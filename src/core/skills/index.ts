/**
 * Skill ratings: an Elo-style rating per skill, fed by every module.
 *
 * Each first attempt at a case is a match between the learner and the case.
 * The case is rated by difficulty; the learner's score (0-100) is the result.
 * A module trains the skills in its metadata: the first skill counts fully,
 * the others count half. Replays are ignored, because the learner has already
 * seen the solution. Pure and deterministic.
 */
import type { Difficulty, Skill } from "@/core/case-engine";
import { SKILLS } from "@/core/case-engine";

export const START_RATING = 1000;
export const DIFFICULTY_RATING: Record<Difficulty, number> = {
  apm: 1000,
  pm: 1200,
  senior: 1400,
};
/** Bigger steps while a skill has few attempts, so it settles quickly. */
const K_EARLY = 48;
const K_SETTLED = 24;
const EARLY_ATTEMPTS = 5;
const SECONDARY_WEIGHT = 0.5;

export interface RatedAttempt {
  caseId: string;
  /** Skills the case's module trains, primary first. */
  skills: readonly Skill[];
  difficulty: Difficulty;
  /** Official score, 0-100. */
  score: number;
  submittedAt: string;
}

export interface SkillPoint {
  date: string;
  caseId: string;
  rating: number;
}

export interface SkillRating {
  skill: Skill;
  rating: number;
  /** Attempts that fed this skill. */
  attempts: number;
  history: SkillPoint[];
}

/** Win probability against a case, as in Elo. */
export function expectedScore(rating: number, caseRating: number): number {
  return 1 / (1 + 10 ** ((caseRating - rating) / 400));
}

/** First attempt at each case, oldest first. */
export function firstAttempts<
  T extends { caseId: string; submittedAt: string },
>(attempts: readonly T[]): T[] {
  const sorted = [...attempts].sort((a, b) =>
    a.submittedAt.localeCompare(b.submittedAt),
  );
  const seen = new Set<string>();
  return sorted.filter((attempt) => {
    if (seen.has(attempt.caseId)) return false;
    seen.add(attempt.caseId);
    return true;
  });
}

export function computeSkillRatings(
  attempts: readonly RatedAttempt[],
): Record<Skill, SkillRating> {
  const ratings = Object.fromEntries(
    SKILLS.map((skill) => [
      skill,
      { skill, rating: START_RATING, attempts: 0, history: [] },
    ]),
  ) as unknown as Record<Skill, SkillRating>;

  for (const attempt of firstAttempts(attempts)) {
    const caseRating = DIFFICULTY_RATING[attempt.difficulty];
    const result = Math.min(1, Math.max(0, attempt.score / 100));
    attempt.skills.forEach((skill, index) => {
      const entry = ratings[skill];
      const k = entry.attempts < EARLY_ATTEMPTS ? K_EARLY : K_SETTLED;
      const weight = index === 0 ? 1 : SECONDARY_WEIGHT;
      const expected = expectedScore(entry.rating, caseRating);
      entry.rating = Math.round(
        entry.rating + k * weight * (result - expected),
      );
      entry.attempts += 1;
      entry.history.push({
        date: attempt.submittedAt,
        caseId: attempt.caseId,
        rating: entry.rating,
      });
    });
  }
  return ratings;
}

/** A 0-100 level for the radar: 800 maps to 0 and 1600 to 100. */
export function ratingToLevel(rating: number): number {
  return Math.round(Math.min(100, Math.max(0, (rating - 800) / 8)));
}

/** The difficulty that stretches a learner at this rating without crushing them. */
export function targetDifficulty(rating: number): Difficulty {
  if (rating < 1100) return "apm";
  if (rating < 1300) return "pm";
  return "senior";
}

export interface RecommendableCase {
  id: string;
  moduleId: string;
  difficulty: Difficulty;
  skills: readonly Skill[];
}

export interface Recommendation {
  skill: Skill;
  caseId: string;
  reason: "not_practiced" | "weakest";
}

const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  apm: 0,
  pm: 1,
  senior: 2,
};

/**
 * Up to `count` unplayed cases, one per skill, for the weakest skills:
 * skills never practiced first, then the lowest ratings. Prefers modules
 * where the skill comes first and the difficulty closest to the target.
 */
export function recommendCases(
  ratings: Record<Skill, SkillRating>,
  cases: readonly RecommendableCase[],
  playedCaseIds: ReadonlySet<string>,
  count = 3,
): Recommendation[] {
  const skills = [...SKILLS].sort((a, b) => {
    const ra = ratings[a];
    const rb = ratings[b];
    if ((ra.attempts === 0) !== (rb.attempts === 0)) {
      return ra.attempts === 0 ? -1 : 1;
    }
    return ra.rating - rb.rating || SKILLS.indexOf(a) - SKILLS.indexOf(b);
  });

  const recommendations: Recommendation[] = [];
  const chosen = new Set<string>();
  for (const skill of skills) {
    if (recommendations.length >= count) break;
    const target = DIFFICULTY_ORDER[targetDifficulty(ratings[skill].rating)];
    const candidates = cases
      .filter(
        (c) =>
          c.skills.includes(skill) &&
          !playedCaseIds.has(c.id) &&
          !chosen.has(c.id),
      )
      .sort(
        (a, b) =>
          Number(a.skills[0] !== skill) - Number(b.skills[0] !== skill) ||
          Math.abs(DIFFICULTY_ORDER[a.difficulty] - target) -
            Math.abs(DIFFICULTY_ORDER[b.difficulty] - target) ||
          a.id.localeCompare(b.id),
      );
    const pick = candidates[0];
    if (!pick) continue;
    chosen.add(pick.id);
    recommendations.push({
      skill,
      caseId: pick.id,
      reason: ratings[skill].attempts === 0 ? "not_practiced" : "weakest",
    });
  }
  return recommendations;
}
