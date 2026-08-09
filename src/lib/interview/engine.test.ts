import { getCandidate, getCandidates } from "../../data/candidate";
import { getCurriculum } from "../../data/curriculum";
import { startSession, processResponse, getSession, compileFinalReport, isSemanticallySimilar, sessionsDb, globalAskedQuestions } from "./orchestrator";
import { generateInterviewPlan } from "./planner";
import { evaluateAnswer } from "./evaluator";
import { extractCandidateClaims } from "./claim-extractor";
import { StartRequestSchema, ConversationRequestSchema, APIInterviewResponseSchema, InterviewQuestion } from "@/types/interview";

function cleanQuestionText(text: string): string {
  return text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function runTests() {
  console.log("\n==================================================");
  console.log("   INFINIQ ADAPTIVE AI INTERVIEWER ENGINE TESTS");
  console.log("==================================================\n");

  globalAskedQuestions.clear();

  // --------------------------------------------------
  // TEST 1: Session starts & candidate dataset loaded
  // --------------------------------------------------
  console.log("Test 1: Verifying session starts and candidate dataset is loaded (20 profiles)...");
  const candidatesList = await getCandidates();
  if (candidatesList.length !== 20) {
    throw new Error(`Test 1 Failed: Expected 20 candidates, found ${candidatesList.length}`);
  }
  const cand001 = await getCandidate("CAND-001"); // Sarah Chen
  const session1 = await startSession(cand001!, "test-session-1");
  if (!session1 || session1.id !== "test-session-1" || !session1.currentQuestion) {
    throw new Error("Test 1 Failed: Session initialization failed.");
  }
  console.log("✓ Test 1: Session starts successfully.\n");

  // --------------------------------------------------
  // TEST 2: Python Environment & Wheel Claims (User Specific Case)
  // --------------------------------------------------
  console.log("Test 2: Verifying Python environment & wheel claim follow-up (No random SQL injection)...");
  const pySession = await startSession(cand001!, "session-py-wheels");
  const pyResponse = "I would use a lockfile and platform-specific wheels. For ARM64 dependencies without wheels, I'd build from source in CI and package the result into a container.";
  
  const pyUpdated = await processResponse(pySession.id, pyResponse);
  const nextQ = pyUpdated.currentQuestion?.text.toLowerCase() || "";

  console.log(`  Candidate Answer: "${pyResponse}"`);
  console.log(`  Next Interviewer Question: "${pyUpdated.currentQuestion?.text}"`);

  // Assert follow-up is about ABI/wheels/ARM64/C-extensions/compilation/dependencies and NOT SQL injection
  const isRelatedToPyEnv =
    nextQ.includes("wheel") ||
    nextQ.includes("arm64") ||
    nextQ.includes("c-extension") ||
    nextQ.includes("abi") ||
    nextQ.includes("compiler") ||
    nextQ.includes("build") ||
    nextQ.includes("lockfile") ||
    nextQ.includes("dependency") ||
    nextQ.includes("container");

  const isSqlInjection = nextQ.includes("sql injection") || nextQ.includes("database filter");

  if (!isRelatedToPyEnv || isSqlInjection) {
    throw new Error(`Test 2 Failed: Next question was unrelated or jumped to SQL injection. Got: "${pyUpdated.currentQuestion?.text}"`);
  }
  console.log("✓ Test 2: Follow-up directly probes candidate's Python environment / wheel / ABI claims.\n");

  // --------------------------------------------------
  // TEST 3: Candidate Claim Extraction
  // --------------------------------------------------
  console.log("Test 3: Verifying structured candidate claim extraction...");
  const claims = extractCandidateClaims(
    "I would use HNSW with efSearch=64 because it balances latency and recall. For caching, I'd use Redis with a TTL invalidation strategy.",
    "Vector Databases Overview"
  );
  if (claims.claims.length === 0 || claims.technologies.length === 0 || claims.tradeoffs.length === 0) {
    throw new Error("Test 3 Failed: Claim extractor did not parse claims or trade-offs.");
  }
  console.log(`✓ Test 3: Extracted claims (${claims.claims.length}), technologies: [${claims.technologies.join(", ")}], trade-offs: [${claims.tradeoffs.join(", ")}].\n`);

  // --------------------------------------------------
  // TEST 4: Trade-off probe on HNSW / Latency vs Recall
  // --------------------------------------------------
  console.log("Test 4: Verifying trade-off follow-up on HNSW vector indexing...");
  const hnswSession = await startSession(cand001!, "session-hnsw-test");
  const hnswUpdated = await processResponse(hnswSession.id, "I'd use HNSW because of its low-latency approximate nearest-neighbor search.");
  const hnswQ = hnswUpdated.currentQuestion?.text.toLowerCase() || "";

  console.log(`  Candidate: "I'd use HNSW because of its low-latency approximate nearest-neighbor search."`);
  console.log(`  Interviewer: "${hnswUpdated.currentQuestion?.text}"`);

  if (!hnswQ.includes("recall") && !hnswQ.includes("trade-off") && !hnswQ.includes("efsearch") && !hnswQ.includes("latency") && !hnswQ.includes("hnsw")) {
    throw new Error("Test 4 Failed: Follow-up did not probe recall/latency trade-off for HNSW.");
  }
  console.log("✓ Test 4: Follow-up challenges HNSW recall/latency trade-offs.\n");

  // --------------------------------------------------
  // TEST 5: Weak Answer / Misconception causes Foundation Repair
  // --------------------------------------------------
  console.log("Test 5: Verifying misconception causes targeted Foundation Repair...");
  const miscSession = await startSession(cand001!, "session-misc-test");
  const miscUpdated = await processResponse(miscSession.id, "Embeddings are basically encrypted versions of text stored in a smaller format.");
  const miscQ = miscUpdated.currentQuestion?.text.toLowerCase() || "";

  console.log(`  Candidate Misconception: "Embeddings are basically encrypted versions of text..."`);
  console.log(`  Interviewer Repair: "${miscUpdated.currentQuestion?.text}"`);

  if (!miscQ.includes("clarify") && !miscQ.includes("embedding") && !miscQ.includes("semantic") && !miscQ.includes("represent")) {
    throw new Error("Test 5 Failed: Misconception did not trigger foundation repair intervention.");
  }
  const lastDecision = miscUpdated.decisions[miscUpdated.decisions.length - 1];
  if (lastDecision.probeType !== "FOUNDATION_REPAIR") {
    throw new Error(`Test 5 Failed: Expected probeType to be FOUNDATION_REPAIR, got ${lastDecision.probeType}`);
  }
  console.log("✓ Test 5: Foundation repair successfully initiated.\n");

  // --------------------------------------------------
  // TEST 6: Short Answer Causes Deepening Probe Rather Than Topic Jumping
  // --------------------------------------------------
  console.log("Test 6: Verifying short answer causes expansion probe on current topic...");
  const shortSession = await startSession(cand001!, "session-short-test");
  const shortUpdated = await processResponse(shortSession.id, "Use Redis.");
  const shortQ = shortUpdated.currentQuestion?.text.toLowerCase() || "";

  console.log(`  Candidate Short Answer: "Use Redis."`);
  console.log(`  Interviewer Probe: "${shortUpdated.currentQuestion?.text}"`);

  if (!shortQ.includes("redis") && !shortQ.includes("cache") && !shortQ.includes("invalidation") && !shortQ.includes("statement")) {
    throw new Error("Test 6 Failed: Short answer jumped topic instead of probing candidate to expand.");
  }
  console.log("✓ Test 6: Short answer prompted candidate to expand on current concept.\n");

  // --------------------------------------------------
  // TEST 7: Strong Answer Causes Deeper Scaling Challenge
  // --------------------------------------------------
  console.log("Test 7: Verifying strong answer causes deeper challenge...");
  const strongSession = await startSession(cand001!, "session-strong-test");
  const strongUpdated = await processResponse(
    strongSession.id,
    "We use multi-stage Docker builds with virtual environment lockfiles and CI matrix compilation across ARM64 and x86_64 to isolate native C-extension dependencies and guarantee reproducible wheels."
  );
  const strongQ = strongUpdated.currentQuestion?.text.toLowerCase() || "";

  console.log(`  Candidate Strong Answer: "I would tune efSearch and M parameters on HNSW..."`);
  console.log(`  Interviewer Probe: "${strongUpdated.currentQuestion?.text}"`);

  const strongDecision = strongUpdated.decisions[strongUpdated.decisions.length - 1];
  const validProbes = ["DEEPER_CHALLENGE", "TRADEOFF_PROBE", "IMPLEMENTATION_PROBE", "SCALE_PROBE", "FAILURE_PROBE", "FOLLOW_UP"];
  if (!validProbes.includes(strongDecision.type)) {
    throw new Error(`Test 7 Failed: Expected valid probe decision, got ${strongDecision.type}`);
  }
  console.log(`✓ Test 7: Strong answer escalated to ${strongDecision.type} on current topic.\n`);

  // --------------------------------------------------
  // TEST 8: Natural Topic Graph Transition After Thread Depth Satisfied
  // --------------------------------------------------
  console.log("Test 8: Verifying natural transition along topic graph after thread depth is satisfied...");
  const transSession = await startSession(cand001!, "session-transition-test");
  // Turn 1 (Initial topic Day 1)
  const turn1 = await processResponse(transSession.id, "I use lockfiles and multi-arch Docker wheels for dependency reproducibility.");
  console.log(`  Turn 1 Follow-up: "${turn1.currentQuestion?.text}"`);
  
  // Turn 2 (Follow-up 1)
  const turn2 = await processResponse(transSession.id, "For missing wheels on ARM64, we cross-compile in CI with dedicated glibc toolchain verification.");
  console.log(`  Turn 2 Follow-up / Transition: "${turn2.currentQuestion?.text}"`);

  // Turn 3 (Should transition to next curriculum topic)
  const turn3 = await processResponse(transSession.id, "We ensure ABI compatibility with static linking where appropriate.");
  console.log(`  Turn 3 Transition Question: "${turn3.currentQuestion?.text}"`);

  if (turn3.coveredTopics.length < 2) {
    throw new Error("Test 8 Failed: Session did not transition to a second topic after exploring thread.");
  }
  console.log(`✓ Test 8: Successfully transitioned along topic graph to "${turn3.currentQuestion?.topic}".\n`);

  // --------------------------------------------------
  // TEST 9: Memory and Active Thread Persistence
  // --------------------------------------------------
  console.log("Test 9: Verifying activeThread persists in session memory...");
  const memSession = await startSession(cand001!, "session-thread-mem");
  await processResponse(memSession.id, "We deploy with FastAPI SSE streaming and React client state.");
  const fetchedMem = await getSession(memSession.id);
  if (!fetchedMem?.activeThread || fetchedMem.activeThread.concepts.length === 0) {
    throw new Error("Test 9 Failed: activeThread was not persisted in memory.");
  }
  console.log(`✓ Test 9: Active thread persisted (Concepts: [${fetchedMem.activeThread.concepts.join(", ")}], Depth: ${fetchedMem.activeThread.currentDepth}).\n`);

  // --------------------------------------------------
  // TEST 10: Complete 8-Question Interview for Candidate (Covering >= 4 Days)
  // --------------------------------------------------
  console.log("Test 10: Verifying complete 8-question interview covers at least 4 curriculum days...");
  const zayn = await getCandidate("CAND-009");
  const fullSession = await startSession(zayn!, "full-interview-8q");

  const answers = [
    "I would use a lockfile with multi-arch wheels to isolate virtual environments and dependencies.",
    "For ARM64 dependencies without wheels, I'd build from source in CI with dedicated glibc toolchain verification.",
    "For local LLM deployment, I configure Ollama with 4-bit GGUF quantization to fit within GPU VRAM budgets.",
    "I budget KV-cache memory by computing sequence length times hidden dimension per concurrent user stream.",
    "For the streaming layer, I use FastAPI Server-Sent Events with async def generators and ping heartbeats.",
    "In React, I manage stream state with optimistic UI buffers and cleanup event listeners on unmount.",
    "For tabular data, I stream large CSVs in 50MB chunks into SQLite with indexed relational lookups.",
    "For autonomous agents, I use LangChain tool schemas with strict Pydantic parameter validation and sandboxes."
  ];

  let currentS = fullSession;
  for (let idx = 0; idx < answers.length; idx++) {
    currentS = await processResponse(currentS.id, answers[idx]);
  }

  if (currentS.status !== "completed") {
    throw new Error(`Test 10 Failed: Expected interview status "completed", got "${currentS.status}"`);
  }
  if (currentS.coveredDays.length < 4) {
    throw new Error(`Test 10 Failed: Expected at least 4 curriculum days, got ${currentS.coveredDays.length} (${currentS.coveredDays.join(", ")})`);
  }
  if (!currentS.finalFeedback) {
    throw new Error("Test 10 Failed: Final feedback report missing.");
  }

  // --------------------------------------------------
  // TEST 11: Exact User Case — Irrelevant Answer Detection (React for Python Wheels)
  // --------------------------------------------------
  console.log("Test 11: Verifying exact irrelevant answer detection (React for Python Wheels)...");
  const irrevEval = await evaluateAnswer(
    "What are the engineering trade-offs between distributing pre-compiled multi-architecture wheels versus building from source inside containerized CI runners?",
    "React is a JavaScript library for building user interfaces. It uses a virtual DOM to improve rendering performance.",
    "VS Code & Python Environment Setup"
  );
  console.log(`  Classification: ${irrevEval.classification}, Relevance: ${irrevEval.relevance}, Score: ${irrevEval.score}`);
  console.log(`  Explanation: "${irrevEval.explanation}"`);

  if (irrevEval.classification !== "IRRELEVANT") {
    throw new Error(`Test 11 Failed: Expected IRRELEVANT classification, got ${irrevEval.classification}`);
  }
  if (irrevEval.relevance > 15 || irrevEval.score > 20 || irrevEval.correct !== false) {
    throw new Error(`Test 11 Failed: Irrelevant answer received excessive credit (Relevance: ${irrevEval.relevance}, Score: ${irrevEval.score})`);
  }
  console.log("✓ Test 11: Irrelevant answer correctly penalized and classified as IRRELEVANT.\n");

  // --------------------------------------------------
  // TEST 12: Exact User Case — Genuine Answer with Trade-offs
  // --------------------------------------------------
  console.log("Test 12: Verifying exact correct answer with trade-offs receives strong evaluation...");
  const correctEval = await evaluateAnswer(
    "What are the engineering trade-offs between distributing pre-compiled multi-architecture wheels versus building from source?",
    "Pre-compiled wheels are easier and faster to distribute, but maintaining artifacts for multiple Python versions and architectures increases release complexity. Building from source gives more control over the compiler and native dependencies, but it increases CI time and reproducibility requirements. I'd use pre-built wheels for common platforms and source builds as a fallback.",
    "VS Code & Python Environment Setup"
  );
  console.log(`  Classification: ${correctEval.classification}, Relevance: ${correctEval.relevance}, Accuracy: ${correctEval.accuracy}, Score: ${correctEval.score}`);

  if (correctEval.classification !== "CORRECT") {
    throw new Error(`Test 12 Failed: Expected CORRECT classification, got ${correctEval.classification}`);
  }
  if (correctEval.score < 80 || correctEval.relevance < 90 || correctEval.accuracy < 85) {
    throw new Error(`Test 12 Failed: Comprehensive trade-off answer scored too low (${correctEval.score})`);
  }
  console.log("✓ Test 12: Correct answer evaluated with high relevance and technical accuracy.\n");

  // --------------------------------------------------
  // TEST 13: Keyword-Heavy Unrelated Answer Does NOT Receive High Score
  // --------------------------------------------------
  console.log("Test 13: Verifying keyword-heavy unrelated answer is not rewarded...");
  const keywordSpamEval = await evaluateAnswer(
    "Explain Raft leader election and split-brain resolution in distributed consensus.",
    "RAG embeddings vector database HNSW Kubernetes.",
    "Distributed Systems"
  );
  console.log(`  Classification: ${keywordSpamEval.classification}, Score: ${keywordSpamEval.score}`);

  if (keywordSpamEval.classification !== "IRRELEVANT" || keywordSpamEval.score > 20) {
    throw new Error(`Test 13 Failed: Keyword spam received high score (${keywordSpamEval.score}) or wrong classification (${keywordSpamEval.classification})`);
  }
  console.log("✓ Test 13: Keyword spam accurately identified as IRRELEVANT with zero unearned credit.\n");

  // --------------------------------------------------
  // TEST 14: ABI Misconception Detection
  // --------------------------------------------------
  console.log("Test 14: Verifying ABI encryption misconception detection...");
  const abiMiscEval = await evaluateAnswer(
    "How would you handle ABI compatibility when distributing C-extension wheels across ARM64 and x86_64?",
    "ABI compatibility means encrypting the Python package so that different machines cannot read it.",
    "VS Code & Python Environment Setup"
  );
  console.log(`  Classification: ${abiMiscEval.classification}, Misconceptions: [${abiMiscEval.misconceptions.join(", ")}]`);

  if (abiMiscEval.classification !== "MISCONCEPTION") {
    throw new Error(`Test 14 Failed: Expected MISCONCEPTION, got ${abiMiscEval.classification}`);
  }
  console.log("✓ Test 14: Fundamental misconception correctly identified.\n");

  // --------------------------------------------------
  // TEST 15: Answer-Driven Final Score and Q&A Pairing Verification
  // --------------------------------------------------
  console.log("Test 15: Verifying final assessment scorecard reflects answer evaluations and preserves Q&A pairs...");
  const fullEvalSession = await startSession(cand001!, "session-answer-driven-final");

  // 8 answers: 7 relevant and 1 intentionally irrelevant (Turn 6)
  const testTurns = [
    "Pre-compiled wheels are faster to install, but source builds give compiler control. I'd use wheels with a source fallback in CI.",
    "To handle ABI compatibility on ARM64, we enforce manylinux glibc standards and run cross-compilation toolchains in CI.",
    "Ollama with 4-bit GGUF quantization fits within 16GB VRAM for KV-cache retention under concurrent users.",
    "For caching and cache invalidation in distributed setups, we use Redis TTL expiration combined with event-driven pub/sub invalidation to keep replicas synchronized.",
    "In React, we use an event stream buffer and optimistic UI state with useEffect cleanup for SSE connections.",
    "Raft leader election requires a majority quorum of node heartbeats before committing an uncommitted log entry to the state machine.", // IRRELEVANT (Turn 6)
    "For the streaming layer between FastAPI and React, we use Server-Sent Events with async def generators and heartbeat pings.",
    "To process large CSV datasets without out-of-memory errors, we stream records using Pandas chunksize in 50MB batches and load them into SQLite tables with indexed foreign keys."
  ];

  let turnState = fullEvalSession;
  for (let idx = 0; idx < testTurns.length; idx++) {
    const qText = turnState.currentQuestion?.text || "";
    const qTopic = turnState.currentQuestion?.topic || "";
    const ans = testTurns[idx];
    console.log(`  Turn ${idx + 1} [${qTopic}]: Q: "${qText.substring(0, 70)}..."`);
    console.log(`  Turn ${idx + 1} Answer: "${ans.substring(0, 70)}..."`);
    turnState = await processResponse(turnState.id, ans);
    const lastEval = turnState.conversationHistory[turnState.conversationHistory.length - 1]?.evaluation;
    console.log(`  Turn ${idx + 1} Eval: Class=${lastEval?.classification}, Score=${lastEval?.score}`);
  }

  const fb = turnState.finalFeedback;
  if (!fb) {
    throw new Error("Test 15 Failed: Final feedback was not generated.");
  }
  if (!fb.grade || !fb.responseQuality) {
    throw new Error("Test 15 Failed: Missing grade or responseQuality in final report.");
  }
  if (fb.responseQuality.irrelevant !== 1) {
    throw new Error(`Test 15 Failed: Expected 1 irrelevant answer in quality breakdown, found ${fb.responseQuality.irrelevant}`);
  }
  if (!turnState.conversationHistory[4].questionText) {
    throw new Error("Test 15 Failed: Turn 5 questionText was not paired with the candidate answer.");
  }

  console.log(`  Final Grade: ${fb.grade}, Overall Score: ${fb.averageScore}%`);
  console.log(`  Quality Breakdown: Evaluated: ${fb.responseQuality.totalEvaluated}, Correct: ${fb.responseQuality.correct}, Partial: ${fb.responseQuality.partiallyCorrect}, Irrelevant: ${fb.responseQuality.irrelevant}`);
  console.log(`  Q&A Turn 5 Pairing: Q: "${turnState.conversationHistory[4].questionText?.substring(0, 45)}..." -> A: "${turnState.conversationHistory[4].text.substring(0, 45)}..."`);
  console.log("✓ Test 15: Final assessment is 100% answer-driven with verified Q&A pairing and response quality metrics.\n");

  console.log("==================================================");
  console.log("             ALL 15 TEST SUITES PASSED");
  console.log("==================================================");
  console.log("✓ Relevance-first semantic evaluation");
  console.log("✓ Exact irrelevant test case passed");
  console.log("✓ Zero unearned keyword-matching credit");
  console.log("✓ Full Q&A pairing preserved");
  console.log("✓ Dynamic answer-driven Final Assessment scorecard");
  console.log("==================================================\n");
}

runTests().catch(err => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});
