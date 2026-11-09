/**
 * Shared scoring primitives.
 *
 * The official score of an attempt is deterministic: the same case and the same
 * answer always produce the same `ScoreResult`. Modules compute a 0..1 ratio per
 * criterion and `buildScoreResult` turns them into weighted points out of 100.
 */
import { z } from "zod";

export const MAX_SCORE = 100;

export const scoreCriterionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** Points this criterion is worth. All weights of a result add up to 100. */
  weight: z.number().min(0).max(MAX_SCORE),
  /** How much of the criterion was achieved, from 0 to 1. */
  ratio: z.number().min(0).max(1),
  /** Points earned: weight * ratio, rounded to one decimal. */
  points: z.number().min(0).max(MAX_SCORE),
  /** Human-readable explanation shown in the score breakdown. */
  detail: z.string().optional(),
});
export type ScoreCriterion = z.infer<typeof scoreCriterionSchema>;

export const scoreResultSchema = z.object({
  /** Official score, integer 0..100. */
  total: z.number().int().min(0).max(MAX_SCORE),
  criteria: z.array(scoreCriterionSchema).min(1),
});
export type ScoreResult = z.infer<typeof scoreResultSchema>;

export type ScoreCriterionInput = Omit<ScoreCriterion, "points">;

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

/** `numerator / denominator` clamped to 0..1. A zero denominator yields `whenEmpty`. */
export function safeRatio(
  numerator: number,
  denominator: number,
  whenEmpty = 1,
): number {
  if (denominator === 0) return clamp01(whenEmpty);
  return clamp01(numerator / denominator);
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  // The epsilon corrects binary float artefacts such as 1.005 * 100 = 100.49999.
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

const WEIGHT_TOLERANCE = 1e-6;

/**
 * Builds the official score from weighted criteria.
 * Throws if weights do not add up to 100 or ids repeat: both are programming
 * errors in a module's scoring engine, never something a user can trigger.
 */
export function buildScoreResult(
  criteria: readonly ScoreCriterionInput[],
): ScoreResult {
  if (criteria.length === 0) {
    throw new Error("A score needs at least one criterion");
  }
  const ids = new Set<string>();
  let weightSum = 0;
  for (const criterion of criteria) {
    if (ids.has(criterion.id)) {
      throw new Error(`Duplicate score criterion id "${criterion.id}"`);
    }
    ids.add(criterion.id);
    if (!(criterion.ratio >= 0 && criterion.ratio <= 1)) {
      throw new Error(
        `Criterion "${criterion.id}" has ratio ${criterion.ratio}; expected 0..1`,
      );
    }
    if (!(criterion.weight >= 0)) {
      throw new Error(
        `Criterion "${criterion.id}" has an invalid weight ${criterion.weight}`,
      );
    }
    weightSum += criterion.weight;
  }
  if (Math.abs(weightSum - MAX_SCORE) > WEIGHT_TOLERANCE) {
    throw new Error(
      `Criterion weights must add up to ${MAX_SCORE}, got ${weightSum}`,
    );
  }

  const exactTotal = criteria.reduce(
    (sum, criterion) => sum + criterion.weight * criterion.ratio,
    0,
  );
  return {
    total: clamp(Math.round(roundTo(exactTotal, 6)), 0, MAX_SCORE),
    criteria: criteria.map((criterion) => ({
      ...criterion,
      points: roundTo(criterion.weight * criterion.ratio, 1),
    })),
  };
}
