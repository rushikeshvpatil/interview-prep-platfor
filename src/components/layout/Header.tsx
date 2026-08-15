'use client';

import { ThemeToggle } from '../ThemeToggle';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[var(--header-height)] items-center justify-between border-b border-border bg-[var(--header-bg)] px-4 backdrop-blur-md sm:px-6">
      {/* Left: mobile menu + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-muted transition-colors lg:hidden cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <span className="text-sm text-muted-foreground hidden sm:block">Interview Prep Platform</span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* User avatar placeholder */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
          U
        </div>
      </div>
    </header>
  );
}
