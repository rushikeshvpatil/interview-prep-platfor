'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScorecardModal } from '@/components/interview/ScorecardModal';
import { PeerReviewModal } from '@/components/interview/PeerReviewModal';

interface SessionRecord {
  id: string;
  userId: string;
  interviewerId?: string | null;
  mode: 'AI' | 'PEER';
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
  } | null;
  candidate?: {
    id: string;
    name?: string | null;
  } | null;
  interviewer?: {
    id: string;
    name?: string | null;
  } | null;
  feedback?: {
    id: string;
    source: string;
    recommendation?: string | null;
    rubricScores: {
      overall?: number;
      correctness?: number;
      complexity?: number;
    };
  }[];
  _count?: {
    submissions: number;
  };
}

export default function MockInterviewPage() {
  const { data: sessionData, status: authStatus } = useSession();
  const currentUserId = sessionData?.user?.id;

  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'CANDIDATE' | 'CONDUCTED'>('CANDIDATE');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'AI' | 'PEER'>('ALL');
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // Modals
  const [selectedScorecardId, setSelectedScorecardId] = useState<string | null>(null);
  const [selectedPeerReviewId, setSelectedPeerReviewId] = useState<string | null>(null);
  const [selectedProblemTitle, setSelectedProblemTitle] = useState<string | undefined>();

  useEffect(() => {
    let isMounted = true;
    async function loadSessions() {
      if (authStatus !== 'authenticated') return;
      try {
        setLoading(true);
        const res = await fetch('/api/interview/schedule');
        if (res.ok && isMounted) {
          const data = await res.json();
          setSessions(data.sessions || []);
        }
      } catch (err) {
        console.error('Failed to load sessions:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSessions();

    return () => {
      isMounted = false;
    };
  }, [authStatus]);

  const handleCopyInvite = (sessionId: string, inviteToken?: string | null) => {
    if (!inviteToken) return;
    const inviteUrl = `${window.location.origin}/interview/join/${inviteToken}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedInviteId(sessionId);
      setTimeout(() => setCopiedInviteId(null), 2500);
    });
  };

  // 1. Separate Candidate sessions vs Conducted sessions
  const candidateSessions = sessions.filter((s) => s.userId === currentUserId);
  const conductedSessions = sessions.filter((s) => s.interviewerId === currentUserId);

  // 2. Filter Candidate sessions based on modeFilter
  const filteredCandidateSessions = candidateSessions.filter((s) => {
    if (modeFilter === 'AI') return s.mode === 'AI';
    if (modeFilter === 'PEER') return s.mode === 'PEER';
    return true;
  });

  const displayedSessions = activeView === 'CANDIDATE' ? filteredCandidateSessions : conductedSessions;
  const completedCount = displayedSessions.filter((s) => s.status === 'COMPLETED').length;

  return (
    <AppShell>
      {/* AI Scorecard Modal */}
      {selectedScorecardId && (
        <ScorecardModal
          sessionId={selectedScorecardId}
          isOpen={!!selectedScorecardId}
          onClose={() => setSelectedScorecardId(null)}
          problemTitle={selectedProblemTitle}
        />
      )}

      {/* Peer Review Modal */}
      {selectedPeerReviewId && (
        <PeerReviewModal
          sessionId={selectedPeerReviewId}
          isOpen={!!selectedPeerReviewId}
          onClose={() => setSelectedPeerReviewId(null)}
        />
      )}

      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Technical Mock Interviews
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Practice coding interviews with AI Gemini as a Staff Tech Lead or with a peer interviewer in real time.
            </p>
          </div>

          <Link href="/interview/schedule">
            <Button variant="primary" size="md" className="shadow-xs">
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Schedule New Mock
            </Button>
          </Link>
        </div>

        {/* Feature Overview Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-foreground">AI Tech Lead (Gemini)</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Clarifies requirements, provides progressive hints, asks Big-O complexity questions, and scores automatically.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/15 text-warning">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-foreground">Peer 1-on-1 Interviews</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate an invite link, share with a peer, and stream code live with a dedicated read-only interviewer review panel.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/15 text-success">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-foreground">Multi-Dimension Rubric</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Comprehensive 6-dimension scoring on Correctness, Problem Solving, Complexity, Code Quality, and Communication.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Primary View Switcher: My Interviews vs Interviews Conducted */}
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <button
            onClick={() => setActiveView('CANDIDATE')}
            className={`text-sm font-bold pb-1 transition-colors cursor-pointer border-b-2 ${
              activeView === 'CANDIDATE'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Your Interview History ({candidateSessions.length})
          </button>

          {conductedSessions.length > 0 && (
            <button
              onClick={() => setActiveView('CONDUCTED')}
              className={`text-sm font-bold pb-1 transition-colors cursor-pointer border-b-2 ml-4 ${
                activeView === 'CONDUCTED'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Interviews Conducted ({conductedSessions.length})
            </button>
          )}
        </div>

        {/* History Listing */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {activeView === 'CANDIDATE' ? 'Your Interview History' : 'Interviews Conducted by You'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Completed: {completedCount} {completedCount === 1 ? 'session' : 'sessions'}
              </p>
            </div>

            {/* Mode Filter Tabs (for Candidate view) */}
            {activeView === 'CANDIDATE' && (
              <div className="flex items-center rounded-lg border border-border bg-card p-1 text-xs">
                {(['ALL', 'AI', 'PEER'] as const).map((tab) => {
                  const label = tab === 'ALL' ? 'All' : tab === 'AI' ? 'AI Mock' : 'Peer';
                  const count = candidateSessions.filter((s) => (tab === 'ALL' ? true : s.mode === tab)).length;
                  return (
                    <button
                      key={tab}
                      onClick={() => setModeFilter(tab)}
                      className={`rounded-md px-3 py-1 font-medium transition-colors cursor-pointer ${
                        modeFilter === tab
                          ? 'bg-primary text-primary-foreground shadow-2xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : displayedSessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {activeView === 'CANDIDATE'
                  ? `No ${modeFilter !== 'ALL' ? modeFilter : ''} Interview Sessions Found`
                  : 'No Conducted Interviews Yet'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {activeView === 'CANDIDATE'
                  ? 'Schedule a mock interview to practice technical problem solving under real interview conditions.'
                  : 'When peers share an interview invite link with you, your conducted evaluation reviews will appear here.'}
              </p>
              {activeView === 'CANDIDATE' && (
                <Link href="/interview/schedule" className="inline-block pt-2">
                  <Button variant="primary" size="sm">
                    Schedule First Session
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {displayedSessions.map((s) => {
                const isComp = s.status === 'COMPLETED';
                const isPeer = s.mode === 'PEER';
                const isCopied = copiedInviteId === s.id;

                // Extract feedback score if available
                const overallScore = s.feedback?.[0]?.rubricScores?.overall;

                return (
                  <div
                    key={s.id}
                    className={`rounded-xl border bg-card p-4 shadow-xs flex flex-col justify-between gap-4 transition-all ${
                      isPeer ? 'border-warning/30 hover:border-warning/50' : 'border-border hover:border-border/80'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={isPeer ? 'warning' : 'primary'}
                          className="text-[10px] font-bold tracking-wider uppercase"
                        >
                          {isPeer ? 'PEER INTERVIEW' : 'AI INTERVIEW'}
                        </Badge>
                        <Badge
                          variant={isComp ? 'success' : s.status === 'IN_PROGRESS' ? 'warning' : 'default'}
                          className="text-[10px]"
                        >
                          {s.status}
                        </Badge>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                          {s.problem?.title || 'General Algorithmic Session'}
                        </h3>
                        {s.problem && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge
                              variant={
                                s.problem.difficulty === 'EASY'
                                  ? 'success'
                                  : s.problem.difficulty === 'MEDIUM'
                                  ? 'warning'
                                  : 'destructive'
                              }
                              className="text-[10px]"
                            >
                              {s.problem.difficulty}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">{s.problem.platform}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground pt-1 space-y-1">
                        <p>📅 {new Date(s.scheduledAt).toLocaleDateString()}</p>
                        <p>⏱️ Duration: {s.durationMinutes} mins</p>

                        {/* Candidate/Interviewer Identity Details */}
                        {activeView === 'CONDUCTED' ? (
                          <p className="pt-0.5 text-[11px] font-medium text-foreground">
                            Candidate: <span className="text-primary font-semibold">{s.candidate?.name || 'Candidate'}</span>
                          </p>
                        ) : isPeer ? (
                          <p className="pt-0.5 text-[11px]">
                            Interviewer:{' '}
                            {s.interviewer?.name ? (
                              <span className="text-foreground font-semibold">{s.interviewer.name}</span>
                            ) : (
                              <span className="text-warning font-medium">Waiting for interviewer</span>
                            )}
                          </p>
                        ) : null}

                        {/* Overall score indicator if completed */}
                        {isComp && overallScore !== undefined && (
                          <p className="pt-0.5 text-[11px] font-semibold text-success">
                            Overall Score: {overallScore}/10
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3">
                      {isComp ? (
                        isPeer ? (
                          <button
                            onClick={() => setSelectedPeerReviewId(s.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                          >
                            <span>View Review</span>
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedScorecardId(s.id);
                              setSelectedProblemTitle(s.problem?.title);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                          >
                            <span>View Scorecard</span>
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                          </button>
                        )
                      ) : (
                        <div className="flex items-center gap-2 w-full justify-between">
                          <Link
                            href={`/interview/${s.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
                          >
                            <span>Enter Room</span>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                          </Link>

                          {isPeer && s.inviteToken && (
                            <button
                              type="button"
                              onClick={() => handleCopyInvite(s.id, s.inviteToken)}
                              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                                isCopied
                                  ? 'border-success bg-success/15 text-success'
                                  : 'border-border bg-background text-foreground hover:bg-muted'
                              }`}
                            >
                              {isCopied ? '✓ Copied' : 'Copy Invite'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
