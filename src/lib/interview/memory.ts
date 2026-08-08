import { CompactMemory, EvaluationResult } from "@/types/interview";

export function createInitialMemory(): CompactMemory {
  return {
    strengths: [],
    weaknesses: [],
    misconceptions: [],
    coveredTopics: [],
    claims: [],
    difficultyTrajectory: [],
    previousFollowUps: [],
  };
}

export function updateMemory(
  currentMemory: CompactMemory,
  questionId: string,
  responseText: string,
  evaluation: EvaluationResult,
  currentDifficulty: "easy" | "medium" | "hard",
  topic: string
): CompactMemory {
  const updated = { ...currentMemory };

  // 1. Merge strengths and weaknesses (avoid duplicates)
  evaluation.strengths.forEach((s) => {
    if (!updated.strengths.includes(s)) updated.strengths.push(s);
  });
  evaluation.weaknesses.forEach((w) => {
    if (!updated.weaknesses.includes(w)) updated.weaknesses.push(w);
  });
  evaluation.misconceptions.forEach((m) => {
    if (!updated.misconceptions.includes(m)) updated.misconceptions.push(m);
  });

  // 2. Track covered topic
  if (topic && !updated.coveredTopics.includes(topic)) {
    updated.coveredTopics.push(topic);
  }

  // 3. Track difficulty trajectory
  updated.difficultyTrajectory = [
    ...updated.difficultyTrajectory,
    {
      questionId,
      difficulty: currentDifficulty,
      score: evaluation.score,
    },
  ];

  // 4. Extract basic claims from the candidate response text
  const cleanResponse = responseText.toLowerCase();
  let claimText = "";
  let confidence: "high" | "medium" | "low" = "medium";

  if (cleanResponse.includes("because") || cleanResponse.includes("therefore")) {
    confidence = "high";
  }

  if (topic === "RAG & Vector Search") {
    if (cleanResponse.includes("rerank")) {
      claimText = "Reranking candidates handles context limits and latency.";
    } else if (cleanResponse.includes("vector")) {
      claimText = "Vector databases resolve high-dimensional index latency.";
    }
  } else if (topic === "CRDTs & Real-time State Sync") {
    if (cleanResponse.includes("crdt")) {
      claimText = "State sync is best managed via conflict-free data types.";
    }
  } else if (topic === "Distributed Consensus & Linearizability") {
    if (cleanResponse.includes("paxos") || cleanResponse.includes("raft")) {
      claimText = "Consistency sharding requires distributed consensus protocols.";
    }
  }

  if (claimText) {
    updated.claims = [
      ...updated.claims,
      { topic, claim: claimText, confidence },
    ];
  }

  return updated;
}
