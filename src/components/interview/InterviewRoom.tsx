'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LANGUAGE_MAP, STARTER_TEMPLATES } from '@/lib/judge0';
import { AIMessageFeed } from '@/components/interview/AIMessageFeed';
import { ScorecardModal } from '@/components/interview/ScorecardModal';
import { PeerViewer } from '@/components/interview/PeerViewer';
import { PeerReviewModal } from '@/components/interview/PeerReviewModal';
import { InterviewChatPanel } from '@/components/interview/InterviewChatPanel';
import { usePeerCollaboration } from '@/hooks/usePeerCollaboration';

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-card text-muted-foreground">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs">Loading Code Editor...</span>
      </div>
    </div>
  ),
});

export interface InterviewSessionData {
  id: string;
  userId?: string | null;
  interviewerId?: string | null;
  mode: 'AI' | 'PEER';
  stream?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  durationMinutes: number;
  scheduledAt: string;
  startedAt?: string | null;
  endedAt?: string | null;
  inviteToken?: string | null;
  problem?: {
    id: string;
    title: string;
    difficulty: string;
    platform: string;
    summary?: string | null;
    constraints?: string | null;
    externalUrl?: string;
    topics?: { topic: { name: string } }[];
    testCases?: { id: string; input: string; expectedOutput: string }[];
  } | null;
  candidate?: { id: string; name?: string | null; email?: string | null } | null;
  interviewer?: { id: string; name?: string | null; email?: string | null } | null;
  codeDraft?: { code: string; language: string } | null;
  submissions?: {
    id: string;
    code: string;
    language: string;
    verdict: string;
    stdout?: string | null;
    stderr?: string | null;
    compileOutput?: string | null;
    executionTime?: number | null;
    memory?: number | null;
    createdAt: string;
  }[];
}

export interface InterviewRoomProps {
  initialSession: InterviewSessionData;
  currentUserId?: string;
}

interface RunResult {
  submissionId: string;
  verdict: 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'INTERNAL_ERROR';
  statusDescription: string;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  executionTime: number | null;
  memory: number | null;
  testCasesPassed?: number;
  totalTestCases?: number;
  publicPassed?: number;
  publicTotal?: number;
  hiddenPassed?: number;
  hiddenTotal?: number;
}

export function InterviewRoom({ initialSession, currentUserId = '' }: InterviewRoomProps) {
  const isInterviewer = currentUserId && initialSession.interviewerId === currentUserId && initialSession.mode === 'PEER';

  if (isInterviewer) {
    return <PeerViewer session={initialSession} currentUserId={currentUserId} />;
  }

  return <CandidateRoom initialSession={initialSession} currentUserId={currentUserId} />;
}

function CandidateRoom({ initialSession, currentUserId = '' }: InterviewRoomProps) {
  const [session, setSession] = useState<InterviewSessionData>(initialSession);

  // Left Panel Tabs
  const [leftTab, setLeftTab] = useState<'problem' | 'ai' | 'chat'>('problem');
  const [unreadAIMessages, setUnreadAIMessages] = useState<number>(0);
  const [showScorecard, setShowScorecard] = useState<boolean>(false);
  const [showPeerReview, setShowPeerReview] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);

  // Editor states
  const initialLang = session.codeDraft?.language || 'python';
  const [language, setLanguage] = useState<string>(initialLang);
  const [code, setCode] = useState<string>(
    session.codeDraft?.code || STARTER_TEMPLATES[initialLang] || STARTER_TEMPLATES.python
  );
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Execution states
  const [customStdin, setCustomStdin] = useState<string>(
    session.problem?.testCases?.[0]?.input || ''
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeOutputTab, setActiveOutputTab] = useState<'output' | 'stdin' | 'history'>('output');
  const [lastResult, setLastResult] = useState<RunResult | null>(null);
  const [submissions, setSubmissions] = useState(session.submissions || []);

  // Real-time synchronization hook for candidate broadcasting to peer
  const {
    peerConnected,
    sendCodeUpdate,
    broadcastRunResult,
    chatMessages,
    sendChatMessage,
  } = usePeerCollaboration({
    sessionId: session.id,
    userId: currentUserId || session.userId || 'candidate-user',
    role: 'candidate',
    userName: session.candidate?.name || 'Candidate',
    initialCode: code,
    initialLanguage: language,
  });

  // Timer states
  const [timeLeftSec, setTimeLeftSec] = useState<number>(() => {
    if (session.status === 'COMPLETED' || session.status === 'CANCELLED') return 0;
    const startTime = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
    const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
    return Math.max(0, session.durationMinutes * 60 - elapsedSec);
  });

  const [isEnding, setIsEnding] = useState<boolean>(false);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. End Session Handler (defined first for use in timer)
  const handleEndSession = useCallback(async () => {
    setIsEnding(true);
    try {
      const res = await fetch(`/api/interview/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        // Automatically open scorecard on completion for AI sessions
        if (session.mode === 'AI') {
          setShowScorecard(true);
        } else if (session.mode === 'PEER') {
          setShowPeerReview(true);
        }
      }
    } catch (err) {
      console.error('Failed to end session:', err);
    } finally {
      setIsEnding(false);
    }
  }, [session.id, session.mode]);

  // 2. Session Timer Countdown
  useEffect(() => {
    if (session.status !== 'IN_PROGRESS' && session.status !== 'SCHEDULED') return;

    const timer = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleEndSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session.status, handleEndSession]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 3. Debounced Autosave Draft
  const saveDraft = useCallback(
    async (codeToSave: string, langToSave: string) => {
      if (session.status === 'COMPLETED' || session.status === 'CANCELLED') return;
      try {
        setAutosaveStatus('saving');
        const res = await fetch(`/api/interview/${session.id}/draft`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: codeToSave, language: langToSave }),
        });
        if (res.ok) {
          setAutosaveStatus('saved');
        } else {
          setAutosaveStatus('error');
        }
      } catch {
        setAutosaveStatus('error');
      }
    },
    [session.id, session.status]
  );

  const handleCodeChange = (value?: string) => {
    const newCode = value ?? '';
    setCode(newCode);
    if (session.status === 'COMPLETED') return;

    // Real-time broadcast to peer interviewer
    if (session.mode === 'PEER') {
      sendCodeUpdate(newCode, language);
    }

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      saveDraft(newCode, language);
    }, 800);
  };

  const handleLanguageChange = (newLang: string) => {
    if (session.status === 'COMPLETED' || isRunning) return;
    setLanguage(newLang);

    const defaultTemplate = STARTER_TEMPLATES[newLang] || '';
    if (!code || code === STARTER_TEMPLATES[language]) {
      setCode(defaultTemplate);
      saveDraft(defaultTemplate, newLang);
      if (session.mode === 'PEER') sendCodeUpdate(defaultTemplate, newLang);
    } else {
      saveDraft(code, newLang);
      if (session.mode === 'PEER') sendCodeUpdate(code, newLang);
    }
  };

  // 4. Run / Submit Code Execution
  const handleExecuteCode = async (action: 'run' | 'submit' = 'run') => {
    if (session.status === 'COMPLETED' || session.status === 'CANCELLED') return;
    setIsRunning(true);
    setActiveOutputTab('output');

    try {
      const res = await fetch(`/api/interview/${session.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          stdin: customStdin,
          action,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Execution failed');
      }

      const result: RunResult = await res.json();
      setLastResult(result);
      setSubmissions((prev) => [
        {
          id: result.submissionId,
          code,
          language,
          verdict: result.verdict,
          stdout: result.stdout,
          stderr: result.stderr,
          compileOutput: result.compileOutput,
          executionTime: result.executionTime,
          memory: result.memory,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      // Broadcast execution result to peer interviewer
      if (session.mode === 'PEER') {
        broadcastRunResult({
          submissionId: result.submissionId,
          verdict: result.verdict,
          stdout: result.stdout,
          stderr: result.stderr,
          compileOutput: result.compileOutput,
          executionTime: result.executionTime,
          memory: result.memory,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Run code error:', err);
      setLastResult({
        submissionId: 'err',
        verdict: 'INTERNAL_ERROR',
        statusDescription: err instanceof Error ? err.message : 'Execution failed',
        stdout: null,
        stderr: err instanceof Error ? err.message : 'Failed to connect to execution engine.',
        compileOutput: null,
        executionTime: null,
        memory: null,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 5. Focus Mode Fullscreen Toggle
  const toggleFocusMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // 6. Copy Peer Invite Link
  const handleCopyInviteLink = () => {
    if (!session.inviteToken) return;
    const inviteUrl = `${window.location.origin}/interview/join/${session.inviteToken}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2500);
    });
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'ACCEPTED':
        return <Badge variant="success" className="font-semibold">Accepted</Badge>;
      case 'WRONG_ANSWER':
        return <Badge variant="destructive" className="font-semibold">Wrong Answer</Badge>;
      case 'TIME_LIMIT_EXCEEDED':
        return <Badge variant="warning" className="font-semibold">Time Limit Exceeded</Badge>;
      case 'COMPILATION_ERROR':
        return <Badge variant="destructive" className="font-semibold">Compilation Error</Badge>;
      case 'RUNTIME_ERROR':
        return <Badge variant="destructive" className="font-semibold">Runtime Error</Badge>;
      default:
        return <Badge variant="default">{verdict}</Badge>;
    }
  };

  const isCompleted = session.status === 'COMPLETED' || session.status === 'CANCELLED';

  return (
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
      {/* AI Scorecard Modal */}
      <ScorecardModal
        sessionId={session.id}
        isOpen={showScorecard}
        onClose={() => setShowScorecard(false)}
        problemTitle={session.problem?.title}
      />

      {/* Peer Review Modal */}
      <PeerReviewModal
        sessionId={session.id}
        isOpen={showPeerReview}
        onClose={() => setShowPeerReview(false)}
      />

      {/* ============================================================
          TOP NAVIGATION BAR
          ============================================================ */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        {/* Left: Back Link & Session Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/interview/schedule"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Sessions"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-foreground line-clamp-1">
                {session.problem?.title || 'General Technical Interview'}
              </h1>
              {session.problem?.difficulty && (
                <Badge
                  variant={
                    session.problem.difficulty === 'EASY'
                      ? 'success'
                      : session.problem.difficulty === 'MEDIUM'
                      ? 'warning'
                      : 'destructive'
                  }
                  className="text-[10px]"
                >
                  {session.problem.difficulty}
                </Badge>
              )}
              <Badge variant={session.mode === 'PEER' ? 'warning' : 'primary'} className="text-[10px]">
                {session.mode === 'PEER' ? 'Peer Interview' : 'AI Interview'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Center: Live Timer & Sync Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1 text-xs font-mono font-bold">
            <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className={timeLeftSec < 300 && !isCompleted ? 'text-destructive animate-pulse' : ''}>
              {isCompleted ? '00:00 (Ended)' : formatTimer(timeLeftSec)}
            </span>
          </div>

          {session.mode === 'PEER' && (
            <Badge
              variant={peerConnected ? 'success' : 'default'}
              className="text-[10px] hidden sm:inline-flex"
            >
              {peerConnected ? '● Live Synced' : 'Connecting...'}
            </Badge>
          )}

          {autosaveStatus === 'saving' && (
            <span className="text-[11px] text-warning hidden md:inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-warning animate-ping" />
              Saving draft...
            </span>
          )}
          {autosaveStatus === 'saved' && (
            <span className="text-[11px] text-muted-foreground/60 hidden md:inline-flex">
              ✓ Saved
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {session.mode === 'PEER' && session.inviteToken && !isCompleted && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyInviteLink}
              className="text-xs hidden sm:inline-flex"
            >
              {copiedInvite ? '✓ Link Copied' : 'Share Invite'}
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleFocusMode}
            className="text-xs hidden md:inline-flex px-2"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Focus Mode'}
          </Button>

          {!isCompleted ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isEnding}
              onClick={handleEndSession}
              className="text-xs shadow-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isEnding ? 'Ending...' : 'End Interview'}
            </Button>
          ) : (
            <Badge variant="success">Completed</Badge>
          )}
        </div>
      </header>

      {/* ============================================================
          MAIN 2-PANE WORKSPACE
          ============================================================ */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* LEFT PANEL: Problem Context, Chat & AI Interviewer Tabs (40% width) */}
        <div className="w-full lg:w-[40%] border-r border-border bg-card flex flex-col overflow-hidden">
          {/* Left Panel Tabs Header */}
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-muted/20 px-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setLeftTab('problem')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  leftTab === 'problem'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Problem Details
              </button>

              {session.mode === 'PEER' && (
                <button
                  onClick={() => setLeftTab('chat')}
                  className={`relative px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    leftTab === 'chat'
                      ? 'bg-background text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>💬 Interview Chat</span>
                  {chatMessages.length > 0 && leftTab !== 'chat' && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                      {chatMessages.length}
                    </span>
                  )}
                </button>
              )}

              {session.mode === 'AI' && (
                <button
                  onClick={() => setLeftTab('ai')}
                  className={`relative px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    leftTab === 'ai'
                      ? 'bg-background text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>AI Interviewer</span>
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                  {unreadAIMessages > 0 && leftTab !== 'ai' && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                      {unreadAIMessages}
                    </span>
                  )}
                </button>
              )}
            </div>

            {session.problem?.externalUrl && leftTab === 'problem' && (
              <a
                href={session.problem.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>View Original ({session.problem.platform})</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            )}
          </div>

          {/* Left Panel Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {leftTab === 'problem' && (
              <div className="p-5 space-y-5">
                {/* Peer Interviewer banner */}
                {session.mode === 'PEER' && (
                  <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-warning flex items-center gap-1.5">
                        <span>👥</span> Peer Interview Mode
                      </span>
                      <Badge variant={peerConnected ? 'success' : 'default'} className="text-[10px]">
                        {peerConnected ? 'Interviewer Connected' : 'Waiting for Interviewer'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-[11px]">
                      Your code and test case executions are streamed in real time to your interviewer. Use the <strong>Interview Chat</strong> tab to communicate.
                    </p>
                  </div>
                )}

                {/* Problem Title & Meta */}
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Interview Problem
                  </span>
                  <h2 className="text-xl font-bold text-foreground mt-1">
                    {session.problem?.title || 'Open Technical Problem Solving'}
                  </h2>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {session.problem?.difficulty && (
                      <Badge
                        variant={
                          session.problem.difficulty === 'EASY'
                            ? 'success'
                            : session.problem.difficulty === 'MEDIUM'
                            ? 'warning'
                            : 'destructive'
                        }
                        className="text-[10px]"
                      >
                        {session.problem.difficulty}
                      </Badge>
                    )}

                    <span className="text-xs text-muted-foreground">
                      Source: {session.problem?.platform || 'Platform Catalog'}
                    </span>

                    {session.problem?.topics && session.problem.topics.length > 0 && (
                      <span className="text-xs text-muted-foreground/80">
                        • {session.problem.topics.map((t) => t.topic.name).join(' · ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Problem Summary / Description */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Problem Statement</h3>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {session.problem?.summary ||
                      'Implement your algorithmic solution in the code editor, explain your thought process, and test your code against the Judge0 sandbox.'}
                  </p>
                </div>

                {/* Constraints */}
                {session.problem?.constraints && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Constraints</h3>
                    <div className="rounded-lg bg-muted/40 p-3 font-mono text-xs text-foreground">
                      {session.problem.constraints}
                    </div>
                  </div>
                )}

                {/* Sample Test Cases */}
                {session.problem?.testCases && session.problem.testCases.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sample Test Cases</h3>
                    {session.problem.testCases.map((tc, idx) => (
                      <div key={tc.id} className="rounded-lg border border-border bg-background p-3 space-y-1.5 text-xs font-mono">
                        <p className="text-[11px] font-semibold text-muted-foreground">Example {idx + 1}:</p>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground">Input:</span>
                          <span className="text-foreground">{tc.input}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground">Expected:</span>
                          <span className="text-success font-semibold">{tc.expectedOutput}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {leftTab === 'chat' && session.mode === 'PEER' && (
              <InterviewChatPanel
                sessionId={session.id}
                currentUserId={currentUserId}
                currentUserRole="CANDIDATE"
                messages={chatMessages}
                onSendMessage={sendChatMessage}
                isSessionActive={!isCompleted}
              />
            )}

            {leftTab === 'ai' && session.mode === 'AI' && (
              <AIMessageFeed
                sessionId={session.id}
                isSessionActive={!isCompleted}
                currentCode={code}
                language={language}
                isActiveTab={leftTab === 'ai'}
                onUnreadChange={setUnreadAIMessages}
              />
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Monaco Editor & Judge0 Execution Results (60% width) */}
        <div className="w-full lg:w-[60%] flex flex-col bg-background relative overflow-hidden">
          {/* Completed overlay */}
          {isCompleted && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/90 backdrop-blur-xs p-6 text-center animate-in fade-in">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success mb-3">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">Interview Session Completed</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                This interview session has ended. Your final code submission and drafts have been saved to your profile.
              </p>
              <div className="mt-4 flex items-center gap-2.5">
                {session.mode === 'AI' && (
                  <Button variant="primary" size="sm" onClick={() => setShowScorecard(true)}>
                    View AI Scorecard
                  </Button>
                )}
                {session.mode === 'PEER' && (
                  <Button variant="primary" size="sm" onClick={() => setShowPeerReview(true)}>
                    View Peer Review
                  </Button>
                )}
                <Link href="/interview/schedule">
                  <Button variant="outline" size="sm">
                    Return to Scheduled Sessions
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Editor Toolbar */}
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-card px-4">
            <div className="flex items-center gap-2">
              <label htmlFor="langSelect" className="text-xs font-medium text-muted-foreground">
                Language:
              </label>
              <select
                id="langSelect"
                value={language}
                disabled={isCompleted}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
              >
                {Object.entries(LANGUAGE_MAP).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isCompleted}
                onClick={() => {
                  const defaultCode = STARTER_TEMPLATES[language] || '';
                  setCode(defaultCode);
                  saveDraft(defaultCode, language);
                }}
                className="text-xs h-7 px-2.5"
              >
                Reset Template
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isRunning || isCompleted}
                onClick={() => handleExecuteCode('run')}
                className="text-xs h-7 px-3 shadow-2xs font-semibold"
              >
                {isRunning ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Running...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Run Code
                  </span>
                )}
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isRunning || isCompleted}
                onClick={() => handleExecuteCode('submit')}
                className="text-xs h-7 px-3.5 shadow-2xs font-semibold"
              >
                {isRunning ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Evaluating...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>⚡</span>
                    Submit Solution
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Monaco Code Editor Area */}
          <div className="flex-1 min-h-[280px]">
            <Editor
              height="100%"
              language={LANGUAGE_MAP[language]?.monacoLang || 'python'}
              value={code}
              theme="vs-dark"
              onChange={handleCodeChange}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'var(--font-geist-mono), monospace',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                tabSize: 4,
                readOnly: isCompleted,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          {/* Submissions Drawer */}
          <div className="h-56 shrink-0 border-t border-border bg-card flex flex-col">
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-muted/20 px-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveOutputTab('output')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    activeOutputTab === 'output'
                      ? 'bg-background text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Execution Output
                </button>
                <button
                  onClick={() => setActiveOutputTab('stdin')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    activeOutputTab === 'stdin'
                      ? 'bg-background text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Custom Stdin
                </button>
                <button
                  onClick={() => setActiveOutputTab('history')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    activeOutputTab === 'history'
                      ? 'bg-background text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Submissions ({submissions.length})
                </button>
              </div>

              {lastResult && (
                <div className="flex items-center gap-2">
                  {getVerdictBadge(lastResult.verdict)}
                  {lastResult.executionTime !== null && (
                    <span className="text-[11px] font-mono text-muted-foreground">
                      ⏱️ {lastResult.executionTime.toFixed(3)}s
                    </span>
                  )}
                  {lastResult.memory !== null && (
                    <span className="text-[11px] font-mono text-muted-foreground">
                      💾 {(lastResult.memory / 1024).toFixed(1)} MB
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
              {activeOutputTab === 'output' && (
                <div className="space-y-2">
                  {isRunning ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-4 justify-center">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span>Compiling and executing in isolated sandbox...</span>
                    </div>
                  ) : lastResult ? (
                    <div className="space-y-2">
                      {lastResult.compileOutput && (
                        <div>
                          <span className="text-[11px] font-bold text-destructive">Compilation Error:</span>
                          <pre className="mt-1 rounded bg-destructive/10 p-2 text-destructive whitespace-pre-wrap">
                            {lastResult.compileOutput}
                          </pre>
                        </div>
                      )}
                      {lastResult.stderr && (
                        <div>
                          <span className="text-[11px] font-bold text-destructive">Standard Error:</span>
                          <pre className="mt-1 rounded bg-destructive/10 p-2 text-destructive whitespace-pre-wrap">
                            {lastResult.stderr}
                          </pre>
                        </div>
                      )}
                      {lastResult.stdout && (
                        <div>
                          <span className="text-[11px] font-bold text-muted-foreground">Standard Output:</span>
                          <pre className="mt-1 rounded bg-background p-2 text-foreground whitespace-pre-wrap border border-border">
                            {lastResult.stdout}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground/60 py-4 text-center">
                      Click &ldquo;Run Code&rdquo; to execute your solution against the Judge0 sandbox.
                    </p>
                  )}
                </div>
              )}

              {activeOutputTab === 'stdin' && (
                <div className="h-full flex flex-col space-y-1.5">
                  <label htmlFor="stdinInput" className="text-[11px] text-muted-foreground">
                    Custom Standard Input (passed to program stdin):
                  </label>
                  <textarea
                    id="stdinInput"
                    rows={3}
                    value={customStdin}
                    onChange={(e) => setCustomStdin(e.target.value)}
                    placeholder="Enter input here..."
                    className="w-full flex-1 rounded border border-input bg-background p-2 text-xs font-mono text-foreground resize-none focus-visible:outline-1"
                  />
                </div>
              )}

              {activeOutputTab === 'history' && (
                <div className="space-y-2">
                  {submissions.length === 0 ? (
                    <p className="text-muted-foreground py-4 text-center">No submissions made yet in this session.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {submissions.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {getVerdictBadge(sub.verdict)}
                            <span className="font-semibold text-foreground uppercase text-[10px]">{sub.language}</span>
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                            {typeof sub.executionTime === 'number' && (
                              <span>{sub.executionTime.toFixed(3)}s</span>
                            )}
                            <span>{new Date(sub.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
