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
You are a senior frontend/AI systems architect conducting a technical interview.
Your goal is to evaluate the candidate's actual engineering reasoning, system decomposition, trade-off awareness, and practical choices.

CORE DIRECTIVES:
1. Do not ask simple definitions or generic trivia questions (e.g. "What is RAG?" or "How does CRDT work?").
2. Ask questions that present a realistic production scenario, system bottleneck, or architectural trade-off.
3. If this is a FOLLOW-UP, you must probe a specific weakness, assumption, trade-off, or statement made in the candidate's previous answer. Do not ask generic questions like "Can you explain more?". Refer directly to their statement and probe their engineering logic.
4. Maintain a calm, professional, and technically rigorous tone. Do not use conversational filler or excessive friendly chatter.
5. Difficulty setting is: ${params.difficulty}. Adjust the depth of sharding, latency limits, concurrency, or synchronization details to match.
6. Verify and strictly adhere to the candidate's completed curriculum. Do NOT ask any questions on topics that were skipped or not completed.
`;

  const memoryContext = `
INTERVIEW CONTEXT:
- Candidate Name: ${params.candidate.member.name}
- Candidate Role: ${params.candidate.member.jobRole}
- Completed Curriculum: ${JSON.stringify(completedDetails)}
- Skipped Curriculum (DO NOT ASK): ${JSON.stringify(skippedDetails)}
- Strengths Identified: ${JSON.stringify(params.memory.strengths)}
- Misconceptions Flagged: ${JSON.stringify(params.memory.misconceptions)}
- Covered Topics: ${JSON.stringify(params.memory.coveredTopics)}
- Claims Made by Candidate: ${JSON.stringify(params.memory.claims)}
- Previously Asked Questions: ${JSON.stringify(params.memory.previousFollowUps)}
`;

  let userPrompt = `
Generate next question for topic: "${params.topic}"
Question Type: ${params.type}
Difficulty: ${params.difficulty}
Question Number: ${params.memory.previousFollowUps.length + 1}
`;

  if (params.type === "follow-up" && params.previousQuestionText && params.previousAnswerText) {
    userPrompt += `
PREVIOUS CONTEXT:
- Previous Question: "${params.previousQuestionText}"
- Candidate Answer: "${params.previousAnswerText}"
- Evaluation: ${params.previousEvaluation ? JSON.stringify(params.previousEvaluation) : "N/A"}

Please generate a highly contextual, specific follow-up question/probe referencing their specific claim or weakness in their previous answer.
`;
  } else {
    userPrompt += `
Please generate a standard or next-domain question for the topic. Introduce the scenario clearly.
`;
  }

  userPrompt += `\n${memoryContext}\nOutput only the clean, raw text of the question. No JSON wrapper, no conversational introduction (like "Here is your next question..."), no formatting prefixes.`;

  const question = await generateCompletion(systemPrompt, userPrompt);
  return question.trim();
}
