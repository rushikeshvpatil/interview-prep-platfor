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
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { sessionId } = await params;
    const userId = session.user.id;

    let interviewSession = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        problem: {
          include: {
            topics: { include: { topic: true } },
            companies: { include: { company: true } },
            testCases: { select: { id: true, input: true, expectedOutput: true, isHidden: true } },
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
          take: 10,
        },
      },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
    }

    // Authorization check
    const isParticipant =
      interviewSession.userId === userId || interviewSession.interviewerId === userId;
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Forbidden. You are not authorized for this interview session.' },
        { status: 403 }
      );
    }

    // Auto-transition from SCHEDULED to IN_PROGRESS on candidate room entry if past scheduled time
    if (interviewSession.status === 'SCHEDULED') {
      interviewSession = await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
        include: {
          problem: {
            include: {
              topics: { include: { topic: true } },
              companies: { include: { company: true } },
              testCases: { select: { id: true, input: true, expectedOutput: true, isHidden: true } },
            },
          },
          candidate: { select: { id: true, name: true, image: true, email: true } },
          interviewer: { select: { id: true, name: true, image: true, email: true } },
          codeDraft: true,
          submissions: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      });
    }

    return NextResponse.json({ session: interviewSession });
  } catch (error) {
    console.error('Error fetching interview session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { sessionId } = await params;
    const userId = session.user.id;
    const body = await request.json();
    const { status: targetStatus } = body;

    const existing = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
    }

    // Check authorization
    if (existing.userId !== userId && existing.interviewerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Disallow modifying completed sessions
    if (existing.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Session is already completed and cannot be modified' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (targetStatus === 'IN_PROGRESS') {
      updateData.status = 'IN_PROGRESS';
      if (!existing.startedAt) updateData.startedAt = new Date();
    } else if (targetStatus === 'COMPLETED') {
      updateData.status = 'COMPLETED';
      updateData.endedAt = new Date();
    } else if (targetStatus === 'CANCELLED') {
      updateData.status = 'CANCELLED';
      updateData.endedAt = new Date();
    }

    const updated = await prisma.interviewSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    return NextResponse.json({ message: 'Session status updated', session: updated });
  } catch (error) {
    console.error('Error updating session status:', error);
    return NextResponse.json({ error: 'Failed to update session status' }, { status: 500 });
  }
}
