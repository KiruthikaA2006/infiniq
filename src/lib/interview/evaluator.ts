import { generateCompletion } from "../ai/provider";
import { EvaluationResult, EvaluationResultSchema } from "@/types/interview";

// Utility to strip JSON markdown wrappers
function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "");
    cleaned = cleaned.replace(/```$/, "");
  }
  return cleaned.trim();
}

/**
 * Runs a deterministic fallback evaluation when the LLM results are malformed or fail Zod schema checks.
 */
function runFallbackEvaluation(
  question: string,
  answer: string,
  topic: string
): EvaluationResult {
  const cleanAns = answer.toLowerCase();
  const isDetailed = cleanAns.length > 80;

  return {
    score: isDetailed ? 80 : 50,
    technicalDepth: isDetailed ? 4 : 2,
    reasoning: isDetailed ? 3.8 : 2,
    accuracy: isDetailed ? 4 : 2.5,
    communication: 3.5,
    strengths: isDetailed
      ? ["Structured explanation of component orchestration", "Addressed common latency bottlenecks"]
      : ["Provided a direct high-level conceptual baseline"],
    weaknesses: isDetailed ? [] : ["Lack of depth regarding alternative strategies and trade-offs"],
    conceptsMentioned: [topic],
    misconceptions: [],
    missingConcepts: isDetailed ? [] : ["Specific framework selections", "Performance trace observability parameters"],
    followUpNeeded: true,
    followUpReason: "Fallback validator triggered. Additional probing required.",
    recommendedDifficulty: isDetailed ? "hard" : "medium",
  };
}

/**
 * Evaluates candidate responses using LLM-driven structured JSON or fallback simulator.
 */
export async function evaluateAnswer(
  questionText: string,
  answerText: string,
  topic: string
): Promise<EvaluationResult> {
  const systemPrompt = `
You are a senior technical interviewer. Evaluate the candidate's answer to the question on the topic "${topic}".
Evaluate their actual technical reasoning, accuracy, and trade-off awareness, rather than scoring purely on keyword presence.

You MUST return a JSON object that adheres strictly to this structure:
{
  "score": number (0 to 100),
  "technicalDepth": number (0.0 to 5.0),
  "reasoning": number (0.0 to 5.0),
  "accuracy": number (0.0 to 5.0),
  "communication": number (0.0 to 5.0),
  "strengths": string[],
  "weaknesses": string[],
  "conceptsMentioned": string[],
  "misconceptions": string[],
  "missingConcepts": string[],
  "followUpNeeded": boolean,
  "followUpReason": string,
  "recommendedDifficulty": "easy" | "medium" | "hard"
}

Ensure formatting is strictly valid JSON. Do not write normal conversation or explanations outside the JSON object.
`;

  const userPrompt = `
Question Asked: "${questionText}"
Candidate's Response: "${answerText}"
`;

  // First Attempt
  let rawResponse = "";
  try {
    rawResponse = await generateCompletion(systemPrompt, userPrompt, EvaluationResultSchema);
    const cleaned = cleanJsonResponse(rawResponse);
    const parsed = EvaluationResultSchema.parse(JSON.parse(cleaned));
    return parsed;
  } catch (err) {
    console.warn("First evaluation parse failed, attempting corrective retry:", err);

    // Corrective Retry Attempt
    const retrySystem = `${systemPrompt}\n\nWARNING: Your previous response was malformed or failed Zod validation. You MUST return ONLY the JSON block. Do not include markdown codeblocks.`;
    try {
      rawResponse = await generateCompletion(retrySystem, userPrompt, EvaluationResultSchema);
      const cleaned = cleanJsonResponse(rawResponse);
      const parsed = EvaluationResultSchema.parse(JSON.parse(cleaned));
      return parsed;
    } catch (retryErr) {
      console.error("Evaluation corrective retry failed, falling back to deterministic evaluator:", retryErr);
      return runFallbackEvaluation(questionText, answerText, topic);
    }
  }
}
