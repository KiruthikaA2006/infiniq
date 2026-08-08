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

  // 2. Select 4 days representing different modules from the candidate's actual completed curriculum
  const completedMissions = candidate.missions.completedMissions || [];
  const skippedMissions = candidate.missions.skippedMissions || [];
  const selectedDays: CurriculumDay[] = [];

  // Filter curriculum to days completed by the candidate and not skipped
  const completedDays = curriculum.filter(
    (d) => completedMissions.includes(d.day) && !skippedMissions.includes(d.day)
  );

  if (completedDays.length > 0) {
    // Group completed days by module to ensure domain variety
    const moduleMap: Record<string, CurriculumDay[]> = {};
    for (const d of completedDays) {
      if (!moduleMap[d.module]) {
        moduleMap[d.module] = [];
      }
      moduleMap[d.module].push(d);
    }

    const modules = Object.keys(moduleMap);
    let modIdx = 0;
    while (selectedDays.length < 4 && selectedDays.length < completedDays.length) {
      const currentMod = modules[modIdx % modules.length];
      const dayList = moduleMap[currentMod];
      const dayToAdd = dayList.find((d) => !selectedDays.some((sd) => sd.day === d.day));
      if (dayToAdd) {
        selectedDays.push(dayToAdd);
      }
      modIdx++;
    }
  }

  // Fallback: If we still need more days, select from other non-skipped curriculum days
  if (selectedDays.length < 4) {
    for (const d of curriculum) {
      if (!skippedMissions.includes(d.day) && !selectedDays.some((sd) => sd.day === d.day)) {
        selectedDays.push(d);
        if (selectedDays.length === 4) break;
      }
    }
  }

  // Double fallback in case skippedMissions leaves us with too few days overall
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
