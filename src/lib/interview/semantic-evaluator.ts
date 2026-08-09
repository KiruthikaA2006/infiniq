import { EvaluationResult, AnswerClassification } from "@/types/interview";

interface DomainDefinition {
  name: string;
  keywords: string[];
  description: string;
}

const DOMAINS: Record<string, DomainDefinition> = {
  PYTHON_PACKAGING: {
    name: "Python Environment & Packaging",
    keywords: [
      "python", "virtual environment", "venv", "lockfile", "poetry", "pip",
      "wheel", "wheels", "c-extension", "c-extensions", "abi", "glibc",
      "compiler", "gcc", "arm64", "x86_64", "architecture", "native bindings",
      "pylance", "type checking", "pyproject", "setup.py"
    ],
    description: "Python environment reproducibility, wheel distribution, and C-extension compilation",
  },
  LOCAL_LLM: {
    name: "Local LLM & Inference",
    keywords: [
      "ollama", "vram", "kv-cache", "kv cache", "quantization", "gguf",
      "awq", "qwen", "llama", "attention", "context window", "ttft",
      "time to first token", "gpu memory", "model weights", "inference"
    ],
    description: "Local model quantization, VRAM budgeting, and offline inference",
  },
  FRONTEND_STREAMING: {
    name: "Frontend & UI Streaming",
    keywords: [
      "react", "vite", "sse", "server-sent events", "websocket", "virtual dom",
      "dom", "ui", "component", "rendering", "state management", "redux",
      "zustand", "jsx", "tsx", "props", "hook", "hooks", "backpressure"
    ],
    description: "React client state management, UI rendering, and streaming responses",
  },
  STRUCTURED_DATA: {
    name: "Structured Data & Databases",
    keywords: [
      "sqlite", "postgres", "sql", "pandas", "dataframe", "csv", "chunking",
      "indexing", "b-tree", "schema", "wal mode", "orm", "sqlalchemy",
      "query plan", "parameterized", "sql injection", "normalization"
    ],
    description: "Relational database indexing, memory-bounded chunking, and SQL optimization",
  },
  VECTOR_RETRIEVAL: {
    name: "Vector Retrieval & Search",
    keywords: [
      "hnsw", "vector", "vectors", "embedding", "embeddings", "nearest neighbor",
      "knn", "approximate nearest", "efsearch", "cosine similarity", "recall",
      "pinecone", "qdrant", "milvus", "rerank", "cross-encoder", "bm25",
      "dense retrieval", "sparse", "rag", "retrieval augmented"
    ],
    description: "Vector embeddings, approximate nearest neighbor indexing, and semantic search",
  },
  DISTRIBUTED_SYSTEMS: {
    name: "Distributed Systems & Consensus",
    keywords: [
      "raft", "consensus", "leader election", "paxos", "replication",
      "distributed", "etcd", "zookeeper", "failover", "microservices",
      "partition", "split brain", "quorum", "two phase commit"
    ],
    description: "Distributed consensus, leader election, and high availability",
  },
  AGENTS_MCP: {
    name: "Agents & Model Context Protocol",
    keywords: [
      "mcp", "model context protocol", "langchain", "json-rpc", "agent",
      "agents", "tools", "react loop", "tool call", "supervisor",
      "sandbox", "prompt injection", "autonomous", "orchestration"
    ],
    description: "Autonomous agents, Tool execution, and Model Context Protocol (MCP)",
  },
  CACHING: {
    name: "Caching & State",
    keywords: [
      "redis", "memcached", "cache invalidation", "write-through", "stale read",
      "ttl", "cache stampede", "eviction", "lru"
    ],
    description: "Distributed caching, cache invalidation, and data consistency",
  },
};

function matchesKeyword(text: string, kw: string): boolean {
  const trimmed = kw.trim();
  if (trimmed.includes(" ") || trimmed.includes("-")) {
    return text.toLowerCase().includes(trimmed.toLowerCase());
  }
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "i");
  return regex.test(text);
}

/**
 * Detects domain matches in a given text snippet.
 */
function detectDomains(text: string): { domain: string; matchCount: number }[] {
  const results: { domain: string; matchCount: number }[] = [];

  for (const [key, def] of Object.entries(DOMAINS)) {
    let count = 0;
    for (const kw of def.keywords) {
      if (matchesKeyword(text, kw)) {
        count++;
      }
    }
    if (count > 0) {
      results.push({ domain: key, matchCount: count });
    }
  }

  return results.sort((a, b) => b.matchCount - a.matchCount);
}

/**
 * Deterministic, semantic relevance-first evaluator.
 * Evaluates candidate responses against question context and expected concepts.
 */
export function evaluateAnswerSemantics(
  questionText: string,
  answerText: string,
  topic: string
): EvaluationResult {
  const cleanAnswer = answerText.trim();
  const lowerAnswer = cleanAnswer.toLowerCase();
  const lowerQuestion = questionText.toLowerCase();

  // 1. Detect question domain and answer domain
  const qDomains = detectDomains(questionText);
  const aDomains = detectDomains(answerText);

  const primaryQuestionDomain = qDomains[0]?.domain;
  const primaryAnswerDomain = aDomains[0]?.domain;

  // Check for explicit misconceptions
  const hasAbiMisconception =
    lowerAnswer.includes("abi") &&
    (lowerAnswer.includes("encrypt") || lowerAnswer.includes("encryption") || lowerAnswer.includes("scramble"));

  const hasEmbeddingMisconception =
    lowerAnswer.includes("embedding") &&
    (lowerAnswer.includes("encrypt") || lowerAnswer.includes("smaller text format") || lowerAnswer.includes("just smaller text") || lowerAnswer.includes("hashing"));

  const hasHnswMisconception =
    lowerAnswer.includes("hnsw") &&
    (lowerAnswer.includes("100% exact") || lowerAnswer.includes("perfect nearest neighbor") || lowerAnswer.includes("never makes errors"));

  // Check for domain mismatch / irrelevance
  // If the question is about Python Packaging / C-extensions and the answer is ONLY about React / Frontend / DOM
  const isPythonVsReactMismatch =
    (lowerQuestion.includes("wheel") || lowerQuestion.includes("c-extension") || lowerQuestion.includes("abi") || lowerQuestion.includes("python") || lowerQuestion.includes("virtual environment")) &&
    (lowerAnswer.includes("react") || lowerAnswer.includes("virtual dom") || lowerAnswer.includes("ui rendering")) &&
    !lowerAnswer.includes("wheel") &&
    !lowerAnswer.includes("c-extension") &&
    !lowerAnswer.includes("compiler") &&
    !lowerAnswer.includes("python") &&
    !lowerAnswer.includes("glibc");

  // If the question is about Raft / Consensus and the answer is purely about Vector / RAG
  const isRaftVsRagMismatch =
    (lowerQuestion.includes("raft") || lowerQuestion.includes("consensus") || lowerQuestion.includes("leader election")) &&
    (lowerAnswer.includes("rag") || lowerAnswer.includes("embeddings") || lowerAnswer.includes("vector database")) &&
    !lowerAnswer.includes("raft") &&
    !lowerAnswer.includes("consensus") &&
    !lowerAnswer.includes("election") &&
    !lowerAnswer.includes("quorum");

  // Check if domains are entirely disjoint and candidate mentions zero concepts from the question or topic
  let isDomainDisjoint = false;
  const qDomainKeys = qDomains.map(d => d.domain);
  const aDomainKeys = aDomains.map(d => d.domain);
  const hasDomainIntersection = qDomainKeys.some(qd => aDomainKeys.includes(qd));

  // Detect domain of the active topic
  const topicDomains = detectDomains(topic).map(d => d.domain);
  const matchesTopicDomain = topicDomains.some(td => aDomainKeys.includes(td));

  if (!hasDomainIntersection && !matchesTopicDomain && (qDomainKeys.length > 0 || topicDomains.length > 0) && aDomainKeys.length > 0) {
    const allQKeywords = Array.from(
      new Set([
        ...qDomainKeys.flatMap(d => DOMAINS[d]?.keywords || []),
        ...topicDomains.flatMap(d => DOMAINS[d]?.keywords || [])
      ])
    );
    const hasAnyKwOverlap = allQKeywords.some(k => matchesKeyword(answerText, k));
    if (!hasAnyKwOverlap) {
      isDomainDisjoint = true;
    }
  }

  // =========================================================================
  // SCENARIO 1: IRRELEVANT ANSWER (Domain Mismatch or Keyword Spam)
  // =========================================================================
  if (isPythonVsReactMismatch || isRaftVsRagMismatch || (isDomainDisjoint && cleanAnswer.length > 20)) {
    const qTopicDesc = DOMAINS[primaryQuestionDomain]?.description || topic;
    const aTopicName = DOMAINS[primaryAnswerDomain]?.name || "an unrelated topic";

    return {
      score: 10,
      classification: "IRRELEVANT",
      relevance: 5,
      accuracy: 8,
      technicalDepth: 5,
      reasoning: 5,
      communication: 40,
      tradeoffAwareness: 5,
      correct: false,
      explanation: `The response discusses ${aTopicName} and does not address the question regarding ${qTopicDesc}.`,
      strengths: [],
      weaknesses: [
        "Response was completely unrelated to the technical question asked.",
        `Discussed ${aTopicName} instead of ${topic}.`
      ],
      conceptsMentioned: [aTopicName],
      misconceptions: [],
      missingConcepts: [topic, "Direct answer to prompt"],
      followUpNeeded: true,
      followUpReason: `Candidate gave an off-topic answer; redirect to core concept of ${topic}.`,
      recommendedDifficulty: "easy",
    };
  }

  // =========================================================================
  // SCENARIO 2: MISCONCEPTION DETECTED
  // =========================================================================
  if (hasAbiMisconception) {
    return {
      score: 22,
      classification: "MISCONCEPTION",
      relevance: 65,
      accuracy: 10,
      technicalDepth: 15,
      reasoning: 15,
      communication: 50,
      tradeoffAwareness: 10,
      correct: false,
      explanation: "The response fundamentally confuses ABI (Application Binary Interface) compatibility with data encryption.",
      strengths: ["Attempted to address the target topic"],
      weaknesses: ["Fundamental misconception of Application Binary Interface (ABI) specifications and symbol tables"],
      conceptsMentioned: ["ABI", "Encryption"],
      misconceptions: ["ABI compatibility assumed to be encryption rather than binary execution conventions"],
      missingConcepts: ["C runtime glibc versioning", "Compiler toolchain symbol exports", "Platform wheel tags"],
      followUpNeeded: true,
      followUpReason: "Misconception detected on ABI compatibility; trigger foundation repair.",
      recommendedDifficulty: "easy",
    };
  }

  if (hasEmbeddingMisconception) {
    return {
      score: 25,
      classification: "MISCONCEPTION",
      relevance: 70,
      accuracy: 15,
      technicalDepth: 20,
      reasoning: 20,
      communication: 50,
      tradeoffAwareness: 15,
      correct: false,
      explanation: "The candidate described vector embeddings as encrypted or compressed text rather than geometric semantic vector spaces.",
      strengths: ["Familiar with the term embeddings"],
      weaknesses: ["Misinterprets mathematical vector embeddings as cryptographic ciphertext or text compression"],
      conceptsMentioned: ["Embeddings"],
      misconceptions: ["Embeddings treated as text compression/encryption rather than continuous semantic vector representations"],
      missingConcepts: ["High-dimensional vector geometry", "Cosine similarity / dot product", "Semantic distance"],
      followUpNeeded: true,
      followUpReason: "Foundation repair required to clarify mathematical nature of embeddings.",
      recommendedDifficulty: "easy",
    };
  }

  if (hasHnswMisconception) {
    return {
      score: 40,
      classification: "MISCONCEPTION",
      relevance: 80,
      accuracy: 25,
      technicalDepth: 30,
      reasoning: 35,
      communication: 65,
      tradeoffAwareness: 25,
      correct: false,
      explanation: "The candidate assumed HNSW is an exact search algorithm rather than a probabilistic approximate nearest-neighbor graph with recall trade-offs.",
      strengths: ["Mentioned HNSW index"],
      weaknesses: ["Unaware that HNSW trades recall accuracy for sub-linear query latency"],
      conceptsMentioned: ["HNSW"],
      misconceptions: ["HNSW assumed to be an exact search algorithm rather than approximate nearest-neighbor graph"],
      missingConcepts: ["Recall vs Latency trade-off", "efSearch parameter tuning", "Graph exploration beam width"],
      followUpNeeded: true,
      followUpReason: "Foundation repair needed regarding approximate vs exact nearest neighbor search.",
      recommendedDifficulty: "easy",
    };
  }

  // =========================================================================
  // SCENARIO 3: INSUFFICIENT / TOO BRIEF
  // =========================================================================
  if (cleanAnswer.length < 35) {
    return {
      score: 38,
      classification: "INSUFFICIENT",
      relevance: 70,
      accuracy: 50,
      technicalDepth: 25,
      reasoning: 25,
      communication: 40,
      tradeoffAwareness: 20,
      correct: false,
      explanation: "The response was overly brief and failed to provide technical reasoning, architecture choices, or operational trade-offs.",
      strengths: ["Addressed the basic subject"],
      weaknesses: ["Response lacks technical substance, operational mechanisms, and trade-off considerations"],
      conceptsMentioned: [topic],
      misconceptions: [],
      missingConcepts: ["Architectural implementation details", "Operational trade-offs", "Failure handling"],
      followUpNeeded: true,
      followUpReason: "Candidate provided a short answer; probing required to establish reasoning depth.",
      recommendedDifficulty: "medium",
    };
  }

  // =========================================================================
  // SCENARIO 4: CORRECT VS PARTIALLY CORRECT
  // =========================================================================
  const mentionsTradeoffs =
    lowerAnswer.includes("trade-off") ||
    lowerAnswer.includes("tradeoff") ||
    lowerAnswer.includes("on one hand") ||
    lowerAnswer.includes("however") ||
    lowerAnswer.includes("whereas") ||
    lowerAnswer.includes("faster") ||
    lowerAnswer.includes("complexity") ||
    lowerAnswer.includes("fallback") ||
    lowerAnswer.includes("latency") ||
    lowerAnswer.includes("overhead");

  const mentionsSpecificMechanisms =
    lowerAnswer.includes("lockfile") ||
    lowerAnswer.includes("wheel") ||
    lowerAnswer.includes("artifact") ||
    lowerAnswer.includes("ci") ||
    lowerAnswer.includes("container") ||
    lowerAnswer.includes("compiler") ||
    lowerAnswer.includes("efsearch") ||
    lowerAnswer.includes("hnsw") ||
    lowerAnswer.includes("vram") ||
    lowerAnswer.includes("quantization") ||
    lowerAnswer.includes("sse") ||
    lowerAnswer.includes("event-loop") ||
    lowerAnswer.includes("chunking") ||
    lowerAnswer.includes("wal") ||
    lowerAnswer.includes("mcp") ||
    lowerAnswer.includes("invalidation");

  const isDetailed = cleanAnswer.length >= 100;

  if (isDetailed && mentionsTradeoffs && mentionsSpecificMechanisms) {
    // High-quality, comprehensive answer with trade-offs
    return {
      score: 88,
      classification: "CORRECT",
      relevance: 95,
      accuracy: 92,
      technicalDepth: 88,
      reasoning: 90,
      communication: 88,
      tradeoffAwareness: 90,
      correct: true,
      explanation: "Directly addressed the question with sound technical accuracy, concrete mechanisms, and balanced trade-off analysis.",
      strengths: [
        "Demonstrated clear architectural decomposition and trade-off awareness under production constraints.",
        "Articulated operational trade-offs between implementation speed and maintenance complexity."
      ],
      weaknesses: [],
      conceptsMentioned: [topic, ...aDomains.map(d => DOMAINS[d.domain].name)],
      misconceptions: [],
      missingConcepts: [],
      followUpNeeded: true,
      followUpReason: "Strong response; escalate to production scale, benchmarking, and failure recovery.",
      recommendedDifficulty: "hard",
    };
  }

  // Partially correct or shallow answer
  return {
    score: 64,
    classification: "PARTIALLY_CORRECT",
    relevance: 82,
    accuracy: 68,
    technicalDepth: 55,
    reasoning: 60,
    communication: 75,
    tradeoffAwareness: 50,
    correct: true,
    explanation: "The response addresses the main topic but is shallow on implementation mechanisms and edge-case trade-offs.",
    strengths: ["Provided a relevant baseline understanding of the core concept."],
    weaknesses: [
      "Could elaborate further on operational edge-case failure modes and scaling trade-offs.",
      "Lacks concrete architectural parameters or benchmarking criteria."
    ],
    conceptsMentioned: [topic],
    misconceptions: [],
    missingConcepts: ["Specific failure handling", "In-depth trade-off quantification"],
    followUpNeeded: true,
    followUpReason: "Standard response; probe specific trade-offs and edge cases.",
    recommendedDifficulty: "medium",
  };
}
