import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [topics, companies] = await Promise.all([
      prisma.topic.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true },
      }),
      prisma.company.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true },
      }),
    ]);

    return NextResponse.json({
      topics,
      companies,
      platforms: ['LeetCode', 'CSES', 'Codeforces', 'HackerRank', 'AtCoder'],
      difficulties: ['EASY', 'MEDIUM', 'HARD'],
    });
  } catch (error) {
    console.error('Error fetching problem filters:', error);
    return NextResponse.json({ error: 'Failed to fetch filter options' }, { status: 500 });
  }
}
