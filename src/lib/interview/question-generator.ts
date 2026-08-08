import { generateCompletion } from "../ai/provider";
import { CandidateProfile } from "@/data/candidate";
import { CompactMemory, EvaluationResult } from "@/types/interview";
import { getCurriculum } from "@/data/curriculum";

export interface QuestionGeneratorParams {
  candidate: CandidateProfile;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  type: "standard" | "follow-up" | "next-domain" | "final";
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
Your mission is to evaluate the candidate's actual engineering reasoning, system decomposition, trade-off awareness, and practical choices based strictly on their curriculum.

CRITICAL DIRECTIVES:
1. STRICTLY UNIQUE QUESTIONS: You must NEVER repeat a question previously asked to this candidate or to any other candidate. Every question must explore a distinct architectural or implementation angle.
2. ABSOLUTELY NO CONVERSATIONAL FILLER: Never use phrases such as "To wrap up", "To conclude", "In conclusion", "As a final question", "Let's wrap up", "Here is your next question", "To finalize our review", "Let's dive in", or "Welcome". State the technical question in a direct, formal, and authoritative manner.
3. ADAPTIVE FOLLOW-UP PROBING: If this is a FOLLOW-UP, you must directly analyze and quote/reference the specific claims, architectural components, or choices made in the candidate's previous answer. Probe their latency trade-offs, concurrency bottlenecks, error handling, or failure recovery.
4. STRICT CURRICULUM ADHERENCE: Strictly adhere to the candidate's completed curriculum. Under NO circumstances ask questions on skipped or uncompleted curriculum modules.
5. TECHNICAL DEPTH: Do not ask simple trivia or basic definitions (e.g. "What is RAG?"). Present realistic production constraints, scaling bottlenecks, data integrity challenges, and engineering trade-offs.
6. DIFFICULTY CALIBRATION: Current difficulty is "${params.difficulty}". Calibrate the depth of distributed consensus, memory overhead, synchronization, and latency boundaries accordingly.
`;

  const memoryContext = `
INTERVIEW CONTEXT:
- Candidate Name: ${params.candidate.member.name}
- Candidate Role: ${params.candidate.member.jobRole}
- Years Experience: ${params.candidate.member.yearsExperience}
- Education: ${params.candidate.member.education}
- Completed Curriculum: ${JSON.stringify(completedDetails)}
- Skipped Curriculum (STRICTLY DO NOT ASK): ${JSON.stringify(skippedDetails)}
- Strengths Identified: ${JSON.stringify(params.memory.strengths)}
- Misconceptions Flagged: ${JSON.stringify(params.memory.misconceptions)}
- Covered Topics: ${JSON.stringify(params.memory.coveredTopics)}
- Claims Made by Candidate: ${JSON.stringify(params.memory.claims)}
- Previously Asked in This Session: ${JSON.stringify(params.memory.previousFollowUps)}
- Previously Asked Across Platform (DO NOT REPEAT): ${JSON.stringify(params.globalAskedQuestions || [])}
`;

  let userPrompt = `
Generate next question for topic: "${params.topic}"
Question Type: ${params.type}
Difficulty: ${params.difficulty}
Question Number: ${params.memory.previousFollowUps.length + 1}
`;

  if (params.type === "follow-up" && params.previousQuestionText && params.previousAnswerText) {
    userPrompt += `
PREVIOUS TURN CONTEXT:
- Question Asked: "${params.previousQuestionText}"
- Candidate's Exact Response: "${params.previousAnswerText}"
- Turn Evaluation: ${params.previousEvaluation ? JSON.stringify(params.previousEvaluation) : "N/A"}

Please generate a direct, highly technical follow-up question referencing their specific stated choices and probing their engineering trade-offs, potential bottlenecks, or failure modes.
`;
  } else {
    userPrompt += `
Please generate a unique, formal production engineering question for the topic.
`;
  }

  userPrompt += `\n${memoryContext}\nOutput only the clean, raw text of the question. No JSON wrapper, no markdown codeblocks, no conversational intros or wrap-up phrases.`;

  const rawQuestion = await generateCompletion(systemPrompt, userPrompt);
  let cleaned = rawQuestion.trim();
  
  // Clean up any remaining quotes or conversational prefixes
  cleaned = cleaned.replace(/^"|"$/g, "");
  cleaned = cleaned.replace(/^(To wrap up|To conclude|In conclusion|As a final question|Let's wrap up|Finally|Next question:?)\s*,?\s*/i, "");
  
  return cleaned.trim();
}
