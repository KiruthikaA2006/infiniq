import { CompactMemory, EvaluationResult, ConversationThread } from "@/types/interview";
import { extractCandidateClaims } from "./claim-extractor";

export function createInitialMemory(initialTopic?: string, initialDay?: number, initialDomain?: string): CompactMemory {
  return {
    strengths: [],
    weaknesses: [],
    misconceptions: [],
    coveredTopics: initialTopic ? [initialTopic] : [],
    claims: [],
    difficultyTrajectory: [],
    previousFollowUps: [],
    activeThread: initialTopic && initialDay
      ? {
          topic: initialTopic,
          curriculumDay: initialDay,
          domain: initialDomain || "Core Engineering",
          concepts: [initialTopic],
          candidateClaims: [],
          unresolvedPoints: [],
          strengths: [],
          weaknesses: [],
          misconceptions: [],
          tradeoffs: [],
          currentDepth: 0,
          maxThreadDepth: 2,
        }
      : undefined,
  };
}

export function updateMemory(
  currentMemory: CompactMemory,
  questionId: string,
  responseText: string,
  evaluation: EvaluationResult,
  currentDifficulty: "easy" | "medium" | "hard",
  topic: string,
  curriculumDay?: number,
  domain?: string
): CompactMemory {
  const updated: CompactMemory = { ...currentMemory };

  // 1. Extract rich candidate claims & trade-offs
  const extracted = extractCandidateClaims(responseText, topic);

  // 2. Merge strengths and weaknesses (deduplicated)
  evaluation.strengths.forEach((s) => {
    if (!updated.strengths.includes(s)) updated.strengths.push(s);
  });
  evaluation.weaknesses.forEach((w) => {
    if (!updated.weaknesses.includes(w)) updated.weaknesses.push(w);
  });
  
  // Merge misconceptions
  [...evaluation.misconceptions, ...extracted.misconceptions].forEach((m) => {
    if (!updated.misconceptions.includes(m)) updated.misconceptions.push(m);
  });

  // 3. Track covered topic
  if (topic && !updated.coveredTopics.includes(topic)) {
    updated.coveredTopics.push(topic);
  }

  // 4. Track difficulty trajectory
  updated.difficultyTrajectory = [
    ...updated.difficultyTrajectory,
    {
      questionId,
      difficulty: currentDifficulty,
      score: evaluation.score,
    },
  ];

  // 5. Append candidate claims
  extracted.claims.forEach((c) => {
    const exists = updated.claims.some((item) => item.claim === c);
    if (!exists) {
      updated.claims.push({
        topic,
        claim: c,
        confidence: responseText.length > 80 ? "high" : "medium",
      });
    }
  });

  // 6. Update or advance ConversationThread
  if (!updated.activeThread || updated.activeThread.topic !== topic) {
    updated.activeThread = {
      topic,
      curriculumDay: curriculumDay || 1,
      domain: domain || "Engineering",
      concepts: [topic, ...extracted.technologies],
      candidateClaims: extracted.claims,
      unresolvedPoints: extracted.unresolvedPoints,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      misconceptions: [...evaluation.misconceptions, ...extracted.misconceptions],
      tradeoffs: extracted.tradeoffs,
      currentDepth: 0,
      maxThreadDepth: 2,
    };
  } else {
    // Thread continuation
    updated.activeThread.currentDepth += 1;
    updated.activeThread.candidateClaims = Array.from(
      new Set([...updated.activeThread.candidateClaims, ...extracted.claims])
    );
    updated.activeThread.concepts = Array.from(
      new Set([...updated.activeThread.concepts, ...extracted.technologies])
    );
    updated.activeThread.unresolvedPoints = Array.from(
      new Set([...updated.activeThread.unresolvedPoints, ...extracted.unresolvedPoints])
    );
    updated.activeThread.tradeoffs = Array.from(
      new Set([...updated.activeThread.tradeoffs, ...extracted.tradeoffs])
    );
    updated.activeThread.misconceptions = Array.from(
      new Set([...updated.activeThread.misconceptions, ...evaluation.misconceptions, ...extracted.misconceptions])
    );
  }

  return updated;
}
