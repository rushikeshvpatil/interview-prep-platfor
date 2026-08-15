'use client';

import { useState, useEffect, useTransition } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface CompanyOption {
  id: string;
  name: string;
  slug: string;
}

interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  experienceLevel: string | null;
  targetRole: string | null;
  targetCompanies: string[];
  primaryFocus: string | null;
  targetInterviewDate: string | null;
  preferredDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
  createdAt?: string;
}

interface StatsData {
  solvedCount: number;
  attemptedCount: number;
  bookmarksCount: number;
}

export default function ProfilePage() {
  const { data: session, status: sessionStatus } = useSession();

  // State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Profile Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<string>('BEGINNER');
  const [targetRole, setTargetRole] = useState<string>('SDE');
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [primaryFocus, setPrimaryFocus] = useState<string>('DSA');
  const [preferredDifficulty, setPreferredDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [targetInterviewDate, setTargetInterviewDate] = useState<string>('');

  // Metadata & Stats
  const [stats, setStats] = useState<StatsData>({
    solvedCount: 0,
    attemptedCount: 0,
    bookmarksCount: 0,
  });
  const [availableCompanies, setAvailableCompanies] = useState<CompanyOption[]>([]);
  const [, startTransition] = useTransition();

  // Fetch initial profile
  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch('/api/profile');
        if (res.ok && isMounted) {
          const data = await res.json();
          const u: ProfileData = data.user;
          setName(u.name || '');
          setEmail(u.email || '');
          setImage(u.image || null);
          setBio(u.bio || '');
          setExperienceLevel(u.experienceLevel || 'BEGINNER');
          setTargetRole(u.targetRole || 'SDE');
          setTargetCompanies(u.targetCompanies || []);
          setPrimaryFocus(u.primaryFocus || 'DSA');
          setPreferredDifficulty(u.preferredDifficulty || 'MEDIUM');
          if (u.targetInterviewDate) {
            const d = new Date(u.targetInterviewDate);
            if (!isNaN(d.getTime())) {
              setTargetInterviewDate(d.toISOString().split('T')[0]);
            }
          }
          if (data.stats) setStats(data.stats);
          if (data.availableCompanies) setAvailableCompanies(data.availableCompanies);
        } else if (isMounted) {
          setErrorMessage('Could not load profile. Please refresh the page.');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        if (isMounted) setErrorMessage('Failed to connect to the server.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (sessionStatus === 'authenticated') {
      loadProfile();
    }

    return () => {
      isMounted = false;
    };
  }, [sessionStatus]);

  // Toggle company selection
  const handleToggleCompany = (companyName: string) => {
    setTargetCompanies((prev) =>
      prev.includes(companyName)
        ? prev.filter((c) => c !== companyName)
        : [...prev, companyName]
    );
  };

  // Submit profile updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        name,
        bio,
        experienceLevel,
        targetRole,
        targetCompanies,
        primaryFocus,
        targetInterviewDate: targetInterviewDate ? new Date(targetInterviewDate).toISOString() : null,
        preferredDifficulty,
      };

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save profile');
      }

      const data = await res.json();
      setSuccessMessage('Candidate profile & interview preferences saved successfully!');
      if (data.user?.name) {
        startTransition(() => {
          setName(data.user.name);
        });
      }
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Save profile error:', err);
      setErrorMessage('Failed to save profile changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate timeline countdown
  const getTimelineCountdown = () => {
    if (!targetInterviewDate) return null;
    const target = new Date(targetInterviewDate);
    if (isNaN(target.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return {
        status: 'today',
        text: '🔥 Your target interview date is today! Best of luck!',
        badge: 'Today',
      };
    } else if (diffDays > 0) {
      return {
        status: 'future',
        text: `🎯 ${diffDays} day${diffDays === 1 ? '' : 's'} until your target interview`,
        badge: `${diffDays} days left`,
      };
    } else {
      const pastDays = Math.abs(diffDays);
      return {
        status: 'past',
        text: `📅 Target date was ${pastDays} day${pastDays === 1 ? '' : 's'} ago. Set your next target milestone.`,
        badge: 'Past Target',
      };
    }
  };

  const countdown = getTimelineCountdown();

  if (sessionStatus === 'loading' || loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl py-16 flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading candidate profile...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Candidate Profile & Preferences
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your interview preferences to personalize practice goals and AI mock interviews.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/problems">
              <Button variant="outline" size="sm">
                Browse Problems
              </Button>
            </Link>
          </div>
        </div>

        {/* Alerts */}
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

        <form onSubmit={handleSaveProfile} className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left 2 Columns: Editable Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* SECTION A: Profile Information */}
              <Card>
                <CardHeader className="border-b border-border bg-muted/20 pb-4">
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    Profile Information
                  </h2>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-2">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={name || 'User Avatar'}
                        className="h-16 w-16 rounded-full border-2 border-border object-cover shrink-0"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold border border-primary/20 shrink-0">
                        {name ? name.charAt(0).toUpperCase() : email ? email.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="text-center sm:text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{name || 'Interview Candidate'}</span>
                        <Badge variant="success" className="text-[10px]">Active</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{email || 'Authenticated User'}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1">Avatar provided automatically by OAuth provider</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="displayName" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                        Display Name
                      </label>
                      <input
                        id="displayName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
                      />
                    </div>

                    <div>
                      <label htmlFor="emailDisplay" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <input
                        id="emailDisplay"
                        type="text"
                        value={email}
                        readOnly
                        disabled
                        className="w-full rounded-lg border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="bioInput" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                      Bio / Elevator Pitch
                    </label>
                    <textarea
                      id="bioInput"
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Briefly describe your technical background, projects, or primary strengths..."
                      className="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* SECTION B: Experience & Target Career Goals */}
              <Card>
                <CardHeader className="border-b border-border bg-muted/20 pb-4">
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                    Experience & Career Preferences
                  </h2>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="expLevel" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                        Experience Level
                      </label>
                      <select
                        id="expLevel"
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
                      >
                        <option value="BEGINNER">Beginner (0–2 years / Entry Level)</option>
                        <option value="INTERMEDIATE">Intermediate (3–5 years / Mid Level)</option>
                        <option value="ADVANCED">Advanced (5+ years / Senior / Lead)</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="targetRoleSelect" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                        Target Role
                      </label>
                      <select
                        id="targetRoleSelect"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
                      >
                        <option value="SDE">Software Development Engineer (SDE)</option>
                        <option value="FRONTEND">Frontend Engineer</option>
                        <option value="BACKEND">Backend Engineer</option>
                        <option value="FULL_STACK">Full-Stack Engineer</option>
                        <option value="SOFTWARE_ENGINEER">Software Engineer (Generalist)</option>
                        <option value="OTHER">Other Technical Role</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="focusSelect" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                        Primary Interview Focus
                      </label>
                      <select
                        id="focusSelect"
                        value={primaryFocus}
                        onChange={(e) => setPrimaryFocus(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
                      >
                        <option value="DSA">Data Structures & Algorithms</option>
                        <option value="SYSTEM_DESIGN">System Design & Architecture</option>
                        <option value="FULL_STACK">Full-Stack Application Design</option>
                        <option value="BEHAVIORAL">Behavioral & Leadership Principles</option>
                        <option value="MIXED">Mixed Comprehensive Preparation</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="prefDiff" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                        Preferred Problem Difficulty
                      </label>
                      <select
                        id="prefDiff"
                        value={preferredDifficulty}
                        onChange={(e) => setPreferredDifficulty(e.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
                      >
                        <option value="EASY">Easy (Fundamentals & Speed)</option>
                        <option value="MEDIUM">Medium (Standard Technical Bar)</option>
                        <option value="HARD">Hard (Advanced Competitive / FAANG Hard)</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SECTION C: Target Companies Multi-Select */}
              <Card>
                <CardHeader className="border-b border-border bg-muted/20 pb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                      </svg>
                      Target Companies
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {targetCompanies.length} selected
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-xs text-muted-foreground mb-3">
                    Select the companies you are preparing for. These will be prioritized in your curated practice problem sets.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableCompanies.length > 0 ? (
                      availableCompanies.map((c) => {
                        const isSelected = targetCompanies.includes(c.name);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleToggleCompany(c.name)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer ${
                              isSelected
                                ? 'bg-primary text-primary-foreground shadow-xs'
                                : 'border border-border bg-card text-foreground hover:bg-muted'
                            }`}
                          >
                            <span>{c.name}</span>
                            {isSelected ? (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                            ) : (
                              <span className="text-muted-foreground/50">+</span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground">No companies found.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SECTION D: Target Interview Timeline */}
              <Card>
                <CardHeader className="border-b border-border bg-muted/20 pb-4">
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.253 18.75h18V7.5H3v13.5Z" />
                    </svg>
                    Target Interview Timeline
                  </h2>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label htmlFor="interviewDate" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                      Target Interview Date
                    </label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <input
                        id="interviewDate"
                        type="date"
                        value={targetInterviewDate}
                        onChange={(e) => setTargetInterviewDate(e.target.value)}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
                      />
                      {targetInterviewDate && (
                        <button
                          type="button"
                          onClick={() => setTargetInterviewDate('')}
                          className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          Clear Date
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Countdown Callout */}
                  {countdown ? (
                    <div
                      className={`rounded-xl border p-4 text-xs font-medium flex items-center justify-between gap-3 ${
                        countdown.status === 'today'
                          ? 'border-warning/30 bg-warning/10 text-warning'
                          : countdown.status === 'future'
                          ? 'border-primary/20 bg-primary/5 text-foreground'
                          : 'border-muted bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      <span>{countdown.text}</span>
                      <span className="font-semibold text-[11px] px-2 py-0.5 rounded-md bg-card border border-border">
                        {countdown.badge}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No target interview date set. Pick a date to see your countdown and pacing goals.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Form Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  className="w-full sm:w-auto shadow-xs"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Saving Preferences...
                    </span>
                  ) : (
                    'Save Candidate Preferences'
                  )}
                </Button>
              </div>
            </div>

            {/* Right Column: SECTION E Preparation Summary & Account Actions */}
            <div className="space-y-6">
              {/* SECTION E: Real Database Preparation Summary */}
              <Card>
                <CardHeader className="border-b border-border bg-muted/20 pb-4">
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                    </svg>
                    Preparation Summary
                  </h2>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {/* Stats Counter Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border border-border bg-muted/10 p-3">
                      <span className="text-xl font-bold text-success">{stats.solvedCount}</span>
                      <p className="text-[11px] font-medium text-muted-foreground uppercase mt-0.5">Solved</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/10 p-3">
                      <span className="text-xl font-bold text-warning">{stats.attemptedCount}</span>
                      <p className="text-[11px] font-medium text-muted-foreground uppercase mt-0.5">Attempted</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/10 p-3">
                      <span className="text-xl font-bold text-amber-500">{stats.bookmarksCount}</span>
                      <p className="text-[11px] font-medium text-muted-foreground uppercase mt-0.5">Bookmarks</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 space-y-3">
                    <div>
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Role & Focus
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <Badge variant="primary">{targetRole}</Badge>
                        <Badge variant="default">{primaryFocus}</Badge>
                        <Badge variant="warning">{experienceLevel}</Badge>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Target Companies
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {targetCompanies.length > 0 ? (
                          targetCompanies.map((c) => (
                            <span
                              key={c}
                              className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
                            >
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">None selected yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/problems"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-2xs text-center"
                    >
                      <span>Practice Curated Catalog</span>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Account Management & Security Card */}
              <Card>
                <CardHeader className="border-b border-border bg-muted/20 pb-4">
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                    Account & Session
                  </h2>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="flex items-center justify-between">
                      <span>Auth Provider:</span>
                      <strong className="text-foreground">{session?.user ? 'OAuth (Google / GitHub)' : 'Guest'}</strong>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Session Status:</span>
                      <strong className="text-success">Authenticated</strong>
                    </p>
                  </div>

                  <div className="border-t border-border pt-4">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs"
                    >
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
