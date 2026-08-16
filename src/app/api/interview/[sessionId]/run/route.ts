import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { executeCodeOnJudge0 } from '@/lib/judge0';

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
    const { code, language, stdin, expectedOutput } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Source code cannot be empty' }, { status: 400 });
    }

    const validLanguage = typeof language === 'string' ? language.toLowerCase() : 'python';

    // Verify session
    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        problem: {
          include: {
            testCases: true,
          },
        },
      },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
    }

    // Verify authorization
    const isParticipant =
      interviewSession.userId === userId || interviewSession.interviewerId === userId;
    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify session state
    if (interviewSession.status === 'COMPLETED' || interviewSession.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Session is completed. Code execution is disabled.' },
        { status: 400 }
      );
    }

    // Determine sample inputs if problem test cases exist, or use custom stdin from user
    const sampleInput = stdin || (interviewSession.problem?.testCases?.[0]?.input ?? '');
    const expected = expectedOutput || (interviewSession.problem?.testCases?.[0]?.expectedOutput ?? '');

    // Submit to Judge0
    const result = await executeCodeOnJudge0({
      sourceCode: code,
      language: validLanguage,
      stdin: sampleInput,
      expectedOutput: expected,
      cpuTimeLimit: 5.0,
      memoryLimit: 128000,
    });

    // Determine test case counts
    const totalCases = interviewSession.problem?.testCases?.length || 1;
    const passedCases = result.verdict === 'ACCEPTED' ? totalCases : 0;

    // Persist SessionSubmission
    const submission = await prisma.sessionSubmission.create({
      data: {
        sessionId,
        code,
        language: validLanguage,
        verdict: result.verdict,
        stdout: result.stdout,
        stderr: result.stderr,
        compileOutput: result.compileOutput,
        executionTime: result.executionTime,
        memory: result.memory,
        testCasesPassed: passedCases,
        totalTestCases: totalCases,
      },
    });

    // Also update current draft
    await prisma.sessionCodeDraft.upsert({
      where: { sessionId },
      update: { code, language: validLanguage },
      create: { sessionId, code, language: validLanguage },
    });

    return NextResponse.json({
      submissionId: submission.id,
      verdict: result.verdict,
      statusDescription: result.statusDescription,
      stdout: result.stdout,
      stderr: result.stderr,
      compileOutput: result.compileOutput,
      executionTime: result.executionTime,
      memory: result.memory,
      testCasesPassed: passedCases,
      totalTestCases: totalCases,
      createdAt: submission.createdAt,
    });
  } catch (error) {
    console.error('Error executing code in session:', error);
    return NextResponse.json(
      { error: 'Failed to execute code. Internal server error.' },
      { status: 500 }
    );
  }
}
