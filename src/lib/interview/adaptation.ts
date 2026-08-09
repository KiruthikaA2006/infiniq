import { EvaluationResult, DecisionType, ProbeType } from "@/types/interview";

export interface AdaptationOutput {
  nextDifficulty: "easy" | "medium" | "hard";
  decisionType: DecisionType;
  reason: string;
}

/**
 * Dynamically adapts interview difficulty based on candidate response quality,
 * reasoning depth, and the active probe type.
 */
export function adaptDifficultyAndGoal(
  evaluation: EvaluationResult,
  currentDifficulty: "easy" | "medium" | "hard",
  consecutiveLowScores: number,
  probeType?: ProbeType
): AdaptationOutput {
  // Foundation Repair or Low Performance: Back off difficulty
  if (probeType === "FOUNDATION_REPAIR" || evaluation.score < 55 || consecutiveLowScores >= 2) {
    let nextDifficulty = currentDifficulty;
    if (currentDifficulty === "hard") nextDifficulty = "medium";
    else if (currentDifficulty === "medium") nextDifficulty = "easy";

    return {
      nextDifficulty,
      decisionType: "FOUNDATION_REPAIR",
      reason: `Foundational repair active (Score: ${evaluation.score}). Calibrating difficulty to evaluate core conceptual fundamentals.`,
    };
  }

  // Strong Performance: Elevate to Deeper Challenge / Harder difficulty
  if (evaluation.score >= 80 && evaluation.reasoning >= 3.8) {
    let nextDifficulty = currentDifficulty;
    if (currentDifficulty === "easy") nextDifficulty = "medium";
    else if (currentDifficulty === "medium") nextDifficulty = "hard";

    return {
      nextDifficulty,
      decisionType: probeType === "TRADEOFF_PROBE" ? "TRADEOFF_PROBE" : "DEEPER_CHALLENGE",
      reason: `Strong technical reasoning (Score: ${evaluation.score}, Depth: ${evaluation.technicalDepth}/5). Escalating to architectural trade-offs, scaling limits, and edge failure recovery.`,
    };
  }

  // Standard Performance: Maintain setting
  return {
    nextDifficulty: currentDifficulty,
    decisionType: probeType === "CLAIM_PROBE" ? "FOLLOW_UP" : "NEW_TOPIC",
    reason: `Consistent response (Score: ${evaluation.score}). Maintaining ${currentDifficulty} calibration.`,
  };
}
