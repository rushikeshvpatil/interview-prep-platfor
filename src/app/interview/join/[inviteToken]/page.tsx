'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface InviteSessionData {
  id: string;
  mode: string;
  stream: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  candidate: { id: string; name?: string | null; email?: string | null; image?: string | null };
  problem?: { id: string; title: string; difficulty: string; platform: string; summary?: string | null } | null;
  isAssigned: boolean;
}

export default function JoinPeerInterviewPage({
  params,
}: {
  params: Promise<{ inviteToken: string }>;
}) {
  const { inviteToken } = use(params);
  const { status: authStatus } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [sessionData, setSessionData] = useState<InviteSessionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchInvite() {
      try {
        setLoading(true);
        const res = await fetch(`/api/interview/join/${inviteToken}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setSessionData(data.session);
        } else {
          const err = await res.json();
          if (isMounted) setError(err.error || 'Invalid or expired invitation link');
        }
      } catch {
        if (isMounted) setError('Failed to load interview invitation.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchInvite();

    return () => {
      isMounted = false;
    };
  }, [inviteToken]);

  const handleJoin = async () => {
    if (authStatus !== 'authenticated') {
      router.push(`/signin?callbackUrl=/interview/join/${inviteToken}`);
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const res = await fetch(`/api/interview/join/${inviteToken}`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join interview');
      }

      router.push(`/interview/${data.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join interview');
      setJoining(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-xl py-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Peer Mock Interview Invitation</h1>
          <p className="text-sm text-muted-foreground">
            You have been invited to participate as an Interviewer for a 1-on-1 technical session.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : sessionData ? (
          <Card>
            <CardHeader className="border-b border-border bg-muted/20 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Session Overview
                </span>
                <Badge variant="warning">{sessionData.stream} Interview</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {/* Candidate Info */}
              <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-sm">
                  {sessionData.candidate.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Candidate</span>
                  <h3 className="text-sm font-bold text-foreground">
                    {sessionData.candidate.name || 'Anonymous Candidate'}
                  </h3>
                </div>
              </div>

              {/* Problem Info */}
              <div className="rounded-xl border border-border bg-background p-3.5 space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Problem Focus</span>
                <h3 className="text-sm font-bold text-foreground">
                  {sessionData.problem?.title || 'General Algorithmic Problem Solving'}
                </h3>
                {sessionData.problem && (
                  <div className="flex items-center gap-2 pt-1">
                    <Badge
                      variant={
                        sessionData.problem.difficulty === 'EASY'
                          ? 'success'
                          : sessionData.problem.difficulty === 'MEDIUM'
                          ? 'warning'
                          : 'destructive'
                      }
                      className="text-[10px]"
                    >
                      {sessionData.problem.difficulty}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{sessionData.problem.platform}</span>
                  </div>
                )}
              </div>

              {/* Duration & Scheduled Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-muted/40 p-3">
                  <span className="text-muted-foreground text-[11px]">⏱️ Duration:</span>
                  <p className="font-semibold text-foreground mt-0.5">{sessionData.durationMinutes} Minutes</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <span className="text-muted-foreground text-[11px]">📅 Scheduled:</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {new Date(sessionData.scheduledAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Role explanation */}
              <div className="rounded-xl bg-muted/20 p-4 text-xs text-muted-foreground space-y-1.5">
                <p className="font-semibold text-foreground">Your Role as Interviewer:</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li>Observe the candidate write code live with a real-time read-only view.</li>
                  <li>Watch test case executions and Judge0 compiler results in real time.</li>
                  <li>Take private scratchpad notes during the session.</li>
                  <li>Submit a structured 6-dimension evaluation scorecard at the end.</li>
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {authStatus !== 'authenticated' ? (
                  <Button
                    onClick={handleJoin}
                    variant="primary"
                    className="w-full"
                  >
                    Sign In to Join as Interviewer
                  </Button>
                ) : (
                  <Button
                    onClick={handleJoin}
                    variant="primary"
                    disabled={joining}
                    className="w-full shadow-xs"
                  >
                    {joining ? 'Entering Room...' : 'Join Interview Room as Interviewer'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center pt-4">
            <Link href="/problems">
              <Button variant="outline">Explore Problems Catalog</Button>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
