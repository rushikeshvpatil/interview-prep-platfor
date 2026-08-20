'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { InviteModal } from '@/components/interview/InviteModal';

interface ProblemOption {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  platform: string;
  summary?: string | null;
  constraints?: string | null;
}

interface TestCaseDraft {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface ScheduledSession {
  id: string;
  userId?: string | null;
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
    summary?: string | null;
  } | null;
  customTitle?: string | null;
  candidate?: {
    id: string;
    name?: string | null;
  } | null;
  interviewer?: {
    id: string;
    name?: string | null;
  } | null;
  _count?: {
    submissions: number;
  };
}

export default function InterviewSchedulePage() {
  const { data: sessionData, status: sessionStatus } = useSession();
  const currentUserId = sessionData?.user?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [problems, setProblems] = useState<ProblemOption[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [mode, setMode] = useState<'AI' | 'PEER'>('PEER');
  const [problemSource, setProblemSource] = useState<'BANK' | 'CUSTOM'>('BANK');
  const [problemId, setProblemId] = useState<string>('');
  const [problemSearch, setProblemSearch] = useState<string>('');
  
  // Custom problem fields
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [customConstraints, setCustomConstraints] = useState<string>('');

  // Test cases draft
  const [testCases, setTestCases] = useState<TestCaseDraft[]>([
    { id: '1', input: 'nums = [2, 7, 11, 15], target = 9', expectedOutput: '[0, 1]', isHidden: false },
    { id: '2', input: 'nums = [3, 2, 4], target = 6', expectedOutput: '[1, 2]', isHidden: true },
  ]);

  const [scheduledAt, setScheduledAt] = useState<string>(() => {
    const now = new Date(Date.now() + 5 * 60 * 1000);
    now.setMinutes(Math.ceil(now.getMinutes() / 5) * 5);
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);
  const [inviteModalSession, setInviteModalSession] = useState<ScheduledSession | null>(null);

  const handleCopyInvite = (sessionId: string, inviteToken?: string | null) => {
    if (!inviteToken) return;
    const inviteUrl = `${window.location.origin}/interview/join/${inviteToken}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedSessionId(sessionId);
      setTimeout(() => setCopiedSessionId(null), 2500);
    });
  };

  const handleAddTestCase = (isHidden: boolean) => {
    setTestCases((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        input: '',
        expectedOutput: '',
        isHidden,
      },
    ]);
  };

  const handleRemoveTestCase = (id: string) => {
    setTestCases((prev) => prev.filter((tc) => tc.id !== id));
  };

  const handleUpdateTestCase = (id: string, field: 'input' | 'expectedOutput', value: string) => {
    setTestCases((prev) =>
      prev.map((tc) => (tc.id === id ? { ...tc, [field]: value } : tc))
    );
  };

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
          if (data.problems?.length > 0 && !problemId) {
            setProblemId(data.problems[0].id);
          }
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
  }, [sessionStatus, problemId]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const isPeer = mode === 'PEER';
      const isCustom = isPeer && problemSource === 'CUSTOM';

      const payload = {
        mode,
        problemId: !isCustom && problemId ? problemId : null,
        customTitle: isCustom ? customTitle : null,
        customDescription: isCustom ? customDescription : null,
        customConstraints: isCustom ? customConstraints : null,
        testCases: isPeer ? testCases.filter((tc) => tc.input.trim() || tc.expectedOutput.trim()) : [],
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes,
      };

      const res = await fetch('/api/interview/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to schedule session');
      }

      const data = await res.json();
      setSuccessMessage('Interview session scheduled successfully!');
      
      // Refresh list
      setSessions((prev) => [data.session, ...prev]);

      // If Peer mode, immediately open the Invite Modal to copy before entering
      if (mode === 'PEER') {
        setInviteModalSession(data.session);
      } else {
        // AI mode goes directly to room
        setTimeout(() => {
          router.push(`/interview/${data.session.id}`);
        }, 800);
      }
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
      console.error('Error cancelling session:', err);
    }
  };

  const getDifficultyBadge = (difficulty?: string) => {
    switch (difficulty) {
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

  const filteredProblems = problems.filter((p) =>
    p.title.toLowerCase().includes(problemSearch.toLowerCase())
  );

  const selectedProblemObj = problems.find((p) => p.id === problemId);

  return (
    <AppShell>
      {/* Invite Modal for Peer Sessions */}
      <InviteModal
        isOpen={!!inviteModalSession}
        onClose={() => setInviteModalSession(null)}
        session={inviteModalSession}
      />

      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Create & Schedule Technical Interviews
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create a 1-on-1 Peer Interview to evaluate a candidate or practice with Google Gemini AI.
            </p>
          </div>

          <Link href="/mock-interview">
            <Button variant="outline" size="sm">
              View Interview Hub
            </Button>
          </Link>
        </div>

        {/* Create Session Form */}
        <Card className="border-border">
          <CardHeader className="border-b border-border bg-muted/20 pb-4">
            <h2 className="text-base font-bold text-foreground">Interview Setup</h2>
            <p className="text-xs text-muted-foreground">Configure problem focus, test cases, and duration</p>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleScheduleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="rounded-xl border border-success/30 bg-success/10 p-3.5 text-xs text-success">
                  {successMessage}
                </div>
              )}

              {/* 1. Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Interview Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setMode('PEER')}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${
                      mode === 'PEER'
                        ? 'border-warning bg-warning/10 ring-1 ring-warning'
                        : 'border-border bg-card hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-3 w-3 rounded-full bg-warning" />
                        <h3 className="text-sm font-bold text-foreground">Peer 1:1 Interview</h3>
                      </div>
                      <Badge variant="warning" className="text-[10px]">Interviewer Lead</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You create the interview, configure test cases, and send the invite link to your candidate.
                    </p>
                  </div>

                  <div
                    onClick={() => setMode('AI')}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${
                      mode === 'AI'
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'border-border bg-card hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-3 w-3 rounded-full bg-primary" />
                        <h3 className="text-sm font-bold text-foreground">AI Mock Interview</h3>
                      </div>
                      <Badge variant="primary" className="text-[10px]">Solo Practice</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Practice solo coding with Gemini acting as a Senior Staff Interviewer giving real-time feedback.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Problem Source (For Peer Mode) */}
              {mode === 'PEER' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    Problem Source
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setProblemSource('BANK')}
                      className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer border ${
                        problemSource === 'BANK'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      📚 Select from Problem Bank
                    </button>
                    <button
                      type="button"
                      onClick={() => setProblemSource('CUSTOM')}
                      className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer border ${
                        problemSource === 'CUSTOM'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      ✍️ Create Custom Problem
                    </button>
                  </div>
                </div>
              )}

              {/* 3A. Catalog Problem Selection */}
              {(mode === 'AI' || problemSource === 'BANK') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                      Select Target Problem
                    </label>
                    <input
                      type="text"
                      placeholder="Search catalog..."
                      value={problemSearch}
                      onChange={(e) => setProblemSearch(e.target.value)}
                      className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground w-48"
                    />
                  </div>

                  <select
                    value={problemId}
                    onChange={(e) => setProblemId(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs text-foreground focus-visible:outline-2"
                  >
                    {filteredProblems.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.difficulty}) - {p.platform}
                      </option>
                    ))}
                  </select>

                  {selectedProblemObj && selectedProblemObj.summary && (
                    <div className="rounded-xl bg-muted/20 border border-border p-3 text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{selectedProblemObj.title}</span>
                        {getDifficultyBadge(selectedProblemObj.difficulty)}
                      </div>
                      <p className="line-clamp-2">{selectedProblemObj.summary}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 3B. Custom Problem Fields */}
              {mode === 'PEER' && problemSource === 'CUSTOM' && (
                <div className="space-y-4 rounded-xl border border-border bg-muted/10 p-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Custom Problem Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Find Kth Largest Element in Infinite Stream"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Problem Description / Examples</label>
                    <textarea
                      rows={4}
                      placeholder="Describe the problem, input format, output format, and examples..."
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Constraints</label>
                    <input
                      type="text"
                      placeholder="e.g. 1 <= N <= 10^5, -10^9 <= nums[i] <= 10^9"
                      value={customConstraints}
                      onChange={(e) => setCustomConstraints(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                </div>
              )}

              {/* 4. Test Case Configuration (For Peer Mode) */}
              {mode === 'PEER' && (
                <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Judge0 Test Cases Configuration
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Configure public tests (visible to candidate) and hidden tests (used for full evaluation scoring).
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTestCase(false)}
                        className="text-xs"
                      >
                        + Add Public Test
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTestCase(true)}
                        className="text-xs"
                      >
                        + Add Hidden Test
                      </Button>
                    </div>
                  </div>

                  {testCases.length === 0 ? (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      No test cases added yet. Click above to add public or hidden test cases.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {testCases.map((tc) => (
                        <div
                          key={tc.id}
                          className={`rounded-xl border p-3 space-y-2 ${
                            tc.isHidden ? 'border-destructive/30 bg-destructive/5' : 'border-success/30 bg-success/5'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Badge variant={tc.isHidden ? 'destructive' : 'success'} className="text-[10px]">
                              {tc.isHidden ? '🔒 Hidden Test Case' : '👁️ Public Sample Test'}
                            </Badge>

                            <button
                              type="button"
                              onClick={() => handleRemoveTestCase(tc.id)}
                              className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[11px] font-semibold text-muted-foreground">Standard Input (stdin)</span>
                              <textarea
                                rows={2}
                                value={tc.input}
                                onChange={(e) => handleUpdateTestCase(tc.id, 'input', e.target.value)}
                                placeholder="Input..."
                                className="w-full mt-1 rounded-md border border-input bg-background p-2 font-mono text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-[11px] font-semibold text-muted-foreground">Expected Output</span>
                              <textarea
                                rows={2}
                                value={tc.expectedOutput}
                                onChange={(e) => handleUpdateTestCase(tc.id, 'expectedOutput', e.target.value)}
                                placeholder="Expected stdout..."
                                className="w-full mt-1 rounded-md border border-input bg-background p-2 font-mono text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 5. Schedule & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Duration (Minutes)</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground"
                  >
                    <option value={30}>30 Minutes (Sprint)</option>
                    <option value={45}>45 Minutes (Standard Technical)</option>
                    <option value={60}>60 Minutes (Deep Dive)</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={submitting}
                className="w-full shadow-xs cursor-pointer font-bold"
              >
                {submitting
                  ? 'Creating Session...'
                  : mode === 'PEER'
                  ? 'Create Peer Interview & Get Invite'
                  : 'Start AI Mock Interview'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Scheduled Sessions Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Your Active & Scheduled Sessions</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
              No interview sessions scheduled yet. Configure and create your first session above.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((s) => {
                const isInterviewer = s.interviewerId === currentUserId;
                const isPeer = s.mode === 'PEER';
                const effectiveTitle = s.problem?.title || s.customTitle || 'General Algorithmic Session';

                return (
                  <div
                    key={s.id}
                    className={`rounded-xl border bg-card p-4 shadow-xs flex flex-col justify-between gap-4 ${
                      isPeer ? 'border-warning/30' : 'border-border'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={isPeer ? 'warning' : 'primary'} className="text-[10px]">
                          {isPeer ? 'PEER INTERVIEW' : 'AI INTERVIEW'}
                        </Badge>
                        {getStatusBadge(s.status)}
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-foreground line-clamp-1">{effectiveTitle}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {isInterviewer ? 'Role: Interviewer' : 'Role: Candidate'}
                        </p>
                      </div>

                      <div className="text-xs text-muted-foreground pt-1 space-y-0.5">
                        <p>📅 {new Date(s.scheduledAt).toLocaleString()}</p>
                        <p>⏱️ Duration: {s.durationMinutes} mins</p>
                        {isPeer && (
                          <p className="pt-0.5 text-[11px]">
                            {s.candidate ? (
                              <span className="text-success font-medium">Candidate: {s.candidate.name || 'Joined'}</span>
                            ) : (
                              <span className="text-warning font-medium">○ Waiting for candidate</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3">
                      {s.status !== 'COMPLETED' && s.status !== 'CANCELLED' ? (
                        <div className="flex items-center gap-2">
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
                                copiedSessionId === s.id
                                  ? 'border-success bg-success/15 text-success'
                                  : 'border-border bg-background text-foreground hover:bg-muted'
                              }`}
                            >
                              {copiedSessionId === s.id ? '✓ Copied' : 'Copy Invite'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Session {s.status.toLowerCase()}</span>
                      )}

                      {s.status !== 'COMPLETED' && s.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancelSession(s.id)}
                          className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          Cancel
                        </button>
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
