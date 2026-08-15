'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ProblemFilters } from './ProblemFilters';
import { ProblemItem, ProblemData } from './ProblemItem';
import { ProblemPagination } from './ProblemPagination';

interface FilterOption {
  id: string;
  name: string;
  slug: string;
}

export function ProblemCatalog() {
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('ALL');
  const [platform, setPlatform] = useState('ALL');
  const [topic, setTopic] = useState('ALL');
  const [company, setCompany] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [sort, setSort] = useState('DEFAULT');
  const [page, setPage] = useState(1);
  const limit = 12;

  // Filter options lists
  const [topicsList, setTopicsList] = useState<FilterOption[]>([]);
  const [companiesList, setCompaniesList] = useState<FilterOption[]>([]);
  const [platformsList, setPlatformsList] = useState<string[]>([
    'LeetCode',
    'CSES',
    'Codeforces',
    'HackerRank',
    'AtCoder',
  ]);

  // Data states
  const [problems, setProblems] = useState<ProblemData[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth prompt banner state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Debounce search timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch filter metadata once on mount
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const res = await fetch('/api/problems/filters');
        if (res.ok) {
          const data = await res.json();
          if (data.topics) setTopicsList(data.topics);
          if (data.companies) setCompaniesList(data.companies);
          if (data.platforms) setPlatformsList(data.platforms);
        }
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    }
    loadFilterOptions();
  }, []);

  // 2. Fetch problems query
  const fetchProblems = useCallback(
    async (currentPage: number, currentSearch: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', currentPage.toString());
        params.set('limit', limit.toString());
        if (currentSearch.trim()) params.set('search', currentSearch.trim());
        if (difficulty !== 'ALL') params.set('difficulty', difficulty);
        if (platform !== 'ALL') params.set('platform', platform);
        if (topic !== 'ALL') params.set('topic', topic);
        if (company !== 'ALL') params.set('company', company);
        if (status !== 'ALL') params.set('status', status);
        if (sort !== 'DEFAULT') params.set('sort', sort);

        const res = await fetch(`/api/problems?${params.toString()}`);
        if (!res.ok) {
          throw new Error('Failed to fetch problems');
        }
        const data = await res.json();
        setProblems(data.problems || []);
        setPagination(
          data.pagination || {
            total: 0,
            page: currentPage,
            limit,
            totalPages: 1,
          }
        );
        setPage(currentPage);
      } catch (err) {
        console.error('Error fetching problems:', err);
        setError('Could not load coding problems. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [difficulty, platform, topic, company, status, sort, limit]
  );

  // 3. Trigger fetch on filter/sort changes
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchProblems(1, search);
    }, 250);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [search, difficulty, platform, topic, company, status, sort, fetchProblems]);

  // 4. Trigger fetch on direct page navigation
  const handlePageChange = (newPage: number) => {
    fetchProblems(newPage, search);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 5. Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setDifficulty('ALL');
    setPlatform('ALL');
    setTopic('ALL');
    setCompany('ALL');
    setStatus('ALL');
    setSort('DEFAULT');
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(search.trim()) ||
    difficulty !== 'ALL' ||
    platform !== 'ALL' ||
    topic !== 'ALL' ||
    company !== 'ALL' ||
    status !== 'ALL' ||
    sort !== 'DEFAULT';

  // 6. Optimistic Bookmark Toggle
  const handleToggleBookmark = async (problemId: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Optimistic UI update
    setProblems((prev) =>
      prev.map((p) => (p.id === problemId ? { ...p, isBookmarked: !p.isBookmarked } : p))
    );

    try {
      const res = await fetch('/api/problems/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId }),
      });
      if (!res.ok) {
        // Rollback
        setProblems((prev) =>
          prev.map((p) => (p.id === problemId ? { ...p, isBookmarked: !p.isBookmarked } : p))
        );
      }
    } catch {
      // Rollback
      setProblems((prev) =>
        prev.map((p) => (p.id === problemId ? { ...p, isBookmarked: !p.isBookmarked } : p))
      );
    }
  };

  // 7. Optimistic Status Update
  const handleUpdateStatus = async (
    problemId: string,
    newStatus: 'SOLVED' | 'ATTEMPTED' | 'UNSOLVED'
  ) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const previousProblem = problems.find((p) => p.id === problemId);
    const prevStatus = previousProblem?.status || 'UNSOLVED';

    // Optimistic update
    setProblems((prev) =>
      prev.map((p) => (p.id === problemId ? { ...p, status: newStatus } : p))
    );

    try {
      const res = await fetch('/api/problems/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, status: newStatus }),
      });
      if (!res.ok) {
        // Rollback
        setProblems((prev) =>
          prev.map((p) => (p.id === problemId ? { ...p, status: prevStatus } : p))
        );
      }
    } catch {
      // Rollback
      setProblems((prev) =>
        prev.map((p) => (p.id === problemId ? { ...p, status: prevStatus } : p))
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Coding Problems Catalog
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Curated list of real technical interview problems from top competitive platforms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-success" />
            <span className="font-semibold text-foreground">{pagination.total}</span> Curated Problems
          </div>
        </div>
      </div>

      {/* Auth required banner modal */}
      {showAuthModal && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Sign in to save your progress</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sign in with Google or GitHub to bookmark problems, mark solutions as solved, and track your stats.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/signin"
              className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary-hover transition-colors text-center"
            >
              Sign In
            </Link>
            <button
              onClick={() => setShowAuthModal(false)}
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Filter controls */}
      <ProblemFilters
        search={search}
        setSearch={setSearch}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        platform={platform}
        setPlatform={setPlatform}
        topic={topic}
        setTopic={setTopic}
        company={company}
        setCompany={setCompany}
        status={status}
        setStatus={setStatus}
        sort={sort}
        setSort={setSort}
        topics={topicsList}
        companies={companiesList}
        platforms={platformsList}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
        isAuthenticated={isAuthenticated}
      />

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive font-medium">{error}</p>
          <button
            onClick={() => fetchProblems(page, search)}
            className="mt-3 rounded-lg bg-card border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && !error && (
        <div className="space-y-3">
          <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border bg-muted/30 px-4 py-3 flex gap-4 text-xs font-medium text-muted-foreground">
              <span className="w-12">Status</span>
              <span className="flex-1">Title</span>
              <span className="w-24">Difficulty</span>
              <span className="w-28">Platform</span>
              <span className="w-48">Topics</span>
              <span className="w-24 text-right">Action</span>
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border/50 animate-pulse">
                <div className="h-6 w-6 rounded-full bg-muted shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-48 rounded bg-muted" />
                  <div className="h-3 w-80 rounded bg-muted/60" />
                </div>
                <div className="h-5 w-16 rounded bg-muted" />
                <div className="h-5 w-20 rounded bg-muted" />
                <div className="h-5 w-32 rounded bg-muted" />
                <div className="h-7 w-16 rounded bg-muted shrink-0 ml-auto" />
              </div>
            ))}
          </div>

          <div className="md:hidden space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3 animate-pulse">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted/60" />
                <div className="flex gap-2">
                  <div className="h-5 w-14 rounded bg-muted" />
                  <div className="h-5 w-20 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Problems List / Table */}
      {!loading && !error && problems.length > 0 && (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 pl-4 pr-2 w-12 text-center">Status</th>
                  <th className="py-3 px-3">Problem Title</th>
                  <th className="py-3 px-3 w-28">Difficulty</th>
                  <th className="py-3 px-3 w-28">Platform</th>
                  <th className="py-3 px-3">Topics & Companies</th>
                  <th className="py-3 pl-2 pr-4 text-right w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {problems.map((problem) => (
                  <ProblemItem
                    key={problem.id}
                    problem={problem}
                    isAuthenticated={isAuthenticated}
                    onToggleBookmark={handleToggleBookmark}
                    onUpdateStatus={handleUpdateStatus}
                    onRequireAuth={() => setShowAuthModal(true)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {problems.map((problem) => (
              <ProblemItem
                key={problem.id}
                problem={problem}
                isAuthenticated={isAuthenticated}
                onToggleBookmark={handleToggleBookmark}
                onUpdateStatus={handleUpdateStatus}
                onRequireAuth={() => setShowAuthModal(true)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <ProblemPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && problems.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-foreground">No problems found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            We couldn&apos;t find any coding problems matching your current search or filter criteria.
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary-hover transition-colors cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
