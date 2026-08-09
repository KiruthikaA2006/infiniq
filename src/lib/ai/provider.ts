import { ZodSchema } from "zod";
import { generateGeminiCompletion } from "./gemini";
import { evaluateAnswerSemantics } from "../interview/semantic-evaluator";

export interface AIProviderStatus {
  provider: "llm" | "mock";
  providerType?: "openai" | "gemini";
  modelName: string;
}

// Check if OpenAI or Gemini key is configured
export function getProviderStatus(): AIProviderStatus {
  const hasOpenAiKey = !!process.env.OPENAI_API_KEY;
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  const providerEnv = process.env.AI_PROVIDER;

  if (providerEnv === "mock") {
    return { provider: "mock", modelName: "deterministic-simulation" };
  }

  if (providerEnv === "gemini" && hasGeminiKey) {
    return { provider: "llm", providerType: "gemini", modelName: process.env.GEMINI_MODEL || "gemini-2.5-flash" };
  }

  if (providerEnv === "openai" && hasOpenAiKey) {
    return { provider: "llm", providerType: "openai", modelName: "gpt-4o-mini" };
  }

  if (hasGeminiKey) {
    return { provider: "llm", providerType: "gemini", modelName: process.env.GEMINI_MODEL || "gemini-2.5-flash" };
  }

  if (hasOpenAiKey) {
    return { provider: "llm", providerType: "openai", modelName: "gpt-4o-mini" };
  }

  return { provider: "mock", modelName: "deterministic-simulation" };
}

/**
 * Sends a chat completion query to OpenAI/Gemini or routes to the local mock simulator.
 */
export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  zodSchema?: ZodSchema
): Promise<string> {
  const status = getProviderStatus();

  if (status.provider === "llm") {
    try {
      if (status.providerType === "gemini") {
        return await generateGeminiCompletion(systemPrompt, userPrompt, zodSchema);
      } else {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: status.modelName,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: zodSchema ? { type: "json_object" } : undefined,
            temperature: 0.2,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenAI request failed: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("Empty response from OpenAI chat completions");
        }
        return content;
      }
    } catch (error) {
      console.warn(`${status.providerType || "LLM"} Provider failed, triggering fallback simulator:`, error);
      // Fall through to deterministic simulation
    }
  }

  // Fallback Deterministic Simulator
  return simulateCompletion(systemPrompt, userPrompt);
}

// =========================================================================
// 31-DAY TECHNICAL CURRICULUM QUESTION BANK
// =========================================================================
export interface TopicQuestions {
  standard: string[];
  followup: string[];
  final: string[];
}

export const CURRICULUM_QUESTION_POOLS: Record<string, TopicQuestions> = {
  // Day 1
  "VS Code & Python Environment Setup": {
    standard: [
      "In designing a multi-developer enterprise repository, how do you enforce reproducible Python virtual environments and isolate C-extension dependencies across differing host OS architectures?",
      "When configuring Pylance and strict static type checking in VS Code for large-scale systems, what performance and type-resolution trade-offs arise when working with dynamically generated ORM models?",
      "How would you architect a pre-commit verification workflow that validates virtual environment dependencies and lockfiles before code reaches continuous integration?",
      "What operational failure modes occur when binary wheels compiled in a local development environment differ from the glibc version in the target production container?"
    ],
    followup: [
      "You discussed lockfiles and platform-specific wheels. What specific ABI compatibility issues or compiler toolchain mismatches can arise when building C-extensions across heterogeneous architectures, and how do you ensure deterministic binary artifacts?",
      "Regarding your dependency isolation choices, what strategy would you use to prevent dependency drift across microservices sharing common utility packages?",
      "How would you benchmark the developer productivity trade-offs between local virtual environments and remote container-based development environments?"
    ],
    final: [
      "From an infrastructure governance standpoint for Python tooling, how would you architect automated vulnerability scanning and license compliance checks for third-party packages in production?",
      "What key operational metrics and environment diagnostics would you establish to maintain reproducible developer environments across distributed engineering teams?"
    ]
  },

  // Day 2
  "Local LLM & AI Coding Assistant Setup": {
    standard: [
      "When deploying local coding models using Ollama and quantized weights (e.g. Qwen2.5-Coder GGUF), how do you calculate GPU VRAM allocation budgets for KV-cache retention under high concurrency?",
      "How would you architect an offline AI coding assistant integration in VS Code that routes between local quantized inference and cloud endpoints based on latency and privacy policies?",
      "What architectural trade-offs exist between 4-bit AWQ and 8-bit GGUF quantization formats when hosting local models for syntax completion?",
      "How would you mitigate context window degradation and attention truncation when local models ingest large multi-file codebase contexts?"
    ],
    followup: [
      "You discussed local model inference and quantization. How would you handle GPU memory fragmentation when multiple concurrent worker threads request streaming token generation?",
      "Regarding quantization degradation, what automated benchmark would you implement to detect logic regressions in generated code compared to unquantized base weights?",
      "How would you optimize time-to-first-token (TTFT) when running local inference on resource-constrained edge machines?"
    ],
    final: [
      "In deploying enterprise-wide local AI assistant infrastructure, what telemetry and latency SLIs would you establish to monitor offline model performance and hardware health?",
      "How would you balance the security advantages of air-gapped local model inference against the operational complexity of distributed hardware management?"
    ]
  },

  // Day 3
  "First AI Project, React Frontend & GitHub": {
    standard: [
      "In architecting a full-stack AI application with FastAPI and a React/Vite frontend, how would you design the communication layer to handle long-lived streaming responses without blocking the ASGI event loop?",
      "How do you manage client-side state transitions in React when user queries trigger concurrent asynchronous LLM invocations with unpredictable response latencies?",
      "What architectural pattern would you implement to handle backpressure and client disconnects during active server-sent event (SSE) streaming sessions?",
      "How would you structure the Git branch and CI/CD deployment pipeline to automate frontend bundle optimization alongside backend API contract testing?"
    ],
    followup: [
      "You highlighted the interface between FastAPI and React. How would you handle connection timeouts and partial stream reconstruction if the network drops mid-generation?",
      "Regarding your client state management, how do you prevent race conditions when rapid user input interrupts an active generation stream?",
      "How would you enforce strict TypeScript API contracts between the FastAPI OpenAPI schema and Vite frontend components?"
    ],
    final: [
      "In deploying a production full-stack AI interface, what Service Level Objectives (SLOs) would you define for end-to-end user latency and error recovery?",
      "How would you architect automated end-to-end integration tests that validate streaming UI components against live backend endpoints in CI?"
    ]
  },

  // Day 4
  "Reading & Processing Structured Data": {
    standard: [
      "When ingesting multi-gigabyte healthcare claims CSVs into SQLite using Pandas, how would you design a memory-bounded chunking pipeline that maintains transaction integrity?",
      "How would you design a relational schema and composite indexing strategy in SQLite to optimize sub-millisecond lookup latency for high-cardinality healthcare plan codes?",
      "What trade-offs exist between raw SQL parameterized queries and SQLAlchemy ORM overhead in high-throughput query routing engines?",
      "How do you ensure data sanitization and prevent SQL injection when dynamically routing natural language queries to structured database filters?"
    ],
    followup: [
      "You referenced SQLite indexing and chunking strategies. How would you handle write contention and database lock timeouts when multiple ingestion workers write concurrently in WAL mode?",
      "Regarding your data normalization approach, how would you reconcile schema discrepancies between legacy claim exports and new plan structures?",
      "How would you measure query execution plans using EXPLAIN QUERY PLAN to identify full-table scans in high-frequency queries?"
    ],
    final: [
      "In an enterprise data architecture, what monitoring and auditing mechanisms would you establish to track data provenance and query latency for sensitive records?",
      "How would you design an automated failover and replication strategy for structured datasets in production environments?"
    ]
  },

  // Day 5
  "Reading & Processing Unstructured Data": {
    standard: [
      "When extracting text from complex multi-column healthcare benefit PDFs containing scanned enrollment forms, how do you coordinate pdfplumber and Tesseract OCR to minimize memory overhead?",
      "How would you architect an unstructured ingestion pipeline that normalizes diverse document sources (DOCX, HTML, scanned PDFs) into a consistent semantic schema?",
      "What strategy do you use to detect OCR extraction artifacts and character recognition errors that could distort downstream vector embeddings?",
      "How do you manage rate limits, session recycling, and DOM volatility when scraping public regulatory healthcare portals using BeautifulSoup and Requests?"
    ],
    followup: [
      "You mentioned OCR text extraction. How would you configure image pre-processing (binarization, deskewing) to improve OCR precision on noisy scanned documents?",
      "Regarding unstructured text normalization, how do you handle tabular data embedded within PDF pages to ensure spatial relationships are preserved?",
      "How would you design a distributed worker queue to process thousands of PDF documents concurrently without exhausting server CPU resources?"
    ],
    final: [
      "What quality assurance pipelines and automated validation metrics would you implement to detect corrupted or incomplete document extractions before knowledge base indexing?",
      "How would you design long-term storage and versioning for raw unstructured documents alongside their parsed representations?"
    ]
  },

  // Day 6
  "Building the Knowledge Base": {
    standard: [
      "In designing document chunking strategies for healthcare policy documents, how do you decide between fixed-size character splitters and semantic boundary-aware text splitters?",
      "How do you structure JSONL metadata schemas (e.g. plan IDs, effective dates, section hierarchies) to enable precise filtering without degrading retrieval performance?",
      "What chunk overlap percentage and boundary detection rules would you configure to ensure contextual continuity across complex policy provisions?",
      "How would you build an automated validation suite to detect semantic fragmentation or orphan clauses in chunked knowledge base records?"
    ],
    followup: [
      "You discussed chunking boundaries. How do you prevent critical exception clauses from being severed from their governing policy rules during chunking?",
      "Regarding metadata enrichment, how do you trade off the storage overhead of dense metadata tags against the latency benefit during retrieval filtering?",
      "How would you handle document updates and differential re-indexing when only a subset of policy sections change?"
    ],
    final: [
      "How would you architect a scalable knowledge base registry that supports continuous ingestion, multi-tenant partitioning, and zero-downtime re-indexing?",
      "What operational metrics would you track to monitor knowledge base drift and chunk quality over time?"
    ]
  },

  // Day 7
  "Embeddings Explained": {
    standard: [
      "When converting healthcare knowledge chunks into dense vectors, what mathematical and domain considerations guide your choice between general-purpose sentence transformers and domain-adapted models?",
      "How do dimensionality reduction techniques like PCA or t-SNE help diagnose embedding collapse or cluster overlap in dense vector spaces?",
      "What are the latency, memory, and semantic precision trade-offs between 384-dimensional small embeddings and 1536-dimensional large embeddings?",
      "How do cosine similarity, dot product, and Euclidean distance differ in vector retrieval behavior when embeddings are not normalized to unit length?"
    ],
    followup: [
      "You mentioned embedding vector dimensions. How would you detect when two semantically opposite healthcare terms map to similar vector neighborhoods due to shared lexical context?",
      "Regarding vector normalization, how does batch normalization impact inference latency when encoding thousands of query vectors concurrently?",
      "How would you implement semantic cluster evaluation to verify that distinct healthcare plan tiers form separable clusters in embedding space?"
    ],
    final: [
      "In a high-throughput production retrieval engine, how would you design embedding model versioning and backward compatibility when upgrading model weights?",
      "What hardware acceleration strategies (e.g. ONNX runtime, TensorRT) would you implement to keep embedding generation latency under 10ms per query?"
    ]
  },

  // Day 8
  "Vector Databases Overview": {
    standard: [
      "In selecting a vector storage architecture for enterprise retrieval, what operational trade-offs dictate choosing an embedded database (like ChromaDB) versus a managed cloud solution (like Pinecone)?",
      "How do HNSW graph index parameters (e.g. M, efConstruction, efSearch) impact the balance between index build time, memory consumption, and query recall?",
      "How does metadata filtering before vector search (pre-filtering) compare to post-filtering in terms of query latency and recall accuracy?",
      "What backup, snapshotting, and disaster recovery strategies would you implement for an in-memory vector index storing millions of high-dimensional vectors?"
    ],
    followup: [
      "You chose HNSW primarily for low latency. What recall trade-offs are you accepting when tuning efSearch, and how would you determine whether that trade-off is acceptable for your production workload?",
      "Regarding metadata filtering, how do you prevent catastrophic recall drop when strict metadata filters eliminate top vector candidates?",
      "How would you shard a vector database across multiple nodes when index size exceeds available single-node RAM?"
    ],
    final: [
      "What Service Level Indicators (SLIs) for query latency (p95/p99) and recall accuracy would you establish for enterprise vector database infrastructure?",
      "How would you design a multi-region vector database deployment to ensure high availability and sub-50ms global query latency?"
    ]
  },

  // Day 9
  "Building & Populating the Vector Database": {
    standard: [
      "When indexing hundreds of thousands of document chunks into a vector database, how do you architect a batching and rate-limiting pipeline to maximize insertion throughput without OOM errors?",
      "How do you ensure idempotency and atomic updates during vector indexing to prevent duplicate records or orphaned vectors during pipeline failures?",
      "What verification mechanisms would you use to validate that all indexed vectors accurately reflect their source document chunks and metadata attributes?",
      "How would you implement an automated regression test that evaluates retrieval accuracy against a curated benchmark set immediately after database population?"
    ],
    followup: [
      "You outlined the vector indexing workflow. How do you handle vector ID collisions and document versioning during continuous pipeline updates?",
      "Regarding insertion batching, what dynamic backpressure mechanism would you implement if the vector database begins returning throttling responses?",
      "How would you benchmark retrieval recall differences across various vector distance metrics on your populated database?"
    ],
    final: [
      "In maintaining a live production vector database, how would you design automated data integrity audits to detect stale or corrupted embeddings?",
      "What strategy would you use to perform a full re-indexing of millions of vectors with zero downtime for active user queries?"
    ]
  },

  // Day 10
  "The Retrieval & Matching Engine": {
    standard: [
      "In building a healthcare retrieval engine, how do you design a query router that dynamically chooses between relational SQL lookups, dense semantic vector search, or a hybrid combination?",
      "How does Reciprocal Rank Fusion (RRF) combine disparate score distributions from keyword search (BM25) and dense embeddings without requiring manual score normalization?",
      "What latency budget would you allocate for Cross-Encoder reranking, and how do you trade off reranker precision against end-to-end query response time?",
      "How would you detect and filter out low-confidence retrieval results to prevent serving irrelevant context to the downstream LLM generator?"
    ],
    followup: [
      "You highlighted hybrid retrieval and scoring. What failure modes occur when the keyword search and vector search return conflicting candidate sets?",
      "Regarding reranker optimization, how would you configure candidate pool size (top-k) to balance GPU compute constraints with retrieval recall?",
      "How would you evaluate retrieval precision and recall under real-world queries containing domain-specific medical acronyms?"
    ],
    final: [
      "What production monitoring metrics (e.g. Mean Reciprocal Rank, NDCG@k) would you track in real-time to detect retrieval quality regressions?",
      "How would you architect a distributed caching layer that caches both raw retrieval candidates and fused reranked results for high-frequency queries?"
    ]
  },

  // Day 11
  "RAG End-to-End & LLM API Basics": {
    standard: [
      "In architecting an end-to-end RAG pipeline, how do you construct grounded system prompts that strictly constrain LLM generation to retrieved context while preventing hallucination?",
      "How do you design fallback handling when retrieved context is empty, conflicting, or fails relevance thresholds?",
      "What strategies do you use to manage LLM API rate limits, connection pooling, and token count budgets across concurrent client sessions?",
      "How would you benchmark the response accuracy of your RAG pipeline against a retrieval-only baseline using standardized evaluation metrics?"
    ],
    followup: [
      "You discussed prompt grounding. How do you prevent the LLM from relying on parametric memory when the retrieved context explicitly contradicts its pre-training data?",
      "Regarding API connection resilience, how would you implement exponential backoff with jitter to handle intermittent 429 and 503 provider errors?",
      "How would you measure context utilization efficiency to determine whether the LLM is attending to all provided retrieval chunks?"
    ],
    final: [
      "In deploying enterprise RAG systems, what guardrails and verification layers would you place between the LLM output and the end user?",
      "How would you design a continuous evaluation pipeline that logs and analyzes production prompt-response pairs for hallucination detection?"
    ]
  },

  // Day 12
  "Prompt Engineering Fundamentals": {
    standard: [
      "When designing system prompts for regulated domain applications, how do you structure zero-shot, few-shot, and chain-of-thought instructions to ensure strict compliance?",
      "How do you evaluate and quantify the trade-offs between prompt verbosity, token consumption costs, and instruction-following fidelity?",
      "What prompt engineering techniques effectively mitigate jailbreak attempts, prompt injection, and unauthorized system prompt extraction?",
      "How would you build an automated prompt evaluation harness that tests prompt variations against a fixed golden dataset to measure precision and tone consistency?"
    ],
    followup: [
      "You mentioned few-shot prompting techniques. How do you curate and dynamically select few-shot examples that match the user's specific query intent?",
      "Regarding chain-of-thought reasoning, how do you prevent the model from exposing internal reasoning traces in user-facing production responses?",
      "How do you handle prompt drift when the underlying LLM provider updates their model checkpoint weights?"
    ],
    final: [
      "What automated regression testing framework would you establish in CI/CD to validate that system prompt updates do not degrade critical domain compliance?",
      "How would you optimize prompt token efficiency to reduce inference latency and API costs across millions of monthly requests?"
    ]
  },

  // Day 13
  "Advanced Prompting: Function Calling & Structured Outputs": {
    standard: [
      "When defining JSON Schema tools for LLM function calling, how do you design tool definitions to minimize ambiguity and ensure deterministic parameter extraction?",
      "How do you handle validation failures when LLM-generated JSON arguments fail Pydantic model validation in an automated execution loop?",
      "What security safeguards do you implement before executing model-invoked functions that interact with backend databases or external APIs?",
      "How do you manage multi-step function calling loops where the output of one tool call determines the arguments for subsequent tool invocations?"
    ],
    followup: [
      "You discussed tool execution and validation. How would you design error recovery when a tool call returns an exception or invalid schema to the model?",
      "Regarding structured output guarantees, what are the latency implications of constrained decoding schemas compared to post-hoc JSON parsing?",
      "How do you prevent the LLM from getting trapped in infinite tool invocation loops during complex query resolution?"
    ],
    final: [
      "In an enterprise tool execution platform, what audit logging and permission boundaries would you implement for all model-triggered actions?",
      "How would you benchmark tool selection accuracy and parameter extraction precision across diverse user inputs in staging?"
    ]
  },

  // Day 21
  "Agentic Frameworks: LangChain Agents & Tool Use": {
    standard: [
      "In building a ReAct reasoning agent with LangChain, how do you structure the Thought-Action-Observation loop to ensure reliable tool selection and prevent runaway execution loops?",
      "How do you wrap existing domain APIs and database queries into standardized LangChain tools with clean descriptions and input validation schemas?",
      "What mechanisms do you implement to detect when an agent is hallucinating tool arguments or attempting to invoke non-existent tools?",
      "How do you analyze agent execution traces to diagnose decision-making bottlenecks and optimize tool invocation order?"
    ],
    followup: [
      "You discussed ReAct loop orchestration. How would you handle execution timeouts and partial failures when an external tool called by the agent fails to respond?",
      "Regarding tool description engineering, how do you prevent agent confusion when two tools have overlapping functional capabilities?",
      "How do you set hard execution step limits and cost ceilings to prevent runaway agent execution loops?"
    ],
    final: [
      "What evaluation harness would you build to measure agent task completion rate, tool selection accuracy, and reasoning efficiency across a benchmark test suite?",
      "How would you architect secure, sandboxed execution environments for tools that execute dynamic scripts or database modifications?"
    ]
  },

  // Day 23
  "Model Context Protocol (MCP)": {
    standard: [
      "In architecting an enterprise tool ecosystem using the Model Context Protocol (MCP), how does the MCP JSON-RPC protocol differ from traditional REST APIs in managing tool lifecycle and capabilities?",
      "How do you design an MCP server that securely exposes database queries, document retrieval, and external APIs to MCP-compatible client runners (e.g. Claude Desktop, Cline)?",
      "What security boundaries, input validation, and permission checks are necessary to prevent prompt injection attacks from manipulating MCP tool parameters?",
      "How do you manage connection transports (stdio vs SSE/WebSockets) and connection pooling when scaling MCP servers across multiple client instances?"
    ],
    followup: [
      "You highlighted MCP protocol capabilities. How would you handle stateful session management when multiple client agents connect to a single MCP server concurrently?",
      "Regarding tool permissioning, how do you enforce granular read/write authorization for specific tools exposed through the MCP protocol?",
      "How do you test and validate MCP server tool implementations using automated mock clients in CI?"
    ],
    final: [
      "What production SLIs would you establish to monitor MCP server response times, tool invocation error rates, and connection stability?",
      "How would you design a centralized MCP gateway that routes tool requests across distributed microservice MCP servers with load balancing?"
    ]
  },

  // Day 26
  "Performance Optimization & Cost Management": {
    standard: [
      "In hosting LLMs and RAG pipelines at scale, how do continuous batching (vLLM) and PagedAttention optimize GPU VRAM utilization and token generation throughput?",
      "How would you design a multi-tiered semantic caching layer using Redis and vector embeddings to achieve sub-50ms responses for repeated or semantically similar queries?",
      "What similarity distance threshold and cache invalidation policies prevent serving stale or contextually inaccurate responses from a semantic cache?",
      "How do you analyze token usage profiles across prompt templates, retrieved chunks, and generation lengths to optimize cost-per-query budgets?"
    ],
    followup: [
      "You highlighted semantic caching and continuous batching. How does KV-cache memory allocation limit the maximum concurrent request capacity of a model serving container?",
      "Regarding semantic cache invalidation, how do you handle cache purges when underlying knowledge base documents are updated?",
      "How do you benchmark the trade-offs between speculative decoding, model quantization, and model size when optimizing for Time to First Token (TTFT)?"
    ],
    final: [
      "What cost allocation and usage telemetry would you implement to track token expenditures by department or user tier in a multi-tenant platform?",
      "How would you architect auto-scaling policies based on request queue depth and GPU memory pressure to minimize idle cloud infrastructure costs?"
    ]
  },

  // Day 27
  "Security, Privacy & Guardrails": {
    standard: [
      "In securing an enterprise conversational AI system, how do you architect input sanitization and guardrail layers to defend against direct and indirect prompt injection attacks?",
      "How do you implement automated Personally Identifiable Information (PII) and Protected Health Information (PHI) redaction throughout the ingestion, logging, and response pipelines?",
      "What authentication, authorization, and role-based access control (RBAC) patterns do you enforce on API endpoints and underlying database tools?",
      "How do you design output guardrails that detect and intercept unsafe, hallucinated, or policy-violating content before it reaches the client UI?"
    ],
    followup: [
      "You discussed prompt injection defenses and guardrails. How do you ensure that input safety guardrail checks do not introduce unacceptable latency overhead (e.g. >100ms)?",
      "Regarding PII redaction, how do you handle anonymization without stripping critical technical or medical context needed for accurate response generation?",
      "How would you conduct red-teaming exercises and automated adversarial penetration testing on the AI platform?"
    ],
    final: [
      "What compliance audits and encryption standards (in-transit and at-rest) are mandatory for healthcare data processing under HIPAA/SOC2?",
      "How would you design an immutable security audit log that records all security violations, guardrail triggers, and access attempts?"
    ]
  },

  // Day 28
  "Docker & Kubernetes Deployment": {
    standard: [
      "In containerizing a full-stack AI platform (FastAPI backend, React frontend, vector DB), how do you design multi-stage Docker builds to minimize final image sizes and attack surfaces?",
      "How do you architect Kubernetes Horizontal Pod Autoscaling (HPA) based on GPU utilization and request queue depth rather than standard CPU metrics?",
      "What persistent volume and storage class configurations ensure high IOPS and data safety for vector database stateful sets?",
      "How do you structure rolling deployments and zero-downtime canary releases for AI microservices in Kubernetes?"
    ],
    followup: [
      "You discussed Kubernetes pod autoscaling. How do you handle cold-start latency when scaling up new GPU worker pods to absorb traffic spikes?",
      "Regarding container security, what non-root user permissions and read-only root filesystem configurations do you enforce in production Dockerfiles?",
      "How do you manage secret rotation and environment variable injection for sensitive API keys across Kubernetes namespaces?"
    ],
    final: [
      "What disaster recovery SLIs and automated cluster failover mechanisms would you establish for enterprise AI services deployed across multi-cloud regions?",
      "How would you architect a production-grade service mesh (e.g. Istio) to manage mutual TLS, rate limiting, and traffic splitting across AI microservices?"
    ]
  }
};

/**
 * Deterministic Fallback Simulator adhering strictly to the Adaptive Interviewing Policy.
 */
export function simulateCompletion(systemPrompt: string, userPrompt: string): string {
  // 1. Check if this is an Answer Evaluation Request
  if (
    systemPrompt.includes("EvaluationResult") ||
    userPrompt.includes("CURRENT QUESTION:") ||
    userPrompt.includes("Candidate's Response:") ||
    userPrompt.includes("CANDIDATE ANSWER:") ||
    userPrompt.includes("Evaluate")
  ) {
    let evaluationTopic = "The Retrieval & Matching Engine";
    const tMatch =
      userPrompt.match(/TOPIC:\s*[\r\n]+"([\s\S]*?)"[\r\n]+CANDIDATE ANSWER:/i) ||
      userPrompt.match(/TOPIC:\s*"([\s\S]*?)"/i) ||
      systemPrompt.match(/topic\s*"([^"]+)"/i);
    if (tMatch) {
      evaluationTopic = tMatch[1].trim();
    }

    let questionText = "";
    const qMatch =
      userPrompt.match(/CURRENT QUESTION:\s*[\r\n]+"([\s\S]*?)"[\r\n]+TOPIC:/i) ||
      userPrompt.match(/CURRENT QUESTION:\s*"([\s\S]*?)"/i) ||
      userPrompt.match(/Question Asked:\s*"([\s\S]*?)"/i);
    if (qMatch) {
      questionText = qMatch[1].trim();
    }

    let answer = userPrompt;
    const aMatch =
      userPrompt.match(/CANDIDATE ANSWER:\s*[\r\n]+"([\s\S]*?)"/i) ||
      userPrompt.match(/CANDIDATE ANSWER:\s*"([\s\S]*?)"/i) ||
      userPrompt.match(/Candidate's Response:\s*([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i) ||
      userPrompt.match(/Candidate Answer:\s*([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i);
    if (aMatch) {
      answer = aMatch[1].trim();
    }

    const evaluation = evaluateAnswerSemantics(questionText, answer, evaluationTopic);
    return JSON.stringify(evaluation);
  }

  // 2. Check if this is a Question Generation Request
  if (
    userPrompt.includes("Generate next question") ||
    userPrompt.includes("curriculum") ||
    systemPrompt.includes("interviewer")
  ) {
    const cleanPrompt = userPrompt.toLowerCase();
    const isFollowUp = cleanPrompt.includes("follow-up") || cleanPrompt.includes("probe");
    const isFinal = cleanPrompt.includes("final") || cleanPrompt.includes("question number: 8");

    // Extract target topic
    let topicName = "The Retrieval & Matching Engine";
    const topicMatch = userPrompt.match(/for topic:\s*"([^"]+)"/i) || userPrompt.match(/topic:\s*"([^"]+)"/i);
    if (topicMatch) {
      topicName = topicMatch[1];
    }

    // Extract probe type
    let probeType = "CLAIM_PROBE";
    const probeMatch = userPrompt.match(/Probe Type:\s*([A-Z_]+)/i);
    if (probeMatch) {
      probeType = probeMatch[1];
    }

    // Extract transition context bridge
    let transitionContext = "";
    const transMatch = userPrompt.match(/Transition Context:\s*"([^"]+)"/i);
    if (transMatch) {
      transitionContext = transMatch[1];
    }

    // Extract previous candidate answer
    let previousAnswer = "";
    const prevAnswerMatch =
      userPrompt.match(/(?:Candidate's Exact Response|Candidate Answer|Candidate Response):\s*"([^"]+)"/i) ||
      userPrompt.match(/(?:Candidate's Exact Response|Candidate Answer|Candidate Response):\s*([^\n]+)/i);
    if (prevAnswerMatch) {
      previousAnswer = prevAnswerMatch[1].trim();
    }
    const cleanPrev = previousAnswer.toLowerCase();

    // =========================================================================
    // CLAIM-SPECIFIC DYNAMIC FOLLOW-UPS (Adaptive Interviewer Reasoning)
    // =========================================================================

    // SCENARIO 1: Python Environment, Lockfiles, Wheels, ARM64, Docker
    if (
      cleanPrev.includes("lockfile") ||
      cleanPrev.includes("wheel") ||
      cleanPrev.includes("arm64") ||
      cleanPrev.includes("c-extension") ||
      cleanPrev.includes("virtual environment")
    ) {
      if (probeType === "TRADEOFF_PROBE") {
        return "What are the engineering trade-offs between distributing pre-compiled multi-arch wheels versus building from source inside containerized CI runners, and when would you reverse that decision?";
      }
      if (probeType === "SCALE_PROBE") {
        return "How would your dependency isolation and lockfile strategy scale when managing developer environments across 100+ microservices sharing native C-bindings?";
      }
      if (probeType === "FAILURE_PROBE" || probeType === "IMPLEMENTATION_PROBE") {
        return "You chose platform-specific wheels and source builds in CI for ARM64 dependencies. What specific ABI compatibility issues or compiler toolchain mismatches can arise when building C-extensions across heterogeneous host architectures, and how do you ensure deterministic binary artifacts?";
      }
      return "You mentioned relying on lockfiles and platform wheels. What specific mechanism ensures that C-extension builds remain reproducible when host glibc or compiler toolchain versions differ?";
    }

    // SCENARIO 2: Vector Search, HNSW, efSearch, Recall, Latency
    if (
      cleanPrev.includes("hnsw") ||
      cleanPrev.includes("efsearch") ||
      cleanPrev.includes("vector database") ||
      cleanPrev.includes("approximate nearest")
    ) {
      if (probeType === "TRADEOFF_PROBE") {
        return "You chose HNSW primarily for latency. What recall trade-offs are you accepting, and how would you determine whether that trade-off is acceptable for your production workload?";
      }
      if (probeType === "SCALE_PROBE") {
        return "How would your indexing strategy change when the corpus grows from millions to hundreds of millions of vectors exceeding single-node RAM?";
      }
      if (probeType === "FAILURE_PROBE") {
        return "How do you detect and recover from index fragmentation when frequent insert and delete operations degrade HNSW graph recall?";
      }
      return "You mentioned tuning efSearch based on recall and latency. How would you design that benchmark so the result represents production traffic rather than an artificial nearest-neighbor benchmark?";
    }

    // SCENARIO 3: Redis / Caching
    if (cleanPrev.includes("redis") || cleanPrev.includes("caching") || cleanPrev.includes("cache")) {
      if (probeType === "TRADEOFF_PROBE") {
        return "What workload characteristics would determine your cache invalidation strategy in Redis, and what consistency risks or stale read windows does that introduce?";
      }
      return "What would determine your cache invalidation strategy, and what consistency risks would that introduce in a distributed setup?";
    }

    // SCENARIO 4: Streaming, SSE, FastAPI, React
    if (cleanPrev.includes("streaming") || cleanPrev.includes("sse") || cleanPrev.includes("server-sent")) {
      if (probeType === "FAILURE_PROBE" || probeType === "IMPLEMENTATION_PROBE") {
        return "How would you handle a client disconnect or network timeout halfway through an active token stream without leaking ASGI worker threads?";
      }
      return "How do you manage client-side state in React to handle backpressure and stream interruptions without causing UI thread jank?";
    }

    // SCENARIO 5: Agents, MCP, Tool Use
    if (cleanPrev.includes("mcp") || cleanPrev.includes("langchain") || cleanPrev.includes("tool") || cleanPrev.includes("agent")) {
      if (probeType === "FAILURE_PROBE") {
        return "What should happen if an MCP tool times out after the agent has already committed to using its result in its reasoning trace?";
      }
      return "How do you enforce security permission boundaries and input validation when exposing database queries via an MCP server?";
    }

    // SCENARIO 6: Foundation Repair for Misconceptions
    if (probeType === "FOUNDATION_REPAIR") {
      if (cleanPrev.includes("embedding") || cleanPrev.includes("vector")) {
        return "Before we discuss retrieval architecture, let's clarify what an embedding represents mathematically and why semantic similarity can be computed from vector distance.";
      }
      if (cleanPrev.includes("hnsw")) {
        return "Before we explore parameter tuning, let's clarify the difference between exact k-NN search and approximate graph-based search in terms of computational complexity.";
      }
      return `Before we advance to production architecture on "${topicName}", let's clarify the underlying core concept and its fundamental operational constraints.`;
    }

    // SCENARIO 7: Natural Topic Graph Transition
    if (transitionContext) {
      const pool = CURRICULUM_QUESTION_POOLS[topicName];
      const baseQ = pool?.standard[0] || `How would you architect ${topicName.toLowerCase()} for enterprise high availability?`;
      return `${transitionContext} ${baseQ}`;
    }

    // SCENARIO 8: Standard Curriculum Pool lookup
    const pool = CURRICULUM_QUESTION_POOLS[topicName];
    if (pool) {
      if (isFinal && pool.final.length > 0) {
        return pool.final[0];
      }
      if (isFollowUp && pool.followup.length > 0) {
        return pool.followup[0];
      }
      return pool.standard[0];
    }

    // Default fallback
    if (isFinal) {
      return `From an operational and reliability perspective on "${topicName}", what production metrics, SLIs, and failover mechanisms would you establish to support enterprise workloads?`;
    }
    if (isFollowUp) {
      return `Regarding your answer on "${topicName}", how would you handle state persistence, concurrent query scaling, and error boundaries for that design?`;
    }
    return `In architecting a production system for "${topicName}", what architectural trade-offs, latency budgets, and failure recovery mechanisms would you prioritize?`;
  }

  return "What architectural trade-offs, latency budgets, and failure recovery mechanisms would you prioritize when deploying this capability in a high-concurrency production environment?";
}
