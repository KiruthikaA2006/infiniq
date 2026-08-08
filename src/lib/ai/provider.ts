import { ZodSchema } from "zod";
import { generateGeminiCompletion } from "./gemini";

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

  // Automatic fallback order: Gemini first, then OpenAI
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
      "You mentioned environment configuration parameters. How would you isolate native library dependencies to ensure deterministic runtime behavior without incurring excessive container overhead?",
      "Regarding your tooling choices, what strategy would you use to prevent dependency drift across microservices sharing common utility packages?",
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
      "You discussed local model inference. How would you handle GPU memory fragmentation when multiple concurrent worker threads request streaming token generation?",
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
      "You referenced SQLite indexing strategies. How would you handle write contention and database lock timeouts when multiple ingestion workers write concurrently in WAL mode?",
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
      "You discussed vector database selection. How would you handle index degradation when frequent write and delete operations fragment the HNSW graph?",
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

  // Day 14
  "Fine-Tuning: Concepts & When to Use It": {
    standard: [
      "What technical and economic criteria determine when fine-tuning an open-source model is more appropriate than optimizing a RAG pipeline with few-shot prompting?",
      "How do you curate, clean, and format a domain-specific instruction dataset in JSONL format while preventing contamination from evaluation datasets?",
      "What strategies do you use to detect and mitigate catastrophic forgetting of general reasoning capabilities during task-specific fine-tuning?",
      "How do you split and balance training, validation, and holdout test datasets to ensure unbiased evaluation of model generalization?"
    ],
    followup: [
      "You discussed dataset preparation for fine-tuning. How do you identify and remove duplicate or low-quality instruction pairs that could degrade model alignment?",
      "Regarding domain adaptation trade-offs, how would you evaluate whether fine-tuning improves domain terminology accuracy without increasing hallucination rates?",
      "How do you calculate the total cost of ownership (compute, hosting, maintenance) between fine-tuned self-hosted models and managed frontier APIs?"
    ],
    final: [
      "What governance framework would you establish to validate that fine-tuned models comply with domain-specific regulatory standards before production deployment?",
      "How would you design continuous fine-tuning pipelines that periodically update model weights with curated production interaction data?"
    ]
  },

  // Day 15
  "Fine-Tuning: Hands-On with LoRA & QLoRA": {
    standard: [
      "In deploying PEFT workflows with LoRA and QLoRA, how do you select rank (r), alpha, and target modules to balance parameter efficiency with model expressiveness?",
      "How does 4-bit NormalFloat (NF4) quantization in BitsAndBytes reduce GPU VRAM requirements during QLoRA training while preserving gradient precision?",
      "What learning rate schedules and gradient accumulation strategies do you configure to maintain stable convergence when fine-tuning on limited GPU hardware?",
      "How do you benchmark the fine-tuned adapter against the base model on unseen out-of-distribution test queries to measure real-world performance gains?"
    ],
    followup: [
      "You highlighted LoRA rank and quantization configurations. How do you evaluate whether increasing rank (e.g. from 8 to 64) produces measurable accuracy gains or simply increases overfitting risk?",
      "Regarding adapter merging, what are the operational pros and cons of merging LoRA weights back into base model weights versus loading dynamic adapters at runtime?",
      "How do you monitor training loss versus validation perplexity to identify early signs of overfitting during fine-tuning?"
    ],
    final: [
      "In a production environment serving multiple fine-tuned tasks, how would you architect dynamic LoRA adapter routing on a shared base model instance?",
      "What validation protocols and regression test suites would you require before promoting a newly trained LoRA adapter to production?"
    ]
  },

  // Day 16
  "Chatbot Backend & API Integration": {
    standard: [
      "In designing a FastAPI backend for an AI chatbot, how do you structure the `/chat` endpoint to orchestrate retrieval, tool calling, and LLM inference within an asynchronous lifecycle?",
      "How do you manage session state and multi-turn conversation history in a stateless backend architecture across load-balanced worker processes?",
      "What connection pooling and timeout strategies do you configure for database and LLM API integrations to prevent worker thread starvation?",
      "How would you design a comprehensive API testing suite using pytest and HTTP client mocks to validate end-to-end conversation flows?"
    ],
    followup: [
      "You discussed backend session orchestration. How would you handle database connection recycling when hundreds of concurrent chat sessions are active?",
      "Regarding API error handling, what structured error responses would you return when the underlying LLM provider experiences elevated latency or failure?",
      "How do you enforce authentication and user authorization boundaries on conversation history endpoints?"
    ],
    final: [
      "What API telemetry and latency dashboards (p50, p95, p99) would you implement to monitor backend health and identify endpoint bottlenecks?",
      "How would you architect the backend for horizontal scaling across Kubernetes pods with shared Redis session caches?"
    ]
  },

  // Day 17
  "Chatbot Frontend Development": {
    standard: [
      "When developing an interactive AI chat interface, how do you architect client-side state to support real-time message rendering, optimistic updates, and multi-session switching?",
      "How do you handle message persistence in local storage or client state to ensure user conversations survive page refreshes without data loss?",
      "What accessibility (ARIA) and keyboard navigation patterns are essential for a professional conversational interface?",
      "How do you design the frontend to gracefully display varied response formats, such as structured cards, citations, and error boundaries?"
    ],
    followup: [
      "You outlined frontend state management. How do you prevent UI re-render jank when rapid streaming token events update message state continuously?",
      "Regarding multi-session switching, how do you cancel pending network requests when a user switches to a different chat session mid-generation?",
      "How would you implement responsive layout adaptations to maintain usability across mobile viewports and desktop monitors?"
    ],
    final: [
      "What Core Web Vitals and frontend performance metrics would you monitor to ensure sub-100ms UI responsiveness during intensive streaming interactions?",
      "How would you structure automated frontend component tests to validate edge-case UI rendering across diverse screen dimensions?"
    ]
  },

  // Day 18
  "Full-Stack Integration & Streaming Responses": {
    standard: [
      "In implementing Server-Sent Events (SSE) streaming between FastAPI and a React client, how do you structure the event payload protocol to transmit tokens, citations, and metadata reliably?",
      "How do you handle network drops, stream reconnections, and partial message reconstruction when a streaming response is interrupted mid-sentence?",
      "What backpressure and buffer management strategies do you implement on the client to ensure smooth incremental text rendering without browser thread locking?",
      "How do you test and validate streaming endpoints in CI/CD environments where standard synchronous HTTP assertion tools do not apply?"
    ],
    followup: [
      "You discussed SSE streaming protocols. How would you handle proxy server timeouts (e.g. Nginx, Cloudflare) that kill idle SSE connections between chunk emissions?",
      "Regarding stream cancellation, how does the frontend notify the backend to terminate LLM generation immediately when a user clicks 'Stop'?",
      "How do you coordinate loading states, token typing animations, and auto-scroll behavior during active text streaming?"
    ],
    final: [
      "What end-to-end streaming SLOs would you establish for Time to First Token (TTFT) and token delivery throughput in production?",
      "How would you architect a WebSocket fallback mechanism for environments that restrict HTTP streaming connections?"
    ]
  },

  // Day 19
  "Response Formatting & Rich Outputs": {
    standard: [
      "When formatting complex LLM responses with citations, markdown tables, and interactive UI cards, how do you validate and sanitize generated markup against XSS vulnerabilities?",
      "How do you design citation mapping that links specific response assertions back to exact source document chunks and page numbers?",
      "What rendering pipeline would you build to parse and render Markdown tokens incrementally as they stream in, without causing layout shift or broken HTML tags?",
      "How do you ensure structured outputs (like claims summary cards) strictly match expected Pydantic schemas before frontend component rendering?"
    ],
    followup: [
      "You highlighted citation mapping and source tracking. How do you handle cases where the model generates a plausible citation that does not exist in the retrieved context?",
      "Regarding streaming Markdown parsing, how do you handle unclosed code blocks or formatting tags that arrive across multiple streaming chunks?",
      "How would you evaluate user trust and response readability when comparing structured card layouts against plain text answers?"
    ],
    final: [
      "What automated visual regression testing would you implement to ensure rich response cards render consistently across all supported browser engines?",
      "How would you design export capabilities (PDF, JSON, CSV) for structured conversation dossiers generated by the platform?"
    ]
  },

  // Day 20
  "Conversation Memory & Context Management": {
    standard: [
      "In managing long-running multi-turn conversations, what strategies (e.g. sliding window, hierarchical summarization, semantic memory) do you use to stay within LLM context window token limits?",
      "How do you prevent context dilution and loss of critical early-turn user constraints when compressing long conversation histories?",
      "What database schema and indexing strategy would you use in SQLite/PostgreSQL to persist, retrieve, and search conversation sessions at scale?",
      "How do you calculate and manage token budgets across system prompts, retrieved RAG context, conversation history, and output generation reservations?"
    ],
    followup: [
      "You discussed conversation summarization strategies. How do you ensure that critical user preferences and entity names are preserved during automatic summary generation?",
      "Regarding context window management, how would you design an eviction policy that prioritizes retaining high-information-density messages over generic conversation turns?",
      "How do you benchmark conversation memory recall accuracy when users reference statements made 15 turns earlier in the session?"
    ],
    final: [
      "In an enterprise platform, how would you implement data retention policies and user data deletion (GDPR/HIPAA compliance) for stored conversation memories?",
      "What monitoring would you establish to detect context window exhaustion and prompt truncation errors in production?"
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

  // Day 22
  "Multi-Agent Orchestration": {
    standard: [
      "When architecting a multi-agent system using frameworks like LangGraph or CrewAI, what criteria guide the division of labor between specialized domain agents?",
      "How do you design inter-agent communication protocols and state sharing to prevent message explosion and conflicting agent decisions?",
      "What routing patterns (e.g. hierarchical supervisor, peer-to-peer consensus, router agent) provide the best balance of flexibility and deterministic execution?",
      "How do you benchmark a multi-agent architecture against a single-agent baseline to prove measurable improvements in task accuracy that justify the higher token cost and latency?"
    ],
    followup: [
      "You discussed supervisor routing patterns. How do you resolve deadlocks or circular delegation loops between collaborating specialist agents?",
      "Regarding shared state management, how do you ensure atomic state updates when multiple agents propose concurrent modifications to the shared workspace?",
      "How would you optimize token consumption across multi-agent workflows where each agent maintains its own system prompt and context history?"
    ],
    final: [
      "What distributed tracing and observability tools would you implement to visualize and debug complex multi-agent execution graphs in production?",
      "How would you design fail-safe mechanisms that allow human-in-the-loop intervention when multi-agent collaboration fails to reach consensus?"
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

  // Day 24
  "Agentic Chatbot Integration": {
    standard: [
      "In synthesizing agents, MCP tools, vector retrieval, and conversation memory into a unified production pipeline, how do you coordinate asynchronous execution to minimize end-to-end latency?",
      "How do you implement resilient retry logic with exponential backoff and circuit breakers around flaky third-party tool and model endpoints?",
      "What architectural patterns allow for graceful degradation when a critical tool or retrieval service becomes unavailable during an active agent session?",
      "How do you design comprehensive integration tests that simulate full agentic reasoning loops with mock MCP servers and deterministic LLM responses?"
    ],
    followup: [
      "You discussed pipeline resilience and circuit breakers. How do you ensure the agent communicates partial progress or tool execution status to the user during long-running tasks?",
      "Regarding end-to-end latency optimization, what stages of the agentic pipeline can be parallelized without compromising decision-making accuracy?",
      "How do you audit and log the complete decision tree (tools called, inputs, outputs, tokens used) for compliance and debugging?"
    ],
    final: [
      "What disaster recovery and high availability architectures would you implement for the unified agentic chatbot platform in a multi-region deployment?",
      "How would you define operational readiness criteria before transitioning an agentic system from staging to live production users?"
    ]
  },

  // Day 25
  "Chatbot Evaluation & Testing": {
    standard: [
      "In designing an automated evaluation framework for enterprise AI systems, how do you implement the RAG Triad metrics (Context Relevance, Groundedness/Faithfulness, Answer Relevance)?",
      "How do you construct a representative golden benchmark dataset covering edge cases, adversarial inputs, and out-of-scope queries?",
      "What are the statistical reliability and bias trade-offs of using an LLM-as-a-judge versus human expert annotation for scoring technical responses?",
      "How do you track evaluation metrics across automated CI/CD builds to detect quality regressions before deployment to production?"
    ],
    followup: [
      "You discussed LLM-as-a-judge evaluation. How do you mitigate position bias, verbosity bias, and self-enhancement bias in automated judge models?",
      "Regarding golden dataset maintenance, what process would you establish to continuously incorporate real-world production failure cases into the benchmark suite?",
      "How do you define acceptable threshold scores for faithfulness and relevance before a model update is approved for release?"
    ],
    final: [
      "What continuous evaluation architecture would you build to sample and evaluate live production conversations in near-real-time?",
      "How would you communicate evaluation metrics and quality trends to non-technical executive stakeholders through automated reporting dashboards?"
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
      "In containerizing a full-stack AI platform (FastAPI backend, React frontend, vector database), how do you design multi-stage Dockerfiles to minimize image sizes and attack surfaces?",
      "How do you configure Kubernetes Deployments, Services, and Ingress controllers with Horizontal Pod Autoscalers (HPA) to scale pods based on custom request latency metrics?",
      "What strategies do you use for managing environment variables, secrets, and volume mounts securely in Kubernetes without embedding credentials in container images?",
      "How do you design readiness and liveness probes for AI services that depend on external LLM APIs and heavy in-memory vector indices?"
    ],
    followup: [
      "You discussed Kubernetes deployment and autoscaling. How do you prevent premature pod termination and dropped connections during rolling updates of long-lived streaming services?",
      "Regarding GPU container workloads, how do you configure resource requests, limits, and NVIDIA device plugins in Kubernetes manifests?",
      "How would you architect persistent volume storage for vector database indices to ensure rapid pod restarts after node failures?"
    ],
    final: [
      "What zero-downtime blue-green or canary deployment strategy would you implement for updating backend API services in production?",
      "How would you design a multi-cluster disaster recovery plan to ensure service continuity in the event of a regional cloud provider outage?"
    ]
  },

  // Day 29
  "Monitoring, Logging & Observability": {
    standard: [
      "In building observability for an enterprise AI platform, how do you instrument OpenTelemetry tracing across frontend interactions, backend API routes, retrieval engines, and LLM calls?",
      "What key Prometheus metrics (e.g. Time to First Token, token generation rate, error rates, cache hit ratios) do you track to maintain production health?",
      "How do you configure structured JSON logging with correlation IDs (trace ID, session ID, user ID) to enable end-to-end request tracing in high-throughput distributed systems?",
      "How do you build Grafana dashboards and alert rules that distinguish between LLM provider outages, vector database latency spikes, and application-level errors?"
    ],
    followup: [
      "You discussed OpenTelemetry and metric collection. How do you manage the storage overhead and sampling rates of distributed traces in high-traffic environments?",
      "Regarding alert thresholds, what specific conditions would trigger an on-call paging alert versus a low-priority informational notification?",
      "How do you correlate user feedback signals (e.g. thumbs up/down) with specific trace IDs to investigate quality degradation in production?"
    ],
    final: [
      "What Service Level Agreements (SLAs) and SLO error budgets would you define for enterprise AI availability, latency, and quality?",
      "How would you automate incident post-mortem generation using telemetry logs and trace data after a production disruption?"
    ]
  },

  // Day 30
  "Production Readiness & Final Testing": {
    standard: [
      "What comprehensive checklist and validation protocols must an AI platform satisfy across load testing, security auditing, data integrity, and disaster recovery before production release?",
      "How do you design and execute stress tests (using tools like Locust or k6) that simulate hundreds of concurrent streaming users to identify system breaking points?",
      "How do you formulate a rollback and contingency plan for scenarios where a new production release exhibits unexpected latency degradation or hallucination spikes?",
      "What operational runbooks and escalation pathways do you document for on-call engineers managing the live production platform?"
    ],
    followup: [
      "You discussed load testing and breaking point analysis. How do you identify whether system degradation under load is caused by database connection pool exhaustion or LLM provider rate limits?",
      "Regarding operational runbooks, what automated mitigation steps should execute immediately when a critical dependency fails?",
      "How do you validate data consistency across distributed caches and persistent storage during simulated failover tests?"
    ],
    final: [
      "How do you conduct a production readiness review (PRR) with security, compliance, and infrastructure stakeholders prior to public launch?",
      "What automated health checks and synthetic monitoring probes would you deploy to continuously verify production system integrity 24/7?"
    ]
  },

  // Day 31
  "Capstone Project & Final Demo": {
    standard: [
      "In presenting a complete enterprise-grade conversational AI architecture, how do you demonstrate that the system satisfies production requirements for accuracy, scalability, and security?",
      "How does your end-to-end architecture synthesize data ingestion, vector indexing, hybrid retrieval, agentic tool execution, and observability into a unified system?",
      "What architectural decisions and engineering trade-offs did you make during development, and how would you evolve the platform to handle 10x higher request volumes?",
      "How do you evaluate and communicate the platform's return on investment (ROI), operational cost efficiency, and business impact to technical and executive stakeholders?"
    ],
    followup: [
      "You reviewed the complete system architecture. Looking back at your design choices, what single component would you re-architect first to improve performance at scale?",
      "Regarding operational cost optimization, what strategies would you deploy to reduce monthly token expenditures without sacrificing response quality?",
      "How do you ensure the codebase and architecture remain modular and maintainable as new AI model capabilities and protocols emerge?"
    ],
    final: [
      "What long-term architectural roadmap would you establish for incorporating multimodal inputs, local fine-tuned models, and decentralized agent workflows into the platform?",
      "How do you establish engineering excellence and documentation standards that enable new team members to rapidly contribute to the codebase?"
    ]
  }
};

/**
 * Fallback deterministic simulator that generates rich, unique questions and evaluations.
 */
function simulateCompletion(systemPrompt: string, userPrompt: string): string {
  // Check if this is an Evaluation Request
  if (
    systemPrompt.includes("EvaluationResult") ||
    userPrompt.includes("Evaluate candidate response") ||
    systemPrompt.includes("Evaluate")
  ) {
    let evaluationTopic = "The Retrieval & Matching Engine";
    const topicMatch = systemPrompt.match(/topic\s*"([^"]+)"/i) || userPrompt.match(/topic\s*"([^"]+)"/i);
    if (topicMatch) {
      evaluationTopic = topicMatch[1];
    }

    // Extract user answer to analyze depth
    const answerMatch =
      userPrompt.match(/Candidate's Response:\s*([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i) ||
      userPrompt.match(/Candidate Answer:\s*([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i);
    const answer = answerMatch ? answerMatch[1].trim() : "";
    const cleanAnswer = answer.toLowerCase();

    // Check depth signals
    const hasTechnicalKeywords =
      cleanAnswer.includes("chunk") ||
      cleanAnswer.includes("vector") ||
      cleanAnswer.includes("rerank") ||
      cleanAnswer.includes("hybrid") ||
      cleanAnswer.includes("lora") ||
      cleanAnswer.includes("peft") ||
      cleanAnswer.includes("mcp") ||
      cleanAnswer.includes("sdk") ||
      cleanAnswer.includes("cache") ||
      cleanAnswer.includes("batching") ||
      cleanAnswer.includes("latency") ||
      cleanAnswer.includes("fastapi") ||
      cleanAnswer.includes("sqlite") ||
      cleanAnswer.includes("react") ||
      cleanAnswer.includes("docker") ||
      cleanAnswer.includes("kubernetes") ||
      cleanAnswer.includes("token") ||
      cleanAnswer.includes("pydantic");

    const isLong = answer.length > 70;

    let score = isLong && hasTechnicalKeywords ? 85 : 52;
    let technicalDepth = isLong && hasTechnicalKeywords ? 4.4 : 2.0;
    let reasoning = isLong && hasTechnicalKeywords ? 4.2 : 2.2;
    let accuracy = isLong && hasTechnicalKeywords ? 4.5 : 2.6;
    let communication = 4.0;
    let recommendedDifficulty: "easy" | "medium" | "hard" = isLong && hasTechnicalKeywords ? "hard" : "medium";
    let followUpNeeded = !isLong || !hasTechnicalKeywords;
    let followUpReason = isLong && hasTechnicalKeywords
      ? "Candidate articulated key architectural components; proceed to probe edge cases."
      : "Candidate response was high-level; probing specific engineering trade-offs is required.";

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const conceptsMentioned: string[] = [evaluationTopic];
    const misconceptions: string[] = [];
    const missingConcepts: string[] = [];

    if (isLong && hasTechnicalKeywords) {
      strengths.push(
        "Demonstrated clear architectural decomposition and trade-off awareness",
        "Addressed concurrency constraints and operational considerations"
      );
    } else {
      weaknesses.push("Relies on high-level conceptual explanations without concrete implementation trade-offs");
      missingConcepts.push("Failure recovery mechanisms", "Latency and memory budget constraints");
    }

    const evaluation = {
      score,
      technicalDepth,
      reasoning,
      accuracy,
      communication,
      strengths,
      weaknesses,
      conceptsMentioned,
      misconceptions,
      missingConcepts,
      followUpNeeded,
      followUpReason,
      recommendedDifficulty,
    };

    return JSON.stringify(evaluation);
  }

  // Check if this is a Question Generation Request
  if (userPrompt.includes("Generate next question") || userPrompt.includes("curriculum") || systemPrompt.includes("interviewer")) {
    const cleanPrompt = userPrompt.toLowerCase();
    const isFollowUp = cleanPrompt.includes("follow-up") || cleanPrompt.includes("probe");
    const isFinal = cleanPrompt.includes("final") || cleanPrompt.includes("question number: 8");

    // Extract target topic
    let topicName = "The Retrieval & Matching Engine";
    const topicMatch = userPrompt.match(/for topic:\s*"([^"]+)"/i) || userPrompt.match(/topic:\s*"([^"]+)"/i);
    if (topicMatch) {
      topicName = topicMatch[1];
    }

    let candidateName = "Candidate";
    const nameMatch = userPrompt.match(/- Candidate Name:\s*(.*)/i);
    if (nameMatch) {
      candidateName = nameMatch[1].trim();
    }

    let candidateRole = "Engineer";
    const roleMatch = userPrompt.match(/- Candidate Role:\s*(.*)/i);
    if (roleMatch) {
      candidateRole = roleMatch[1].trim();
    }

    let questionNum = 1;
    const numMatch = userPrompt.match(/Question Number:\s*(\d+)/i);
    if (numMatch) {
      questionNum = parseInt(numMatch[1], 10);
    }

    // Extract previous answer for dynamic follow-up extraction
    let previousAnswer = "";
    const prevAnswerMatch =
      userPrompt.match(/(?:Candidate's Exact Response|Candidate Answer|Candidate Response):\s*"([^"]+)"/i) ||
      userPrompt.match(/(?:Candidate's Exact Response|Candidate Answer|Candidate Response):\s*([^\n]+)/i);
    if (prevAnswerMatch) {
      previousAnswer = prevAnswerMatch[1].trim();
    }

    // Compute unique hash based on candidate name, question number, and topic
    let hashSeed = 0;
    for (let i = 0; i < candidateName.length; i++) {
      hashSeed += candidateName.charCodeAt(i) * (i + 1);
    }
    for (let i = 0; i < topicName.length; i++) {
      hashSeed += topicName.charCodeAt(i);
    }
    hashSeed += questionNum * 17;

    const pool = CURRICULUM_QUESTION_POOLS[topicName];

    if (isFollowUp && previousAnswer.length > 10) {
      // Extract specific key phrases or claims from the candidate's actual answer
      const answerSnippet = previousAnswer.length > 50 ? `${previousAnswer.substring(0, 45)}...` : previousAnswer;
      
      const dynamicFollowUps = [
        `In your previous response on "${topicName}", you emphasized: "${answerSnippet}". What specific concurrency bottlenecks or failure modes would emerge from this approach in a high-throughput production system, and how would you mitigate them?`,
        `Regarding your proposal to use "${answerSnippet}" for "${topicName}", how would you validate data integrity and latency overhead when scaling to concurrent distributed requests?`,
        `You stated: "${answerSnippet}". What architectural trade-offs did you make regarding memory consumption and failure recovery with that specific choice?`,
        `Building on your approach involving "${answerSnippet}", how would you design automated fallback mechanisms if that component experiences elevated error rates in production?`
      ];

      const chosenIdx = Math.abs(hashSeed) % dynamicFollowUps.length;
      return dynamicFollowUps[chosenIdx];
    }

    if (pool) {
      if (isFinal && pool.final.length > 0) {
        const finalIdx = Math.abs(hashSeed) % pool.final.length;
        return pool.final[finalIdx];
      } else if (isFollowUp && pool.followup.length > 0) {
        const followIdx = Math.abs(hashSeed) % pool.followup.length;
        return pool.followup[followIdx];
      } else {
        const standardIdx = Math.abs(hashSeed) % pool.standard.length;
        return pool.standard[standardIdx];
      }
    }

    // Dynamic fallback for any unlisted topic
    if (isFinal) {
      return `From an operational and reliability perspective on "${topicName}", what production metrics, SLIs, and failover mechanisms would you establish to support enterprise workloads?`;
    } else if (isFollowUp) {
      return `Regarding your answer on "${topicName}", you outlined key architectural components. How would you handle state persistence, concurrent query scaling, and error boundaries for that design?`;
    } else {
      return `Considering the topic "${topicName}", given your engineering background as a ${candidateRole}, how would you architect this system for high availability, minimal latency, and robust fault tolerance?`;
    }
  }

  // Clean default fallback
  return "What architectural trade-offs, latency budgets, and failure recovery mechanisms would you prioritize when deploying this capability in a high-concurrency production environment?";
}
