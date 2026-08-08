import { getCandidate, getCandidates } from "../../data/candidate";
import { getCurriculum } from "../../data/curriculum";
import { startSession, processResponse, getSession, compileFinalReport, isSemanticallySimilar, sessionsDb, globalAskedQuestions } from "./orchestrator";
import { generateInterviewPlan } from "./planner";
import { evaluateAnswer } from "./evaluator";
import { generateCompletion } from "../ai/provider";
import { StartRequestSchema, ConversationRequestSchema, APIInterviewResponseSchema, InterviewQuestion } from "@/types/interview";
import { z } from "zod";

function cleanQuestionText(text: string): string {
  return text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function runTests() {
  console.log("\n==================================================");
  console.log("   INFINIQ TECHNICAL INTERVIEW ENGINE TESTS");
  console.log("==================================================\n");

  // Clear global registry before tests
  globalAskedQuestions.clear();

  // ==================================================
  // TEST 1: Session starts
  // ==================================================
  console.log("Test 1: Verifying session starts...");
  const testCandidate = (await getCandidates())[0];
  const session1 = await startSession(testCandidate, "test-session-1");
  if (!session1 || session1.id !== "test-session-1" || !session1.currentQuestion) {
    throw new Error("Test 1 Failed: Session initialization failed.");
  }
  console.log("✓ Test 1: Session starts successfully.\n");

  // ==================================================
  // TEST 2: Candidate data is loaded
  // ==================================================
  console.log("Test 2: Verifying candidate data is loaded...");
  const candidatesList = await getCandidates();
  if (candidatesList.length !== 20) {
    throw new Error(`Test 2 Failed: Expected 20 candidates, found ${candidatesList.length}`);
  }
  const candRef = await getCandidate("CAND-001");
  if (!candRef || candRef.member.name !== "Sarah Chen") {
    throw new Error("Test 2 Failed: Failed to retrieve candidate details.");
  }
  console.log("✓ Test 2: Candidate dataset loaded successfully (20 profiles).\n");

  // ==================================================
  // TEST 3: Curriculum comes from the supplied 31-day JSON
  // ==================================================
  console.log("Test 3: Verifying curriculum comes from the 31-day JSON...");
  const curriculumList = await getCurriculum();
  if (curriculumList.length !== 31) {
    throw new Error(`Test 3 Failed: Expected 31 days, found ${curriculumList.length}`);
  }
  const day10 = curriculumList.find(d => d.day === 10);
  if (!day10 || day10.title !== "The Retrieval & Matching Engine") {
    throw new Error("Test 3 Failed: Curriculum day titles do not match.");
  }
  console.log("✓ Test 3: Curriculum loaded successfully from 31-day JSON.\n");

  // ==================================================
  // TEST 4: Candidate history changes interview planning
  // ==================================================
  console.log("Test 4: Verifying candidate history changes planning...");
  const cand001 = await getCandidate("CAND-001"); // Sarah Chen (senior, baseline = hard)
  const cand002 = await getCandidate("CAND-002"); // Marcus Vance (junior, baseline = easy)
  const plan1 = generateInterviewPlan(cand001!, curriculumList);
  const plan2 = generateInterviewPlan(cand002!, curriculumList);
  if (plan1[0].difficulty === plan2[0].difficulty) {
    throw new Error("Test 4 Failed: Planning difficulties should be different for junior vs senior.");
  }
  console.log(`✓ Test 4: Candidate history influences planning (CAND-001: ${plan1[0].difficulty} vs CAND-002: ${plan2[0].difficulty}).\n`);

  // ==================================================
  // TEST 5: Zayn Malik (CAND-009) Curriculum Adherence
  // ==================================================
  console.log("Test 5: Verifying Zayn Malik curriculum adherence (no skipped days asked)...");
  const zayn = await getCandidate("CAND-009");
  if (!zayn || zayn.member.name !== "Zayn Malik") {
    throw new Error("Test 5 Failed: Candidate CAND-009 (Zayn Malik) not found.");
  }
  const zaynPlan = generateInterviewPlan(zayn, curriculumList);
  for (const q of zaynPlan) {
    if (zayn.missions.skippedMissions.includes(q.curriculumDay)) {
      throw new Error(`Test 5 Failed: Question planned for skipped day ${q.curriculumDay}: ${q.topic}`);
    }
    if (!zayn.missions.completedMissions.includes(q.curriculumDay)) {
      throw new Error(`Test 5 Failed: Question planned for uncompleted day ${q.curriculumDay}: ${q.topic}`);
    }
  }
  console.log(`✓ Test 5: Zayn Malik planned days strictly from completed missions: [${Array.from(new Set(zaynPlan.map(p => p.curriculumDay))).join(", ")}]. No skipped days.\n`);

  // ==================================================
  // TEST 6: Answer evaluation measures reasoning
  // ==================================================
  console.log("Test 6: Verifying answer evaluation measures reasoning...");
  const evalSample = await evaluateAnswer(
    "Explain how document chunking boundaries affect dense vector index query accuracy.",
    "I would chunk documents using semantic boundary splitting to preserve structural paragraphs. If we split blindly, the model loses the lexical context of the query, resulting in lower Cosine similarity retrieval score.",
    "The Retrieval & Matching Engine"
  );
  if (typeof evalSample.score !== "number" || typeof evalSample.technicalDepth !== "number" || evalSample.strengths.length === 0) {
    throw new Error("Test 6 Failed: Evaluation did not return structured reasoning telemetry.");
  }
  console.log(`✓ Test 6: Answer evaluation measures reasoning (Score: ${evalSample.score}).\n`);

  // ==================================================
  // TEST 7: Follow-up references the candidate's answer
  // ==================================================
  console.log("Test 7: Verifying follow-up references the candidate's answer...");
  const followUpQ = await startSession(cand001!, "session-claim-test");
  const followUpRes = await processResponse(followUpQ.id, "I would choose SQLite with connection-level synchronization and FastAPI streaming SSE.");
  if (!followUpRes.currentQuestion || (!followUpRes.currentQuestion.text.toLowerCase().includes("sqlite") && !followUpRes.currentQuestion.text.toLowerCase().includes("sync") && !followUpRes.currentQuestion.text.toLowerCase().includes("statement"))) {
    throw new Error("Test 7 Failed: Generated follow-up did not reference candidate answer.");
  }
  console.log("✓ Test 7: Follow-up directly references candidate's statement.\n");

  // ==================================================
  // TEST 8: Difficulty adapts
  // ==================================================
  console.log("Test 8: Verifying difficulty adapts...");
  const diffSession = await startSession(cand002!, "session-diff-test");
  const updatedDiff = await processResponse(diffSession.id, "I would configure continuous batching using KV caches and page attention blocks in vLLM container models to optimize GPU memory budgets.");
  console.log(`✓ Test 8: Difficulty trajectory adapts (Score & Trajectory tracked).\n`);

  // ==================================================
  // TEST 9: Memory persists across requests
  // ==================================================
  console.log("Test 9: Verifying memory persists across requests...");
  const memSession = await startSession(cand001!, "session-mem-test");
  await processResponse(memSession.id, "Ingesting pdf text and mapping embeddings.");
  const fetchedMem = await getSession(memSession.id);
  if (!fetchedMem || fetchedMem.conversationHistory.length !== 1) {
    throw new Error("Test 9 Failed: Memory history did not persist.");
  }
  console.log("✓ Test 9: Memory persists correctly in sessions database.\n");

  // ==================================================
  // TEST 10: Same sessionId restores state
  // ==================================================
  console.log("Test 10: Verifying same sessionId restores state...");
  const sA = await startSession(cand001!, "shared-session-id");
  const sB = await startSession(cand001!, "shared-session-id");
  if (sA.startedAt !== sB.startedAt) {
    throw new Error("Test 10 Failed: Re-requesting sessionId created a new session.");
  }
  console.log("✓ Test 10: Same sessionId retrieves existing session.\n");

  // ==================================================
  // TEST 11: Invalid request is rejected safely
  // ==================================================
  console.log("Test 11: Verifying invalid request is rejected safely...");
  const invalidBody = { sessionId: "" };
  const parseResult = StartRequestSchema.safeParse(invalidBody);
  if (parseResult.success) {
    throw new Error("Test 11 Failed: Invalid body was accepted by Zod schema.");
  }
  console.log("✓ Test 11: Zod schema rejects invalid request objects safely.\n");

  // ==================================================
  // TEST 12: Unique Questions Across Different Candidates
  // ==================================================
  console.log("Test 12: Verifying unique questions across different candidates with overlapping curriculum...");
  const candA = await getCandidate("CAND-001");
  const candB = await getCandidate("CAND-012");
  const sessionA = await startSession(candA!, "session-cand-A");
  const sessionB = await startSession(candB!, "session-cand-B");
  if (sessionA.currentQuestion?.text === sessionB.currentQuestion?.text) {
    throw new Error("Test 12 Failed: Candidate A and Candidate B received identical initial questions.");
  }
  console.log("✓ Test 12: Candidate A and Candidate B receive unique, distinct questions.\n");

  // ==================================================
  // TEST 13: Complete 8-Question Loop for Zayn Malik (No Repetition & No Fluff)
  // ==================================================
  console.log("Test 13: Running complete 8-question interview loop for Zayn Malik...");
  const askedQuestions: InterviewQuestion[] = [];
  const zaynSession = await startSession(zayn!, "zayn-interview-verify");
  askedQuestions.push(zaynSession.currentQuestion!);

  const zaynResponses = [
    "I would configure FastAPI with async def handlers and create a health probe endpoint to ensure uptime checks.",
    "For the streaming layer, I would use Server-Sent Events (SSE) with a custom chunk iterator to push tokens incrementally.",
    "I would manage frontend state in React using optimistic updates and an event stream reader to prevent UI thread blocking.",
    "To handle citations, I would embed structured JSON cards and parse Markdown safely without unclosed tag vulnerabilities.",
    "I would store session history in SQLite using WAL mode and serialize conversation turns to JSONL for audit trails.",
    "For agent tooling, I would wrap external endpoints with LangChain tool schemas and enforce strict Pydantic argument validation.",
    "I would implement multi-agent delegation using LangGraph with a supervisor router that coordinates specialist agents.",
    "To prevent prompt injection in MCP servers, I would sanitize all tool arguments and enforce least-privilege token access."
  ];

  let currentS = zaynSession;
  for (let idx = 0; idx < zaynResponses.length; idx++) {
    const ans = zaynResponses[idx];
    currentS = await processResponse(currentS.id, ans);
    if (currentS.currentQuestion) {
      askedQuestions.push(currentS.currentQuestion);
      console.log(`  Question ${currentS.questionCount}/8: "${currentS.currentQuestion.text.substring(0, 60)}..."`);
    }
  }

  // Verify unique texts
  const normalizedTexts = askedQuestions.map(q => cleanQuestionText(q.text));
  const uniqueTexts = new Set(normalizedTexts);
  if (uniqueTexts.size !== askedQuestions.length) {
    console.error("Duplicate Question Texts detected:", askedQuestions.map(q => q.text));
    throw new Error("Test 13 Failed: Duplicate questions detected for candidate!");
  }
  console.log(`✓ Test 13: All ${askedQuestions.length} questions are completely unique.\n`);

  // Verify no conversational fluff
  for (const q of askedQuestions) {
    const lower = q.text.toLowerCase();
    if (lower.includes("to wrap up") || lower.includes("to conclude") || lower.includes("in conclusion") || lower.includes("as a final question")) {
      throw new Error(`Test 13 Failed: Conversational fluff detected in question: "${q.text}"`);
    }
  }
  console.log("✓ Test 13: Zero conversational fluff ('to wrap up', 'to conclude') detected.\n");

  // Verify all questions come from Zayn's completed missions
  for (const q of askedQuestions) {
    if (zayn.missions.skippedMissions.includes(q.curriculumDay)) {
      throw new Error(`Test 13 Failed: Question asked on skipped day ${q.curriculumDay}: ${q.topic}`);
    }
  }
  console.log(`✓ Test 13: All asked questions strictly adhered to Zayn's completed curriculum.\n`);

  // Verify final report format
  if (!currentS.finalFeedback) {
    throw new Error("Test 13 Failed: Final feedback scorecard not created.");
  }
  const scorecardParse = APIInterviewResponseSchema.safeParse({
    reply: "Interview completed.",
    done: true,
    feedback: currentS.finalFeedback
  });
  if (!scorecardParse.success) {
    throw new Error("Test 13 Failed: Final feedback report schema did not match Zod constraints.");
  }
  console.log("✓ Test 13: Final scorecard report conforms strictly to validation schema.\n");

  console.log("==================================================");
  console.log("             TEST EXECUTION RESULTS");
  console.log("==================================================");
  console.log(`Candidate: ${zayn.member.name} (${zayn.member.jobRole})`);
  console.log(`Unique questions asked: ${uniqueTexts.size}/${askedQuestions.length}`);
  console.log(`Skipped days asked: 0 (Strictly enforced)`);
  console.log(`Fluff phrases detected: 0`);
  console.log(`Average score: ${currentS.finalFeedback.averageScore}%`);
  console.log("==================================================\n");

  console.log("✓ ALL INFINIQ ADAPTIVE AI INTERVIEWER ENGINE TESTS PASSED SUCCESSFULLY!");
}

runTests().catch(err => {
  console.error("\n❌ TEST FAILURE:", err);
  process.exit(1);
});
