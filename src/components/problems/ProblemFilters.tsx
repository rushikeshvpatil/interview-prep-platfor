'use client';

import { useTransition } from 'react';

interface TopicOption {
  id: string;
  name: string;
  slug: string;
}

interface CompanyOption {
  id: string;
  name: string;
  slug: string;
}

interface ProblemFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  difficulty: string;
  setDifficulty: (value: string) => void;
  platform: string;
  setPlatform: (value: string) => void;
  topic: string;
  setTopic: (value: string) => void;
  company: string;
  setCompany: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  sort: string;
  setSort: (value: string) => void;
  topics: TopicOption[];
  companies: CompanyOption[];
  platforms: string[];
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  isAuthenticated: boolean;
}

export function ProblemFilters({
  search,
  setSearch,
  difficulty,
  setDifficulty,
  platform,
  setPlatform,
  topic,
  setTopic,
  company,
  setCompany,
  status,
  setStatus,
  sort,
  setSort,
  topics,
  companies,
  platforms,
  hasActiveFilters,
  onResetFilters,
  isAuthenticated,
}: ProblemFiltersProps) {
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs">
      {/* Top row: Search and Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              const val = e.target.value;
              startTransition(() => {
                setSearch(val);
              });
            }}
            placeholder="Search by problem title, platform, or topic..."
            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Clear search"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-xs font-medium text-muted-foreground shrink-0 hidden sm:block">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
          >
            <option value="DEFAULT">Default Order</option>
            <option value="TITLE_ASC">Title (A &rarr; Z)</option>
            <option value="TITLE_DESC">Title (Z &rarr; A)</option>
            <option value="DIFFICULTY_ASC">Difficulty (Easy &rarr; Hard)</option>
            <option value="DIFFICULTY_DESC">Difficulty (Hard &rarr; Easy)</option>
            <option value="NEWEST">Recently Added</option>
          </select>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
        {/* Difficulty Filter */}
        <div>
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs sm:text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
          >
            <option value="ALL">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        {/* Platform Filter */}
        <div>
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
            Platform
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs sm:text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
          >
            <option value="ALL">All Platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Topic Filter */}
        <div>
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
            Topic
          </label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs sm:text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
          >
            <option value="ALL">All Topics</option>
            {topics.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Company Filter */}
        <div>
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
            Company
          </label>
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs sm:text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
          >
            <option value="ALL">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="col-span-2 sm:col-span-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
            My Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={!isAuthenticated}
            className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs sm:text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title={!isAuthenticated ? 'Sign in to filter by your progress status' : undefined}
          >
            <option value="ALL">All Status</option>
            <option value="SOLVED">Solved</option>
            <option value="ATTEMPTED">Attempted</option>
            <option value="UNSOLVED">Unsolved</option>
          </select>
        </div>
      </div>

      {/* Active filters summary bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-foreground">
                &ldquo;{search}&rdquo;
                <button onClick={() => setSearch('')} className="hover:text-destructive cursor-pointer">
                  &times;
                </button>
              </span>
            )}
            {difficulty !== 'ALL' && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-foreground">
                {difficulty}
                <button onClick={() => setDifficulty('ALL')} className="hover:text-destructive cursor-pointer">
                  &times;
                </button>
              </span>
            )}
            {platform !== 'ALL' && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-foreground">
                {platform}
                <button onClick={() => setPlatform('ALL')} className="hover:text-destructive cursor-pointer">
                  &times;
                </button>
              </span>
            )}
            {topic !== 'ALL' && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-foreground">
                {topics.find((t) => t.slug === topic)?.name || topic}
                <button onClick={() => setTopic('ALL')} className="hover:text-destructive cursor-pointer">
                  &times;
                </button>
              </span>
            )}
            {company !== 'ALL' && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-foreground">
                {companies.find((c) => c.slug === company)?.name || company}
                <button onClick={() => setCompany('ALL')} className="hover:text-destructive cursor-pointer">
                  &times;
                </button>
              </span>
            )}
            {status !== 'ALL' && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-foreground">
                {status}
                <button onClick={() => setStatus('ALL')} className="hover:text-destructive cursor-pointer">
                  &times;
                </button>
              </span>
            )}
          </div>

          <button
            onClick={onResetFilters}
            className="text-xs font-medium text-primary hover:underline cursor-pointer"
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
}
