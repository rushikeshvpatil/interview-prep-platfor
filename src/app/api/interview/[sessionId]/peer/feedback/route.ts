import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

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
    const currentUserId = session.user.id;

    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, interviewerId: true },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (
      interviewSession.userId !== currentUserId &&
      interviewSession.interviewerId !== currentUserId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const feedback = await prisma.sessionFeedback.findFirst({
      where: {
        sessionId,
        source: 'PEER',
      },
      include: {
        session: {
          include: {
            problem: true,
            candidate: { select: { id: true, name: true, image: true, email: true } },
            interviewer: { select: { id: true, name: true, image: true, email: true } },
            submissions: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error fetching peer feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch peer feedback' }, { status: 500 });
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
    const currentUserId = session.user.id;
    const body = await request.json();

    const {
      rubricScores,
      strengths,
      improvements,
      notes,
      recommendation,
    } = body;

    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        problem: true,
      },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Strict security check: ONLY assigned peer interviewer can submit peer feedback
    if (interviewSession.interviewerId !== currentUserId) {
      return NextResponse.json(
        { error: 'Forbidden. Only the assigned peer interviewer can submit interview feedback.' },
        { status: 403 }
      );
    }

    // Valid recommendations
    const validRecommendations = ['STRONG_HIRE', 'HIRE', 'BORDERLINE', 'NO_HIRE'];
    const finalRec = validRecommendations.includes(recommendation)
      ? recommendation
      : 'HIRE';

    const structuredNotes = JSON.stringify({
      strengths: Array.isArray(strengths) ? strengths : [strengths || ''],
      improvements: Array.isArray(improvements) ? improvements : [improvements || ''],
      summary: typeof notes === 'string' ? notes : '',
    });

    // Create SessionFeedback
    const feedback = await prisma.sessionFeedback.create({
      data: {
        sessionId,
        source: 'PEER',
        authorId: currentUserId,
        rubricScores: rubricScores || {
          problemSolving: 8,
          correctness: 8,
          complexity: 8,
          codeQuality: 8,
          communication: 8,
          overall: 8,
        },
        notes: structuredNotes,
        recommendation: finalRec,
      },
    });

    // Mark session COMPLETED and set endedAt
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Peer evaluation submitted successfully',
      feedback,
    });
  } catch (error) {
    console.error('Error submitting peer feedback:', error);
    return NextResponse.json({ error: 'Failed to submit peer feedback' }, { status: 500 });
  }
}
