import curriculumData from "./curriculum.json";
import candidatesData from "./candidates.json";

// ==========================================
// CURRICULUM INTERFACES
// ==========================================
export interface CurriculumDay {
  day: number;
  title: string;
  type: string;
  tools: string[];
  objectives: string[];
  module: string; // Dynamically associated
}

export interface CurriculumModule {
  n: number;
  title: string;
  days: number[];
}

export interface CurriculumDataset {
  cohort: string;
  modules: CurriculumModule[];
  days: Omit<CurriculumDay, "module">[];
}

// ==========================================
// CANDIDATE INTERFACES
// ==========================================
export interface CandidateMember {
  id: string;
  name: string;
  jobRole: string;
  yearsExperience: number;
  education: string;
  status: string;
}

export interface CandidateMissions {
  completedMissions: number[];
  skippedMissions: number[];
  failedMissions: number[];
  attempts: number;
  commitDays: number;
  missionsCompleted: number;
  firstTryMissions: number;
}

export interface CandidateSignals {
  strengthSignals: string[];
  weaknessSignals: string[];
  confidenceLevel: "high" | "medium" | "low";
}

export interface Candidate {
  id: string;
  member: CandidateMember;
  missions: CandidateMissions;
  signals: CandidateSignals;
}

// Typed cast of imported JSONs
const typedCurriculum = curriculumData as CurriculumDataset;
const typedCandidates = candidatesData as Candidate[];

// ==========================================
// DATA LOADERS
// ==========================================

/**
 * Loads the 31-day curriculum, dynamically joining days to their respective module titles.
 */
export async function getCurriculum(): Promise<CurriculumDay[]> {
  const { modules, days } = typedCurriculum;
  return days.map((d) => {
    // Find module containing this day
    const mod = modules.find((m) => d.day >= m.days[0] && d.day <= m.days[1]);
    return {
      ...d,
      module: mod ? mod.title : "General",
    };
  });
}

/**
 * Loads a specific curriculum day.
 */
export async function getCurriculumDay(day: number): Promise<CurriculumDay | null> {
  const list = await getCurriculum();
  return list.find((d) => d.day === day) || null;
}

/**
 * Loads all candidates in the dataset (CAND-001 through CAND-020).
 */
export async function getCandidates(): Promise<Candidate[]> {
  return typedCandidates;
}

/**
 * Loads a specific candidate profile by ID.
 */
export async function getCandidate(id: string): Promise<Candidate | null> {
  const list = await getCandidates();
  return list.find((c) => c.id === id || c.member.id === id) || null;
}
