import { generateCompletion } from "../ai/provider";
import { CandidateProfile } from "@/data/candidate";
import { CompactMemory, EvaluationResult, ProbeType, ConversationThread } from "@/types/interview";
import { getCurriculum } from "@/data/curriculum";

export interface QuestionGeneratorParams {
  candidate: CandidateProfile;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  type: "standard" | "follow-up" | "next-domain" | "final";
  probeType?: ProbeType;
  thread?: ConversationThread;
  transitionBridge?: string;
  memory: CompactMemory;
  previousQuestionText?: string;
  previousAnswerText?: string;
  previousEvaluation?: EvaluationResult;
  globalAskedQuestions?: string[];
}

export async function generateQuestion(params: QuestionGeneratorParams): Promise<string> {
  const curriculum = await getCurriculum();
  const completedMissions = params.candidate.missions?.completedMissions || [];
  const skippedMissions = params.candidate.missions?.skippedMissions || [];

  const completedDetails = curriculum
    .filter((d) => completedMissions.includes(d.day))
    .map((d) => `Day ${d.day}: ${d.title} (${d.module})`);

  const skippedDetails = curriculum
    .filter((d) => skippedMissions.includes(d.day))
    .map((d) => `Day ${d.day}: ${d.title} (${d.module})`);

  const systemPrompt = `
You are InfiniQ's AI Technical Interviewer conducting a rigorous engineering assessment.
Your goal is to act like a real senior technical interviewer who actively listens, probes candidate claims, challenges design trade-offs, and repairs foundations.

CORE PRINCIPLES:
1. STRICTLY RELEVANT FOLLOW-UPS: If this is a follow-up (${params.probeType || "CLAIM_PROBE"}), you MUST directly inspect the candidate's previous response, reference the specific technical claims or technologies they proposed, and challenge their decision. NEVER jump to an unrelated topic while the current thread is active.
2. PROBE TYPES:
   - CLAIM_PROBE: Probe specific mechanics and assumptions in what the candidate stated.
   - TRADEOFF_PROBE: Ask what workload characteristics or constraints would make them reverse their decision.
   - IMPLEMENTATION_PROBE: Ask how they would implement concrete details, handle edge cases, or parse schemas.
   - SCALE_PROBE: Move from local implementation to production scale, concurrency, or large datasets.
   - FAILURE_PROBE: Probe failure handling, disconnects, timeouts, or crash recovery.
   - FOUNDATION_REPAIR: Clarify fundamental misconceptions constructively before proceeding.
3. TOPIC TRANSITIONS: If transitioning to a new curriculum topic, provide a natural conversational bridge.
4. ZERO CONVERSATIONAL FLUFF: Never say "To wrap up", "In conclusion", "As a final question", "Let's dive in", or "Welcome".
5. UNIQUE QUESTIONS: Do not repeat questions asked in this session or across the platform.
`;

  const threadSummary = params.thread
    ? `
ACTIVE CONVERSATION THREAD:
- Topic: ${params.thread.topic} (Day ${params.thread.curriculumDay})
- Current Thread Depth: ${params.thread.currentDepth}
- Candidate Claims: ${JSON.stringify(params.thread.candidateClaims)}
- Concepts Mentioned: ${JSON.stringify(params.thread.concepts)}
- Trade-offs Identified: ${JSON.stringify(params.thread.tradeoffs)}
- Misconceptions Flagged: ${JSON.stringify(params.thread.misconceptions)}
`
    : "";

  let userPrompt = `
Generate next question for topic: "${params.topic}"
Question Type: ${params.type}
Probe Type: ${params.probeType || "CLAIM_PROBE"}
Difficulty: ${params.difficulty}
Question Number: ${params.memory.previousFollowUps.length + 1}
${params.transitionBridge ? `Transition Context: "${params.transitionBridge}"` : ""}
`;

  if (params.type === "follow-up" && params.previousQuestionText && params.previousAnswerText) {
    userPrompt += `
PREVIOUS TURN CONTEXT:
- Previous Question: "${params.previousQuestionText}"
- Candidate's Exact Response: "${params.previousAnswerText}"
- Evaluation: ${params.previousEvaluation ? JSON.stringify(params.previousEvaluation) : "N/A"}
`;
  }

  userPrompt += `
${threadSummary}
- Completed Curriculum: ${JSON.stringify(completedDetails)}
- Skipped Curriculum (DO NOT ASK): ${JSON.stringify(skippedDetails)}
- Previous Questions Asked (DO NOT REPEAT): ${JSON.stringify(params.memory.previousFollowUps)}
Output only the clean text of the question.
`;

  const rawQuestion = await generateCompletion(systemPrompt, userPrompt);
  let cleaned = rawQuestion.trim();
  
  // Clean quotes or conversational prefixes
  cleaned = cleaned.replace(/^"|"$/g, "");
  cleaned = cleaned.replace(/^(To wrap up|To conclude|In conclusion|As a final question|Let's wrap up|Finally|Next question:?)\s*,?\s*/i, "");
  
  return cleaned.trim();
}
