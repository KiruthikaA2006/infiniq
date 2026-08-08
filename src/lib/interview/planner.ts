import { Candidate } from "@/data/loaders";
import { CurriculumDay } from "@/data/loaders";

export interface PlannedQuestion {
  curriculumDay: number;
  domain: string;
  type: "standard" | "follow-up" | "next-domain" | "final";
  difficulty: "easy" | "medium" | "hard";
  topic: string;
}

export function generateInterviewPlan(
  candidate: Candidate,
  curriculum: CurriculumDay[]
): PlannedQuestion[] {
  const plan: PlannedQuestion[] = [];

  // 1. Establish initial difficulty baseline using jobRole, yearsExperience, and education
  let baselineDifficulty: "easy" | "medium" | "hard" = "medium";
  const roleLower = (candidate.member.jobRole || "").toLowerCase();
  const eduLower = (candidate.member.education || "").toLowerCase();
  const yrsExp = candidate.member.yearsExperience || 0;

  if (
    yrsExp >= 5 ||
    roleLower.includes("senior") ||
    roleLower.includes("architect") ||
    roleLower.includes("lead") ||
    eduLower.includes("ph.d")
  ) {
    baselineDifficulty = "hard";
  } else if (
    yrsExp >= 2 ||
    roleLower.includes("engineer") ||
    roleLower.includes("developer") ||
    eduLower.includes("m.s.")
  ) {
    baselineDifficulty = "medium";
  } else {
    baselineDifficulty = "easy";
  }

  // Adjust baseline further based on confidence level signal
  if (candidate.signals.confidenceLevel === "low" && baselineDifficulty === "hard") {
    baselineDifficulty = "medium";
  } else if (candidate.signals.confidenceLevel === "high" && baselineDifficulty === "easy") {
    baselineDifficulty = "medium";
  }

  // 2. Select 4 days representing different modules from the 31-day curriculum
  // To ensure the mock provider has high-quality realistic questions, we select:
  // - Day 10: Module 3 (Embeddings & Vector Search)
  // - Day 15: Module 4 (LLM Core, Prompting & Fine-Tuning)
  // - Day 23: Module 6 (Agentic AI & MCP)
  // - Day 26: Module 7 (Evaluation, Security & Deployment - Performance Optimization)
  const targetDays = [10, 15, 23, 26];
  const selectedDays: CurriculumDay[] = [];

  for (const dayNum of targetDays) {
    const dayObj = curriculum.find((d) => d.day === dayNum);
    if (dayObj) {
      selectedDays.push(dayObj);
    }
  }

  // Fallback in case curriculum doesn't contain target days (ensure at least 4 unique days)
  if (selectedDays.length < 4) {
    for (const d of curriculum) {
      if (!selectedDays.some((sd) => sd.day === d.day)) {
        selectedDays.push(d);
        if (selectedDays.length === 4) break;
      }
    }
  }

  // Sort chronologically
  selectedDays.sort((a, b) => a.day - b.day);

  // Helper to adjust difficulty per day based on candidate learning history
  const getPersonalizedDifficulty = (dayNum: number): "easy" | "medium" | "hard" => {
    const completed = candidate.missions.completedMissions.includes(dayNum);
    const skipped = candidate.missions.skippedMissions.includes(dayNum);
    const failed = candidate.missions.failedMissions.includes(dayNum);

    if (failed || skipped) {
      // Lower difficulty to start with foundation checks
      if (baselineDifficulty === "hard") return "medium";
      return "easy";
    }

    if (completed) {
      // Check if they completed it with high struggle (ratio of attempts to completed is high)
      const isStruggling = candidate.missions.attempts > candidate.missions.missionsCompleted * 1.5;
      if (isStruggling) {
        if (baselineDifficulty === "hard") return "medium";
        return "easy";
      }
      // If they passed on first try (high firstTry ratio)
      const isHighPerformer = candidate.missions.firstTryMissions > candidate.missions.missionsCompleted * 0.8;
      if (isHighPerformer) {
        if (baselineDifficulty === "easy") return "medium";
        return "hard";
      }
    }

    return baselineDifficulty;
  };

  // 3. Build an 8-question slot list (2 questions per selected day/module)
  // Day 1 (Slot 1 & 2)
  const day1 = selectedDays[0];
  const diff1 = getPersonalizedDifficulty(day1.day);
  plan.push({
    curriculumDay: day1.day,
    domain: day1.module,
    topic: day1.title,
    type: "standard",
    difficulty: diff1,
  });
  plan.push({
    curriculumDay: day1.day,
    domain: day1.module,
    topic: day1.title,
    type: "follow-up",
    difficulty: diff1 === "easy" ? "medium" : "hard",
  });

  // Day 2 (Slot 3 & 4)
  const day2 = selectedDays[1];
  const diff2 = getPersonalizedDifficulty(day2.day);
  plan.push({
    curriculumDay: day2.day,
    domain: day2.module,
    topic: day2.title,
    type: "next-domain",
    difficulty: diff2,
  });
  plan.push({
    curriculumDay: day2.day,
    domain: day2.module,
    topic: day2.title,
    type: "follow-up",
    difficulty: diff2 === "easy" ? "medium" : "hard",
  });

  // Day 3 (Slot 5 & 6)
  const day3 = selectedDays[2];
  const diff3 = getPersonalizedDifficulty(day3.day);
  plan.push({
    curriculumDay: day3.day,
    domain: day3.module,
    topic: day3.title,
    type: "next-domain",
    difficulty: diff3,
  });
  plan.push({
    curriculumDay: day3.day,
    domain: day3.module,
    topic: day3.title,
    type: "follow-up",
    difficulty: "hard",
  });

  // Day 4 (Slot 7 & 8)
  const day4 = selectedDays[3];
  const diff4 = getPersonalizedDifficulty(day4.day);
  plan.push({
    curriculumDay: day4.day,
    domain: day4.module,
    topic: day4.title,
    type: "next-domain",
    difficulty: diff4,
  });
  plan.push({
    curriculumDay: day4.day,
    domain: day4.module,
    topic: day4.title,
    type: "final",
    difficulty: "hard",
  });

  return plan;
}
