import { getCandidate, Candidate } from "@/data/candidate";
import { getCurriculum } from "@/data/curriculum";
import { generateInterviewPlan } from "./planner";
import { generateQuestion } from "./question-generator";
import { evaluateAnswer } from "./evaluator";
import { evaluateFollowUpNecessity } from "./follow-up";
import { adaptDifficultyAndGoal } from "./adaptation";
import { createInitialMemory, updateMemory } from "./memory";
import { InterviewSession, InterviewQuestion, InterviewResponse, AgentDecision } from "@/types/interview";

// In-memory session persistence database
export const sessionsDb: Record<string, InterviewSession> = {};

// Global registry of all asked question texts across all candidates and sessions
export const globalAskedQuestions = new Set<string>();

function cleanText(text: string): string[] {
  const stopwords = new Set([
    "the", "a", "an", "explain", "how", "what", "is", "would", "you", "to", "in", "for", 
    "with", "of", "and", "your", "design", "production", "system", "use", "why", 
    "mentioned", "reason", "storing", "describe", "discuss", "concerning", "regarding", "about"
  ]);
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
    .replace(/\s+/g, " ")
    .split(" ")
    .filter((w) => w && !stopwords.has(w));
}

export function isSemanticallySimilar(textA: string, textB: string): boolean {
  if (!textA || !textB) return false;
  if (textA.trim().toLowerCase() === textB.trim().toLowerCase()) return true;

  const wordsA = cleanText(textA);
  const wordsB = cleanText(textB);
  if (wordsA.length === 0 || wordsB.length === 0) return false;

  const setA = new Set(wordsA);
  const setB = new Set(wordsB);

  let intersection = 0;
  setA.forEach((w) => {
    if (setB.has(w)) intersection++;
  });

  const union = setA.size + setB.size - intersection;
  const jaccard = intersection / union;
  return jaccard > 0.65;
}

export async function getSession(id: string): Promise<InterviewSession | null> {
  return sessionsDb[id] || null;
}

export async function startSession(
  candidateIdOrObject: string | Candidate,
  customSessionId?: string
): Promise<InterviewSession> {
  if (customSessionId && sessionsDb[customSessionId]) {
    return sessionsDb[customSessionId];
  }

  let candidate: Candidate;
  let candidateId: string;

  if (typeof candidateIdOrObject === "string") {
    candidateId = candidateIdOrObject;
    const loaded = await getCandidate(candidateId);
    if (!loaded) {
      throw new Error(`Candidate with ID ${candidateId} not found.`);
    }
    candidate = loaded;
  } else {
    candidate = candidateIdOrObject;
    candidateId = candidate.id || candidate.member.id;
  }

  const curriculum = await getCurriculum();
  const rawPlan = generateInterviewPlan(candidate, curriculum);

  const initialMemory = createInitialMemory();

  // Pick the first item in the plan and generate initial question with global uniqueness check
  const firstPlanItem = rawPlan[0];
  const globalList = Array.from(globalAskedQuestions);
  
  let initialQuestionText = await generateQuestion({
    candidate,
    topic: firstPlanItem.topic,
    difficulty: firstPlanItem.difficulty,
    type: firstPlanItem.type,
    memory: initialMemory,
    globalAskedQuestions: globalList,
  });

  // Verify against global asked questions
  let initAttempts = 0;
  let isGlobalDup = globalList.some(q => isSemanticallySimilar(initialQuestionText, q));
  while (isGlobalDup && initAttempts < 5) {
    initAttempts++;
    initialQuestionText = await generateQuestion({
      candidate,
      topic: firstPlanItem.topic,
      difficulty: firstPlanItem.difficulty,
      type: firstPlanItem.type,
      memory: initialMemory,
      globalAskedQuestions: globalList,
    });
    isGlobalDup = globalList.some(q => isSemanticallySimilar(initialQuestionText, q));
  }

  initialMemory.previousFollowUps.push(initialQuestionText);
  globalAskedQuestions.add(initialQuestionText);

  const firstQuestion: InterviewQuestion = {
    id: "q_1",
    challengeNumber: 1,
    curriculumDay: firstPlanItem.curriculumDay,
    domain: firstPlanItem.domain,
    topic: firstPlanItem.topic,
    type: firstPlanItem.type,
    text: initialQuestionText,
    difficulty: firstPlanItem.difficulty,
  };

  const sessionId = customSessionId || `session_${Math.random().toString(36).substring(2, 11)}`;

  const newSession: InterviewSession = {
    id: sessionId,
    candidateId,
    candidate,
    plan: rawPlan,
    startedAt: new Date().toISOString(),
    currentQuestion: firstQuestion,
    questionCount: 1,
    maxQuestions: 8,
    conversationHistory: [],
    coveredDays: [firstPlanItem.curriculumDay],
    coveredTopics: [firstPlanItem.topic],
    strengths: [],
    weaknesses: [],
    difficulty: firstPlanItem.difficulty,
    pendingFollowUp: false,
    status: "ready",
    memory: initialMemory,
    decisions: [],
    evaluations: [],
  };

  sessionsDb[sessionId] = newSession;
  return newSession;
}

export async function processResponse(
  sessionId: string,
  answerText: string
): Promise<InterviewSession> {
  const session = sessionsDb[sessionId];
  if (!session) {
    throw new Error(`Session with ID ${sessionId} not found.`);
  }

  const currentQuestion = session.currentQuestion;
  if (!currentQuestion) {
    throw new Error("No active question to respond to.");
  }

  let candidate: Candidate = session.candidate;
  if (!candidate) {
    const loaded = await getCandidate(session.candidateId);
    if (!loaded) {
      throw new Error(`Candidate with ID ${session.candidateId} not found.`);
    }
    candidate = loaded;
    session.candidate = candidate;
  }

  session.status = "thinking";

  // 1. Run Answer Evaluation
  const evaluation = await evaluateAnswer(currentQuestion.text, answerText, currentQuestion.topic);

  // 2. Append response and evaluation results to history
  const responseEntry: InterviewResponse = {
    questionId: currentQuestion.id,
    text: answerText,
    submittedAt: new Date().toISOString(),
    evaluation,
  };
  session.conversationHistory.push(responseEntry);

  if (!session.evaluations) {
    session.evaluations = [];
  }
  session.evaluations.push(evaluation);

  // 3. Update memory
  session.memory = updateMemory(
    session.memory,
    currentQuestion.id,
    answerText,
    evaluation,
    session.difficulty,
    currentQuestion.topic
  );

  // Sync session lists
  session.strengths = [...session.memory.strengths];
  session.weaknesses = [...session.memory.weaknesses];

  // 4. Calculate consecutive low scores for adaptation bounds
  let consecutiveLowScores = 0;
  for (let i = session.conversationHistory.length - 1; i >= 0; i--) {
    const ev = session.conversationHistory[i].evaluation;
    if (ev && ev.score < 55) {
      consecutiveLowScores++;
    } else {
      break;
    }
  }

  // 5. Run Adaptation Rules
  const adaptation = adaptDifficultyAndGoal(evaluation, session.difficulty, consecutiveLowScores);
  session.difficulty = adaptation.nextDifficulty;

  // 6. Run Follow-Up checks (consecutive follow-ups for the active topic only)
  let consecutiveFollowUpsCount = 0;
  for (let i = session.conversationHistory.length - 1; i >= 0; i--) {
    const entry = session.conversationHistory[i];
    if (entry.questionId.includes("_followup")) {
      consecutiveFollowUpsCount++;
    } else {
      break;
    }
  }

  const followUpDecision = evaluateFollowUpNecessity(
    currentQuestion,
    answerText,
    evaluation,
    consecutiveFollowUpsCount
  );

  // 7. Log explicit AgentDecision for explainability
  const decision: AgentDecision = {
    type: adaptation.decisionType,
    reason: `${adaptation.reason} | Follow-up choice: ${followUpDecision.reason}`,
    targetConcept: currentQuestion.topic,
    difficulty: session.difficulty,
    curriculumDay: currentQuestion.curriculumDay,
  };
  session.decisions.push(decision);

  // 8. Determine Next Step (Check if interview is completed)
  if (session.questionCount >= session.maxQuestions) {
    session.currentQuestion = null;
    session.status = "completed";

    // Build the final feedback scorecard
    const scores = session.conversationHistory
      .map((h) => h.evaluation?.score || 0)
      .filter((s) => s > 0);
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const summaryText = `The candidate demonstrated ${session.difficulty} capability on ${session.coveredTopics.join(", ")}. The average score was ${averageScore}% with structured technical reasoning.`;
    
    // Deduping strengths and gaps
    const finalStrengths = Array.from(new Set([
      ...session.strengths,
      "Demonstrated system architecture and trade-off awareness under rigorous technical probing."
    ])).slice(0, 4);

    const finalGaps = Array.from(new Set([
      ...session.weaknesses,
      ...session.memory.misconceptions,
      "Requires deeper familiarity with production edge cases and scaling bottlenecks."
    ])).slice(0, 4);

    const nextActions = [
      `Review advanced parameters and failure modes for ${session.coveredTopics[0] || "core topics"}.`,
      "Practice edge-case recovery and high-concurrency bottleneck analysis.",
      "Study observability metrics and tracing in distributed production workloads."
    ];

    session.finalFeedback = {
      summary: summaryText,
      strengths: finalStrengths,
      gaps: finalGaps,
      next: nextActions,
      averageScore,
      technicalDepth: Number((session.conversationHistory.reduce((acc, h) => acc + (h.evaluation?.technicalDepth || 0), 0) / (session.conversationHistory.filter(h => h.evaluation).length || 1)).toFixed(1)),
      reasoning: Number((session.conversationHistory.reduce((acc, h) => acc + (h.evaluation?.reasoning || 0), 0) / (session.conversationHistory.filter(h => h.evaluation).length || 1)).toFixed(1)),
      accuracy: Number((session.conversationHistory.reduce((acc, h) => acc + (h.evaluation?.accuracy || 0), 0) / (session.conversationHistory.filter(h => h.evaluation).length || 1)).toFixed(1)),
      communication: Number((session.conversationHistory.reduce((acc, h) => acc + (h.evaluation?.communication || 0), 0) / (session.conversationHistory.filter(h => h.evaluation).length || 1)).toFixed(1)),
      decisions: session.decisions,
      coveredTopics: session.coveredTopics,
    };

    sessionsDb[sessionId] = session;
    return session;
  }

  // Prepare next question properties
  let nextType: "standard" | "follow-up" | "next-domain" | "final" = "next-domain";
  let nextTopic = currentQuestion.topic;
  let nextDomain = currentQuestion.domain;
  let nextDay = currentQuestion.curriculumDay;

  const curriculum = await getCurriculum();
  const rawPlan = generateInterviewPlan(candidate, curriculum);

  if (followUpDecision.shouldFollowUp) {
    nextType = "follow-up";
    session.pendingFollowUp = true;
  } else {
    session.pendingFollowUp = false;
    // Find the next planned topic in rawPlan by current questionCount index directly
    let nextPlanIdx = session.questionCount;
    if (nextPlanIdx >= rawPlan.length) nextPlanIdx = rawPlan.length - 1;
    const nextPlanItem = rawPlan[nextPlanIdx];

    nextType = nextPlanItem.type;
    nextTopic = nextPlanItem.topic;
    nextDomain = nextPlanItem.domain;
    nextDay = nextPlanItem.curriculumDay;
  }

  // Final question check overrides type
  if (session.questionCount === session.maxQuestions - 1) {
    nextType = "final";
  }

  // 9. Generate the next question with deduplication retry check across session and platform
  let nextQuestionText = "";
  let attempts = 0;
  let isDuplicate = true;
  const globalList = Array.from(globalAskedQuestions);

  while (isDuplicate && attempts < 10) {
    nextQuestionText = await generateQuestion({
      candidate,
      topic: nextTopic,
      difficulty: session.difficulty,
      type: nextType,
      memory: session.memory,
      previousQuestionText: currentQuestion.text,
      previousAnswerText: answerText,
      previousEvaluation: evaluation,
      globalAskedQuestions: globalList,
    });

    attempts++;
    isDuplicate = false;

    // Check semantic similarity against this candidate's session memory
    for (const askedQ of session.memory.previousFollowUps) {
      if (isSemanticallySimilar(nextQuestionText, askedQ)) {
        isDuplicate = true;
        break;
      }
    }

    // Check semantic similarity against globally asked questions across all candidates
    if (!isDuplicate) {
      for (const globalQ of globalAskedQuestions) {
        if (isSemanticallySimilar(nextQuestionText, globalQ)) {
          isDuplicate = true;
          break;
        }
      }
    }

    // If duplicate is flagged, shift to next topic/angle in rawPlan and regenerate
    if (isDuplicate) {
      let currentPlanIdx = session.questionCount;
      let nextPlanIdx = (currentPlanIdx + attempts) % rawPlan.length;
      const nextPlanItem = rawPlan[nextPlanIdx];

      nextType = nextPlanItem.type;
      nextTopic = nextPlanItem.topic;
      nextDomain = nextPlanItem.domain;
      nextDay = nextPlanItem.curriculumDay;
    }
  }

  // Record accepted unique question text in both session memory and global registry
  session.memory.previousFollowUps.push(nextQuestionText);
  globalAskedQuestions.add(nextQuestionText);

  // Extract clean context quote from candidate's answer for follow-ups
  const answerSnippet = answerText.length > 50 ? `${answerText.substring(0, 48)}...` : answerText;

  const nextQuestion: InterviewQuestion = {
    id: `q_${session.questionCount + 1}${nextType === "follow-up" ? "_followup" : ""}`,
    challengeNumber: session.questionCount + 1,
    curriculumDay: nextDay,
    domain: nextDomain,
    topic: nextTopic,
    type: nextType,
    text: nextQuestionText,
    difficulty: session.difficulty,
    contextText: nextType === "follow-up" ? `Regarding your statement: "${answerSnippet}"` : undefined,
  };

  // Update session
  session.currentQuestion = nextQuestion;
  session.questionCount += 1;
  if (!session.coveredDays.includes(nextDay)) {
    session.coveredDays.push(nextDay);
  }
  if (!session.coveredTopics.includes(nextTopic)) {
    session.coveredTopics.push(nextTopic);
  }
  session.status = "ready";

  sessionsDb[sessionId] = session;
  return session;
}

export async function compileFinalReport(sessionId: string): Promise<any> {
  const session = sessionsDb[sessionId];
  if (!session) {
    throw new Error(`Session with ID ${sessionId} not found.`);
  }

  const scores = session.conversationHistory
    .map((h) => h.evaluation?.score || 0)
    .filter((s) => s > 0);

  const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return {
    sessionId,
    candidateId: session.candidateId,
    averageScore,
    totalQuestions: session.conversationHistory.length,
    coveredDaysCount: session.coveredDays.length,
    coveredTopics: session.coveredTopics,
    strengths: session.strengths,
    weaknesses: session.weaknesses,
    misconceptions: session.memory.misconceptions,
    trajectory: session.memory.difficultyTrajectory,
    decisions: session.decisions,
  };
}
