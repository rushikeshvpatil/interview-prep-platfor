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
      select: { userId: true, interviewerId: true, interviewerNotes: true },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Only interviewer can read private scratchpad notes
    if (interviewSession.interviewerId !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden. Notes are private to the interviewer.' }, { status: 403 });
    }

    return NextResponse.json({ notes: interviewSession.interviewerNotes || '' });
  } catch (error) {
    console.error('Error fetching interviewer notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
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
    const currentUserId = session.user.id;
    const body = await request.json();
    const { notes } = body;

    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, interviewerId: true, status: true },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Strict security check: ONLY assigned interviewer can write notes
    if (interviewSession.interviewerId !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden. Only the assigned interviewer can edit notes.' }, { status: 403 });
    }

    const updated = await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        interviewerNotes: typeof notes === 'string' ? notes : '',
      },
    });

    return NextResponse.json({
      message: 'Notes autosaved',
      notes: updated.interviewerNotes,
    });
  } catch (error) {
    console.error('Error saving interviewer notes:', error);
    return NextResponse.json({ error: 'Failed to save notes' }, { status: 500 });
  }
}
