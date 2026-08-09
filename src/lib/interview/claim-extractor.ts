export interface ExtractedClaims {
  claims: string[];
  technologies: string[];
  tradeoffs: string[];
  misconceptions: string[];
  unresolvedPoints: string[];
}

/**
 * Extracts structured technical claims, technology choices, trade-offs, and potential misconceptions
 * from candidate answer text across engineering domains.
 */
export function extractCandidateClaims(
  answerText: string,
  topic: string,
  questionText?: string
): ExtractedClaims {
  const cleanAnswer = answerText.trim();
  const lowerAnswer = cleanAnswer.toLowerCase();

  const claims: string[] = [];
  const technologies: string[] = [];
  const tradeoffs: string[] = [];
  const misconceptions: string[] = [];
  const unresolvedPoints: string[] = [];

  // Technology entity detection map
  const techKeywords = [
    { key: "lockfile", label: "Lockfile / pinned dependencies" },
    { key: "wheel", label: "Platform-specific binary wheels" },
    { key: "arm64", label: "ARM64 architecture target" },
    { key: "build from source", label: "Source builds for native dependencies" },
    { key: "docker", label: "Docker container isolation" },
    { key: "ci", label: "CI/CD automated build matrix" },
    { key: "hnsw", label: "HNSW approximate nearest-neighbor index" },
    { key: "efsearch", label: "efSearch parameter tuning" },
    { key: "recall", label: "Recall vs latency evaluation" },
    { key: "vector database", label: "Vector database indexing" },
    { key: "chroma", label: "ChromaDB embedded storage" },
    { key: "pinecone", label: "Pinecone managed vector search" },
    { key: "redis", label: "Redis caching layer" },
    { key: "semantic cache", label: "Semantic cache with vector similarity" },
    { key: "fastapi", label: "FastAPI asynchronous backend" },
    { key: "react", label: "React client state management" },
    { key: "sse", label: "Server-Sent Events (SSE) streaming" },
    { key: "websocket", label: "WebSocket bi-directional communication" },
    { key: "sqlite", label: "SQLite relational storage" },
    { key: "wal mode", label: "SQLite Write-Ahead Logging (WAL)" },
    { key: "pandas", label: "Pandas chunked data ingestion" },
    { key: "pydantic", label: "Pydantic schema validation" },
    { key: "langchain", label: "LangChain ReAct agent loop" },
    { key: "langgraph", label: "LangGraph multi-agent orchestration" },
    { key: "mcp", label: "Model Context Protocol (MCP) server" },
    { key: "lora", label: "LoRA parameter-efficient fine-tuning" },
    { key: "qlora", label: "QLoRA 4-bit quantized fine-tuning" },
    { key: "vllm", label: "vLLM continuous batching & PagedAttention" },
    { key: "kubernetes", label: "Kubernetes pod orchestration" },
    { key: "guardrail", label: "Input/Output guardrails" },
    { key: "prompt injection", label: "Prompt injection defense" },
  ];

  for (const item of techKeywords) {
    if (lowerAnswer.includes(item.key)) {
      technologies.push(item.label);
    }
  }

  // Sentence / clause decomposition for atomic claims
  const sentences = cleanAnswer.split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.length > 10);
  for (const s of sentences) {
    const sLower = s.toLowerCase();
    if (
      sLower.includes("i would") ||
      sLower.includes("i'd") ||
      sLower.includes("use") ||
      sLower.includes("using") ||
      sLower.includes("because") ||
      sLower.includes("to ensure") ||
      sLower.includes("implement") ||
      sLower.includes("configure") ||
      sLower.includes("rely on")
    ) {
      claims.push(s);
    }
  }

  // Trade-off detection
  if (
    lowerAnswer.includes("trade-off") ||
    lowerAnswer.includes("tradeoff") ||
    lowerAnswer.includes("instead of") ||
    lowerAnswer.includes("versus") ||
    lowerAnswer.includes("balance") ||
    (lowerAnswer.includes("latency") && lowerAnswer.includes("recall")) ||
    (lowerAnswer.includes("memory") && lowerAnswer.includes("performance")) ||
    (lowerAnswer.includes("cost") && lowerAnswer.includes("accuracy"))
  ) {
    if (lowerAnswer.includes("latency") && lowerAnswer.includes("recall")) {
      tradeoffs.push("Latency vs Recall trade-off under HNSW indexing");
    } else if (lowerAnswer.includes("memory") || lowerAnswer.includes("overhead")) {
      tradeoffs.push("Memory overhead vs computation speed trade-off");
    } else {
      tradeoffs.push("Architectural choice trade-off identified in response");
    }
  }

  // Common Misconceptions detection
  if (
    lowerAnswer.includes("embedding") &&
    (lowerAnswer.includes("encrypt") || lowerAnswer.includes("compressed text format") || lowerAnswer.includes("just smaller text"))
  ) {
    misconceptions.push("Embeddings treated as simple text encryption/compression rather than high-dimensional semantic representations");
  }

  if (
    lowerAnswer.includes("hnsw") &&
    (lowerAnswer.includes("100% exact") || lowerAnswer.includes("perfect nearest neighbor") || lowerAnswer.includes("never makes errors"))
  ) {
    misconceptions.push("HNSW assumed to provide exact nearest neighbor search without recall trade-off");
  }

  if (
    lowerAnswer.includes("sqlite") &&
    (lowerAnswer.includes("distributed multi-region") || lowerAnswer.includes("unlimited concurrent writers"))
  ) {
    misconceptions.push("SQLite assumed to support concurrent distributed writes");
  }

  // Identify unresolved technical points
  if (technologies.length > 0) {
    if (lowerAnswer.includes("lockfile") && !lowerAnswer.includes("arm64") && !lowerAnswer.includes("c-extension")) {
      unresolvedPoints.push("Did not specify cross-platform binary wheel fallback for missing host architectures");
    }
    if (lowerAnswer.includes("hnsw") && !lowerAnswer.includes("efsearch") && !lowerAnswer.includes("recall")) {
      unresolvedPoints.push("Did not specify index tuning parameters (efSearch / M) or recall validation");
    }
    if (lowerAnswer.includes("redis") && !lowerAnswer.includes("invalidation") && !lowerAnswer.includes("ttl")) {
      unresolvedPoints.push("Did not explain cache invalidation or consistency guarantee");
    }
    if (lowerAnswer.includes("mcp") && !lowerAnswer.includes("timeout") && !lowerAnswer.includes("permission")) {
      unresolvedPoints.push("Did not address MCP tool failure handling or permission boundary enforcement");
    }
  }

  return {
    claims: claims.slice(0, 5),
    technologies: Array.from(new Set(technologies)),
    tradeoffs,
    misconceptions,
    unresolvedPoints,
  };
}
