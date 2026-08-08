import { ZodSchema } from "zod";

export interface AIProviderStatus {
  provider: "llm" | "mock";
  modelName: string;
}

// Check if OpenAI key is configured
export function getProviderStatus(): AIProviderStatus {
  const hasKey = !!process.env.OPENAI_API_KEY;
  const providerEnv = process.env.AI_PROVIDER;

  if (hasKey && providerEnv !== "mock") {
    return { provider: "llm", modelName: "gpt-4o-mini" };
  }
  return { provider: "mock", modelName: "deterministic-simulation" };
}

/**
 * Sends a chat completion query to OpenAI or routes to the local mock simulator.
 */
export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  zodSchema?: ZodSchema
): Promise<string> {
  const status = getProviderStatus();

  if (status.provider === "llm") {
    try {
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
          temperature: 0.1,
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
    } catch (error) {
      console.warn("LLM Provider failed, triggering fallback simulator:", error);
      // Fall through to deterministic simulation
    }
  }

  // Fallback Deterministic Simulator
  return simulateCompletion(systemPrompt, userPrompt);
}

/**
 * Semantic fallback simulator that parses prompts and returns realistic JSON or technical questions.
 */
function simulateCompletion(systemPrompt: string, userPrompt: string): string {
  // Check if this is an Evaluation Request
  if (systemPrompt.includes("EvaluationResult") || userPrompt.includes("Evaluate candidate response") || systemPrompt.includes("Evaluate")) {
    let evaluationTopic = "The Retrieval & Matching Engine";
    const topicMatch = systemPrompt.match(/topic\s*"([^"]+)"/i) || userPrompt.match(/topic\s*"([^"]+)"/i);
    if (topicMatch) {
      evaluationTopic = topicMatch[1];
    }

    const isRag = evaluationTopic === "The Retrieval & Matching Engine";
    const isFineTuning = evaluationTopic === "Fine-Tuning: Hands-On with LoRA & QLoRA";
    const isMcp = evaluationTopic === "Model Context Protocol (MCP)";
    const isPerformance = evaluationTopic === "Performance Optimization & Cost Management";

    // Extract user answer to analyze depth
    const answerMatch = userPrompt.match(/Candidate's Response:\s*([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i) || userPrompt.match(/Candidate Answer:\s*([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i);
    const answer = answerMatch ? answerMatch[1].trim() : "";
    const cleanAnswer = answer.toLowerCase();

    // Check depth signals
    const hasDepthKeywords = 
      cleanAnswer.includes("chunk") || 
      cleanAnswer.includes("rerank") || 
      cleanAnswer.includes("hybrid") || 
      cleanAnswer.includes("lora") || 
      cleanAnswer.includes("peft") || 
      cleanAnswer.includes("mcp") || 
      cleanAnswer.includes("sdk") || 
      cleanAnswer.includes("cache") || 
      cleanAnswer.includes("batching") || 
      cleanAnswer.includes("latency");

    const isLong = answer.length > 80;

    let score = 55;
    let technicalDepth = 2;
    let reasoning = 2.5;
    let accuracy = 3;
    let communication = 3;
    let recommendedDifficulty: "easy" | "medium" | "hard" = "medium";
    let followUpNeeded = true;
    let followUpReason = "Candidate raised key architectural points that warrant further technical detail.";
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const conceptsMentioned: string[] = [];
    const misconceptions: string[] = [];
    const missingConcepts: string[] = [];

    if (isRag) {
      conceptsMentioned.push("RAG & Retrieval");
      if (cleanAnswer.includes("vector")) conceptsMentioned.push("Vector Database");
      if (cleanAnswer.includes("embed")) conceptsMentioned.push("Embeddings");
      
      if (hasDepthKeywords && isLong) {
        score = 88;
        technicalDepth = 4.5;
        reasoning = 4;
        accuracy = 4.5;
        communication = 4;
        recommendedDifficulty = "hard";
        followUpNeeded = true;
        strengths.push("Good separation of ingestion and retrieval pipelines", "Aware of semantic boundary chunking");
        if (cleanAnswer.includes("rerank")) strengths.push("Integrates reranking stage for context compression");
      } else {
        score = 50;
        technicalDepth = 1.8;
        reasoning = 2;
        accuracy = 2.5;
        recommendedDifficulty = "medium";
        followUpNeeded = true;
        weaknesses.push("Shallow architectural explanation", "Relies heavily on high-level RAG definitions");
        missingConcepts.push("Hybrid search mechanics", "Reranking compressions");
        misconceptions.push("Embeddings alone guarantee absolute retrieval precision");
      }
    } else if (isFineTuning) {
      conceptsMentioned.push("Fine-Tuning & Parameter Efficiency");
      if (cleanAnswer.includes("lora")) conceptsMentioned.push("LoRA");
      if (cleanAnswer.includes("peft")) conceptsMentioned.push("PEFT");
      
      if (hasDepthKeywords && isLong) {
        score = 92;
        technicalDepth = 4.8;
        reasoning = 4.5;
        accuracy = 4.8;
        communication = 4.5;
        recommendedDifficulty = "hard";
        followUpNeeded = false;
        strengths.push("Understands LoRA parameter scaling constraints", "Identifies rank and alpha ratios");
      } else {
        score = 52;
        technicalDepth = 2;
        reasoning = 2.2;
        recommendedDifficulty = "medium";
        followUpNeeded = true;
        weaknesses.push("Vague parameter tuning trade-offs");
        missingConcepts.push("Parameter-Efficient Fine-Tuning (PEFT)");
      }
    } else if (isMcp) {
      conceptsMentioned.push("Model Context Protocol");
      if (cleanAnswer.includes("mcp")) conceptsMentioned.push("MCP Server");
      if (cleanAnswer.includes("sdk")) conceptsMentioned.push("MCP SDK");

      if (hasDepthKeywords && isLong) {
        score = 90;
        technicalDepth = 4.6;
        reasoning = 4.4;
        accuracy = 4.6;
        recommendedDifficulty = "hard";
        followUpNeeded = false;
        strengths.push("Understands safe client-server tool invocation lifecycle and prompt injections");
      } else {
        score = 48;
        technicalDepth = 1.5;
        reasoning = 1.8;
        recommendedDifficulty = "easy";
        followUpNeeded = true;
        weaknesses.push("Confuses local MCP server streaming with stateless REST callbacks");
      }
    } else if (isPerformance) {
      conceptsMentioned.push("Production LLM serving performance");
      if (cleanAnswer.includes("cache")) conceptsMentioned.push("Semantic Caching");
      if (cleanAnswer.includes("batching")) conceptsMentioned.push("Continuous Batching");

      if (hasDepthKeywords && isLong) {
        score = 86;
        technicalDepth = 4.4;
        reasoning = 4.2;
        accuracy = 4.4;
        recommendedDifficulty = "hard";
        followUpNeeded = false;
        strengths.push("Correctly addresses token latency budgets and continuous batching trade-offs");
      } else {
        score = 54;
        technicalDepth = 2.2;
        reasoning = 2.4;
        recommendedDifficulty = "medium";
        followUpNeeded = true;
        weaknesses.push("Unfamiliar with continuous batching blocking thresholds");
      }
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
  if (userPrompt.includes("Generate next question") || userPrompt.includes("curriculum")) {
    const cleanPrompt = userPrompt.toLowerCase();
    const isFollowUp = cleanPrompt.includes("follow-up") || cleanPrompt.includes("probe");

    // Pools for each curriculum topic
    const pools: Record<string, { standard: string[]; followup: string[] }> = {
      "The Retrieval & Matching Engine": {
        standard: [
          "You are building a healthcare RAG system. How would you decide whether to use dense embeddings, keyword retrieval, or a hybrid approach, and what failure modes would you expect?",
          "Describe how document chunking boundaries affect dense vector index query accuracy."
        ],
        followup: [
          "You mentioned speed as an operational metric for storing vectors. What database latency trade-offs make a specialized vector database preferable to a relational database with pgvector indexing in a production environment?",
          "Regarding embedding retrieval quality, how would you detect and filter out irrelevant context that might hurt the final LLM response generation?",
          "For the reranking pipeline stage, how would you configure the latency budget to ensure it does not block user text streams?"
        ]
      },
      "Fine-Tuning: Hands-On with LoRA & QLoRA": {
        standard: [
          "In deploying an LLM for a domain-specific billing compliance task, what criteria would you use to decide between fine-tuning a small open model (like Qwen2.5-Coder) using LoRA versus using advanced few-shot prompting on a frontier model?",
          "Describe how you would prepare instruction dataset formats for fine-tuning a coding model."
        ],
        followup: [
          "For fine-tuning with LoRA, how would you select rank (r) and alpha values, and how would you evaluate if the model is suffering from catastrophic forgetting of basic programming skills?",
          "Regarding PEFT constraints, how would quantization using BitsAndBytes affect fine-tuning training speed and VRAM overhead?",
          "Explain how you would trade off model quantization precision against inference throughput."
        ]
      },
      "Model Context Protocol (MCP)": {
        standard: [
          "You are building a multi-agent workspace with CrewAI and LangGraph. How would you design a tool invocation loop using the Model Context Protocol (MCP) to let agents read databases safely while preventing prompt injection?",
          "Describe how MCP servers differ from traditional REST APIs when exposed to local client runners."
        ],
        followup: [
          "For the tool execution safety, how would you isolate the database execution environment, and what latency implications would this containerized isolation create?",
          "Regarding MCP Python SDK limits, how would you manage WebSocket connection pools when 50+ concurrent agents are executing queries?",
          "How would you handle authentication and credentials transport when third-party client agents connect to your MCP node?"
        ]
      },
      "Performance Optimization & Cost Management": {
        standard: [
          "In hosting an enterprise chatbot, how would you configure continuous batching and semantic caching using Redis to reduce token cost and meet a sub-100ms time-to-first-token budget?",
          "Describe how you would implement semantic cache indexing to maximize LLM cache hits."
        ],
        followup: [
          "Regarding the semantic cache, what similarity distance threshold would you use to prevent serving stale or contextually incorrect answers to users?",
          "For continuous batching, how does KV cache size affect memory limits, and how would you monitor trace metrics to prevent container OOM crashes?",
          "Explain how you would trade off token latency against throughput when model hosting concurrency parameters are shifted."
        ]
      }
    };

    // Determine target topic by extracting the exact text between quotes in "for topic: "..."
    let topicName = "The Retrieval & Matching Engine";
    const topicMatch = userPrompt.match(/for topic:\s*"([^"]+)"/i);
    if (topicMatch) {
      topicName = topicMatch[1];
    }

    const pool = pools[topicName] || pools["The Retrieval & Matching Engine"];
    const candidateList = isFollowUp ? pool.followup : pool.standard;

    // Pick a candidate question that has NOT already been mentioned in userPrompt
    for (const q of candidateList) {
      const qLower = q.toLowerCase();
      const keywordSample = qLower.substring(0, 30);
      if (!cleanPrompt.includes(keywordSample)) {
        return q;
      }
    }

    // Default fallback to first element if all are exhausted
    return candidateList[0];
  }

  // Simple raw fallback
  return "Could you go one level deeper on that? Please expand on your architectural trade-offs and engineering choices.";
}
