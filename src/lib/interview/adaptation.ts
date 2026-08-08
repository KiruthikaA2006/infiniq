import { EvaluationResult, DecisionType } from "@/types/interview";

export interface AdaptationOutput {
  nextDifficulty: "easy" | "medium" | "hard";
  decisionType: DecisionType;
  reason: string;
}

/**
 * Dynamically adapts the difficulty and determines the agent transition decision.
 */
export function adaptDifficultyAndGoal(
  evaluation: EvaluationResult,
  currentDifficulty: "easy" | "medium" | "hard",
  consecutiveLowScores: number
): AdaptationOutput {
  // Strong Performance: Step up difficulty
  if (evaluation.score >= 80 && evaluation.reasoning >= 3.8) {
    let nextDifficulty = currentDifficulty;
    if (currentDifficulty === "easy") nextDifficulty = "medium";
    else if (currentDifficulty === "medium") nextDifficulty = "hard";

    return {
      nextDifficulty,
      decisionType: "DEEPER_CHALLENGE",
      reason: `Strong response (Score: ${evaluation.score}, Reasoning: ${evaluation.reasoning}/5). Escapes core loops into deep architectural design and trade-offs.`,
    };
  }

  // Weak Performance: Scaffolding or fallback to fundamentals
  if (evaluation.score < 55 || consecutiveLowScores >= 2) {
    let nextDifficulty = currentDifficulty;
    if (currentDifficulty === "hard") nextDifficulty = "medium";
    else if (currentDifficulty === "medium") nextDifficulty = "easy";

    return {
      nextDifficulty,
      decisionType: "FOUNDATION_REPAIR",
      reason: `Performance alert (Score: ${evaluation.score}). Candidate demonstrates gaps in topic foundations. Backing off difficulty to evaluate basic constraints.`,
    };
  }

  // Average Performance: Proceed with plan
  return {
    nextDifficulty: currentDifficulty,
    decisionType: evaluation.followUpNeeded ? "FOLLOW_UP" : "NEW_TOPIC",
    reason: `Standard response (Score: ${evaluation.score}). Maintaining difficulty setting and proceeding with curriculum scheduling.`,
  };
}
