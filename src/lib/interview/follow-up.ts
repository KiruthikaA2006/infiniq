import { EvaluationResult, InterviewQuestion } from "@/types/interview";

export interface FollowUpDecision {
  shouldFollowUp: boolean;
  reason: string;
}

export function evaluateFollowUpNecessity(
  currentQuestion: InterviewQuestion,
  responseText: string,
  evaluation: EvaluationResult,
  consecutiveFollowUpsCount: number
): FollowUpDecision {
  const cleanResponse = responseText.trim().toLowerCase();

  // 1. If response is extremely short, request a probe to expand
  if (cleanResponse.length < 30) {
    return {
      shouldFollowUp: true,
      reason: "Candidate provided a very short response; probing required to establish technical depth.",
    };
  }

  // 2. Limit consecutive follow-ups to prevent getting stuck in one topic
  if (consecutiveFollowUpsCount >= 1) {
    return {
      shouldFollowUp: false,
      reason: "Concluded current topic exploration to maintain curriculum coverage breadth.",
    };
  }

  // 3. Trigger follow-up if evaluator marked it as needed
  if (evaluation.followUpNeeded) {
    return {
      shouldFollowUp: true,
      reason: evaluation.followUpReason || "Candidate response contains claims requiring further trade-off details.",
    };
  }

  // 4. Fallback: move to next topic
  return {
    shouldFollowUp: false,
    reason: "Candidate demonstrated clear understanding and completeness; ready to transition topic.",
  };
}
