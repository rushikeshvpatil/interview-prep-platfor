'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { LandingThemeToggle } from '@/components/LandingThemeToggle';

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const errorParam = searchParams.get('error');

  const [loadingProvider, setLoadingProvider] = useState<'google' | 'github' | null>(null);

  const handleSignIn = async (provider: 'google' | 'github') => {
    setLoadingProvider(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setLoadingProvider(null);
    }
  };

  const getErrorMessage = (error: string | null) => {
    if (!error) return null;
    switch (error) {
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'EmailCreateAccount':
      case 'Callback':
        return 'Could not authenticate with the provider. Please verify credentials or try again.';
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another provider account.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.';
      case 'Configuration':
        return 'Authentication service configuration error. Please ensure OAuth credentials are configured.';
      default:
        return 'An error occurred during sign in. Please try again.';
    }
  };

  const errorMessage = getErrorMessage(errorParam);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-border bg-[var(--header-bg)] px-4 backdrop-blur-md sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight">InterviewPrep</span>
        </Link>
        <div className="flex items-center gap-3">
          <LandingThemeToggle />
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </header>

      {/* Main card */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome to InterviewPrep</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Sign in to track your progress, solve problems, and practice mock interviews.
            </p>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive flex items-start gap-2.5">
              <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3.5">
            {/* Google button */}
            <button
              onClick={() => handleSignIn('google')}
              disabled={loadingProvider !== null}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-all duration-150 hover:bg-muted hover:border-border active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              {loadingProvider === 'google' ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{loadingProvider === 'google' ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            {/* GitHub button */}
            <button
              onClick={() => handleSignIn('github')}
              disabled={loadingProvider !== null}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-all duration-150 hover:bg-muted hover:border-border active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              {loadingProvider === 'github' ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
                </svg>
              )}
              <span>{loadingProvider === 'github' ? 'Connecting to GitHub...' : 'Continue with GitHub'}</span>
            </button>
          </div>

          <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
