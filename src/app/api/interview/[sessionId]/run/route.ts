import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { executeCodeOnJudge0, Judge0ExecutionResult } from '@/lib/judge0';

interface TestCaseItem {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
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
    const { code, language, stdin, expectedOutput, action = 'run' } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Source code cannot be empty' }, { status: 400 });
    }

    const validLanguage = typeof language === 'string' ? language.toLowerCase() : 'python';

    // Verify session & test cases
    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        problem: {
          include: {
            testCases: true,
          },
        },
        testCases: true,
      },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
    }

    // Verify authorization
    const isInterviewer = interviewSession.interviewerId === userId;
    const isCandidate = interviewSession.userId === userId;
    if (!isInterviewer && !isCandidate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify session state
    if (interviewSession.status === 'COMPLETED' || interviewSession.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Session is completed. Code execution is disabled.' },
        { status: 400 }
      );
    }

    // Gather effective test cases (Session test cases take precedence, fallback to Problem test cases)
    let allTestCases: TestCaseItem[] = [];
    if (interviewSession.testCases && interviewSession.testCases.length > 0) {
      allTestCases = interviewSession.testCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
      }));
    } else if (interviewSession.problem?.testCases && interviewSession.problem.testCases.length > 0) {
      allTestCases = interviewSession.problem.testCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
      }));
    }

    const isSubmit = action === 'submit';

    // Determine test suite to execute
    // RUN: only public test cases (or custom stdin)
    // SUBMIT: all test cases (public + hidden)
    const testCasesToRun = isSubmit
      ? allTestCases
      : allTestCases.filter((tc) => !tc.isHidden);

    let finalVerdict: Judge0ExecutionResult['verdict'] = 'ACCEPTED';
    let finalStatusDesc = 'All test cases passed successfully';
    let totalExecutionTime = 0;
    let maxMemory = 0;
    let lastStdout: string | null = null;
    let lastStderr: string | null = null;
    let lastCompileOutput: string | null = null;

    interface TestResultSummary {
      testCaseId?: string;
      index: number;
      isHidden: boolean;
      verdict: string;
      stdout: string | null;
      stderr: string | null;
      compileOutput: string | null;
      input?: string;
      expectedOutput?: string;
    }

    const caseResults: TestResultSummary[] = [];

    if (testCasesToRun.length === 0) {
      // No preset test cases configured: execute against custom sample stdin
      const singleRes = await executeCodeOnJudge0({
        sourceCode: code,
        language: validLanguage,
        stdin: stdin || '',
        expectedOutput: expectedOutput || '',
      });

      finalVerdict = singleRes.verdict;
      finalStatusDesc = singleRes.statusDescription;
      totalExecutionTime = singleRes.executionTime || 0;
      maxMemory = singleRes.memory || 0;
      lastStdout = singleRes.stdout;
      lastStderr = singleRes.stderr;
      lastCompileOutput = singleRes.compileOutput;

      caseResults.push({
        index: 1,
        isHidden: false,
        verdict: singleRes.verdict,
        stdout: singleRes.stdout,
        stderr: singleRes.stderr,
        compileOutput: singleRes.compileOutput,
        input: stdin || undefined,
        expectedOutput: expectedOutput || undefined,
      });
    } else {
      // Execute each test case sequentially
      for (let i = 0; i < testCasesToRun.length; i++) {
        const tc = testCasesToRun[i];
        const res = await executeCodeOnJudge0({
          sourceCode: code,
          language: validLanguage,
          stdin: tc.input,
          expectedOutput: tc.expectedOutput,
        });

        if (res.executionTime) totalExecutionTime += res.executionTime;
        if (res.memory && res.memory > maxMemory) maxMemory = res.memory;

        lastStdout = res.stdout;
        lastStderr = res.stderr;
        lastCompileOutput = res.compileOutput;

        const isPassed = res.verdict === 'ACCEPTED';
        if (!isPassed && finalVerdict === 'ACCEPTED') {
          finalVerdict = res.verdict;
          finalStatusDesc = res.statusDescription;
        }

        // STRICT SECURITY RULE:
        // If candidate, NEVER leak hidden test case input or expectedOutput!
        const canSeeHiddenData = isInterviewer;
        caseResults.push({
          testCaseId: tc.id,
          index: i + 1,
          isHidden: tc.isHidden,
          verdict: res.verdict,
          stdout: !tc.isHidden || canSeeHiddenData ? res.stdout : null,
          stderr: !tc.isHidden || canSeeHiddenData ? res.stderr : null,
          compileOutput: res.compileOutput,
          input: !tc.isHidden || canSeeHiddenData ? tc.input : undefined,
          expectedOutput: !tc.isHidden || canSeeHiddenData ? tc.expectedOutput : undefined,
        });

        // If compilation error occurs, break early
        if (res.verdict === 'COMPILATION_ERROR') {
          finalVerdict = 'COMPILATION_ERROR';
          break;
        }
      }
    }

    const totalCount = caseResults.length;
    const passedCount = caseResults.filter((c) => c.verdict === 'ACCEPTED').length;
    const publicTotal = caseResults.filter((c) => !c.isHidden).length;
    const publicPassed = caseResults.filter((c) => !c.isHidden && c.verdict === 'ACCEPTED').length;
    const hiddenTotal = caseResults.filter((c) => c.isHidden).length;
    const hiddenPassed = caseResults.filter((c) => c.isHidden && c.verdict === 'ACCEPTED').length;

    // Persist SessionSubmission
    const submission = await prisma.sessionSubmission.create({
      data: {
        sessionId,
        code,
        language: validLanguage,
        verdict: finalVerdict,
        stdout: lastStdout,
        stderr: lastStderr,
        compileOutput: lastCompileOutput,
        executionTime: parseFloat(totalExecutionTime.toFixed(3)),
        memory: maxMemory,
        testCasesPassed: passedCount,
        totalTestCases: totalCount,
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
      action,
      verdict: finalVerdict,
      statusDescription: finalStatusDesc,
      stdout: lastStdout,
      stderr: lastStderr,
      compileOutput: lastCompileOutput,
      executionTime: submission.executionTime,
      memory: submission.memory,
      testCasesPassed: passedCount,
      totalTestCases: totalCount,
      publicPassed,
      publicTotal,
      hiddenPassed,
      hiddenTotal,
      results: caseResults,
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
