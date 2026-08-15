import { AppShell } from '@/components/layout/AppShell';

export const metadata = {
  title: 'Problems | Interview Prep Platform',
  description: 'Practice coding problems for technical interviews',
};

export default function ProblemsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Problems</h1>
          <p className="text-muted-foreground mt-1">Practice coding problems by topic and difficulty</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Problems Coming Soon</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">A curated collection of coding problems with filters, code editor, and automated testing will be available here.</p>
        </div>
      </div>
    </AppShell>
  );
}
