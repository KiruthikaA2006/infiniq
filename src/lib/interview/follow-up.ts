import { EvaluationResult, InterviewQuestion, ProbeType, DecisionType, ConversationThread } from "@/types/interview";
import { ExtractedClaims } from "./claim-extractor";

export interface FollowUpDecisionResult {
  shouldFollowUp: boolean;
  probeType: ProbeType;
  transition: DecisionType;
  reason: string;
  targetFocus: string;
  referencesPreviousAnswer: boolean;
}

/**
 * Computes the next-question strategy following the explicit Interview Decision Priority:
 *
 * PRIORITY A: Probe an important technical claim from candidate's answer (CLAIM_PROBE)
 * PRIORITY B: Probe an unexplained assumption, weakness, or missing detail (IMPLEMENTATION_PROBE)
 * PRIORITY C: Probe a technical trade-off mentioned by the candidate (TRADEOFF_PROBE)
 * PRIORITY D: Increase difficulty toward scale, reliability, failure modes (SCALE_PROBE / FAILURE_PROBE)
 * PRIORITY E: Repair a weak foundation if candidate demonstrates misunderstanding (FOUNDATION_REPAIR)
 * PRIORITY F: Transition to another topic once thread is sufficiently explored (NEW_TOPIC)
 */
export function evaluateFollowUpNecessity(
  currentQuestion: InterviewQuestion,
  responseText: string,
  evaluation: EvaluationResult,
  thread?: ConversationThread,
  extractedClaims?: ExtractedClaims
): FollowUpDecisionResult {
  const cleanResponse = responseText.trim().toLowerCase();
  const threadDepth = thread?.currentDepth || 0;
  const maxDepth = thread?.maxThreadDepth ?? 2;

  // Short Answer Expansion Rule
  if (cleanResponse.length < 35) {
    return {
      shouldFollowUp: true,
      probeType: "CLAIM_PROBE",
      transition: "FOLLOW_UP",
      reason: "Candidate provided a brief answer; probing deeper to establish technical depth and reasoning.",
      targetFocus: currentQuestion.topic,
      referencesPreviousAnswer: true,
    };
  }

  // PRIORITY E: Foundation Repair (Misconceptions flagged)
  if (
    evaluation.misconceptions.length > 0 ||
    (extractedClaims && extractedClaims.misconceptions.length > 0) ||
    evaluation.score < 50
  ) {
    const misc =
      evaluation.misconceptions[0] ||
      (extractedClaims?.misconceptions[0]) ||
      "Identified conceptual gap in foundational theory";

    return {
      shouldFollowUp: true,
      probeType: "FOUNDATION_REPAIR",
      transition: "FOUNDATION_REPAIR",
      reason: `Foundational misconception detected: "${misc}". Intervening to clarify core principles before proceeding.`,
      targetFocus: currentQuestion.topic,
      referencesPreviousAnswer: true,
    };
  }

  // Check if current thread is already sufficiently explored (threadDepth >= maxDepth)
  if (threadDepth >= maxDepth) {
    return {
      shouldFollowUp: false,
      probeType: "NEW_TOPIC",
      transition: "NEW_TOPIC",
      reason: `Current conversational thread on "${currentQuestion.topic}" has reached sufficient depth (${threadDepth} turns). Transitioning naturally to next curriculum domain.`,
      targetFocus: currentQuestion.topic,
      referencesPreviousAnswer: false,
    };
  }

  // PRIORITY A: Probe an important technical claim from the candidate's answer
  if (extractedClaims && extractedClaims.claims.length > 0 && threadDepth === 0) {
    const claim = extractedClaims.claims[0];
    return {
      shouldFollowUp: true,
      probeType: "CLAIM_PROBE",
      transition: "FOLLOW_UP",
      reason: `Candidate claimed: "${claim}". Probing specific implementation mechanism and boundary conditions.`,
      targetFocus: claim,
      referencesPreviousAnswer: true,
    };
  }

  // PRIORITY B: Probe unexplained assumptions or missing details
  if (evaluation.missingConcepts.length > 0 || (extractedClaims && extractedClaims.unresolvedPoints.length > 0)) {
    const missing =
      extractedClaims?.unresolvedPoints[0] ||
      evaluation.missingConcepts[0] ||
      "unexplained architectural assumptions";

    return {
      shouldFollowUp: true,
      probeType: "IMPLEMENTATION_PROBE",
      transition: "IMPLEMENTATION_PROBE",
      reason: `Missing architectural detail: ${missing}. Probing concrete implementation choices.`,
      targetFocus: missing,
      referencesPreviousAnswer: true,
    };
  }

  // PRIORITY C: Probe a technical trade-off mentioned by the candidate
  if (extractedClaims && extractedClaims.tradeoffs.length > 0) {
    const trade = extractedClaims.tradeoffs[0];
    return {
      shouldFollowUp: true,
      probeType: "TRADEOFF_PROBE",
      transition: "TRADEOFF_PROBE",
      reason: `Candidate touched upon trade-off: "${trade}". Challenging decision criteria and reversal conditions.`,
      targetFocus: trade,
      referencesPreviousAnswer: true,
    };
  }

  // PRIORITY D: Scale, Reliability, Failure Modes (Strong answer progression)
  if (evaluation.score >= 75) {
    return {
      shouldFollowUp: true,
      probeType: threadDepth === 1 ? "FAILURE_PROBE" : "SCALE_PROBE",
      transition: "DEEPER_CHALLENGE",
      reason: `Strong response on ${currentQuestion.topic} (Score: ${evaluation.score}). Elevating question from local implementation to production scale and failure modes.`,
      targetFocus: `${currentQuestion.topic} at production scale`,
      referencesPreviousAnswer: true,
    };
  }

  // Default follow-up on candidate's answer if within thread bounds
  return {
    shouldFollowUp: true,
    probeType: "CLAIM_PROBE",
    transition: "FOLLOW_UP",
    reason: `Probing candidate's choices on "${currentQuestion.topic}" to verify operational robustness.`,
    targetFocus: currentQuestion.topic,
    referencesPreviousAnswer: true,
  };
}
