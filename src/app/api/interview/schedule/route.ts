import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { InterviewMode } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const userId = session.user.id;

    const [sessions, problems] = await Promise.all([
      prisma.interviewSession.findMany({
        where: {
          OR: [{ userId }, { interviewerId: userId }],
        },
        orderBy: { scheduledAt: 'desc' },
        include: {
          problem: {
            select: { id: true, title: true, difficulty: true, platform: true, summary: true },
          },
          candidate: {
            select: { id: true, name: true, image: true },
          },
          interviewer: {
            select: { id: true, name: true, image: true },
          },
          feedback: {
            select: { id: true, source: true, recommendation: true, rubricScores: true, createdAt: true },
          },
          _count: {
            select: { submissions: true },
          },
        },
      }),
      prisma.problem.findMany({
        take: 50,
        orderBy: { title: 'asc' },
        select: { id: true, title: true, difficulty: true, platform: true },
      }),
    ]);

    return NextResponse.json({ sessions, problems });
  } catch (error) {
    console.error('Error fetching interview sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const { mode, problemId, scheduledAt, durationMinutes } = body;

    // Validate mode
    let modeVal: InterviewMode = InterviewMode.AI;
    if (mode && mode.toUpperCase() === 'PEER') {
      modeVal = InterviewMode.PEER;
    }

    // Validate scheduledAt
    const scheduledDate = scheduledAt ? new Date(scheduledAt) : new Date();
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduled date' }, { status: 400 });
    }

    // Validate duration
    const validDuration = [30, 45, 60].includes(Number(durationMinutes))
      ? Number(durationMinutes)
      : 45;

    // Verify problem exists if provided
    let verifiedProblemId: string | null = null;
    if (problemId) {
      const p = await prisma.problem.findUnique({
        where: { id: problemId },
        select: { id: true },
      });
      if (p) verifiedProblemId = p.id;
    }

    const newSession = await prisma.interviewSession.create({
      data: {
        userId,
        mode: modeVal,
        problemId: verifiedProblemId,
        scheduledAt: scheduledDate,
        durationMinutes: validDuration,
        status: 'SCHEDULED',
      },
      include: {
        problem: {
          select: { id: true, title: true, difficulty: true, platform: true },
        },
      },
    });

    return NextResponse.json({
      message: 'Interview session scheduled successfully',
      session: newSession,
    });
  } catch (error) {
    console.error('Error scheduling interview session:', error);
    return NextResponse.json({ error: 'Failed to schedule session' }, { status: 500 });
  }
}
