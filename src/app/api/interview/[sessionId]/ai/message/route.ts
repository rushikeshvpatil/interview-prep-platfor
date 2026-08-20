import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { generateInterviewerResponse, ChatMessage } from '@/lib/gemini';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const userId = session.user.id;

    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        problem: true,
        candidate: true,
      },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (interviewSession.userId !== userId && interviewSession.interviewerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let messages: ChatMessage[] = Array.isArray(interviewSession.aiTranscript)
      ? (interviewSession.aiTranscript as unknown as ChatMessage[])
      : [];

    // If no messages yet, generate the initial interviewer greeting
    if (messages.length === 0 && interviewSession.mode === 'AI') {
      const initialGreeting = await generateInterviewerResponse({
        candidate: {
          name: interviewSession.candidate.name,
          targetRole: interviewSession.candidate.targetRole,
          experienceLevel: interviewSession.candidate.experienceLevel,
          targetCompanies: interviewSession.candidate.targetCompanies,
        },
        problem: {
          title: interviewSession.problem?.title || 'Algorithmic Problem Solving',
          difficulty: interviewSession.problem?.difficulty || 'MEDIUM',
          platform: interviewSession.problem?.platform || 'Catalog',
          summary: interviewSession.problem?.summary,
          constraints: interviewSession.problem?.constraints,
        },
        messages: [
          {
            role: 'system',
            content: 'Initial greeting request: Candidate has entered the interview room.',
            timestamp: new Date().toISOString(),
          },
        ],
      });

      messages = [
        {
          role: 'interviewer',
          content: initialGreeting,
          timestamp: new Date().toISOString(),
        },
      ];

      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          aiTranscript: messages as unknown as object,
        },
      });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching AI transcript:', error);
    return NextResponse.json({ error: 'Failed to fetch AI chat' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const userId = session.user.id;
    const body = await request.json();
    const { content, currentCode, language, isHintRequest } = body;

    if (!content && !isHintRequest) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        problem: true,
        candidate: true,
        submissions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (interviewSession.userId !== userId && interviewSession.interviewerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingMessages: ChatMessage[] = Array.isArray(interviewSession.aiTranscript)
      ? (interviewSession.aiTranscript as unknown as ChatMessage[])
      : [];

    const userMessageContent = isHintRequest
      ? 'Could you please provide a gentle conceptual hint on how to approach or optimize this problem?'
      : content;

    const candidateMessage: ChatMessage = {
      role: 'candidate',
      content: userMessageContent,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...existingMessages, candidateMessage];

    const latestSub = interviewSession.submissions[0];

    // Generate AI Interviewer response
    const interviewerReply = await generateInterviewerResponse({
      candidate: {
        name: interviewSession.candidate.name,
        targetRole: interviewSession.candidate.targetRole,
        experienceLevel: interviewSession.candidate.experienceLevel,
        targetCompanies: interviewSession.candidate.targetCompanies,
      },
      problem: {
        title: interviewSession.problem?.title || 'Algorithmic Problem',
        difficulty: interviewSession.problem?.difficulty || 'MEDIUM',
        platform: interviewSession.problem?.platform || 'Catalog',
        summary: interviewSession.problem?.summary,
        constraints: interviewSession.problem?.constraints,
      },
      messages: updatedHistory,
      currentCode,
      language,
      latestVerdict: latestSub?.verdict,
      latestOutput: latestSub?.stdout || latestSub?.stderr || latestSub?.compileOutput,
    });

    const aiMessage: ChatMessage = {
      role: 'interviewer',
      content: interviewerReply,
      timestamp: new Date().toISOString(),
    };

    const finalMessages = [...updatedHistory, aiMessage];

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        aiTranscript: finalMessages as unknown as object,
      },
    });

    return NextResponse.json({
      messages: finalMessages,
      reply: aiMessage,
    });
  } catch (error) {
    console.error('Error handling AI chat message:', error);
    return NextResponse.json({ error: 'Failed to generate AI response' }, { status: 500 });
  }
}
