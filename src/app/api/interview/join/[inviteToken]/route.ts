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
          select: { id: true, title: true, difficulty: true, platform: true, summary: true },
        },
        candidate: {
          select: { id: true, name: true, image: true, email: true },
        },
        interviewer: {
          select: { id: true, name: true, image: true },
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
        problem: interviewSession.problem,
        isAssigned: !!interviewSession.interviewerId,
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

    // Candidate cannot be their own peer interviewer
    if (interviewSession.userId === currentUserId) {
      return NextResponse.json({
        message: 'You are the candidate for this session.',
        sessionId: interviewSession.id,
        role: 'candidate',
      });
    }

    // If already assigned to someone else
    if (interviewSession.interviewerId && interviewSession.interviewerId !== currentUserId) {
      return NextResponse.json(
        { error: 'Another interviewer has already joined this session.' },
        { status: 409 }
      );
    }

    // Assign current user as interviewer and set startedAt / IN_PROGRESS if needed
    const updated = await prisma.interviewSession.update({
      where: { id: interviewSession.id },
      data: {
        interviewerId: currentUserId,
        status: interviewSession.status === 'SCHEDULED' ? 'IN_PROGRESS' : interviewSession.status,
        startedAt: interviewSession.startedAt || new Date(),
      },
    });

    return NextResponse.json({
      message: 'Successfully joined peer interview as Interviewer.',
      sessionId: updated.id,
      role: 'interviewer',
    });
  } catch (error) {
    console.error('Error joining peer session:', error);
    return NextResponse.json({ error: 'Failed to join interview session' }, { status: 500 });
  }
}
