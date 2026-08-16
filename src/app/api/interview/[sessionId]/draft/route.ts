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
    const userId = session.user.id;

    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, interviewerId: true },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (interviewSession.userId !== userId && interviewSession.interviewerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const draft = await prisma.sessionCodeDraft.findUnique({
      where: { sessionId },
    });

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Error fetching code draft:', error);
    return NextResponse.json({ error: 'Failed to fetch draft' }, { status: 500 });
  }
}

export async function PUT(
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
    const body = await request.json();
    const { code, language } = body;

    if (typeof code !== 'string') {
      return NextResponse.json({ error: 'Code string is required' }, { status: 400 });
    }

    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, interviewerId: true, status: true },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (interviewSession.userId !== userId && interviewSession.interviewerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (interviewSession.status === 'COMPLETED' || interviewSession.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot modify completed or cancelled sessions' }, { status: 400 });
    }

    const draft = await prisma.sessionCodeDraft.upsert({
      where: { sessionId },
      update: {
        code,
        language: typeof language === 'string' ? language : undefined,
      },
      create: {
        sessionId,
        code,
        language: typeof language === 'string' ? language : 'python',
      },
    });

    return NextResponse.json({ message: 'Draft saved', draft });
  } catch (error) {
    console.error('Error saving code draft:', error);
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
  }
}
