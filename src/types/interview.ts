import { z } from "zod";

export type AnswerClassification =
  | "CORRECT"
  | "PARTIALLY_CORRECT"
  | "INCORRECT"
  | "IRRELEVANT"
  | "INSUFFICIENT"
  | "MISCONCEPTION";

// Zod Schema for strict LLM Evaluation results
export const EvaluationResultSchema = z.object({
  score: z.number().min(0).max(100),
  classification: z.enum([
    "CORRECT",
    "PARTIALLY_CORRECT",
    "INCORRECT",
    "IRRELEVANT",
    "INSUFFICIENT",
    "MISCONCEPTION",
  ]).default("CORRECT"),
  relevance: z.number().min(0).max(100).default(85),
  accuracy: z.number().min(0).max(100).default(80),
  technicalDepth: z.number().min(0).max(100).default(80),
  reasoning: z.number().min(0).max(100).default(80),
  communication: z.number().min(0).max(100).default(80),
  tradeoffAwareness: z.number().min(0).max(100).default(75),
  correct: z.boolean().default(true),
  explanation: z.string().default(""),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  conceptsMentioned: z.array(z.string()).default([]),
  misconceptions: z.array(z.string()).default([]),
  missingConcepts: z.array(z.string()).default([]),
  followUpNeeded: z.boolean().default(false),
  followUpReason: z.string().default(""),
  recommendedDifficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

export type ProbeType =
  | "CLAIM_PROBE"
  | "TRADEOFF_PROBE"
  | "IMPLEMENTATION_PROBE"
  | "SCALE_PROBE"
  | "FAILURE_PROBE"
  | "SECURITY_PROBE"
  | "FOUNDATION_REPAIR"
  | "NEW_TOPIC";

export type DecisionType =
  | "FOLLOW_UP"
  | "DEEPER_CHALLENGE"
  | "TRADEOFF_PROBE"
  | "IMPLEMENTATION_PROBE"
  | "SCALE_PROBE"
  | "FAILURE_PROBE"
  | "FOUNDATION_REPAIR"
  | "NEW_TOPIC";

export interface ConversationThread {
  topic: string;
  curriculumDay: number;
  domain: string;
  concepts: string[];
  candidateClaims: string[];
  unresolvedPoints: string[];
  strengths: string[];
  weaknesses: string[];
  misconceptions: string[];
  tradeoffs: string[];
  currentDepth: number; // 0 for initial question, 1 for follow-up 1, 2 for follow-up 2
  maxThreadDepth: number; // default 2-3
  lastProbeType?: ProbeType;
}

export interface AgentDecision {
  type: DecisionType;
  transition: DecisionType;
  reason: string;
  targetConcept: string;
  targetTopic: string;
  targetDay: number;
  difficulty: "easy" | "medium" | "hard";
  probeType: ProbeType;
  curriculumDay: number;
  referencesPreviousAnswer: boolean;
}

export interface CompactMemory {
  strengths: string[];
  weaknesses: string[];
  misconceptions: string[];
  coveredTopics: string[];
  claims: Array<{
    topic: string;
    claim: string;
    confidence: "high" | "medium" | "low";
  }>;
  difficultyTrajectory: Array<{
    questionId: string;
    difficulty: "easy" | "medium" | "hard";
    score: number;
  }>;
  previousFollowUps: string[];
  activeThread?: ConversationThread;
}

export interface InterviewQuestion {
  id: string;
  challengeNumber: number;
  curriculumDay: number;
  domain: string;
  topic: string;
  type: "standard" | "follow-up" | "next-domain" | "final";
  text: string;
  contextText?: string; // Reference to previous answer segment for follow-ups
  difficulty: "easy" | "medium" | "hard";
  probeType?: ProbeType;
  transitionContext?: string;
}

export interface InterviewResponse {
  questionId: string;
  questionText?: string;
  topic?: string;
  curriculumDay?: number;
  difficulty?: "easy" | "medium" | "hard";
  text: string;
  submittedAt: string;
  evaluation?: EvaluationResult;
}

export type AnsweringState =
  | "ready"
  | "answering"
  | "submitting"
  | "thinking"
  | "next-question"
  | "error"
  | "completed";

export interface ResponseQualitySummary {
  totalEvaluated: number;
  correct: number;
  partiallyCorrect: number;
  incorrect: number;
  irrelevant: number;
  misconceptions: number;
}

export interface FinalFeedback {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
  grade?: string;
  averageScore?: number;
  technicalDepth?: number;
  reasoning?: number;
  accuracy?: number;
  communication?: number;
  relevance?: number;
  responseQuality?: ResponseQualitySummary;
  decisions?: AgentDecision[];
  coveredTopics?: string[];
  responses?: InterviewResponse[];
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  candidate?: any; // Stores the candidate object
  plan?: any[]; // Stores generateInterviewPlan
  startedAt: string;
  currentQuestion: InterviewQuestion | null;
  questionCount: number;
  maxQuestions: number;
  conversationHistory: InterviewResponse[];
  coveredDays: number[];
  coveredTopics: string[];
  strengths: string[];
  weaknesses: string[];
  difficulty: "easy" | "medium" | "hard";
  pendingFollowUp: boolean;
  status: AnsweringState;
  memory: CompactMemory;
  decisions: AgentDecision[];
  evaluations?: EvaluationResult[];
  activeThread?: ConversationThread;
  finalFeedback?: FinalFeedback;
}

// ==========================================
// API REQUEST & RESPONSE VALIDATION SCHEMAS
// ==========================================
export const StartRequestSchema = z.object({
  sessionId: z.string().min(1),
  candidate: z.object({
    id: z.string().min(1),
    member: z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      jobRole: z.string().min(1),
      yearsExperience: z.number().min(0),
      education: z.string().min(1),
      status: z.string().min(1),
    }),
    missions: z.object({
      completedMissions: z.array(z.number()),
      skippedMissions: z.array(z.number()),
      failedMissions: z.array(z.number()),
      attempts: z.number().min(0),
      commitDays: z.number().min(0),
      missionsCompleted: z.number().min(0),
      firstTryMissions: z.number().min(0),
    }),
    signals: z.object({
      strengthSignals: z.array(z.string()),
      weaknessSignals: z.array(z.string()),
      confidenceLevel: z.enum(["high", "medium", "low"]),
    }),
  }),
});

export type StartRequest = z.infer<typeof StartRequestSchema>;

export const ConversationRequestSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1),
});

export type ConversationRequest = z.infer<typeof ConversationRequestSchema>;

export const APIInterviewResponseSchema = z.object({
  reply: z.string(),
  done: z.boolean(),
  feedback: z.optional(
    z.object({
      summary: z.string(),
      strengths: z.array(z.string()),
      gaps: z.array(z.string()),
      next: z.array(z.string()),
      grade: z.optional(z.string()),
      averageScore: z.optional(z.number()),
      technicalDepth: z.optional(z.number()),
      reasoning: z.optional(z.number()),
      accuracy: z.optional(z.number()),
      communication: z.optional(z.number()),
      relevance: z.optional(z.number()),
      responseQuality: z.optional(
        z.object({
          totalEvaluated: z.number(),
          correct: z.number(),
          partiallyCorrect: z.number(),
          incorrect: z.number(),
          irrelevant: z.number(),
          misconceptions: z.number(),
        })
      ),
      decisions: z.optional(z.array(z.any())),
      coveredTopics: z.optional(z.array(z.string())),
      responses: z.optional(z.array(z.any())),
    })
  ),
});

export type APIInterviewResponse = z.infer<typeof APIInterviewResponseSchema>;

