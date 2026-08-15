import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Prisma, Difficulty } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '12', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const difficulty = searchParams.get('difficulty')?.toUpperCase() || 'ALL';
    const platform = searchParams.get('platform') || 'ALL';
    const topic = searchParams.get('topic') || 'ALL';
    const company = searchParams.get('company') || 'ALL';
    const status = searchParams.get('status')?.toUpperCase() || 'ALL';
    const sort = searchParams.get('sort') || 'DEFAULT';

    const where: Prisma.ProblemWhereInput = {};

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { platform: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        {
          topics: {
            some: {
              topic: {
                name: { contains: search, mode: 'insensitive' },
              },
            },
          },
        },
      ];
    }

    // Difficulty filter
    if (difficulty !== 'ALL' && ['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
      where.difficulty = difficulty as Difficulty;
    }

    // Platform filter
    if (platform !== 'ALL') {
      where.platform = { equals: platform, mode: 'insensitive' };
    }

    // Topic filter
    if (topic !== 'ALL') {
      where.topics = {
        some: {
          topic: {
            OR: [
              { slug: topic },
              { name: { equals: topic, mode: 'insensitive' } },
            ],
          },
        },
      };
    }

    // Company filter
    if (company !== 'ALL') {
      where.companies = {
        some: {
          company: {
            OR: [
              { slug: company },
              { name: { equals: company, mode: 'insensitive' } },
            ],
          },
        },
      };
    }

    // Status filter (User specific)
    if (userId && status !== 'ALL') {
      if (status === 'SOLVED') {
        where.progress = {
          some: {
            userId,
            solved: true,
          },
        };
      } else if (status === 'ATTEMPTED') {
        where.progress = {
          some: {
            userId,
            attempted: true,
            solved: false,
          },
        };
      } else if (status === 'UNSOLVED') {
        where.NOT = {
          progress: {
            some: {
              userId,
              solved: true,
            },
          },
        };
      }
    }

    // Sorting
    let orderBy: Prisma.ProblemOrderByWithRelationInput[] = [{ createdAt: 'asc' }];
    if (sort === 'TITLE_ASC') {
      orderBy = [{ title: 'asc' }];
    } else if (sort === 'TITLE_DESC') {
      orderBy = [{ title: 'desc' }];
    } else if (sort === 'DIFFICULTY_ASC') {
      orderBy = [{ difficulty: 'asc' }, { title: 'asc' }];
    } else if (sort === 'DIFFICULTY_DESC') {
      orderBy = [{ difficulty: 'desc' }, { title: 'asc' }];
    } else if (sort === 'NEWEST') {
      orderBy = [{ createdAt: 'desc' }];
    }

    const skip = (page - 1) * limit;

    const [total, problems] = await Promise.all([
      prisma.problem.count({ where }),
      prisma.problem.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          topics: {
            include: {
              topic: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          companies: {
            include: {
              company: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          bookmarks: userId
            ? {
                where: { userId },
                select: { id: true },
              }
            : false,
          progress: userId
            ? {
                where: { userId },
                select: { solved: true, attempted: true, attempts: true, solvedAt: true },
              }
            : false,
        },
      }),
    ]);

    const formattedProblems = problems.map((p) => {
      const isBookmarked = Boolean(p.bookmarks && p.bookmarks.length > 0);
      const userProg = p.progress && p.progress.length > 0 ? p.progress[0] : null;

      let userStatus: 'SOLVED' | 'ATTEMPTED' | 'UNSOLVED' = 'UNSOLVED';
      if (userProg?.solved) {
        userStatus = 'SOLVED';
      } else if (userProg?.attempted) {
        userStatus = 'ATTEMPTED';
      }

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        platform: p.platform,
        externalUrl: p.externalUrl,
        externalId: p.externalId,
        difficulty: p.difficulty,
        summary: p.summary,
        topics: p.topics.map((t) => t.topic),
        companies: p.companies.map((c) => c.company),
        isBookmarked,
        status: userStatus,
        attempts: userProg?.attempts || 0,
        solvedAt: userProg?.solvedAt || null,
      };
    });

    return NextResponse.json({
      problems: formattedProblems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching problems:', error);
    return NextResponse.json({ error: 'Failed to fetch problems' }, { status: 500 });
  }
}
