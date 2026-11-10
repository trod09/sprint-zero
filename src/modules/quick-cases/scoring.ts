/**
 * Deterministic score of a quick case: each decision earns the rating of
 * the options chosen against the best the step allows.
 */
import { z } from "zod";

import { buildScoreResult, safeRatio, scoreResultSchema } from "@/core/scoring";

import type { QuickAnswer, QuickCase } from "./schema";

export const quickReportSchema = z.object({
  steps: z.array(
    z.object({
      id: z.string(),
      earned: z.number(),
      best: z.number(),
      options: z.array(
        z.object({
          id: z.string(),
          rating: z.number(),
          picked: z.boolean(),
        }),
      ),
    }),
  ),
  timing: z.object({ timed: z.boolean(), secondsUsed: z.number() }).nullable(),
});
export type QuickReport = z.infer<typeof quickReportSchema>;

export const quickResultSchema = scoreResultSchema.extend({
  report: quickReportSchema,
});
export type QuickResult = ReturnType<typeof scoreQuickCase>;

/** The best total a step allows: its `pick` highest ratings. */
export function bestForStep(ratings: readonly number[], pick: number): number {
  return [...ratings]
    .sort((a, b) => b - a)
    .slice(0, pick)
    .reduce((total, rating) => total + rating, 0);
}

export function scoreQuickCase(caseData: QuickCase, answer: QuickAnswer) {
  const steps = caseData.steps.map((step, index) => {
    const truth = caseData.hidden.steps[index];
    const rating = new Map(truth.options.map((o) => [o.id, o.rating]));
    // Only the first `pick` distinct, known options count.
    const picked = [...new Set(answer.choices[step.id] ?? [])]
      .filter((id) => rating.has(id))
      .slice(0, step.pick);
    const earned = picked.reduce((total, id) => total + rating.get(id)!, 0);
    const best = bestForStep([...rating.values()], step.pick);
    return {
      step,
      weight: truth.weight,
      report: {
        id: step.id,
        earned,
        best,
        options: step.options.map((option) => ({
          id: option.id,
          rating: rating.get(option.id)!,
          picked: picked.includes(option.id),
        })),
      },
    };
  });

  const score = buildScoreResult(
    steps.map(({ step, weight, report }) => ({
      id: step.id,
      label: step.title,
      weight,
      ratio: safeRatio(report.earned, report.best, 0),
      detail:
        step.pick === 1
          ? `Your choice is worth ${report.earned} of ${report.best}`
          : `Your ${step.pick} choices are worth ${report.earned} of ${report.best}`,
    })),
  );
  return {
    ...score,
    report: {
      steps: steps.map((s) => s.report),
      timing: answer.timing ?? null,
    } satisfies QuickReport,
  };
}
