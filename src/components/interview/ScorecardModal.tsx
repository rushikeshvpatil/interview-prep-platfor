'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScorecardResult } from '@/lib/gemini';

interface ScorecardModalProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  problemTitle?: string;
}

export function ScorecardModal({ sessionId, isOpen, onClose, problemTitle }: ScorecardModalProps) {
  const [loading, setLoading] = useState(true);
  const [scorecard, setScorecard] = useState<ScorecardResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchOrGenerateScorecard() {
      try {
        setLoading(true);
        setError(null);

        // First check if already generated
        const getRes = await fetch(`/api/interview/${sessionId}/ai/feedback`);
        if (getRes.ok) {
          const getData = await getRes.json();
          if (getData.feedback && isMounted) {
            const parsedNotes = typeof getData.feedback.notes === 'string'
              ? JSON.parse(getData.feedback.notes)
              : getData.feedback.notes;

            setScorecard({
              rubricScores: getData.feedback.rubricScores,
              strengths: parsedNotes.strengths || [],
              improvements: parsedNotes.improvements || [],
              recommendedTopics: parsedNotes.recommendedTopics || [],
              summary: parsedNotes.summary || '',
            });
            setLoading(false);
            return;
          }
        }

        // Otherwise, generate new scorecard
        const postRes = await fetch(`/api/interview/${sessionId}/ai/feedback`, {
          method: 'POST',
        });

        if (postRes.ok && isMounted) {
          const postData = await postRes.json();
          setScorecard(postData.scorecard);
        } else {
          throw new Error('Failed to generate scorecard');
        }
      } catch (err) {
        console.error('Error in scorecard:', err);
        if (isMounted) setError('Unable to load scorecard. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchOrGenerateScorecard();

    return () => {
      isMounted = false;
    };
  }, [isOpen, sessionId]);

  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-success bg-success';
    if (score >= 6) return 'text-warning bg-warning';
    return 'text-destructive bg-destructive';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary font-bold">
              AI
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Interview Evaluation Scorecard</h2>
              <p className="text-xs text-muted-foreground">
                {problemTitle ? `Performance on "${problemTitle}"` : 'AI Mock Interview Analysis'}
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

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs leading-relaxed">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              <p className="font-semibold text-foreground">Evaluating your interview session...</p>
              <p className="text-muted-foreground max-w-xs text-[11px]">
                Gemini is analyzing your code correctness, problem-solving, Big-O complexity, and communication.
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-center">
              {error}
            </div>
          ) : scorecard ? (
            <>
              {/* Overall Score Banner */}
              <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Overall Interview Rating
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">Comprehensive candidate evaluation</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-primary">
                    {scorecard.rubricScores.overall}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">/ 10</span>
                </div>
              </div>

              {/* Rubric Score Bars Grid */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Rubric Breakdown
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Correctness & Test Cases', score: scorecard.rubricScores.correctness },
                    { label: 'Problem Solving & Approach', score: scorecard.rubricScores.problemSolving },
                    { label: 'Time & Space Complexity', score: scorecard.rubricScores.complexity },
                    { label: 'Code Quality & Cleanliness', score: scorecard.rubricScores.codeQuality },
                    { label: 'Communication & Reasoning', score: scorecard.rubricScores.communication },
                  ].map((dim) => (
                    <div key={dim.label} className="rounded-xl border border-border bg-background p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{dim.label}</span>
                        <span className="font-bold text-foreground">{dim.score}/10</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getScoreColor(dim.score).split(' ')[1]}`}
                          style={{ width: `${Math.min(100, dim.score * 10)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Strengths */}
                <div className="rounded-xl border border-success/30 bg-success/5 p-4 space-y-2">
                  <h4 className="font-bold text-success flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    Key Strengths
                  </h4>
                  <ul className="space-y-1.5 pl-1">
                    {scorecard.strengths.map((st, i) => (
                      <li key={i} className="text-foreground/90 flex items-start gap-1.5">
                        <span className="text-success font-bold">•</span>
                        <span>{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-2">
                  <h4 className="font-bold text-warning flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    Areas for Growth
                  </h4>
                  <ul className="space-y-1.5 pl-1">
                    {scorecard.improvements.map((imp, i) => (
                      <li key={i} className="text-foreground/90 flex items-start gap-1.5">
                        <span className="text-warning font-bold">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended Topics */}
              {scorecard.recommendedTopics.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Recommended Study & Revision
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {scorecard.recommendedTopics.map((top, i) => (
                      <Badge key={i} variant="primary" className="text-xs">
                        {top}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary Notes */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                <h4 className="font-bold text-foreground">Interviewer Feedback Summary</h4>
                <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {scorecard.summary}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border bg-card px-6 py-3.5">
          <Link href="/interview/schedule">
            <Button variant="outline" size="sm">
              View All Scheduled Sessions
            </Button>
          </Link>

          <Link href="/problems">
            <Button variant="primary" size="sm">
              Practice Next Problem
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
