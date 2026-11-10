/**
 * Player progress: stars, XP, level, streak and badges.
 *
 * Nothing here is stored. Everything is derived from the attempts the store
 * already keeps, so it is deterministic, replays cannot farm XP, and it moves
 * to Supabase with the attempts.
 *
 * - Stars per case, from its best score: 1 at 50+, 2 at 75+, 3 at 90+.
 * - XP per case: best score + 25 per star (175 at most). Replaying a case only
 *   adds the improvement.
 * - Levels start at 1; going from level n to n+1 costs 200 x n XP.
 * - Streak: consecutive days with at least one submitted case, ending today
 *   or yesterday.
 */
import type { Difficulty } from "@/core/case-engine";
import { parseGeneratedCaseId } from "@/core/case-engine";

export const STAR_THRESHOLDS = [50, 75, 90] as const;
export const XP_PER_STAR = 25;
export const XP_PER_LEVEL_STEP = 200;
export const SENIOR_CLEAR_SCORE = 75;

export interface ProgressAttempt {
  id: string;
  caseId: string;
  moduleId: string;
  submittedAt: string;
  /** Official score, 0-100. */
  score: number;
}

export interface CaseInfo {
  id: string;
  moduleId: string;
  difficulty: Difficulty;
}

export const BADGE_IDS = [
  "first_case",
  "perfect",
  "module_master",
  "streak_3",
  "streak_7",
  "senior_clear",
  "explorer",
  "generated",
] as const;
export type BadgeId = (typeof BADGE_IDS)[number];

export interface CaseProgress {
  best: number;
  stars: number;
  xp: number;
  attempts: number;
}

export interface ModuleProgress {
  moduleId: string;
  /** Curated cases played at least once. */
  played: number;
  /** Curated cases in the module. */
  total: number;
  stars: number;
  maxStars: number;
}

export interface LevelInfo {
  level: number;
  /** XP earned inside the current level. */
  into: number;
  /** XP the current level needs in total. */
  needed: number;
}

export interface Progress {
  xp: number;
  level: LevelInfo;
  streak: number;
  longestStreak: number;
  /** Day keys (YYYY-MM-DD) with at least one submitted case. */
  activeDays: string[];
  badges: Record<BadgeId, boolean>;
  cases: Record<string, CaseProgress>;
  modules: Record<string, ModuleProgress>;
  totalStars: number;
}

export function starsFor(score: number): number {
  return STAR_THRESHOLDS.filter((threshold) => score >= threshold).length;
}

export function caseXp(best: number): number {
  return Math.round(best) + XP_PER_STAR * starsFor(best);
}

export function levelFor(xp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, Math.floor(xp));
  while (remaining >= XP_PER_LEVEL_STEP * level) {
    remaining -= XP_PER_LEVEL_STEP * level;
    level += 1;
  }
  return { level, into: remaining, needed: XP_PER_LEVEL_STEP * level };
}

/** Local calendar day of an ISO timestamp, as YYYY-MM-DD. */
export function localDayKey(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function previousDay(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return localDayKey(new Date(year, month - 1, day - 1));
}

/** Current streak (ending today or yesterday) and the longest one. */
export function streaks(
  days: readonly string[],
  today: string,
): { current: number; longest: number } {
  const set = new Set(days);
  let longest = 0;
  for (const day of set) {
    if (set.has(previousDay(day))) continue;
    let length = 0;
    let cursor = day;
    while (set.has(cursor)) {
      length += 1;
      const [year, month, date] = cursor.split("-").map(Number);
      cursor = localDayKey(new Date(year, month - 1, date + 1));
    }
    longest = Math.max(longest, length);
  }
  let start = set.has(today) ? today : previousDay(today);
  let current = 0;
  while (set.has(start)) {
    current += 1;
    start = previousDay(start);
  }
  return { current, longest };
}

function difficultyOf(
  caseId: string,
  info: ReadonlyMap<string, CaseInfo>,
): Difficulty | null {
  return (
    info.get(caseId)?.difficulty ??
    parseGeneratedCaseId(caseId)?.difficulty ??
    null
  );
}

export function computeProgress(
  attempts: readonly ProgressAttempt[],
  catalog: readonly CaseInfo[],
  now: Date = new Date(),
): Progress {
  const info = new Map(catalog.map((c) => [c.id, c]));
  const cases: Record<string, CaseProgress> = {};
  for (const attempt of attempts) {
    const current = cases[attempt.caseId];
    const best = Math.max(current?.best ?? 0, attempt.score);
    cases[attempt.caseId] = {
      best,
      stars: starsFor(best),
      xp: caseXp(best),
      attempts: (current?.attempts ?? 0) + 1,
    };
  }
  const xp = Object.values(cases).reduce((sum, c) => sum + c.xp, 0);

  const modules: Record<string, ModuleProgress> = {};
  for (const item of catalog) {
    const entry = (modules[item.moduleId] ??= {
      moduleId: item.moduleId,
      played: 0,
      total: 0,
      stars: 0,
      maxStars: 0,
    });
    entry.total += 1;
    entry.maxStars += STAR_THRESHOLDS.length;
    const played = cases[item.id];
    if (played) {
      entry.played += 1;
      entry.stars += played.stars;
    }
  }

  const activeDays = [
    ...new Set(attempts.map((a) => localDayKey(a.submittedAt))),
  ].sort();
  const { current, longest } = streaks(activeDays, localDayKey(now));

  const playedModules = new Set(attempts.map((a) => a.moduleId));
  const catalogModules = new Set(catalog.map((c) => c.moduleId));
  const badges: Record<BadgeId, boolean> = {
    first_case: attempts.length > 0,
    perfect: Object.values(cases).some((c) => c.best >= 100),
    module_master: Object.values(modules).some(
      (m) => m.total > 0 && m.stars === m.maxStars,
    ),
    streak_3: longest >= 3,
    streak_7: longest >= 7,
    senior_clear: Object.entries(cases).some(
      ([caseId, c]) =>
        c.best >= SENIOR_CLEAR_SCORE && difficultyOf(caseId, info) === "senior",
    ),
    explorer:
      catalogModules.size > 0 &&
      [...catalogModules].every((id) => playedModules.has(id)),
    generated: attempts.some((a) => parseGeneratedCaseId(a.caseId) !== null),
  };

  return {
    xp,
    level: levelFor(xp),
    streak: current,
    longestStreak: longest,
    activeDays,
    badges,
    cases,
    modules,
    totalStars: Object.values(cases).reduce((sum, c) => sum + c.stars, 0),
  };
}

export interface AttemptReward {
  score: number;
  stars: number;
  /** XP this attempt added: the improvement on the case's previous best. */
  xpGained: number;
  before: { xp: number; level: LevelInfo };
  after: { xp: number; level: LevelInfo };
  newBadges: BadgeId[];
}

/** What one attempt earned, comparing progress just before and just after it. */
export function rewardFor(
  attempts: readonly ProgressAttempt[],
  attemptId: string,
  catalog: readonly CaseInfo[],
): AttemptReward | null {
  const target = attempts.find((a) => a.id === attemptId);
  if (!target) return null;
  const upTo = attempts.filter(
    (a) => a.submittedAt <= target.submittedAt && a.id !== attemptId,
  );
  const at = new Date(target.submittedAt);
  const before = computeProgress(upTo, catalog, at);
  const after = computeProgress([...upTo, target], catalog, at);
  return {
    score: target.score,
    stars: starsFor(target.score),
    xpGained: after.xp - before.xp,
    before: { xp: before.xp, level: before.level },
    after: { xp: after.xp, level: after.level },
    newBadges: BADGE_IDS.filter((id) => after.badges[id] && !before.badges[id]),
  };
}
