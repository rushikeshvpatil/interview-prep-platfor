'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScorecardModal } from '@/components/interview/ScorecardModal';

interface AISessionRecord {
  id: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  durationMinutes: number;
  scheduledAt: string;
  startedAt?: string | null;
  endedAt?: string | null;
  problem?: {
    id: string;
    title: string;
    difficulty: string;
    platform: string;
  } | null;
  feedback?: {
    id: string;
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
  const { status: authStatus } = useSession();
  const [sessions, setSessions] = useState<AISessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScorecardId, setSelectedScorecardId] = useState<string | null>(null);
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
          const aiSessions = (data.sessions || []).filter(
            (s: { mode: string }) => s.mode === 'AI'
          );
          setSessions(aiSessions);
        }
      } catch (err) {
        console.error('Failed to load AI sessions:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSessions();

    return () => {
      isMounted = false;
    };
  }, [authStatus]);

  const completedCount = sessions.filter((s) => s.status === 'COMPLETED').length;

  return (
    <AppShell>
      {/* Scorecard Modal */}
      {selectedScorecardId && (
        <ScorecardModal
          sessionId={selectedScorecardId}
          isOpen={!!selectedScorecardId}
          onClose={() => setSelectedScorecardId(null)}
          problemTitle={selectedProblemTitle}
        />
      )}

      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              AI Mock Interviews
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Simulate high-stakes technical interviews with Gemini acting as a Senior Tech Lead.
            </p>
          </div>

          <Link href="/interview/schedule">
            <Button variant="primary" size="md" className="shadow-xs">
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Schedule New AI Mock
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
              <h3 className="text-sm font-semibold text-foreground">Interactive Technical Dialogue</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gemini clarifies problem requirements, asks for your approach before coding, and challenges assumptions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/15 text-warning">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.516 0c.85.493 1.508 1.333 1.508 2.316V18" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-foreground">Progressive Hints & Edge Cases</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Receive subtle guidance when stuck without giving away the solution. Analyzes Big-O time and space trade-offs.
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
              <h3 className="text-sm font-semibold text-foreground">Automated Scorecards</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                6-dimension rubric evaluation with strengths, improvements, and custom study recommendations.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Interview History Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Your AI Mock Interview History</h2>
              <p className="text-xs text-muted-foreground">
                Completed: {completedCount} {completedCount === 1 ? 'session' : 'sessions'}
              </p>
            </div>

            <Link href="/interview/schedule">
              <Button variant="outline" size="sm">
                Schedule Session
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground">No AI Mock Interviews Yet</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Schedule your first mock interview with Google Gemini to practice technical problem solving under real interview conditions.
              </p>
              <Link href="/interview/schedule" className="inline-block pt-2">
                <Button variant="primary" size="sm">
                  Schedule First Session
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((s) => {
                const isComp = s.status === 'COMPLETED';
                return (
                  <div
                    key={s.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-xs flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="primary" className="text-[10px]">
                          AI Interview
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
                          {s.problem?.title || 'General Technical Problem'}
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

                      <div className="text-xs text-muted-foreground pt-1 space-y-0.5">
                        <p>📅 {new Date(s.scheduledAt).toLocaleDateString()}</p>
                        <p>⏱️ Duration: {s.durationMinutes} mins</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3">
                      {isComp ? (
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
                      ) : (
                        <Link
                          href={`/interview/${s.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
                        >
                          <span>Enter Room</span>
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                          </svg>
                        </Link>
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
