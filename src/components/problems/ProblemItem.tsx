'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';

export interface ProblemData {
  id: string;
  title: string;
  slug: string;
  platform: string;
  externalUrl: string;
  externalId?: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  summary?: string | null;
  topics: { id: string; name: string; slug: string }[];
  companies: { id: string; name: string; slug: string }[];
  isBookmarked: boolean;
  status: 'SOLVED' | 'ATTEMPTED' | 'UNSOLVED';
  attempts: number;
  solvedAt?: string | null;
}

interface ProblemComponentProps {
  problem: ProblemData;
  isAuthenticated: boolean;
  onToggleBookmark: (problemId: string) => void;
  onUpdateStatus: (problemId: string, status: 'SOLVED' | 'ATTEMPTED' | 'UNSOLVED') => void;
  onRequireAuth: () => void;
}

function getDifficultyBadge(diff: string) {
  switch (diff) {
    case 'EASY':
      return <Badge variant="success" className="font-semibold">Easy</Badge>;
    case 'MEDIUM':
      return <Badge variant="warning" className="font-semibold">Medium</Badge>;
    case 'HARD':
      return <Badge variant="destructive" className="font-semibold">Hard</Badge>;
    default:
      return <Badge>{diff}</Badge>;
  }
}

function getPlatformBadgeColor(plat: string) {
  switch (plat.toLowerCase()) {
    case 'leetcode':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'codeforces':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'cses':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    case 'hackerrank':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'atcoder':
      return 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-300 border-neutral-500/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

/**
 * Desktop Table Row Representation (Must only be rendered inside <tbody>)
 */
export function ProblemTableRow({
  problem,
  isAuthenticated,
  onToggleBookmark,
  onUpdateStatus,
  onRequireAuth,
}: ProblemComponentProps) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const handleStatusChange = (newStatus: 'SOLVED' | 'ATTEMPTED' | 'UNSOLVED') => {
    setStatusMenuOpen(false);
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    onUpdateStatus(problem.id, newStatus);
  };

  const handleBookmarkClick = () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    onToggleBookmark(problem.id);
  };

  return (
    <tr className="border-b border-border/70 hover:bg-muted/40 transition-colors group">
      {/* Status */}
      <td className="py-3.5 pl-4 pr-2 w-12 text-center align-top pt-4">
        <div className="relative inline-block text-left">
          <button
            onClick={() => {
              if (!isAuthenticated) {
                onRequireAuth();
              } else {
                setStatusMenuOpen(!statusMenuOpen);
              }
            }}
            className="p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
            title={
              isAuthenticated
                ? `Status: ${problem.status}. Click to change.`
                : 'Sign in to track problem progress'
            }
          >
            {problem.status === 'SOLVED' ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
            ) : problem.status === 'ATTEMPTED' ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/15 text-warning">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
                </svg>
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground/40 hover:text-muted-foreground hover:border-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-transparent" />
              </div>
            )}
          </button>

          {statusMenuOpen && (
            <div className="absolute left-0 mt-1 w-44 rounded-lg border border-border bg-card p-1 shadow-lg z-30 animate-in fade-in zoom-in-95">
              <button
                onClick={() => handleStatusChange('SOLVED')}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                  problem.status === 'SOLVED'
                    ? 'bg-success/10 text-success'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-success" />
                Mark as Solved
              </button>
              <button
                onClick={() => handleStatusChange('ATTEMPTED')}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                  problem.status === 'ATTEMPTED'
                    ? 'bg-warning/10 text-warning'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-warning" />
                Mark as Attempted
              </button>
              <button
                onClick={() => handleStatusChange('UNSOLVED')}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                  problem.status === 'UNSOLVED'
                    ? 'bg-muted text-muted-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="h-2 w-2 rounded-full border border-muted-foreground" />
                Reset to Unsolved
              </button>
            </div>
          )}
        </div>
      </td>

      {/* Title & Summary */}
      <td className="py-3.5 px-3 align-top max-w-sm">
        <div className="flex flex-col">
          <a
            href={problem.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
          >
            <span>{problem.title}</span>
            <svg
              className="h-3.5 w-3.5 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:text-primary transition-opacity shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
          {problem.summary && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {problem.summary}
            </p>
          )}
        </div>
      </td>

      {/* Difficulty */}
      <td className="py-3.5 px-3 align-top whitespace-nowrap">
        {getDifficultyBadge(problem.difficulty)}
      </td>

      {/* Platform */}
      <td className="py-3.5 px-3 align-top whitespace-nowrap">
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${getPlatformBadgeColor(
            problem.platform
          )}`}
        >
          {problem.platform}
        </span>
      </td>

      {/* Topics & Companies */}
      <td className="py-3.5 px-3 align-top">
        <div className="flex flex-wrap gap-1 max-w-xs">
          {problem.topics.slice(0, 3).map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {t.name}
            </span>
          ))}
          {problem.topics.length > 3 && (
            <span
              className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
              title={problem.topics.map((t) => t.name).join(', ')}
            >
              +{problem.topics.length - 3}
            </span>
          )}
          {problem.companies.slice(0, 2).map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center rounded-md bg-primary/5 border border-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary"
            >
              {c.name}
            </span>
          ))}
        </div>
      </td>

      {/* Actions (Bookmark + External Link) */}
      <td className="py-3.5 pl-2 pr-4 align-top text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={handleBookmarkClick}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              problem.isBookmarked
                ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title={problem.isBookmarked ? 'Remove bookmark' : 'Bookmark problem'}
          >
            <svg
              className="h-4 w-4"
              fill={problem.isBookmarked ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
          </button>

          <a
            href={problem.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-150 shadow-2xs"
          >
            <span>Solve</span>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </a>
        </div>
      </td>
    </tr>
  );
}

/**
 * Mobile Card Representation (Must only be rendered inside <div>)
 */
export function ProblemCard({
  problem,
  isAuthenticated,
  onToggleBookmark,
  onUpdateStatus,
  onRequireAuth,
}: ProblemComponentProps) {
  const handleStatusCycle = () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    const nextStatus =
      problem.status === 'UNSOLVED'
        ? 'ATTEMPTED'
        : problem.status === 'ATTEMPTED'
        ? 'SOLVED'
        : 'UNSOLVED';
    onUpdateStatus(problem.id, nextStatus);
  };

  const handleBookmarkClick = () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    onToggleBookmark(problem.id);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {/* Status toggle */}
          <button
            onClick={handleStatusCycle}
            className="mt-0.5 shrink-0 cursor-pointer"
            title={`Status: ${problem.status}. Tap to cycle.`}
          >
            {problem.status === 'SOLVED' ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
            ) : problem.status === 'ATTEMPTED' ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/15 text-warning">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
                </svg>
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground/30">
                <span className="h-2 w-2 rounded-full" />
              </div>
            )}
          </button>

          <div>
            <a
              href={problem.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <span>{problem.title}</span>
              <svg className="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
            {problem.summary && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                {problem.summary}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleBookmarkClick}
          className={`p-1.5 rounded-lg shrink-0 cursor-pointer ${
            problem.isBookmarked
              ? 'text-amber-500 bg-amber-500/10'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <svg
            className="h-4 w-4"
            fill={problem.isBookmarked ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
          </svg>
        </button>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {getDifficultyBadge(problem.difficulty)}
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${getPlatformBadgeColor(
            problem.platform
          )}`}
        >
          {problem.platform}
        </span>
        {problem.topics.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
          >
            {t.name}
          </span>
        ))}
        {problem.companies.map((c) => (
          <span
            key={c.id}
            className="inline-flex items-center rounded-md bg-primary/5 border border-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary"
          >
            {c.name}
          </span>
        ))}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-muted-foreground capitalize">
          Status: <strong className="text-foreground">{problem.status.toLowerCase()}</strong>
        </span>
        <a
          href={problem.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
        >
          <span>Solve on {problem.platform}</span>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </a>
      </div>
    </div>
  );
}
