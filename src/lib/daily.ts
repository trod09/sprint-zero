/**
 * The daily case: one generated case per calendar day (UTC), the same for
 * everyone. Nothing is stored: the date picks the module, the industry, the
 * level and the seed, and the case id carries them.
 */
import {
  generatedCaseId,
  INDUSTRY_KEYS,
  MAX_SEED,
  type Difficulty,
  type IndustryKey,
} from "@/core/case-engine";
import { hashString } from "@/core/rng";

const DAY_MS = 86_400_000;
const EPOCH = Date.UTC(2026, 0, 1);

/** Sunday to Saturday: the week gets harder and eases off at the weekend. */
const LEVEL_BY_WEEKDAY: readonly Difficulty[] = [
  "pm",
  "apm",
  "apm",
  "pm",
  "pm",
  "senior",
  "pm",
];

export interface DailyCase {
  /** "2026-11-10" */
  date: string;
  /** Days since the first daily case, from 1. */
  number: number;
  caseId: string;
  moduleId: string;
  industry: IndustryKey;
  difficulty: Difficulty;
}

/** The UTC calendar day of a moment, as "YYYY-MM-DD". */
export function utcDay(moment: Date): string {
  return moment.toISOString().slice(0, 10);
}

/** `date` plus a number of days, as "YYYY-MM-DD". */
export function shiftDay(date: string, days: number): string {
  return utcDay(new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS));
}

/**
 * The daily case of a day. `moduleIds` are the modules that can generate
 * cases, in catalog order: they take turns, one per day.
 */
export function dailyCaseFor(
  date: string,
  moduleIds: readonly string[],
): DailyCase | null {
  const time = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(time) || moduleIds.length === 0) return null;
  const day = Math.floor((time - EPOCH) / DAY_MS);
  const moduleId =
    moduleIds[((day % moduleIds.length) + moduleIds.length) % moduleIds.length];
  const industry = INDUSTRY_KEYS[hashString(`${date}:industry`) % 4];
  const difficulty = LEVEL_BY_WEEKDAY[new Date(time).getUTCDay()];
  const seed = (hashString(`${date}:seed`) % MAX_SEED) + 1;
  return {
    date,
    number: day + 1,
    moduleId,
    industry,
    difficulty,
    caseId: generatedCaseId(moduleId, { seed, difficulty, industry }),
  };
}

/**
 * Consecutive days, ending today or yesterday, on which the daily case of
 * that day was played. `playedCaseIds` are the cases with an attempt.
 */
export function dailyStreak(
  today: string,
  moduleIds: readonly string[],
  playedCaseIds: ReadonlySet<string>,
): number {
  const played = (date: string) => {
    const daily = dailyCaseFor(date, moduleIds);
    return daily !== null && playedCaseIds.has(daily.caseId);
  };
  let date = played(today) ? today : shiftDay(today, -1);
  let streak = 0;
  while (played(date) && streak < 3650) {
    streak += 1;
    date = shiftDay(date, -1);
  }
  return streak;
}
