'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    inviteToken?: string | null;
    durationMinutes: number;
    problem?: {
      title: string;
      difficulty?: string;
    } | null;
  } | null;
}

export function InviteModal({ isOpen, onClose, session }: InviteModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !session || !session.inviteToken) return null;

  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/interview/join/${session.inviteToken}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/15 text-warning font-bold text-base">
              🎉
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Peer Interview Created!</h2>
              <p className="text-xs text-muted-foreground">Share this invite link with your interviewer</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Session details */}
          <div className="rounded-xl border border-border bg-background p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="warning" className="text-[10px]">
                Peer Mock Interview
              </Badge>
              <span className="text-muted-foreground font-mono">⏱️ {session.durationMinutes} Minutes</span>
            </div>
            <h3 className="text-sm font-bold text-foreground line-clamp-1">
              {session.problem?.title || 'General Algorithmic Session'}
            </h3>
          </div>

          {/* Share instructions */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
              Send this invite link to your interviewer:
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono text-foreground focus-visible:outline-2"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                type="button"
                variant={copied ? 'primary' : 'outline'}
                size="sm"
                onClick={handleCopy}
                className="h-8 px-3 shrink-0 text-xs"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Quick guide */}
          <div className="rounded-xl bg-muted/20 p-3.5 space-y-1.5 text-muted-foreground">
            <p className="font-semibold text-foreground text-[11px]">How it works:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
              <li>Send the link to a peer or mentor.</li>
              <li>They join as your interviewer with a live read-only observation viewer.</li>
              <li>You code and test in real time; they submit evaluation notes & ratings at the end.</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border bg-card px-6 py-4 gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1"
          >
            {copied ? '✓ Link Copied to Clipboard!' : '📋 Copy Invite Link'}
          </Button>

          <Link href={`/interview/${session.id}`} className="flex-1">
            <Button variant="primary" size="sm" className="w-full shadow-xs">
              <span>Enter Interview Room</span>
              <svg className="h-3.5 w-3.5 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
