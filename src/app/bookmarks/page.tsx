import { AppShell } from '@/components/layout/AppShell';

export const metadata = {
  title: 'Bookmarks | Interview Prep Platform',
  description: 'Your saved problems and study lists',
};

export default function BookmarksPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Bookmarks</h1>
          <p className="text-muted-foreground mt-1">Your saved problems and custom study lists</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Bookmarks Coming Soon</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">Save problems to custom lists, add personal notes, and organize your study materials here.</p>
        </div>
      </div>
    </AppShell>
  );
}
