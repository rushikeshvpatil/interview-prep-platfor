'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl py-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  const user = session?.user;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">User Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account and interview prep settings</p>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/20 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name || 'User Avatar'}
                  className="h-20 w-20 rounded-full border-2 border-border object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold border border-primary/20">
                  {user?.name ? user.name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-xl font-semibold text-foreground">
                  {user?.name || 'Interview Candidate'}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">{user?.email || 'No email provided'}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Active Account
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/10 p-4">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Display Name</span>
                <p className="text-sm font-semibold text-foreground mt-1">{user?.name || 'Not provided'}</p>
              </div>

              <div className="rounded-lg border border-border bg-muted/10 p-4">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</span>
                <p className="text-sm font-semibold text-foreground mt-1 truncate">{user?.email || 'Not provided'}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-medium text-foreground">Authentication Status</h3>
              <p className="text-xs text-muted-foreground mt-1">
                You are currently signed in with OAuth. Your session is securely authenticated.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  Back to Dashboard
                </Button>
              </Link>
              <Button
                variant="primary"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
