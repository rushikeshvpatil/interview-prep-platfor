import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { problemId, status } = body;

    if (!problemId || typeof problemId !== 'string') {
      return NextResponse.json({ error: 'Problem ID is required' }, { status: 400 });
    }

    if (!status || !['SOLVED', 'ATTEMPTED', 'UNSOLVED'].includes(status)) {
      return NextResponse.json({ error: 'Valid status (SOLVED, ATTEMPTED, UNSOLVED) is required' }, { status: 400 });
    }

    const isSolved = status === 'SOLVED';
    const isAttempted = status === 'ATTEMPTED' || status === 'SOLVED';

    const progress = await prisma.userProblemProgress.upsert({
      where: {
        userId_problemId: {
          userId,
          problemId,
        },
      },
      update: {
        solved: isSolved,
        attempted: isAttempted,
        solvedAt: isSolved ? new Date() : null,
        lastAttemptAt: isAttempted ? new Date() : undefined,
        ...(isAttempted ? { attempts: { increment: 1 } } : {}),
      },
      create: {
        userId,
        problemId,
        solved: isSolved,
        attempted: isAttempted,
        attempts: isAttempted ? 1 : 0,
        solvedAt: isSolved ? new Date() : null,
        lastAttemptAt: isAttempted ? new Date() : null,
      },
    });

    let resultingStatus: 'SOLVED' | 'ATTEMPTED' | 'UNSOLVED' = 'UNSOLVED';
    if (progress.solved) {
      resultingStatus = 'SOLVED';
    } else if (progress.attempted) {
      resultingStatus = 'ATTEMPTED';
    }

    return NextResponse.json({
      status: resultingStatus,
      attempts: progress.attempts,
      solvedAt: progress.solvedAt,
    });
  } catch (error) {
    console.error('Error updating problem progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
