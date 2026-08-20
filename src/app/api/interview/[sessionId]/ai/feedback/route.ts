import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { generateScorecardFeedback, ChatMessage } from '@/lib/gemini';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const userId = session.user.id;

    const feedback = await prisma.sessionFeedback.findFirst({
      where: {
        sessionId,
        source: 'AI',
      },
      include: {
        session: {
          include: {
            problem: true,
            candidate: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!feedback) {
      return NextResponse.json({ feedback: null });
    }

    if (
      feedback.session.userId !== userId &&
      feedback.session.interviewerId !== userId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error fetching AI feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const userId = session.user.id;

    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        problem: true,
        candidate: true,
        codeDraft: true,
        submissions: true,
        feedback: {
          where: { source: 'AI' },
        },
      },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (interviewSession.userId !== userId && interviewSession.interviewerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If feedback already generated, format and return both feedback and scorecard
    if (interviewSession.feedback.length > 0) {
      const existing = interviewSession.feedback[0];
      let parsedNotes: { strengths?: string[]; improvements?: string[]; recommendedTopics?: string[]; summary?: string } = {};
      try {
        parsedNotes = typeof existing.notes === 'string' ? JSON.parse(existing.notes) : existing.notes;
      } catch {
        parsedNotes = { summary: existing.notes };
      }

      return NextResponse.json({
        feedback: existing,
        scorecard: {
          rubricScores: existing.rubricScores,
          strengths: parsedNotes.strengths || [],
          improvements: parsedNotes.improvements || [],
          recommendedTopics: parsedNotes.recommendedTopics || [],
          summary: parsedNotes.summary || '',
        },
      });
    }

    const messages: ChatMessage[] = Array.isArray(interviewSession.aiTranscript)
      ? (interviewSession.aiTranscript as unknown as ChatMessage[])
      : [];

    const hasAccepted = interviewSession.submissions.some((s) => s.verdict === 'ACCEPTED');

    // Generate structured scorecard from Gemini
    const scorecard = await generateScorecardFeedback({
      candidate: {
        name: interviewSession.candidate?.name,
        targetRole: interviewSession.candidate?.targetRole,
        experienceLevel: interviewSession.candidate?.experienceLevel,
      },
      problem: {
        title: interviewSession.problem?.title || 'General Technical Problem',
        difficulty: interviewSession.problem?.difficulty || 'MEDIUM',
        platform: interviewSession.problem?.platform || 'Catalog',
      },
      messages,
      finalCode: interviewSession.codeDraft?.code,
      language: interviewSession.codeDraft?.language || 'python',
      submissionCount: interviewSession.submissions.length,
      hasAcceptedSubmission: hasAccepted,
    });

    const savedFeedback = await prisma.sessionFeedback.create({
      data: {
        sessionId,
        source: 'AI',
        rubricScores: scorecard.rubricScores as unknown as object,
        notes: JSON.stringify({
          strengths: scorecard.strengths,
          improvements: scorecard.improvements,
          recommendedTopics: scorecard.recommendedTopics,
          summary: scorecard.summary,
        }),
      },
    });

    // If candidate problem was solved, also mark UserProblemProgress in catalog
    if (hasAccepted && interviewSession.problemId && interviewSession.userId) {
      await prisma.userProblemProgress.upsert({
        where: {
          userId_problemId: {
            userId: interviewSession.userId,
            problemId: interviewSession.problemId,
          },
        },
        update: {
          solved: true,
          attempted: true,
          solvedAt: new Date(),
        },
        create: {
          userId: interviewSession.userId,
          problemId: interviewSession.problemId,
          solved: true,
          attempted: true,
          solvedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      feedback: savedFeedback,
      scorecard,
    });
  } catch (error) {
    console.error('Error generating AI feedback scorecard:', error);
    return NextResponse.json({ error: 'Failed to generate scorecard' }, { status: 500 });
  }
}
