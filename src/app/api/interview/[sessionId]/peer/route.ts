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
      include: {
        problem: {
          include: {
            topics: { include: { topic: true } },
            companies: { include: { company: true } },
            testCases: true,
          },
        },
        candidate: {
          select: { id: true, name: true, image: true, email: true },
        },
        interviewer: {
          select: { id: true, name: true, image: true, email: true },
        },
        codeDraft: true,
        submissions: {
          orderBy: { createdAt: 'desc' },
          take: 15,
        },
        feedback: {
          where: { source: 'PEER' },
        },
      },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Authorization check
    if (
      interviewSession.userId !== currentUserId &&
      interviewSession.interviewerId !== currentUserId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      session: {
        id: interviewSession.id,
        mode: interviewSession.mode,
        stream: interviewSession.stream,
        status: interviewSession.status,
        durationMinutes: interviewSession.durationMinutes,
        scheduledAt: interviewSession.scheduledAt,
        startedAt: interviewSession.startedAt,
        endedAt: interviewSession.endedAt,
        inviteToken: interviewSession.inviteToken,
        candidate: interviewSession.candidate,
        interviewer: interviewSession.interviewer,
        problem: interviewSession.problem,
        codeDraft: interviewSession.codeDraft,
        submissions: interviewSession.submissions,
        feedback: interviewSession.feedback[0] || null,
        interviewerNotes:
          interviewSession.interviewerId === currentUserId
            ? interviewSession.interviewerNotes || ''
            : null,
      },
    });
  } catch (error) {
    console.error('Error fetching peer session state:', error);
    return NextResponse.json({ error: 'Failed to fetch peer state' }, { status: 500 });
  }
}
