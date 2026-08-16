import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { InterviewRoom, InterviewSessionData } from '@/components/interview/InterviewRoom';

export const metadata = {
  title: 'Interview Room | Interview Prep Platform',
  description: 'Live interview session with in-browser code editor and execution sandbox.',
};

export default async function InterviewSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const authSession = await auth();
  if (!authSession?.user?.id) {
    redirect('/signin');
  }

  const { sessionId } = await params;
  const currentUserId = authSession.user.id;

  let session = await prisma.interviewSession.findUnique({
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
      codeDraft: true,
      submissions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!session) {
    notFound();
  }

  // Strict server-side authorization guard
  const isParticipant = session.userId === currentUserId || session.interviewerId === currentUserId;
  if (!isParticipant) {
    redirect('/dashboard');
  }

  // Auto-start session if entering when scheduled
  if (session.status === 'SCHEDULED') {
    session = await prisma.interviewSession.update({
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
        codeDraft: true,
        submissions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }

  // Format serializable payload
  const formattedSession: InterviewSessionData = {
    id: session.id,
    userId: session.userId,
    interviewerId: session.interviewerId,
    mode: session.mode,
    status: session.status,
    durationMinutes: session.durationMinutes,
    scheduledAt: session.scheduledAt.toISOString(),
    startedAt: session.startedAt?.toISOString() || null,
    endedAt: session.endedAt?.toISOString() || null,
    problem: session.problem
      ? {
          id: session.problem.id,
          title: session.problem.title,
          difficulty: session.problem.difficulty,
          platform: session.problem.platform,
          summary: session.problem.summary,
          constraints: session.problem.constraints,
          externalUrl: session.problem.externalUrl,
          topics: session.problem.topics.map((t) => ({ topic: { name: t.topic.name } })),
          testCases: session.problem.testCases.map((tc) => ({
            id: tc.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
          })),
        }
      : null,
    candidate: session.candidate,
    interviewer: session.interviewer,
    codeDraft: session.codeDraft
      ? { code: session.codeDraft.code, language: session.codeDraft.language }
      : null,
    submissions: session.submissions.map((s) => ({
      id: s.id,
      code: s.code,
      language: s.language,
      verdict: s.verdict,
      stdout: s.stdout,
      stderr: s.stderr,
      compileOutput: s.compileOutput,
      executionTime: s.executionTime,
      memory: s.memory,
      createdAt: s.createdAt.toISOString(),
    })),
  };

  return (
    <InterviewRoom initialSession={formattedSession} currentUserId={currentUserId} />
  );
}
