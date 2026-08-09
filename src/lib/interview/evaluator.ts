import { generateCompletion } from "../ai/provider";
import { EvaluationResult, EvaluationResultSchema } from "@/types/interview";
import { evaluateAnswerSemantics } from "./semantic-evaluator";

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
 * Runs a deterministic semantic fallback evaluation when the LLM results are malformed or fail Zod schema checks.
 */
function runFallbackEvaluation(
  question: string,
  answer: string,
  topic: string
): EvaluationResult {
  return evaluateAnswerSemantics(question, answer, topic);
}

/**
 * Evaluates candidate responses using LLM-driven structured JSON or fallback simulator.
 * Enforces relevance-first scoring, 6-tier classification, and strict domain mismatch penalties.
 */
export async function evaluateAnswer(
  questionText: string,
  answerText: string,
  topic: string
): Promise<EvaluationResult> {
  const systemPrompt = `
You are a senior technical interviewer. Evaluate whether the candidate actually answered the technical question on the topic "${topic}".

Evaluation Priority:
1. Question understanding & semantic relevance (MUST come first)
2. Technical correctness & accuracy
3. Technical depth & reasoning
4. Trade-off awareness
5. Communication clarity

CRITICAL RULES:
- Do NOT reward unrelated technical keywords or buzzwords.
- If the question is about Python C-extensions/wheels and the candidate talks about React/UI, classify as "IRRELEVANT" with relevance <= 10 and score <= 15.
- If the answer demonstrates a fundamental conceptual error (e.g. ABI is encryption), classify as "MISCONCEPTION".
- If the answer is shallow, classify as "PARTIALLY_CORRECT" with reduced technical depth.
- If the answer directly and accurately answers the question with trade-offs, classify as "CORRECT".

Classifications: "CORRECT" | "PARTIALLY_CORRECT" | "INCORRECT" | "IRRELEVANT" | "INSUFFICIENT" | "MISCONCEPTION"

You MUST return a JSON object adhering strictly to:
{
  "score": number (0 to 100),
  "classification": "CORRECT" | "PARTIALLY_CORRECT" | "INCORRECT" | "IRRELEVANT" | "INSUFFICIENT" | "MISCONCEPTION",
  "relevance": number (0 to 100),
  "accuracy": number (0 to 100),
  "technicalDepth": number (0 to 100),
  "reasoning": number (0 to 100),
  "communication": number (0 to 100),
  "tradeoffAwareness": number (0 to 100),
  "correct": boolean,
  "explanation": string,
  "strengths": string[],
  "weaknesses": string[],
  "conceptsMentioned": string[],
  "misconceptions": string[],
  "missingConcepts": string[],
  "followUpNeeded": boolean,
  "followUpReason": string,
  "recommendedDifficulty": "easy" | "medium" | "hard"
}
`;

  const userPrompt = `
CURRENT QUESTION:
"${questionText}"

TOPIC:
"${topic}"

CANDIDATE ANSWER:
"${answerText}"
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
    const retrySystem = `${systemPrompt}\n\nWARNING: Return ONLY the JSON object. Do not wrap in markdown or conversation.`;
    try {
      rawResponse = await generateCompletion(retrySystem, userPrompt, EvaluationResultSchema);
      const cleaned = cleanJsonResponse(rawResponse);
      const parsed = EvaluationResultSchema.parse(JSON.parse(cleaned));
      return parsed;
    } catch (retryErr) {
      console.warn("Evaluation retry failed, falling back to deterministic semantic evaluator:", retryErr);
      return runFallbackEvaluation(questionText, answerText, topic);
    }
  }
}

