'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LANGUAGE_MAP } from '@/lib/judge0';
import { usePeerCollaboration } from '@/hooks/usePeerCollaboration';
import { InterviewSessionData } from '@/components/interview/InterviewRoom';
import { InterviewChatPanel } from '@/components/interview/InterviewChatPanel';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-card text-muted-foreground">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs">Loading Candidate Editor Stream...</span>
      </div>
    </div>
  ),
});

interface PeerViewerProps {
  session: InterviewSessionData;
  currentUserId: string;
}

export function PeerViewer({ session: initialSession, currentUserId }: PeerViewerProps) {
  const [session] = useState<InterviewSessionData>(initialSession);
  const [leftTab, setLeftTab] = useState<'problem' | 'chat' | 'notes' | 'evaluation'>('problem');

  // Real-time synchronization hook
  const {
    liveCode,
    liveLanguage,
    liveSubmissions,
    chatMessages,
    peerConnected,
    sendChatMessage,
  } = usePeerCollaboration({
    sessionId: session.id,
    userId: currentUserId,
    role: 'interviewer',
    userName: session.interviewer?.name || 'Interviewer',
    initialCode: session.codeDraft?.code || '',
    initialLanguage: session.codeDraft?.language || 'python',
  });

  // Notes state & autosave
  const [notes, setNotes] = useState<string>('');
  const [notesAutosaveStatus, setNotesAutosaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const notesTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Rubric evaluation state
  const [rubricScores, setRubricScores] = useState({
    problemSolving: 8,
    correctness: 8,
    complexity: 8,
    codeQuality: 8,
    communication: 8,
    overall: 8,
  });
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [recommendation, setRecommendation] = useState<'STRONG_HIRE' | 'HIRE' | 'BORDERLINE' | 'NO_HIRE'>('HIRE');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState(false);

  // Timer states
  const [timeLeftSec, setTimeLeftSec] = useState<number>(() => {
    if (session.status === 'COMPLETED' || session.status === 'CANCELLED') return 0;
    const startTime = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
    const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
    return Math.max(0, session.durationMinutes * 60 - elapsedSec);
  });

  // Fetch initial notes
  useEffect(() => {
    let isMounted = true;
    async function loadNotes() {
      try {
        const res = await fetch(`/api/interview/${session.id}/peer/notes`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setNotes(data.notes || '');
        }
      } catch (e) {
        console.error('Failed to load notes:', e);
      }
    }
    loadNotes();
    return () => {
      isMounted = false;
    };
  }, [session.id]);

  // Session timer
  useEffect(() => {
    if (session.status !== 'IN_PROGRESS' && session.status !== 'SCHEDULED') return;

    const timer = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session.status]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Debounced Autosave Notes
  const saveNotes = useCallback(
    async (notesText: string) => {
      try {
        setNotesAutosaveStatus('saving');
        const res = await fetch(`/api/interview/${session.id}/peer/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: notesText }),
        });
        if (res.ok) {
          setNotesAutosaveStatus('saved');
        } else {
          setNotesAutosaveStatus('error');
        }
      } catch {
        setNotesAutosaveStatus('error');
      }
    },
    [session.id]
  );

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(() => {
      saveNotes(value);
    }, 800);
  };

  // Submit Feedback Scorecard
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      const res = await fetch(`/api/interview/${session.id}/peer/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rubricScores,
          recommendation,
          strengths: strengths.split('\n').filter((s) => s.trim().length > 0),
          improvements: improvements.split('\n').filter((s) => s.trim().length > 0),
        }),
      });

      if (res.ok) {
        setSubmittedFeedback(true);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmittingFeedback(false);
    }
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
      {/* Top Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
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
              <span className="flex h-2.5 w-2.5 rounded-full bg-warning animate-pulse" />
              <h1 className="text-sm font-bold text-foreground line-clamp-1">
                Interviewer Observation: {session.candidate?.name || 'Waiting for candidate to join...'}
              </h1>
              <Badge variant="warning" className="text-[10px]">
                Interviewer (Read Only)
              </Badge>
            </div>
          </div>
        </div>

        {/* Center: Timer & Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1 text-xs font-mono font-bold">
            <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>{isCompleted ? '00:00 (Ended)' : formatTimer(timeLeftSec)}</span>
          </div>

          <Badge variant={peerConnected ? 'success' : 'default'} className="text-[10px]">
            {peerConnected ? '● Live Connected' : 'Connecting...'}
          </Badge>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLeftTab('evaluation')}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover transition-colors cursor-pointer shadow-xs"
          >
            <span>{isCompleted ? 'View Evaluation' : 'Evaluate Candidate'}</span>
          </button>
        </div>
      </header>

      {/* Main 2-Column Split */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* LEFT COLUMN: Problem / Chat / Notes / Evaluation Form (40% width) */}
        <div className="w-full lg:w-[40%] border-r border-border bg-card flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-muted/20 px-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setLeftTab('problem')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  leftTab === 'problem' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Problem Details
              </button>
              <button
                onClick={() => setLeftTab('chat')}
                className={`relative px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  leftTab === 'chat' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>💬 Chat</span>
                {chatMessages.length > 0 && leftTab !== 'chat' && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                    {chatMessages.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setLeftTab('notes')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  leftTab === 'notes' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Private Notes
              </button>
              <button
                onClick={() => setLeftTab('evaluation')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  leftTab === 'evaluation' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Rubric & Feedback
              </button>
            </div>
          </div>

          {/* Left Column Content */}
          <div className="flex-1 overflow-y-auto">
            {leftTab === 'problem' && (
              <div className="p-5 space-y-5 text-xs">
                {/* Problem Header */}
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Problem Focus</span>
                  <h2 className="text-xl font-bold text-foreground mt-1">
                    {session.problem?.title || 'Algorithmic Problem'}
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

                    {session.problem?.externalUrl && (
                      <a
                        href={session.problem.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <span>View Original Problem ↗</span>
                      </a>
                    )}

                    {session.problem?.topics && session.problem.topics.length > 0 && (
                      <span className="text-xs text-muted-foreground/80">
                        • {session.problem.topics.map((t) => t.topic.name).join(' · ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Problem Statement */}
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-muted-foreground uppercase text-[11px]">Problem Statement</h3>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {session.problem?.summary || 'Candidate is working on this algorithmic problem.'}
                  </p>
                </div>

                {/* Constraints */}
                {session.problem?.constraints && (
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-muted-foreground uppercase text-[11px]">Constraints</h3>
                    <div className="rounded-lg bg-muted/40 p-2.5 font-mono text-foreground">{session.problem.constraints}</div>
                  </div>
                )}

                {/* Test Cases / Examples */}
                {session.problem?.testCases && session.problem.testCases.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-muted-foreground uppercase text-[11px]">Configured Test Cases</h3>
                    {session.problem.testCases.map((tc, idx) => (
                      <div key={tc.id} className="rounded-lg border border-border bg-background p-3 space-y-1.5 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-muted-foreground">Test Case {idx + 1}</span>
                        </div>
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

                {/* Interviewer Guide Tips */}
                <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-2 text-muted-foreground">
                  <p className="font-semibold text-foreground">Interviewer Evaluation Tips:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li>Did the candidate ask clarifying questions before coding?</li>
                    <li>Did they state optimal Big-O time and space complexity?</li>
                    <li>How did they react to test case failures or edge cases?</li>
                    <li>Use the <strong>💬 Chat</strong> tab to ask follow-up questions during the interview.</li>
                  </ul>
                </div>
              </div>
            )}

            {leftTab === 'chat' && (
              <InterviewChatPanel
                sessionId={session.id}
                currentUserId={currentUserId}
                currentUserRole="INTERVIEWER"
                messages={chatMessages}
                onSendMessage={sendChatMessage}
                isSessionActive={!isCompleted}
              />
            )}

            {leftTab === 'notes' && (
              <div className="h-full flex flex-col p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Private Scratchpad Notes</h3>
                    <p className="text-[11px] text-muted-foreground">Notes are strictly private to you and autosaved automatically.</p>
                  </div>
                  <span className="text-[11px]">
                    {notesAutosaveStatus === 'saving' ? (
                      <span className="text-warning">Autosaving...</span>
                    ) : notesAutosaveStatus === 'saved' ? (
                      <span className="text-muted-foreground/60">✓ Autosaved</span>
                    ) : (
                      <span className="text-destructive">Autosave failed</span>
                    )}
                  </span>
                </div>

                <textarea
                  rows={14}
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Record your observations: communication clarity, algorithmic approach, hint requests, debugging instincts..."
                  className="flex-1 w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground resize-none focus-visible:outline-2"
                />
              </div>
            )}

            {leftTab === 'evaluation' && (
              <div className="p-5 space-y-5 text-xs">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Candidate Evaluation Rubric</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Rate the candidate across 6 standardized technical interview dimensions.
                  </p>
                </div>

                {submittedFeedback ? (
                  <div className="rounded-xl border border-success/30 bg-success/10 p-5 text-center space-y-2">
                    <span className="text-2xl">🎉</span>
                    <h4 className="font-bold text-success text-sm">Evaluation Submitted</h4>
                    <p className="text-xs text-muted-foreground">
                      Your evaluation and recommendations have been saved to the candidate session review.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitFeedback} className="space-y-4">
                    {/* Rubric sliders */}
                    {[
                      { key: 'problemSolving', label: 'Problem Solving & Approach' },
                      { key: 'correctness', label: 'Correctness & Edge Cases' },
                      { key: 'complexity', label: 'Complexity Analysis (Big-O)' },
                      { key: 'codeQuality', label: 'Code Quality & Cleanliness' },
                      { key: 'communication', label: 'Communication & Reasoning' },
                      { key: 'overall', label: 'Overall Interview Rating' },
                    ].map((item) => (
                      <div key={item.key} className="space-y-1 rounded-lg border border-border bg-background p-2.5">
                        <div className="flex items-center justify-between">
                          <label className="font-medium text-foreground text-[11px]">{item.label}</label>
                          <span className="font-bold text-primary">
                            {rubricScores[item.key as keyof typeof rubricScores]}/10
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={rubricScores[item.key as keyof typeof rubricScores]}
                          onChange={(e) =>
                            setRubricScores((prev) => ({
                              ...prev,
                              [item.key]: parseInt(e.target.value, 10),
                            }))
                          }
                          className="w-full accent-primary cursor-pointer"
                        />
                      </div>
                    ))}

                    {/* Recommendation Select */}
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground uppercase text-[11px]">Final Recommendation</label>
                      <select
                        value={recommendation}
                        onChange={(e) => setRecommendation(e.target.value as typeof recommendation)}
                        className="w-full rounded-lg border border-input bg-background p-2 text-xs font-semibold text-foreground cursor-pointer"
                      >
                        <option value="STRONG_HIRE">Strong Hire</option>
                        <option value="HIRE">Hire</option>
                        <option value="BORDERLINE">Borderline</option>
                        <option value="NO_HIRE">No Hire</option>
                      </select>
                    </div>

                    {/* Strengths */}
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground uppercase text-[11px]">Key Strengths (One per line)</label>
                      <textarea
                        rows={2}
                        value={strengths}
                        onChange={(e) => setStrengths(e.target.value)}
                        placeholder="e.g. Strong graph traversal instincts&#10;Clean variable naming"
                        className="w-full rounded-lg border border-input bg-background p-2 text-xs text-foreground resize-none"
                      />
                    </div>

                    {/* Improvements */}
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground uppercase text-[11px]">Areas for Growth (One per line)</label>
                      <textarea
                        rows={2}
                        value={improvements}
                        onChange={(e) => setImprovements(e.target.value)}
                        placeholder="e.g. Discuss space complexity upfront&#10;Check empty array edge cases"
                        className="w-full rounded-lg border border-input bg-background p-2 text-xs text-foreground resize-none"
                      />
                    </div>

                    <Button type="submit" variant="primary" disabled={submittingFeedback} className="w-full">
                      {submittingFeedback ? 'Submitting Review...' : 'Submit Evaluation Scorecard'}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Candidate Monaco Code Stream + Output (60% width) */}
        <div className="w-full lg:w-[60%] flex flex-col bg-background relative overflow-hidden">
          {/* Top Bar for Code Stream */}
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-card px-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">Candidate Editor:</span>
              <Badge variant="primary" className="text-[10px] uppercase font-bold">
                {LANGUAGE_MAP[liveLanguage]?.name || liveLanguage}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
              <span>Live Observation Mode (Read Only)</span>
            </div>
          </div>

          {/* Monaco Editor in Read-Only Mode (using liveCode || initial draft) */}
          <div className="flex-1 min-h-[280px]">
            <Editor
              height="100%"
              language={LANGUAGE_MAP[liveLanguage]?.monacoLang || 'python'}
              value={liveCode || session.codeDraft?.code || ''}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'var(--font-geist-mono), monospace',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                tabSize: 4,
                readOnly: true,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          {/* Real-time Judge0 Execution Output Stream Drawer */}
          <div className="h-56 shrink-0 border-t border-border bg-card flex flex-col font-mono text-xs">
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-muted/20 px-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">Candidate Submissions & Execution</span>
                <span className="text-[11px] text-muted-foreground">
                  ({liveSubmissions.length > 0 ? liveSubmissions.length : session.submissions?.length || 0})
                </span>
              </div>

              {liveSubmissions[0] && (
                <div className="flex items-center gap-2">
                  {getVerdictBadge(liveSubmissions[0].verdict)}
                  {liveSubmissions[0].executionTime !== null && (
                    <span className="text-[11px] text-muted-foreground">⏱️ {liveSubmissions[0].executionTime.toFixed(3)}s</span>
                  )}
                  {liveSubmissions[0].memory !== null && (
                    <span className="text-[11px] text-muted-foreground">💾 {(liveSubmissions[0].memory / 1024).toFixed(1)} MB</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {liveSubmissions.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Latest Run Verdict:</span>
                    <span>{new Date(liveSubmissions[0].createdAt).toLocaleTimeString()}</span>
                  </div>

                  {liveSubmissions[0].compileOutput && (
                    <div>
                      <span className="text-[11px] font-bold text-destructive">Compilation Error:</span>
                      <pre className="mt-1 rounded bg-destructive/10 p-2 text-destructive whitespace-pre-wrap">
                        {liveSubmissions[0].compileOutput}
                      </pre>
                    </div>
                  )}

                  {liveSubmissions[0].stderr && (
                    <div>
                      <span className="text-[11px] font-bold text-destructive">Runtime Error / Stderr:</span>
                      <pre className="mt-1 rounded bg-destructive/10 p-2 text-destructive whitespace-pre-wrap">
                        {liveSubmissions[0].stderr}
                      </pre>
                    </div>
                  )}

                  {liveSubmissions[0].stdout && (
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground">Output:</span>
                      <pre className="mt-1 rounded bg-background p-2 text-foreground whitespace-pre-wrap border border-border">
                        {liveSubmissions[0].stdout}
                      </pre>
                    </div>
                  )}
                </div>
              ) : session.submissions && session.submissions.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Previous Submission ({getVerdictBadge(session.submissions[0].verdict)}):</span>
                    <span>{new Date(session.submissions[0].createdAt).toLocaleTimeString()}</span>
                  </div>
                  {session.submissions[0].stdout && (
                    <pre className="rounded bg-background p-2 text-foreground whitespace-pre-wrap border border-border">
                      {session.submissions[0].stdout}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground/60">
                  <span>Waiting for candidate to execute code...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
