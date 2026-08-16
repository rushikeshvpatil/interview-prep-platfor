'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ProblemOption {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  platform: string;
}

interface ScheduledSession {
  id: string;
  mode: 'AI' | 'PEER';
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
    summary?: string | null;
  } | null;
  _count?: {
    submissions: number;
  };
}

export default function InterviewSchedulePage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [problems, setProblems] = useState<ProblemOption[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [mode, setMode] = useState<'AI' | 'PEER'>('AI');
  const [problemId, setProblemId] = useState<string>('');
  const [scheduledAt, setScheduledAt] = useState<string>(() => {
    const now = new Date(Date.now() + 5 * 60 * 1000);
    now.setMinutes(Math.ceil(now.getMinutes() / 5) * 5);
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  const [durationMinutes, setDurationMinutes] = useState<number>(45);

  // Fetch existing sessions and problems
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/interview/schedule');
        if (res.ok && isMounted) {
          const data = await res.json();
          setSessions(data.sessions || []);
          setProblems(data.problems || []);
        }
      } catch (err) {
        console.error('Failed to load schedule data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (sessionStatus === 'authenticated') {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [sessionStatus]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/interview/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          problemId: problemId || null,
          scheduledAt: new Date(scheduledAt).toISOString(),
          durationMinutes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to schedule session');
      }

      const data = await res.json();
      setSuccessMessage('Interview session scheduled successfully!');
      
      // Refresh list
      setSessions((prev) => [data.session, ...prev]);

      // Redirect directly to the room
      setTimeout(() => {
        router.push(`/interview/${data.session.id}`);
      }, 800);
    } catch (err) {
      console.error('Error scheduling session:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to schedule session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/interview/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (res.ok) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, status: 'CANCELLED' } : s))
        );
      }
    } catch (err) {
      console.error('Failed to cancel session:', err);
    }
  };

  const getDifficultyBadge = (diff?: string) => {
    switch (diff) {
      case 'EASY':
        return <Badge variant="success">Easy</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning">Medium</Badge>;
      case 'HARD':
        return <Badge variant="destructive">Hard</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="primary">Scheduled</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning">In Progress</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="default">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Schedule Interview Session
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Book a live mock interview with in-browser code execution and automated test evaluation.
            </p>
          </div>

          <Link href="/problems">
            <Button variant="outline" size="sm">
              Explore Problems
            </Button>
          </Link>
        </div>

        {/* Feedback alerts */}
        {successMessage && (
          <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm font-medium text-success flex items-center gap-2.5 animate-in fade-in">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive flex items-center gap-2.5 animate-in fade-in">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Scheduling Form (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="border-b border-border bg-muted/20 pb-4">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.253 18.75h18V7.5H3v13.5Z" />
                  </svg>
                  Interview Configuration
                </h2>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <form onSubmit={handleScheduleSubmit} className="space-y-6">
                  {/* Mode Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                      Interview Mode
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setMode('AI')}
                        className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          mode === 'AI'
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-border bg-card hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                            AI
                          </span>
                          <span className="text-sm font-semibold text-foreground">AI Mock Interview</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                          Practice with Gemini acting as your interviewer. Asks follow-ups and grades your code.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMode('PEER')}
                        className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          mode === 'PEER'
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-border bg-card hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/15 text-warning text-xs font-bold">
                            1:1
                          </span>
                          <span className="text-sm font-semibold text-foreground">Peer Interview</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                          Share an invite link with a peer. One user codes while the other observes and reviews.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Target Problem */}
                  <div>
                    <label htmlFor="problemSelect" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                      Target Problem (Optional)
                    </label>
                    <select
                      id="problemSelect"
                      value={problemId}
                      onChange={(e) => setProblemId(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
                    >
                      <option value="">General Algorithmic Session (Any DSA Problem)</option>
                      {problems.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.difficulty}] {p.title} ({p.platform})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Choose from your curated catalog, or leave general for an open interview session.
                    </p>
                  </div>

                  {/* Date & Time */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="scheduleDateTime" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                        Scheduled Date & Time
                      </label>
                      <input
                        id="scheduleDateTime"
                        type="datetime-local"
                        required
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                        Session Duration
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[30, 45, 60].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setDurationMinutes(mins)}
                            className={`rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer text-center ${
                              durationMinutes === mins
                                ? 'bg-primary text-primary-foreground shadow-xs'
                                : 'border border-border bg-card text-foreground hover:bg-muted'
                            }`}
                          >
                            {mins} mins
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="border-t border-border pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={submitting}
                      className="w-full sm:w-auto"
                    >
                      {submitting ? 'Creating Session Room...' : 'Schedule & Enter Interview Room'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Information Callout */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b border-border bg-muted/20 pb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                  Gated Execution Environment
                </h3>
              </CardHeader>
              <CardContent className="p-5 space-y-3 text-xs text-muted-foreground leading-relaxed">
                <p>
                  To ensure maximum performance and security, the <strong>Monaco Editor</strong> and <strong>Judge0 Execution Engine</strong> only load inside active scheduled interview rooms.
                </p>
                <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 text-[11px]">
                  <p className="font-semibold text-foreground">Supported Languages:</p>
                  <p>• Python 3.8+ (Language ID: 71)</p>
                  <p>• JavaScript / Node.js (Language ID: 63)</p>
                  <p>• TypeScript (Language ID: 74)</p>
                  <p>• C++ GCC 9.2 (Language ID: 54)</p>
                  <p>• Java OpenJDK 13 (Language ID: 62)</p>
                </div>
                <p className="text-[11px] text-muted-foreground/80">
                  Code drafts automatically persist to PostgreSQL so you never lose your progress during a disconnect.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Existing Scheduled Sessions List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Your Scheduled Sessions</h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">No interview sessions scheduled yet. Use the form above to book one!</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        {s.mode === 'AI' ? 'AI Interview' : 'Peer Session'}
                      </span>
                      {getStatusBadge(s.status)}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                        {s.problem?.title || 'General Algorithmic Session'}
                      </h3>
                      {s.problem && (
                        <div className="flex items-center gap-1.5 mt-1">
                          {getDifficultyBadge(s.problem.difficulty)}
                          <span className="text-[11px] text-muted-foreground">{s.problem.platform}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground pt-1">
                      <p>📅 {new Date(s.scheduledAt).toLocaleString()}</p>
                      <p>⏱️ Duration: {s.durationMinutes} mins</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    {s.status !== 'COMPLETED' && s.status !== 'CANCELLED' ? (
                      <>
                        <Link
                          href={`/interview/${s.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
                        >
                          <span>Enter Room</span>
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleCancelSession(s.id)}
                          className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Session {s.status.toLowerCase()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
