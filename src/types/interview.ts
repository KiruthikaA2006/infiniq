import { z } from "zod";

// Zod Schema for strict LLM Evaluation results
export const EvaluationResultSchema = z.object({
  score: z.number().min(0).max(100),
  technicalDepth: z.number().min(0).max(5),
  reasoning: z.number().min(0).max(5),
  accuracy: z.number().min(0).max(5),
  communication: z.number().min(0).max(5),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  conceptsMentioned: z.array(z.string()),
  misconceptions: z.array(z.string()),
  missingConcepts: z.array(z.string()),
  followUpNeeded: z.boolean(),
  followUpReason: z.string(),
  recommendedDifficulty: z.enum(["easy", "medium", "hard"]),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

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
}

export interface InterviewResponse {
  questionId: string;
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

export type DecisionType = "FOLLOW_UP" | "NEW_TOPIC" | "DEEPER_CHALLENGE" | "FOUNDATION_REPAIR";

export interface AgentDecision {
  type: DecisionType;
  reason: string;
  targetConcept: string;
  difficulty: "easy" | "medium" | "hard";
  curriculumDay: number;
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
  finalFeedback?: {
    summary: string;
    strengths: string[];
    gaps: string[];
    next: string[];
    averageScore?: number;
    technicalDepth?: number;
    reasoning?: number;
    accuracy?: number;
    communication?: number;
    decisions?: any[];
    coveredTopics?: string[];
  };
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
      averageScore: z.optional(z.number()),
      technicalDepth: z.optional(z.number()),
      reasoning: z.optional(z.number()),
      accuracy: z.optional(z.number()),
      communication: z.optional(z.number()),
      decisions: z.optional(z.array(z.any())),
      coveredTopics: z.optional(z.array(z.string())),
    })
  ),
});

export type APIInterviewResponse = z.infer<typeof APIInterviewResponseSchema>;


