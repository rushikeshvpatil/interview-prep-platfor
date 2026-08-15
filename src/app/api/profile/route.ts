import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Difficulty } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user with relations and stats
    const [user, solvedCount, attemptedCount, bookmarksCount, availableCompanies] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            experienceLevel: true,
            targetRole: true,
            targetCompanies: true,
            primaryFocus: true,
            targetInterviewDate: true,
            preferredDifficulty: true,
            createdAt: true,
          },
        }),
        prisma.userProblemProgress.count({
          where: { userId, solved: true },
        }),
        prisma.userProblemProgress.count({
          where: { userId, attempted: true, solved: false },
        }),
        prisma.bookmark.count({
          where: { userId },
        }),
        prisma.company.findMany({
          orderBy: { name: 'asc' },
          select: { id: true, name: true, slug: true },
        }),
      ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user,
      stats: {
        solvedCount,
        attemptedCount,
        bookmarksCount,
      },
      availableCompanies,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const {
      name,
      bio,
      experienceLevel,
      targetRole,
      targetCompanies,
      primaryFocus,
      targetInterviewDate,
      preferredDifficulty,
    } = body;

    // Validate preferredDifficulty if provided
    let difficultyVal: Difficulty = Difficulty.MEDIUM;
    if (
      preferredDifficulty &&
      ['EASY', 'MEDIUM', 'HARD'].includes(preferredDifficulty.toUpperCase())
    ) {
      difficultyVal = preferredDifficulty.toUpperCase() as Difficulty;
    }

    // Validate targetInterviewDate if provided
    let parsedDate: Date | null = null;
    if (targetInterviewDate) {
      const d = new Date(targetInterviewDate);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }

    // Clean targetCompanies array
    const cleanedCompanies = Array.isArray(targetCompanies)
      ? targetCompanies.filter((c: unknown) => typeof c === 'string' && c.trim().length > 0)
      : [];

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: typeof name === 'string' ? name.trim() : undefined,
        bio: typeof bio === 'string' ? bio.trim() : null,
        experienceLevel: typeof experienceLevel === 'string' ? experienceLevel : null,
        targetRole: typeof targetRole === 'string' ? targetRole : null,
        targetCompanies: cleanedCompanies,
        primaryFocus: typeof primaryFocus === 'string' ? primaryFocus : null,
        targetInterviewDate: parsedDate,
        preferredDifficulty: difficultyVal,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        experienceLevel: true,
        targetRole: true,
        targetCompanies: true,
        primaryFocus: true,
        targetInterviewDate: true,
        preferredDifficulty: true,
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
