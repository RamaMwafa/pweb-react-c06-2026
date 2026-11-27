import type { Application, WorkMode } from "../types";
import { calculateSkillMatch } from "./skillmatch";

export const WORK_MODE_SCORES: Record<WorkMode, number> = {
  Remote: 100,
  Hybrid: 75,
  Onsite: 50,
};

export interface OfferScoreBreakdown {
  application: Application;
  salary: number;
  normalizedSalary: number;
  salaryWeighted: number;
  workModeScore: number;
  workModeWeighted: number;
  skillMatchScore: number;
  matchedSkillsCount: number;
  requiredSkillsCount: number;
  skillMatchWeighted: number;
  totalScore: number;
}

export interface OfferComparisonResult {
  a: OfferScoreBreakdown;
  b: OfferScoreBreakdown;
  winner: "A" | "B" | "TIE";
}

function buildBreakdown(
  application: Application,
  maxSalary: number,
  kaptenSkills: string[]
): OfferScoreBreakdown {
  const salary = application.salaryOffer ?? 0;
  const normalizedSalary = maxSalary > 0 ? (salary / maxSalary) * 100 : 0;
  const salaryWeighted = normalizedSalary * 0.5;

  const workModeScore = WORK_MODE_SCORES[application.workMode];
  const workModeWeighted = workModeScore * 0.25;

  const skillMatch = calculateSkillMatch(
    kaptenSkills,
    application.requiredSkills
  );
  const skillMatchWeighted = skillMatch.score * 0.25;

  const totalScore = salaryWeighted + workModeWeighted + skillMatchWeighted;

  return {
    application,
    salary,
    normalizedSalary,
    salaryWeighted,
    workModeScore,
    workModeWeighted,
    skillMatchScore: skillMatch.score,
    matchedSkillsCount: skillMatch.matchedSkills.length,
    requiredSkillsCount: application.requiredSkills.length,
    skillMatchWeighted,
    totalScore,
  };
}

export function compareOffers(
  offerA: Application,
  offerB: Application,
  kaptenSkills: string[]
): OfferComparisonResult {
  const salaryA = offerA.salaryOffer ?? 0;
  const salaryB = offerB.salaryOffer ?? 0;
  const maxSalary = Math.max(salaryA, salaryB);

  const a = buildBreakdown(offerA, maxSalary, kaptenSkills);
  const b = buildBreakdown(offerB, maxSalary, kaptenSkills);

  const diff = Math.round((a.totalScore - b.totalScore) * 10) / 10;
  let winner: "A" | "B" | "TIE" = "TIE";
  if (diff > 0) winner = "A";
  else if (diff < 0) winner = "B";

  return { a, b, winner };
}
