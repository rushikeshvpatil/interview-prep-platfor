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
        testCases: {
          select: { id: true, input: true, expectedOutput: true, isHidden: true },
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

    // Authorization check: User must be candidate OR interviewer
    const isInterviewer = interviewSession.interviewerId === userId;
    const isCandidate = interviewSession.userId === userId;

    if (!isInterviewer && !isCandidate) {
      return NextResponse.json(
        { error: 'Forbidden. You are not authorized for this interview session.' },
        { status: 403 }
      );
    }

    // Auto-transition from SCHEDULED to IN_PROGRESS on room entry
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
          testCases: { select: { id: true, input: true, expectedOutput: true, isHidden: true } },
          codeDraft: true,
          submissions: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      });
    }

    // Determine effective problem details (Catalog problem vs Custom Interview Problem)
    const effectiveTitle = interviewSession.problem?.title || interviewSession.customTitle || 'General Algorithmic Problem Solving';
    const effectiveDescription = interviewSession.problem?.summary || interviewSession.customDescription || '';
    const effectiveConstraints = interviewSession.problem?.constraints || interviewSession.customConstraints || '';

    const effectiveProblem = interviewSession.problem || {
      id: 'custom',
      title: effectiveTitle,
      slug: 'custom-session-problem',
      platform: 'Custom',
      difficulty: 'MEDIUM',
      summary: effectiveDescription,
      constraints: effectiveConstraints,
      topics: [],
      companies: [],
      testCases: [],
    };

    // Gather test cases
    const allSessionTestCases = interviewSession.testCases?.length > 0
      ? interviewSession.testCases
      : (interviewSession.problem?.testCases || []);

    // Strict Security Filtering: If candidate, never leak hidden test cases
    const sanitizedTestCases = isInterviewer
      ? allSessionTestCases
      : allSessionTestCases
          .filter((tc) => !tc.isHidden)
          .map((tc) => ({ id: tc.id, input: tc.input, expectedOutput: tc.expectedOutput, isHidden: false }));

    const sanitizedSession = {
      ...interviewSession,
      problem: effectiveProblem,
      testCases: sanitizedTestCases,
    };

    return NextResponse.json({ session: sanitizedSession });
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

    const updated = await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: targetStatus,
        endedAt: targetStatus === 'COMPLETED' || targetStatus === 'CANCELLED' ? new Date() : undefined,
      },
    });

    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error('Error updating session status:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
