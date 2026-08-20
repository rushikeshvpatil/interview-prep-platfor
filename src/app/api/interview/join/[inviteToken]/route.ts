import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ inviteToken: string }> }
) {
  try {
    const { inviteToken } = await params;

    const interviewSession = await prisma.interviewSession.findUnique({
      where: { inviteToken },
      include: {
        problem: {
          select: { id: true, title: true, difficulty: true, platform: true, summary: true, constraints: true },
        },
        candidate: {
          select: { id: true, name: true, image: true, email: true },
        },
        interviewer: {
          select: { id: true, name: true, image: true },
        },
        testCases: {
          where: { isHidden: false },
          select: { id: true, input: true, expectedOutput: true, isHidden: true },
        },
      },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Invalid or expired invitation link' }, { status: 404 });
    }

    if (interviewSession.status === 'COMPLETED' || interviewSession.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'This interview session has already ended or was cancelled.' },
        { status: 400 }
      );
    }

    const effectiveTitle = interviewSession.problem?.title || interviewSession.customTitle || 'General Algorithmic Problem Solving';
    const effectiveDescription = interviewSession.problem?.summary || interviewSession.customDescription || '';
    const effectiveConstraints = interviewSession.problem?.constraints || interviewSession.customConstraints || '';

    return NextResponse.json({
      session: {
        id: interviewSession.id,
        mode: interviewSession.mode,
        stream: interviewSession.stream,
        status: interviewSession.status,
        scheduledAt: interviewSession.scheduledAt,
        durationMinutes: interviewSession.durationMinutes,
        candidate: interviewSession.candidate,
        interviewer: interviewSession.interviewer,
        problem: interviewSession.problem || {
          id: 'custom',
          title: effectiveTitle,
          difficulty: 'MEDIUM',
          platform: 'Custom',
          summary: effectiveDescription,
          constraints: effectiveConstraints,
        },
        customTitle: interviewSession.customTitle,
        customDescription: interviewSession.customDescription,
        customConstraints: interviewSession.customConstraints,
        publicTestCases: interviewSession.testCases,
        isAssigned: !!interviewSession.userId,
      },
    });
  } catch (error) {
    console.error('Error fetching invite details:', error);
    return NextResponse.json({ error: 'Failed to fetch invite details' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteToken: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to join.' }, { status: 401 });
    }

    const { inviteToken } = await params;
    const currentUserId = session.user.id;

    const interviewSession = await prisma.interviewSession.findUnique({
      where: { inviteToken },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Invalid or expired invitation link' }, { status: 404 });
    }

    if (interviewSession.status === 'COMPLETED' || interviewSession.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'This interview session has already ended or was cancelled.' },
        { status: 400 }
      );
    }

    // If current user is the Interviewer who created the session, route them to interview as Interviewer
    if (interviewSession.interviewerId === currentUserId) {
      return NextResponse.json({
        message: 'You are the interviewer for this session.',
        sessionId: interviewSession.id,
        role: 'interviewer',
      });
    }

    // If session is already claimed by another candidate
    if (interviewSession.userId && interviewSession.userId !== currentUserId) {
      return NextResponse.json(
        { error: 'Another candidate has already claimed this interview session.' },
        { status: 409 }
      );
    }

    // Assign current authenticated user as Candidate and mark session IN_PROGRESS
    const updated = await prisma.interviewSession.update({
      where: { id: interviewSession.id },
      data: {
        userId: currentUserId,
        status: interviewSession.status === 'SCHEDULED' ? 'IN_PROGRESS' : interviewSession.status,
        startedAt: interviewSession.startedAt || new Date(),
      },
    });

    return NextResponse.json({
      message: 'Successfully joined peer interview as Candidate.',
      sessionId: updated.id,
      role: 'candidate',
    });
  } catch (error) {
    console.error('Error joining peer session:', error);
    return NextResponse.json({ error: 'Failed to join interview session' }, { status: 500 });
  }
}
