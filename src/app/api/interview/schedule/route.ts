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
            select: {
              id: true,
              title: true,
              difficulty: true,
              platform: true,
              externalUrl: true,
              summary: true,
              constraints: true,
              topics: { include: { topic: true } },
            },
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
          testCases: {
            select: { id: true, input: true, expectedOutput: true, isHidden: true },
          },
          _count: {
            select: { submissions: true },
          },
        },
      }),
      prisma.problem.findMany({
        take: 100,
        orderBy: { title: 'asc' },
        select: {
          id: true,
          title: true,
          difficulty: true,
          platform: true,
          externalUrl: true,
          summary: true,
          constraints: true,
          topics: { include: { topic: true } },
          testCases: { select: { id: true, input: true, expectedOutput: true, isHidden: true } },
        },
      }),
    ]);

    // Strict Security Filtering: Never leak hidden test case input/output to the candidate!
    const sanitizedSessions = sessions.map((sess) => {
      const isInterviewer = sess.interviewerId === userId;
      return {
        ...sess,
        testCases: isInterviewer
          ? sess.testCases
          : sess.testCases
              .filter((tc) => !tc.isHidden)
              .map((tc) => ({ id: tc.id, input: tc.input, expectedOutput: tc.expectedOutput, isHidden: false })),
      };
    });

    return NextResponse.json({ sessions: sanitizedSessions, problems });
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

    const {
      mode,
      problemId,
      customTitle,
      customDescription,
      customConstraints,
      testCases,
      scheduledAt,
      durationMinutes,
    } = body;

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

    const isPeer = modeVal === InterviewMode.PEER;
    const isCustom = isPeer && Boolean(customTitle && customTitle.trim());

    // Verify or find catalog problem
    let verifiedProblemId: string | null = null;
    if (!isCustom) {
      if (problemId) {
        const p = await prisma.problem.findUnique({
          where: { id: problemId },
          include: { testCases: true },
        });
        if (p) verifiedProblemId = p.id;
      }

      // Fallback: pick the first problem if none was explicitly passed
      if (!verifiedProblemId) {
        const firstP = await prisma.problem.findFirst({
          orderBy: { title: 'asc' },
          select: { id: true },
        });
        if (firstP) verifiedProblemId = firstP.id;
      }
    }

    // Validate test cases array if provided
    const validTestCases: { input: string; expectedOutput: string; isHidden: boolean }[] = [];
    if (Array.isArray(testCases)) {
      for (const tc of testCases) {
        if (typeof tc.input === 'string' && typeof tc.expectedOutput === 'string') {
          if (tc.input.trim() || tc.expectedOutput.trim()) {
            validTestCases.push({
              input: tc.input.trim(),
              expectedOutput: tc.expectedOutput.trim(),
              isHidden: Boolean(tc.isHidden),
            });
          }
        }
      }
    }

    // If catalog problem selected and no test cases manually provided, copy public test cases from problem
    if (validTestCases.length === 0 && verifiedProblemId) {
      const problemRecord = await prisma.problem.findUnique({
        where: { id: verifiedProblemId },
        include: { testCases: true },
      });
      if (problemRecord?.testCases && problemRecord.testCases.length > 0) {
        for (const tc of problemRecord.testCases) {
          validTestCases.push({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden,
          });
        }
      }
    }

    // OWNERSHIP MODEL:
    // For PEER interviews: interviewerId = current authenticated user, userId = null (pending candidate invite acceptance)
    // For AI interviews: userId = current authenticated user, interviewerId = null
    const newSession = await prisma.interviewSession.create({
      data: {
        userId: isPeer ? null : userId,
        interviewerId: isPeer ? userId : null,
        mode: modeVal,
        problemId: verifiedProblemId,
        customTitle: isCustom ? customTitle.trim() : null,
        customDescription: isCustom ? (customDescription?.trim() || null) : null,
        customConstraints: isCustom ? (customConstraints?.trim() || null) : null,
        scheduledAt: scheduledDate,
        durationMinutes: validDuration,
        status: 'SCHEDULED',
        testCases: validTestCases.length > 0 ? {
          create: validTestCases.map((tc) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden,
          })),
        } : undefined,
      },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            platform: true,
            externalUrl: true,
            summary: true,
            constraints: true,
            topics: { include: { topic: true } },
          },
        },
        interviewer: {
          select: { id: true, name: true, image: true },
        },
        candidate: {
          select: { id: true, name: true, image: true },
        },
        testCases: true,
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
