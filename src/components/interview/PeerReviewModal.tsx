'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface PeerFeedbackData {
  id: string;
  source: string;
  recommendation?: string | null;
  rubricScores: {
    problemSolving?: number;
    correctness?: number;
    complexity?: number;
    codeQuality?: number;
    communication?: number;
    overall?: number;
  };
  notes: string;
  createdAt: string;
  session: {
    candidate: { name?: string | null };
    interviewer?: { name?: string | null };
    problem?: { title?: string | null; difficulty?: string | null };
  };
}

interface PeerReviewModalProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PeerReviewModal({ sessionId, isOpen, onClose }: PeerReviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<PeerFeedbackData | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadFeedback() {
      try {
        setLoading(true);
        const res = await fetch(`/api/interview/${sessionId}/peer/feedback`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setFeedback(data.feedback);
        }
      } catch (e) {
        console.error('Error loading peer feedback:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFeedback();

    return () => {
      isMounted = false;
    };
  }, [isOpen, sessionId]);

  if (!isOpen) return null;

  let parsedNotes: { strengths?: string[]; improvements?: string[]; summary?: string } = {};
  if (feedback?.notes) {
    try {
      parsedNotes = JSON.parse(feedback.notes);
    } catch {
      parsedNotes = { summary: feedback.notes };
    }
  }

  const getRecommendationBadge = (rec?: string | null) => {
    switch (rec) {
      case 'STRONG_HIRE':
        return <Badge variant="success" className="font-bold">🌟 Strong Hire</Badge>;
      case 'HIRE':
        return <Badge variant="success" className="font-bold">✓ Hire</Badge>;
      case 'BORDERLINE':
        return <Badge variant="warning" className="font-bold">~ Borderline</Badge>;
      case 'NO_HIRE':
        return <Badge variant="destructive" className="font-bold">✕ Needs Preparation</Badge>;
      default:
        return <Badge variant="primary">Completed</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/15 text-warning font-bold text-xs">
              1:1
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Peer Interview Evaluation</h2>
              <p className="text-xs text-muted-foreground">
                Reviewed by {feedback?.session.interviewer?.name || 'Peer Interviewer'}
              </p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs leading-relaxed">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : feedback ? (
            <>
              {/* Interview Details Header */}
              <div className="rounded-xl border border-border bg-background p-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold block">Candidate</span>
                  <p className="font-semibold text-foreground">{feedback.session.candidate?.name || 'Candidate'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold block">Interviewer</span>
                  <p className="font-semibold text-foreground">{feedback.session.interviewer?.name || 'Peer Interviewer'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold block">Problem</span>
                  <p className="font-semibold text-foreground">{feedback.session.problem?.title || 'General Algorithmic Session'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold block">Date Reviewed</span>
                  <p className="text-muted-foreground">{new Date(feedback.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Overall Outcome Banner */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Interviewer Recommendation
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">Assessment verdict</p>
                </div>
                <div>{getRecommendationBadge(feedback.recommendation)}</div>
              </div>

              {/* Rubric Breakdown Grid */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Scorecard Ratings
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Problem Solving & Approach', score: feedback.rubricScores.problemSolving || 8 },
                    { label: 'Correctness & Test Cases', score: feedback.rubricScores.correctness || 8 },
                    { label: 'Complexity Analysis (Big-O)', score: feedback.rubricScores.complexity || 8 },
                    { label: 'Code Quality & Cleanliness', score: feedback.rubricScores.codeQuality || 8 },
                    { label: 'Communication & Reasoning', score: feedback.rubricScores.communication || 8 },
                    { label: 'Overall Rating', score: feedback.rubricScores.overall || 8 },
                  ].map((dim) => (
                    <div key={dim.label} className="rounded-xl border border-border bg-background p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{dim.label}</span>
                        <span className="font-bold text-primary">{dim.score}/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid gap-4 sm:grid-cols-2">
                {parsedNotes.strengths && parsedNotes.strengths.length > 0 && (
                  <div className="rounded-xl border border-success/30 bg-success/5 p-4 space-y-2">
                    <h4 className="font-bold text-success">Key Strengths</h4>
                    <ul className="space-y-1 pl-1">
                      {parsedNotes.strengths.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-foreground/90">
                          <span className="text-success font-bold">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {parsedNotes.improvements && parsedNotes.improvements.length > 0 && (
                  <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-2">
                    <h4 className="font-bold text-warning">Areas for Growth</h4>
                    <ul className="space-y-1 pl-1">
                      {parsedNotes.improvements.map((imp, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-foreground/90">
                          <span className="text-warning font-bold">•</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Notes Summary */}
              {parsedNotes.summary && (
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                  <h4 className="font-bold text-foreground">Interviewer Feedback Notes</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{parsedNotes.summary}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Peer evaluation has not been submitted yet.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-card px-6 py-3.5">
          <Link href="/interview/schedule">
            <Button variant="outline" size="sm">
              View All Scheduled Sessions
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close Review
          </Button>
        </div>
      </div>
    </div>
  );
}
