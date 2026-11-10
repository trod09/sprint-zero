/**
 * Turns the attempts in this browser into skill ratings and the cases to
 * practise next. Shared by the skills page, the results page and the home.
 */
import type { CaseSummary } from "@/components/case-library";
import {
  computeSkillRatings,
  recommendCases,
  type RatedAttempt,
  type Recommendation,
} from "@/core/skills";
import type { Attempt } from "@/core/storage";
import { moduleCatalog } from "@/modules/catalog";

import { caseLabel } from "./case-label";

const skillsOf = new Map(moduleCatalog.map((meta) => [meta.id, meta.skills]));

/** Attempts the rating engine can use: known cases of modules with skills. */
export function ratedAttemptsFrom(
  attempts: readonly Attempt[],
  caseById: ReadonlyMap<string, CaseSummary>,
): RatedAttempt[] {
  return attempts.flatMap((attempt) => {
    const summary = caseLabel(attempt.caseId, caseById);
    const skills = skillsOf.get(attempt.moduleId);
    if (!summary || !skills) return [];
    return [
      {
        caseId: attempt.caseId,
        skills,
        difficulty: summary.difficulty,
        score: attempt.result.total,
        submittedAt: attempt.submittedAt,
      },
    ];
  });
}

/** Unplayed curated cases for the weakest skills, best first. */
export function recommendFromAttempts(
  attempts: readonly Attempt[],
  cases: readonly CaseSummary[],
  count = 3,
): Recommendation[] {
  const caseById = new Map(cases.map((c) => [c.id, c]));
  const ratings = computeSkillRatings(ratedAttemptsFrom(attempts, caseById));
  return recommendCases(
    ratings,
    cases.map((c) => ({
      id: c.id,
      moduleId: c.moduleId,
      difficulty: c.difficulty,
      skills: skillsOf.get(c.moduleId) ?? [],
    })),
    new Set(attempts.map((a) => a.caseId)),
    count,
  );
}
