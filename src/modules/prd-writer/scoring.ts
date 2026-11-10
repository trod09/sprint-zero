/**
 * Deterministic scoring of a PRD.
 *
 * MASTER_PROMPT (Hito 2.6) asks for AI feedback anchored to sections and
 * sentences; the official score reads only what code can check against the
 * documents (weights 15 / 25 / 35 / 25):
 * - Evidence: strength of the evidence cited, over the three strongest.
 * - Success metric: the right metric (40%), its baseline as the documents
 *   state it (20%), a target the documents support (25%) and the horizon
 *   (15%). Baseline and target only count with the right metric.
 * - Scope: each requirement in the right bucket; half credit one bucket off
 *   (v1 / later / out), none for v1 versus out.
 * - Risks: relevance of the risks named, over the three most relevant.
 * Everything written in the learner's words goes to the AI coach.
 */
import { z } from "zod";

import { buildScoreResult, clamp01, scoreResultSchema } from "@/core/scoring";

import {
  BUCKETS,
  bucketSchema,
  horizonSchema,
  MAX_EVIDENCE,
  MAX_RISKS,
  type Bucket,
  type PrdAnswer,
  type PrdCase,
} from "./schema";

export const PRD_WEIGHTS = {
  evidence: 15,
  metric: 25,
  scope: 35,
  risks: 25,
} as const;

export const METRIC_PARTS = {
  metric: 0.4,
  baseline: 0.2,
  target: 0.25,
  horizon: 0.15,
} as const;

/** A baseline within 1% of the documents counts as read correctly. */
export const BASELINE_TOLERANCE = 0.01;

export const prdReportSchema = z.object({
  evidence: z.array(
    z.object({ id: z.string(), strength: z.number(), picked: z.boolean() }),
  ),
  metric: z.object({
    chosenId: z.string().nullable(),
    primaryId: z.string(),
    baseline: z.number(),
    targetMin: z.number(),
    targetMax: z.number(),
    horizon: horizonSchema,
    learnerBaseline: z.number().nullable(),
    learnerTarget: z.number().nullable(),
    learnerHorizon: horizonSchema.nullable(),
    baselineOk: z.boolean(),
    targetOk: z.boolean(),
    horizonOk: z.boolean(),
  }),
  scope: z.array(
    z.object({
      id: z.string(),
      expected: bucketSchema,
      learner: bucketSchema.nullable(),
      credit: z.number(),
    }),
  ),
  risks: z.array(
    z.object({ id: z.string(), relevance: z.number(), picked: z.boolean() }),
  ),
});
export type PrdReport = z.infer<typeof prdReportSchema>;

export const prdResultSchema = scoreResultSchema.extend({
  report: prdReportSchema,
});
export type PrdResult = z.infer<typeof prdResultSchema>;

/** Credit for putting a requirement in `learner` when it belongs in `expected`. */
export function bucketCredit(expected: Bucket, learner: Bucket | null) {
  if (learner === null) return 0;
  const distance = Math.abs(
    BUCKETS.indexOf(expected) - BUCKETS.indexOf(learner),
  );
  return distance === 0 ? 1 : distance === 1 ? 0.5 : 0;
}

/** Sum of the picked values over the sum of the best `count` values. */
function bestShare(
  values: readonly { id: string; value: number }[],
  picked: readonly string[],
  count: number,
): number {
  const best = [...values]
    .sort((a, b) => b.value - a.value)
    .slice(0, count)
    .reduce((sum, item) => sum + item.value, 0);
  const got = values
    .filter((item) => picked.includes(item.id))
    .reduce((sum, item) => sum + item.value, 0);
  return best === 0 ? 0 : clamp01(got / best);
}

export function scorePrd(caseData: PrdCase, answer: PrdAnswer): PrdResult {
  const { hidden } = caseData;

  const evidenceIds = new Set(hidden.evidence.map((e) => e.id));
  const pickedEvidence = [...new Set(answer.evidenceIds)].filter((id) =>
    evidenceIds.has(id),
  );
  const evidenceRatio = bestShare(
    hidden.evidence.map((e) => ({ id: e.id, value: e.strength })),
    pickedEvidence,
    MAX_EVIDENCE,
  );

  const { metric } = hidden;
  const chosenId = caseData.metrics.some((m) => m.id === answer.metric.metricId)
    ? answer.metric.metricId
    : null;
  const rightMetric = chosenId === metric.primaryId;
  const baselineOk =
    rightMetric &&
    answer.metric.baseline !== null &&
    Math.abs(answer.metric.baseline - metric.baseline) <=
      Math.max(Math.abs(metric.baseline) * BASELINE_TOLERANCE, 1e-9);
  const targetOk =
    rightMetric &&
    answer.metric.target !== null &&
    answer.metric.target >= metric.targetMin &&
    answer.metric.target <= metric.targetMax;
  const horizonOk = answer.metric.horizon === metric.horizon;
  const metricRatio =
    (rightMetric ? METRIC_PARTS.metric : 0) +
    (baselineOk ? METRIC_PARTS.baseline : 0) +
    (targetOk ? METRIC_PARTS.target : 0) +
    (horizonOk ? METRIC_PARTS.horizon : 0);

  const scope = hidden.requirements.map((requirement) => {
    const learner = answer.scope[requirement.id] ?? null;
    return {
      id: requirement.id,
      expected: requirement.bucket,
      learner,
      credit: bucketCredit(requirement.bucket, learner),
    };
  });
  const scopeRatio =
    scope.reduce((sum, item) => sum + item.credit, 0) / scope.length;
  const wrongScope = scope.filter((item) => item.credit < 1).length;

  const riskIds = new Set(hidden.risks.map((r) => r.id));
  const pickedRisks = [...new Set(answer.risks.map((r) => r.riskId))].filter(
    (id) => riskIds.has(id),
  );
  const risksRatio = bestShare(
    hidden.risks.map((r) => ({ id: r.id, value: r.relevance })),
    pickedRisks,
    MAX_RISKS,
  );

  const metricMisses = [
    !rightMetric && "the primary metric",
    rightMetric && !baselineOk && "the baseline",
    rightMetric && !targetOk && "the target",
    !horizonOk && "the time frame",
  ].filter((item): item is string => typeof item === "string");

  const result = buildScoreResult([
    {
      id: "evidence",
      label: "Problem evidence",
      weight: PRD_WEIGHTS.evidence,
      ratio: evidenceRatio,
      detail:
        pickedEvidence.length === 0
          ? "You did not cite any evidence."
          : evidenceRatio === 1
            ? "You backed the problem with the strongest evidence."
            : "Some of the evidence you cited is weak or anecdotal.",
    },
    {
      id: "metric",
      label: "Success metric",
      weight: PRD_WEIGHTS.metric,
      ratio: clamp01(metricRatio),
      detail:
        metricMisses.length === 0
          ? "The right metric, with the baseline, target and time frame the documents support."
          : `Check ${metricMisses.join(", ")} against the documents.`,
    },
    {
      id: "scope",
      label: "Scope and non-goals",
      weight: PRD_WEIGHTS.scope,
      ratio: scopeRatio,
      detail:
        wrongScope === 0
          ? "Every requirement is in the right place."
          : `${wrongScope} of ${scope.length} requirements are not where the documents put them.`,
    },
    {
      id: "risks",
      label: "Risks",
      weight: PRD_WEIGHTS.risks,
      ratio: risksRatio,
      detail:
        pickedRisks.length === 0
          ? "You did not name any risk."
          : risksRatio === 1
            ? "You named the risks that matter most."
            : "A more relevant risk was left out.",
    },
  ]);

  const report: PrdReport = {
    evidence: hidden.evidence.map((e) => ({
      id: e.id,
      strength: e.strength,
      picked: pickedEvidence.includes(e.id),
    })),
    metric: {
      chosenId,
      primaryId: metric.primaryId,
      baseline: metric.baseline,
      targetMin: metric.targetMin,
      targetMax: metric.targetMax,
      horizon: metric.horizon,
      learnerBaseline: answer.metric.baseline,
      learnerTarget: answer.metric.target,
      learnerHorizon: answer.metric.horizon,
      baselineOk,
      targetOk,
      horizonOk,
    },
    scope,
    risks: hidden.risks.map((r) => ({
      id: r.id,
      relevance: r.relevance,
      picked: pickedRisks.includes(r.id),
    })),
  };
  return { ...result, report };
}
