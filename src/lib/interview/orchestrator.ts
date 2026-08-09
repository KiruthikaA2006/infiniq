import { getCandidate, Candidate } from "@/data/candidate";
import { getCurriculum } from "@/data/curriculum";
import { generateInterviewPlan } from "./planner";
import { generateQuestion } from "./question-generator";
import { evaluateAnswer } from "./evaluator";
import { evaluateFollowUpNecessity } from "./follow-up";
import { adaptDifficultyAndGoal } from "./adaptation";
import { createInitialMemory, updateMemory } from "./memory";
import { extractCandidateClaims } from "./claim-extractor";
import { findBestTransitionTopic } from "./topic-graph";
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

export async function getAllSessions(): Promise<InterviewSession[]> {
  const sessions = Object.values(sessionsDb);
  if (sessions.length === 0) {
    // Seed initial realistic sessions using actual candidates for instant history availability
    try {
      const cand001 = await getCandidate("CAND-001");
      const cand003 = await getCandidate("CAND-003");
      const cand009 = await getCandidate("CAND-009");

      if (cand001) {
        sessionsDb["session_sarah_chen"] = {
          id: "session_sarah_chen",
          candidateId: cand001.id,
          candidate: cand001,
          startedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          currentQuestion: null,
          questionCount: 8,
          maxQuestions: 8,
          conversationHistory: [
            {
              questionId: "q_1",
              text: "We use a multi-stage Docker build with virtual environment lockfiles and CI matrix compilation.",
              submittedAt: new Date(Date.now() - 3600000 * 2 + 120000).toISOString(),
              evaluation: {
                score: 86,
                classification: "CORRECT",
                relevance: 90,
                technicalDepth: 86,
                reasoning: 85,
                accuracy: 90,
                communication: 84,
                tradeoffAwareness: 85,
                correct: true,
                explanation: "Clear architectural decomposition addressing cross-platform wheel compatibility and containerization.",
                strengths: ["Clear architectural decomposition", "Addressed cross-platform wheel compatibility"],
                weaknesses: [],
                conceptsMentioned: ["VS Code & Python Environment Setup", "Docker", "Lockfiles"],
                misconceptions: [],
                missingConcepts: [],
                followUpNeeded: true,
                followUpReason: "Probe ARM64 C-extension builds.",
                recommendedDifficulty: "hard",
              },
            },
          ],
          coveredDays: [1, 2, 3, 16],
          coveredTopics: [
            "VS Code & Python Environment Setup",
            "Local LLM & AI Coding Assistant Setup",
            "First AI Project, React Frontend & GitHub",
            "Chatbot Backend & API Integration",
          ],
          strengths: [
            "Exceptional distributed systems architecture",
            "Deep understanding of low-level concurrency and memory layouts",
            "Clear trade-off justification across latency and consistency",
          ],
          weaknesses: [
            "Could elaborate further on cold-start latency mitigation for edge models",
          ],
          difficulty: "hard",
          pendingFollowUp: false,
          status: "completed",
          memory: {
            strengths: ["Distributed systems architecture", "Memory layout optimizations"],
            weaknesses: ["Edge model cold-starts"],
            misconceptions: [],
            coveredTopics: ["VS Code & Python Environment Setup", "Chatbot Backend & API Integration"],
            claims: [{ topic: "VS Code & Python Environment Setup", claim: "Docker multi-stage builds for wheels", confidence: "high" }],
            difficultyTrajectory: [{ questionId: "q_1", difficulty: "hard", score: 86 }],
            previousFollowUps: [],
          },
          decisions: [
            {
              type: "FOLLOW_UP",
              transition: "FOLLOW_UP",
              reason: "Strong response | Strategy: Probe ARM64 C-extension builds",
              targetConcept: "C-extension isolation",
              targetTopic: "VS Code & Python Environment Setup",
              targetDay: 1,
              difficulty: "hard",
              probeType: "CLAIM_PROBE",
              curriculumDay: 1,
              referencesPreviousAnswer: true,
            },
            {
              type: "NEW_TOPIC",
              transition: "NEW_TOPIC",
              reason: "Thread depth reached | Strategy: Transition to Local LLM & AI Coding Assistant Setup",
              targetConcept: "Local LLM inference",
              targetTopic: "Local LLM & AI Coding Assistant Setup",
              targetDay: 2,
              difficulty: "hard",
              probeType: "NEW_TOPIC",
              curriculumDay: 2,
              referencesPreviousAnswer: false,
            },
          ],
          finalFeedback: {
            summary: "The candidate demonstrated senior-level capability across core environments, local inference, and API architectures with an average score of 88%.",
            strengths: [
              "Demonstrated system architecture and trade-off awareness under rigorous technical probing.",
              "Deep understanding of low-level concurrency and memory layouts",
              "Clear trade-off justification across latency and consistency",
            ],
            gaps: [
              "Could elaborate further on cold-start latency mitigation for edge models",
            ],
            next: [
              "Review advanced parameters and failure modes for distributed inference.",
              "Practice edge-case recovery and high-concurrency bottleneck analysis.",
              "Study observability metrics and tracing in distributed production workloads.",
            ],
            averageScore: 88,
            technicalDepth: 4.6,
            reasoning: 4.5,
            accuracy: 4.7,
            communication: 4.4,
            coveredTopics: [
              "VS Code & Python Environment Setup",
              "Local LLM & AI Coding Assistant Setup",
              "First AI Project, React Frontend & GitHub",
              "Chatbot Backend & API Integration",
            ],
          },
        };
      }

      if (cand003) {
        sessionsDb["session_priya_nair"] = {
          id: "session_priya_nair",
          candidateId: cand003.id,
          candidate: cand003,
          startedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
          currentQuestion: null,
          questionCount: 8,
          maxQuestions: 8,
          conversationHistory: [],
          coveredDays: [3, 17, 18, 19],
          coveredTopics: [
            "First AI Project, React Frontend & GitHub",
            "Chatbot Frontend Development",
            "Full-Stack Integration & Streaming Responses",
            "Response Formatting & Rich Outputs",
          ],
          strengths: [
            "Strong grasp of frontend fundamentals and React state machines",
            "Clear understanding of Server-Sent Events streaming protocols",
            "Clean component modularity and responsive UI design",
          ],
          weaknesses: [
            "Advanced React patterns need deeper experience",
            "State management depth is moderate under high streaming concurrency",
          ],
          difficulty: "medium",
          pendingFollowUp: false,
          status: "completed",
          memory: {
            strengths: ["Frontend fundamentals", "SSE Streaming"],
            weaknesses: ["High streaming concurrency state machines"],
            misconceptions: [],
            coveredTopics: ["Chatbot Frontend Development"],
            claims: [{ topic: "Chatbot Frontend Development", claim: "Optimistic React state updates with SSE", confidence: "high" }],
            difficultyTrajectory: [{ questionId: "q_1", difficulty: "medium", score: 81 }],
            previousFollowUps: [],
          },
          decisions: [
            {
              type: "FOLLOW_UP",
              transition: "FOLLOW_UP",
              reason: "Standard response | Strategy: Probe client-side backpressure",
              targetConcept: "React state management",
              targetTopic: "Chatbot Frontend Development",
              targetDay: 17,
              difficulty: "medium",
              probeType: "CLAIM_PROBE",
              curriculumDay: 17,
              referencesPreviousAnswer: true,
            },
          ],
          finalFeedback: {
            summary: "Priya demonstrated solid frontend architecture and streaming response handling with an overall score of 81%.",
            strengths: [
              "Strong grasp of frontend fundamentals and React state machines",
              "Clear understanding of Server-Sent Events streaming protocols",
              "Clean component modularity and responsive UI design",
            ],
            gaps: [
              "Advanced React patterns need deeper experience",
              "State management depth is moderate under high streaming concurrency",
            ],
            next: [
              "Advance to React Advanced Patterns and custom hook optimization.",
              "Practice State Management (Redux/Zustand) for multi-stream scenarios.",
              "Explore System Design fundamentals and WebSocket fallback protocols.",
            ],
            averageScore: 81,
            technicalDepth: 4.1,
            reasoning: 4.0,
            accuracy: 4.2,
            communication: 4.5,
            coveredTopics: [
              "First AI Project, React Frontend & GitHub",
              "Chatbot Frontend Development",
              "Full-Stack Integration & Streaming Responses",
            ],
          },
        };
      }

      if (cand009) {
        sessionsDb["session_zayn_malik"] = {
          id: "session_zayn_malik",
          candidateId: cand009.id,
          candidate: cand009,
          startedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          currentQuestion: null,
          questionCount: 8,
          maxQuestions: 8,
          conversationHistory: [],
          coveredDays: [21, 22, 23, 24],
          coveredTopics: [
            "Agentic Frameworks: LangChain Agents & Tool Use",
            "Multi-Agent Orchestration",
            "Model Context Protocol (MCP)",
            "Agentic Chatbot Integration",
          ],
          strengths: [
            "Exceptional autonomous agent architecture and ReAct loop design",
            "Deep expertise in MCP JSON-RPC protocol and security boundaries",
            "Strong multi-agent supervisor graph coordination",
          ],
          weaknesses: [
            "Could incorporate more automated regression testing for tool failures",
          ],
          difficulty: "hard",
          pendingFollowUp: false,
          status: "completed",
          memory: {
            strengths: ["Agentic Frameworks", "MCP Protocol"],
            weaknesses: ["Tool failure regression benchmarks"],
            misconceptions: [],
            coveredTopics: ["Model Context Protocol (MCP)"],
            claims: [{ topic: "Model Context Protocol (MCP)", claim: "Least privilege token security for MCP", confidence: "high" }],
            difficultyTrajectory: [{ questionId: "q_1", difficulty: "hard", score: 92 }],
            previousFollowUps: [],
          },
          decisions: [
            {
              type: "DEEPER_CHALLENGE",
              transition: "DEEPER_CHALLENGE",
              reason: "Strong reasoning | Strategy: Escalate to tool timeout and consensus deadlocks",
              targetConcept: "Multi-agent deadlocks",
              targetTopic: "Multi-Agent Orchestration",
              targetDay: 22,
              difficulty: "hard",
              probeType: "FAILURE_PROBE",
              curriculumDay: 22,
              referencesPreviousAnswer: true,
            },
          ],
          finalFeedback: {
            summary: "Zayn demonstrated outstanding mastery of agentic systems and MCP protocol standards with a 92% score.",
            strengths: [
              "Exceptional autonomous agent architecture and ReAct loop design",
              "Deep expertise in MCP JSON-RPC protocol and security boundaries",
              "Strong multi-agent supervisor graph coordination",
            ],
            gaps: [
              "Could incorporate more automated regression testing for tool failures",
            ],
            next: [
              "Design centralized MCP gateway routing across distributed microservices.",
              "Benchmark multi-agent consensus vs single-agent latency profiles.",
              "Implement formal verification for dynamic tool execution sandboxes.",
            ],
            averageScore: 92,
            technicalDepth: 4.8,
            reasoning: 4.7,
            accuracy: 4.9,
            communication: 4.6,
            coveredTopics: [
              "Agentic Frameworks: LangChain Agents & Tool Use",
              "Multi-Agent Orchestration",
              "Model Context Protocol (MCP)",
              "Agentic Chatbot Integration",
            ],
          },
        };
      }
    } catch (e) {
      console.warn("Seeding initial history sessions failed:", e);
    }
  }

  return Object.values(sessionsDb).sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
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

  const firstPlanItem = rawPlan[0];
  const initialMemory = createInitialMemory(firstPlanItem.topic, firstPlanItem.curriculumDay, firstPlanItem.domain);

  const globalList = Array.from(globalAskedQuestions);
  
  let initialQuestionText = await generateQuestion({
    candidate,
    topic: firstPlanItem.topic,
    difficulty: firstPlanItem.difficulty,
    type: firstPlanItem.type,
    probeType: "CLAIM_PROBE",
    thread: initialMemory.activeThread,
    memory: initialMemory,
    globalAskedQuestions: globalList,
  });

  // Verify uniqueness against global questions
  let initAttempts = 0;
  let isGlobalDup = globalList.some(q => isSemanticallySimilar(initialQuestionText, q));
  while (isGlobalDup && initAttempts < 5) {
    initAttempts++;
    initialQuestionText = await generateQuestion({
      candidate,
      topic: firstPlanItem.topic,
      difficulty: firstPlanItem.difficulty,
      type: firstPlanItem.type,
      probeType: "CLAIM_PROBE",
      thread: initialMemory.activeThread,
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
    probeType: "CLAIM_PROBE",
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
    activeThread: initialMemory.activeThread,
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

  // 2. Extract Candidate Claims & Decisions from Answer Text
  const extractedClaims = extractCandidateClaims(answerText, currentQuestion.topic, currentQuestion.text);

  // 3. Append response to conversation history with complete question pairing
  const responseEntry: InterviewResponse = {
    questionId: currentQuestion.id,
    questionText: currentQuestion.text,
    topic: currentQuestion.topic,
    curriculumDay: currentQuestion.curriculumDay,
    difficulty: currentQuestion.difficulty,
    text: answerText,
    submittedAt: new Date().toISOString(),
    evaluation,
  };
  session.conversationHistory.push(responseEntry);

  if (!session.evaluations) {
    session.evaluations = [];
  }
  session.evaluations.push(evaluation);

  // 4. Update Memory with active conversation thread
  session.memory = updateMemory(
    session.memory,
    currentQuestion.id,
    answerText,
    evaluation,
    session.difficulty,
    currentQuestion.topic,
    currentQuestion.curriculumDay,
    currentQuestion.domain
  );

  session.activeThread = session.memory.activeThread;
  session.strengths = [...session.memory.strengths];
  session.weaknesses = [...session.memory.weaknesses];

  // 5. Calculate consecutive low scores for adaptation bounds
  let consecutiveLowScores = 0;
  for (let i = session.conversationHistory.length - 1; i >= 0; i--) {
    const ev = session.conversationHistory[i].evaluation;
    if (ev && ev.score < 55) {
      consecutiveLowScores++;
    } else {
      break;
    }
  }

  // 6. Evaluate Follow-Up Strategy via Prioritized Policy
  const followUpDecision = evaluateFollowUpNecessity(
    currentQuestion,
    answerText,
    evaluation,
    session.activeThread,
    extractedClaims
  );

  // 7. Adapt Difficulty
  const adaptation = adaptDifficultyAndGoal(
    evaluation,
    session.difficulty,
    consecutiveLowScores,
    followUpDecision.probeType
  );
  session.difficulty = adaptation.nextDifficulty;

  // 8. Log Explicit Agent Decision
  const decision: AgentDecision = {
    type: followUpDecision.transition,
    transition: followUpDecision.transition,
    reason: `${adaptation.reason} | Strategy: ${followUpDecision.reason}`,
    targetConcept: followUpDecision.targetFocus,
    targetTopic: currentQuestion.topic,
    targetDay: currentQuestion.curriculumDay,
    difficulty: session.difficulty,
    probeType: followUpDecision.probeType,
    curriculumDay: currentQuestion.curriculumDay,
    referencesPreviousAnswer: followUpDecision.referencesPreviousAnswer,
  };
  session.decisions.push(decision);

  // 9. Check if Interview is Completed
  if (session.questionCount >= session.maxQuestions) {
    session.currentQuestion = null;
    session.status = "completed";

    const evals = session.conversationHistory
      .map((h) => h.evaluation)
      .filter((ev): ev is NonNullable<typeof ev> => !!ev);

    const totalEvals = evals.length || 1;

    const avgAccuracy = Math.round(evals.reduce((sum, e) => sum + (e.accuracy || e.score), 0) / totalEvals);
    const avgDepth = Math.round(evals.reduce((sum, e) => sum + (e.technicalDepth || e.score), 0) / totalEvals);
    const avgReasoning = Math.round(evals.reduce((sum, e) => sum + (e.reasoning || e.score), 0) / totalEvals);
    const avgCommunication = Math.round(evals.reduce((sum, e) => sum + (e.communication || 75), 0) / totalEvals);
    const avgRelevance = Math.round(evals.reduce((sum, e) => sum + (e.relevance || 80), 0) / totalEvals);

    // Relevance-first weighted overall score
    const weightedScore = Math.round(
      0.35 * avgAccuracy +
      0.25 * avgRelevance +
      0.20 * avgDepth +
      0.15 * avgReasoning +
      0.05 * avgCommunication
    );

    const averageScore = Math.min(100, Math.max(0, weightedScore));

    // Dynamic Letter Grade
    let grade = "B";
    if (averageScore >= 90) grade = "A+";
    else if (averageScore >= 85) grade = "A";
    else if (averageScore >= 80) grade = "A-";
    else if (averageScore >= 75) grade = "B+";
    else if (averageScore >= 70) grade = "B";
    else if (averageScore >= 65) grade = "B-";
    else if (averageScore >= 60) grade = "C+";
    else if (averageScore >= 50) grade = "C";
    else grade = "D";

    // Response Quality Breakdown
    const responseQuality = {
      totalEvaluated: evals.length,
      correct: evals.filter((e) => e.classification === "CORRECT").length,
      partiallyCorrect: evals.filter((e) => e.classification === "PARTIALLY_CORRECT").length,
      incorrect: evals.filter((e) => e.classification === "INCORRECT").length,
      irrelevant: evals.filter((e) => e.classification === "IRRELEVANT").length,
      misconceptions: evals.filter((e) => e.classification === "MISCONCEPTION" || (e.misconceptions && e.misconceptions.length > 0)).length,
    };

    // Extract genuine strengths from candidate answers
    const dynamicStrengths: string[] = [];
    evals.forEach((e) => {
      if (e.strengths && e.strengths.length > 0 && e.score >= 70) {
        e.strengths.forEach((st) => {
          if (!dynamicStrengths.includes(st)) dynamicStrengths.push(st);
        });
      }
    });

    if (dynamicStrengths.length === 0) {
      dynamicStrengths.push("Provided basic conceptual baseline across covered curriculum areas.");
    }

    // Extract genuine knowledge gaps from weak, misconception, or irrelevant answers
    const dynamicGaps: string[] = [];
    if (responseQuality.irrelevant > 0) {
      dynamicGaps.push("Several responses were unrelated to the questions asked, which significantly reduced technical accuracy and reasoning scores.");
    }

    evals.forEach((e) => {
      if (e.misconceptions && e.misconceptions.length > 0) {
        e.misconceptions.forEach((m) => {
          if (!dynamicGaps.includes(m)) dynamicGaps.push(`Misconception: ${m}`);
        });
      }
      if (e.weaknesses && e.weaknesses.length > 0 && (e.score < 70 || e.classification !== "CORRECT")) {
        e.weaknesses.forEach((w) => {
          if (!dynamicGaps.includes(w)) dynamicGaps.push(w);
        });
      }
    });

    if (dynamicGaps.length === 0) {
      dynamicGaps.push("Deepen familiarity with production edge cases and scaling bottlenecks under high concurrency.");
    }

    // Topics actually evaluated during the interview
    const evaluatedTopics = Array.from(
      new Set(session.conversationHistory.map((h) => h.topic).filter(Boolean) as string[])
    );

    // Dynamic Recommendations directly addressing gaps
    const nextActions: string[] = [];
    if (responseQuality.irrelevant > 0) {
      nextActions.push("Practice active listening to directly address prompt requirements without introducing unrelated topics.");
    }
    if (responseQuality.misconceptions > 0) {
      nextActions.push("Review fundamental mathematical and architectural definitions for identified concept gaps.");
    }
    evaluatedTopics.slice(0, 2).forEach((top) => {
      nextActions.push(`Explore advanced configuration and failure recovery patterns for ${top}.`);
    });
    if (nextActions.length < 3) {
      nextActions.push("Conduct end-to-end integration benchmarking under simulated production failure modes.");
    }

    const summaryText = `The candidate completed an 8-question adaptive interview covering ${evaluatedTopics.join(", ")}. Overall score: ${averageScore}% (${grade}), with ${responseQuality.correct} correct, ${responseQuality.partiallyCorrect} partially correct, and ${responseQuality.irrelevant} irrelevant answers.`;

    session.finalFeedback = {
      summary: summaryText,
      strengths: dynamicStrengths.slice(0, 4),
      gaps: dynamicGaps.slice(0, 4),
      next: nextActions.slice(0, 4),
      grade,
      averageScore,
      technicalDepth: avgDepth,
      reasoning: avgReasoning,
      accuracy: avgAccuracy,
      communication: avgCommunication,
      relevance: avgRelevance,
      responseQuality,
      decisions: session.decisions,
      coveredTopics: evaluatedTopics,
      responses: session.conversationHistory,
    };

    sessionsDb[sessionId] = session;
    return session;
  }

  // 10. Determine Next Question Properties
  let nextType: "standard" | "follow-up" | "next-domain" | "final" = "next-domain";
  let nextTopic = currentQuestion.topic;
  let nextDomain = currentQuestion.domain;
  let nextDay = currentQuestion.curriculumDay;
  let transitionBridge: string | undefined = undefined;

  const curriculum = await getCurriculum();
  const completedMissions = candidate.missions.completedMissions || [];

  if (followUpDecision.shouldFollowUp) {
    nextType = "follow-up";
    session.pendingFollowUp = true;
    nextTopic = currentQuestion.topic;
    nextDomain = currentQuestion.domain;
    nextDay = currentQuestion.curriculumDay;
  } else {
    // Natural transition along the Topic Graph to another completed curriculum area
    session.pendingFollowUp = false;
    const transition = findBestTransitionTopic(
      currentQuestion.curriculumDay,
      completedMissions,
      session.coveredDays,
      curriculum
    );

    nextType = session.questionCount === session.maxQuestions - 1 ? "final" : "next-domain";
    nextTopic = transition.targetTopic;
    nextDomain = transition.targetDomain;
    nextDay = transition.targetDay;
    transitionBridge = transition.bridgeText;

    // Reset thread for new topic
    session.memory.activeThread = {
      topic: nextTopic,
      curriculumDay: nextDay,
      domain: nextDomain,
      concepts: [nextTopic],
      candidateClaims: [],
      unresolvedPoints: [],
      strengths: [],
      weaknesses: [],
      misconceptions: [],
      tradeoffs: [],
      currentDepth: 0,
      maxThreadDepth: 2,
    };
    session.activeThread = session.memory.activeThread;
  }

  // 11. Generate Next Question with Deduplication
  let nextQuestionText = "";
  let attempts = 0;
  let isDuplicate = true;
  const globalList = Array.from(globalAskedQuestions);

  while (isDuplicate && attempts < 8) {
    nextQuestionText = await generateQuestion({
      candidate,
      topic: nextTopic,
      difficulty: session.difficulty,
      type: nextType,
      probeType: followUpDecision.probeType,
      thread: session.activeThread,
      transitionBridge,
      memory: session.memory,
      previousQuestionText: currentQuestion.text,
      previousAnswerText: answerText,
      previousEvaluation: evaluation,
      globalAskedQuestions: globalList,
    });

    attempts++;
    isDuplicate = false;

    for (const askedQ of session.memory.previousFollowUps) {
      if (isSemanticallySimilar(nextQuestionText, askedQ)) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      for (const globalQ of globalAskedQuestions) {
        if (isSemanticallySimilar(nextQuestionText, globalQ)) {
          isDuplicate = true;
          break;
        }
      }
    }
  }

  session.memory.previousFollowUps.push(nextQuestionText);
  globalAskedQuestions.add(nextQuestionText);

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
    probeType: followUpDecision.probeType,
    contextText: nextType === "follow-up" ? `Regarding your statement: "${answerSnippet}"` : undefined,
    transitionContext: transitionBridge,
  };

  // Update session state
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
