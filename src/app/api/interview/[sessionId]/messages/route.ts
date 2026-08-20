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

    // Verify session participation
    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        interviewerId: true,
      },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
    }

    const isParticipant =
      interviewSession.userId === userId || interviewSession.interviewerId === userId;
    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden. You are not a session participant.' }, { status: 403 });
    }

    const messages = await prisma.interviewMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        sessionId: true,
        senderId: true,
        senderRole: true,
        senderName: true,
        message: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching interview messages:', error);
    return NextResponse.json({ error: 'Failed to fetch interview messages' }, { status: 500 });
  }
}

export async function POST(
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
    const { message } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    // Verify session participation
    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        interviewerId: true,
      },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
    }

    const isInterviewer = interviewSession.interviewerId === userId;
    const isCandidate = interviewSession.userId === userId;

    if (!isInterviewer && !isCandidate) {
      return NextResponse.json({ error: 'Forbidden. You are not a session participant.' }, { status: 403 });
    }

    const senderRole = isInterviewer ? 'INTERVIEWER' : 'CANDIDATE';
    const senderName = session.user.name || (isInterviewer ? 'Interviewer' : 'Candidate');

    const createdMessage = await prisma.interviewMessage.create({
      data: {
        sessionId,
        senderId: userId,
        senderRole,
        senderName,
        message: message.trim(),
      },
      select: {
        id: true,
        sessionId: true,
        senderId: true,
        senderRole: true,
        senderName: true,
        message: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ message: createdMessage });
  } catch (error) {
    console.error('Error saving interview message:', error);
    return NextResponse.json({ error: 'Failed to save interview message' }, { status: 500 });
  }
}
