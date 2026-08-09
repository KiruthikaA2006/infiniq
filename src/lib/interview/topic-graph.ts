export interface TopicTransition {
  fromDay: number;
  toDay: number;
  bridgeText: string;
}

export const TOPIC_TRANSITION_BRIDGES: Record<string, string> = {
  "1->2": "Let's move from local Python environment isolation to local model deployment and quantization...",
  "1->3": "Let's transition from developer tooling and environment isolation to full-stack API architecture...",
  "1->4": "Let's move from environment configuration to structured data ingestion and query optimization...",
  "2->3": "Now that we've covered local model runtime considerations, let's look at full-stack integration with FastAPI and React...",
  "4->5": "Let's move from structured tabular data to unstructured document extraction and OCR pipelines...",
  "4->10": "Let's transition from relational database filtering to hybrid retrieval and query routing...",
  "5->6": "Building on document extraction, let's look at chunking strategies and knowledge base metadata design...",
  "6->7": "Now that the document chunks are structured, let's explore semantic vector embeddings...",
  "7->8": "Let's move from embedding geometry to vector storage architectures and HNSW index tuning...",
  "8->9": "Now that we've examined vector indexing, let's look at batch ingestion and pipeline idempotency...",
  "8->10": "Let's move from index parameters to the retrieval matching engine and reranking layer...",
  "10->11": "Now that the retrieval candidates are ranked, let's look at end-to-end RAG prompt grounding and LLM generation...",
  "11->12": "Let's transition from basic RAG grounding to advanced prompt engineering and instruction following...",
  "12->13": "Building on system prompting, let's look at structured outputs and deterministic function calling...",
  "13->21": "Let's move from single function calling to ReAct autonomous agents and tool orchestration...",
  "21->22": "Now that we've covered single agent loops, let's step up to multi-agent collaboration and routing...",
  "21->23": "Let's transition from framework-specific tools to standardized Model Context Protocol (MCP) servers...",
  "23->24": "Building on MCP tool servers, let's look at unified agent integration and latency management...",
  "16->18": "Let's move from backend API contracts to Server-Sent Events streaming and client backpressure...",
  "18->20": "Now that the streaming layer is established, let's explore conversation memory and context window budgets...",
  "25->26": "Let's move from offline evaluation benchmarks to real-time performance optimization and semantic caching...",
  "26->27": "Now that throughput is optimized, let's address security guardrails, PII redaction, and prompt injection...",
  "27->28": "Let's transition from application security to containerization, Kubernetes pod orchestration, and deployment...",
  "28->30": "Finally, let's look at production observability, latency SLIs, and distributed tracing...",
};

/**
 * Finds the most coherent and natural next curriculum topic from completed days
 * that hasn't been covered yet.
 */
export function findBestTransitionTopic(
  currentDay: number,
  completedDays: number[],
  alreadyCoveredDays: number[],
  curriculumList: Array<{ day: number; title: string; module: string }>
): { targetDay: number; targetTopic: string; targetDomain: string; bridgeText: string } {
  // Candidate pool: completed days not yet covered in this session
  const remainingDays = completedDays.filter((d) => !alreadyCoveredDays.includes(d));

  if (remainingDays.length === 0) {
    // If all completed days are covered, pick the least recently covered completed day
    const fallbackDay = completedDays[completedDays.length - 1] || 1;
    const currItem = curriculumList.find((c) => c.day === fallbackDay) || {
      day: fallbackDay,
      title: "System Architecture",
      module: "Architecture",
    };
    return {
      targetDay: currItem.day,
      targetTopic: currItem.title,
      targetDomain: currItem.module,
      bridgeText: "Let's synthesize our discussion across system architecture and production reliability...",
    };
  }

  // Find the closest forward completed day (or nearest logical jump)
  let bestDay = remainingDays[0];
  let minDistance = 999;

  for (const d of remainingDays) {
    // Prefer days that come after currentDay in the curriculum flow
    const dist = d > currentDay ? d - currentDay : (d + 31) - currentDay;
    if (dist < minDistance) {
      minDistance = dist;
      bestDay = d;
    }
  }

  const currItem = curriculumList.find((c) => c.day === bestDay) || {
    day: bestDay,
    title: "Technical Topic",
    module: "Engineering",
  };

  const bridgeKey = `${currentDay}->${bestDay}`;
  const bridgeText =
    TOPIC_TRANSITION_BRIDGES[bridgeKey] ||
    `Let's move from our previous focus to ${currItem.title.toLowerCase()}...`;

  return {
    targetDay: currItem.day,
    targetTopic: currItem.title,
    targetDomain: currItem.module,
    bridgeText,
  };
}
