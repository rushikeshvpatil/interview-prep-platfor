import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Mock Interview | Interview Prep Platform',
  description: 'Practice realistic technical interviews with in-browser code execution',
};

export default function MockInterviewPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Mock Interviews</h1>
            <p className="text-muted-foreground mt-1">Practice realistic technical interviews with code execution and timer</p>
          </div>
          <Link href="/interview/schedule">
            <Button variant="primary">
              Schedule New Interview
            </Button>
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Ready to start an interview session?</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Schedule an AI or Peer interview session with gated in-browser code execution, live timer, and automated testing.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link href="/interview/schedule">
              <Button variant="primary">
                Go to Interview Scheduler
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
