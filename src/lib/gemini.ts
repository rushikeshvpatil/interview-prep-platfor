import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface ChatMessage {
  role: 'interviewer' | 'candidate' | 'system';
  content: string;
  timestamp: string;
}

export interface CandidateContext {
  name?: string | null;
  targetRole?: string | null;
  experienceLevel?: string | null;
  targetCompanies?: string[];
  primaryFocus?: string | null;
}

export interface ProblemContext {
  title: string;
  difficulty: string;
  platform: string;
  summary?: string | null;
  constraints?: string | null;
}

export interface ScorecardResult {
  rubricScores: {
    correctness: number;
    problemSolving: number;
    complexity: number;
    codeQuality: number;
    communication: number;
    overall: number;
  };
  strengths: string[];
  improvements: string[];
  recommendedTopics: string[];
  summary: string;
}

const INTERVIEWER_SYSTEM_PROMPT = `
You are a Senior Staff Software Engineer and Technical Interviewer at a top technology company (FAANG / Tier 1).
You are conducting a live 1-on-1 technical coding interview with a software engineering candidate.

Your goals:
1. Conduct a realistic, rigorous, yet respectful technical interview.
2. At the start, greet the candidate, briefly state the problem, and ask them to clarify any constraints, discuss edge cases, and outline their algorithmic approach BEFORE they write full code.
3. If the candidate explains an approach, assess it:
   - If optimal: acknowledge the approach and invite them to implement it in the code editor.
   - If suboptimal (e.g. O(N^2) brute force when O(N) is possible): gently ask if they can optimize space/time complexity.
4. When the candidate asks for hints:
   - NEVER provide full code or give away the solution directly.
   - Give progressive, conceptual hints (e.g., "Think about how a hash map or two-pointer technique might avoid nested loops").
5. When the candidate runs code or submits:
   - If tests pass: congratulate them and ask about time/space complexity (Big-O) and potential scalability trade-offs.
   - If tests fail / runtime error: ask them how they would debug the issue or what edge case might be causing the failure (e.g. empty input, duplicates, negative numbers).
6. Keep responses concise, natural, and conversational (2-4 paragraphs max). Do not dump long walls of text. Speak as an interviewer in a voice call.
`;

/**
 * Generate interviewer dialogue response using Gemini
 */
export async function generateInterviewerResponse(params: {
  candidate: CandidateContext;
  problem: ProblemContext;
  messages: ChatMessage[];
  currentCode?: string;
  language?: string;
  latestVerdict?: string | null;
  latestOutput?: string | null;
}): Promise<string> {
  const { candidate, problem, messages, currentCode, language, latestVerdict, latestOutput } = params;

  if (!genAI) {
    // Fallback response for dev when API key is not configured
    return `[Interviewer] Welcome to your technical interview! I see you're preparing for ${candidate.targetRole || 'Software Engineering'} roles. Today we will work on "${problem.title}". Before jumping into the code, could you briefly explain your initial thoughts on how you plan to solve this problem and any edge cases you anticipate?`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const contextPrompt = `
=== INTERVIEW CONTEXT ===
Candidate Profile:
- Name: ${candidate.name || 'Candidate'}
- Target Role: ${candidate.targetRole || 'Software Engineer'}
- Experience Level: ${candidate.experienceLevel || 'Intermediate'}
- Target Companies: ${candidate.targetCompanies?.join(', ') || 'Tech Companies'}

Problem Under Discussion:
- Title: ${problem.title} (${problem.difficulty} on ${problem.platform})
- Summary: ${problem.summary || 'Algorithmic problem'}
- Constraints: ${problem.constraints || 'Standard constraints'}

Current Candidate Code in Monaco Editor (${language || 'python'}):
\`\`\`${language || 'python'}
${currentCode || '// No code written yet'}
\`\`\`

${latestVerdict ? `Latest Code Execution Verdict: ${latestVerdict}\nLatest Execution Output: ${latestOutput || 'None'}` : ''}

=== CONVERSATION HISTORY ===
${messages
  .map((m) => `${m.role === 'candidate' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
  .join('\n\n')}

Please provide your response as the interviewer. Speak directly to the candidate in a professional, constructive conversational style.
`;

    const result = await model.generateContent([
      { text: INTERVIEWER_SYSTEM_PROMPT },
      { text: contextPrompt },
    ]);

    const response = result.response.text();
    return response || 'Could you walk me through your thought process on this step?';
  } catch (error) {
    console.error('Gemini interviewer error:', error);
    return 'I noticed your latest update. How do you plan to handle potential edge cases with this approach?';
  }
}

/**
 * Generate final scorecard feedback at session completion
 */
export async function generateScorecardFeedback(params: {
  candidate: CandidateContext;
  problem: ProblemContext;
  messages: ChatMessage[];
  finalCode?: string;
  language?: string;
  submissionCount: number;
  hasAcceptedSubmission: boolean;
}): Promise<ScorecardResult> {
  const { candidate, problem, messages, finalCode, language, submissionCount, hasAcceptedSubmission } = params;

  if (!genAI) {
    return {
      rubricScores: {
        correctness: hasAcceptedSubmission ? 8 : 6,
        problemSolving: 7,
        complexity: 7,
        codeQuality: 8,
        communication: 8,
        overall: hasAcceptedSubmission ? 8 : 7,
      },
      strengths: [
        'Structured approach to decomposing the problem',
        'Clean variable naming and code structure',
        'Good responsiveness to interview questions',
      ],
      improvements: [
        'Could analyze space and time complexity more proactively',
        'Consider writing unit test edge cases before executing',
      ],
      recommendedTopics: [problem.title, 'Time & Space Complexity Analysis', 'Two Pointers / Hash Tables'],
      summary: `Overall solid performance on **${problem.title}**. The candidate demonstrated good problem-solving instincts and clean coding habits. Continued practice on articulating Big-O complexity will further strengthen interview readiness.`,
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const scorecardPrompt = `
You are the Lead Technical Interviewer evaluating a candidate's completed mock interview session.
Generate a structured JSON scorecard evaluating the candidate across 6 core dimensions (scores from 1 to 10):
1. correctness (1-10)
2. problemSolving (1-10)
3. complexity (1-10)
4. codeQuality (1-10)
5. communication (1-10)
6. overall (1-10)

Also provide:
- strengths: array of 3 concise strings highlighting what the candidate did well.
- improvements: array of 2-3 specific actionable improvement items.
- recommendedTopics: array of 2-4 DSA topics or problem patterns they should revise next.
- summary: 2-3 paragraphs of markdown summary giving balanced, encouraging, and actionable feedback.

Candidate Profile:
- Target Role: ${candidate.targetRole || 'Software Engineer'}
- Experience Level: ${candidate.experienceLevel || 'Intermediate'}

Problem:
- Title: ${problem.title} (${problem.difficulty})
- Submissions Made: ${submissionCount} (Accepted: ${hasAcceptedSubmission})

Final Code (${language || 'python'}):
\`\`\`${language || 'python'}
${finalCode || '// No code'}
\`\`\`

Interview Chat History:
${messages.map((m) => `${m.role}: ${m.content}`).join('\n')}

Output MUST be a valid JSON object matching this exact TypeScript structure:
{
  "rubricScores": {
    "correctness": number,
    "problemSolving": number,
    "complexity": number,
    "codeQuality": number,
    "communication": number,
    "overall": number
  },
  "strengths": string[],
  "improvements": string[],
  "recommendedTopics": string[],
  "summary": string
}
`;

    const result = await model.generateContent(scorecardPrompt);
    const jsonText = result.response.text();
    const parsed = JSON.parse(jsonText) as ScorecardResult;
    return parsed;
  } catch (error) {
    console.error('Failed to generate Gemini scorecard:', error);
    return {
      rubricScores: {
        correctness: hasAcceptedSubmission ? 8 : 6,
        problemSolving: 7,
        complexity: 7,
        codeQuality: 8,
        communication: 8,
        overall: hasAcceptedSubmission ? 8 : 7,
      },
      strengths: [
        'Clear problem breakdown and logical thought progression',
        'Good code readability and clean syntax formatting',
      ],
      improvements: [
        'Practice stating Big-O time and space complexity upfront',
        'Test additional edge cases before final submission',
      ],
      recommendedTopics: [problem.title, 'Algorithm Optimization'],
      summary: `The candidate completed the session for **${problem.title}**. Good communication and coding structure. Recommended next step is to continue practicing similar difficulty problems under timed conditions.`,
    };
  }
}
