/**
 * Deterministic scoring of a Product Case.
 *
 * MASTER_PROMPT (Hito 2.5): a rubric per step and an annotated ideal answer.
 * The official score reads only the structured choices; the written
 * reasoning goes to the AI coach.
 *
 * Design, improvement and strategy (weights 20 / 25 / 30 / 25):
 * - Users: fit of the chosen segment, 0-3.
 * - Problems: severity of the chosen problems for the chosen segment, over
 *   the best possible pair. Judged against the learner's own segment, so one
 *   early miss does not sink every later step.
 * - Priorities: the first solution's priority over the best one (60%) and
 *   overlap of the top three (40%), for the learner's own problems.
 * - Metrics: success metric fit (60%) and guardrail fit (40%).
 *
 * Estimation (weights 40 / 60):
 * - Drivers: F1 of the facts used against the facts needed.
 * - Estimate: full credit within 1.25x of the truth, none beyond 3x,
 *   linear in log scale between.
 */
import { z } from "zod";

import { buildScoreResult, clamp01, scoreResultSchema } from "@/core/scoring";

import {
  bestSegmentId,
  rankSolutions,
  segmentSeverities,
  topProblems,
} from "./analysis";
import {
  MAX_PROBLEMS,
  MAX_RANKED_SOLUTIONS,
  type EstimationAnswer,
  type EstimationCase,
  type ProductCase,
  type ProductCaseAnswer,
  type StructuredAnswer,
  type StructuredCase,
} from "./schema";

export const STRUCTURED_WEIGHTS = {
  users: 20,
  problems: 25,
  priorities: 30,
  metrics: 25,
} as const;
export const ESTIMATION_WEIGHTS = { drivers: 40, estimate: 60 } as const;

export const FIRST_PICK_SHARE = 0.6;
export const SUCCESS_SHARE = 0.6;
export const ESTIMATE_FULL_CREDIT = 1.25;
export const ESTIMATE_ZERO_CREDIT = 3;

const structuredReportSchema = z.object({
  kind: z.literal("structured"),
  segment: z.object({
    chosenId: z.string().nullable(),
    bestId: z.string(),
    /** Segment the later steps are judged against. */
    basisId: z.string(),
  }),
  problems: z.array(
    z.object({
      id: z.string(),
      severity: z.number(),
      top: z.boolean(),
      picked: z.boolean(),
    }),
  ),
  /** Problems the solutions are judged against. */
  problemBasis: z.array(z.string()),
  solutions: z.array(
    z.object({
      id: z.string(),
      value: z.number(),
      effort: z.number(),
      priority: z.number(),
      rank: z.number().int(),
      learnerPosition: z.number().int().nullable(),
    }),
  ),
  bestRanking: z.array(z.string()),
  metrics: z.object({
    successId: z.string().nullable(),
    guardrailId: z.string().nullable(),
  }),
});

const estimationReportSchema = z.object({
  kind: z.literal("estimation"),
  facts: z.array(
    z.object({ id: z.string(), required: z.boolean(), used: z.boolean() }),
  ),
  estimate: z.number().nullable(),
  truth: z.number(),
  /** Estimate over truth. */
  ratio: z.number().nullable(),
  trapEstimate: z.number(),
  formula: z.string(),
});

export const productCaseReportSchema = z.discriminatedUnion("kind", [
  structuredReportSchema,
  estimationReportSchema,
]);
export type ProductCaseReport = z.infer<typeof productCaseReportSchema>;
export type StructuredReport = z.infer<typeof structuredReportSchema>;
export type EstimationReport = z.infer<typeof estimationReportSchema>;

export const productCaseResultSchema = scoreResultSchema.extend({
  report: productCaseReportSchema,
});
export type ProductCaseResult = z.infer<typeof productCaseResultSchema>;

const EMPTY_STRUCTURED: Omit<StructuredAnswer, "kind"> = {
  segmentId: null,
  usersWhy: "",
  problemIds: [],
  problemsWhy: "",
  ideas: "",
  solutionRanking: [],
  solutionsWhy: "",
  successMetricId: null,
  guardrailMetricId: null,
  metricsWhy: "",
};

const EMPTY_ESTIMATION: Omit<EstimationAnswer, "kind"> = {
  factIds: [],
  multipliers: [],
  estimate: null,
  approach: "",
  sanityCheck: "",
};

export function scoreProductCase(
  caseData: ProductCase,
  answer: ProductCaseAnswer,
): ProductCaseResult {
  if (caseData.kind === "estimation") {
    const estimation =
      answer.kind === "estimation"
        ? answer
        : { kind: "estimation" as const, ...EMPTY_ESTIMATION };
    return scoreEstimation(caseData, estimation);
  }
  const structured =
    answer.kind === "estimation"
      ? { kind: caseData.kind, ...EMPTY_STRUCTURED }
      : answer;
  return scoreStructured(caseData, structured);
}

// ------------------------------------------------------------ structured

export function scoreStructured(
  caseData: StructuredCase,
  answer: StructuredAnswer,
): ProductCaseResult {
  const { hidden } = caseData;
  const fitOf = new Map(hidden.segments.map((s) => [s.id, s.fit]));
  const bestId = bestSegmentId(caseData);
  const chosenId =
    answer.segmentId && fitOf.has(answer.segmentId) ? answer.segmentId : null;
  const basisId = chosenId ?? bestId;

  // Problems, judged for the learner's own segment.
  const severities = segmentSeverities(caseData, basisId);
  const top = topProblems(caseData, basisId, MAX_PROBLEMS);
  const topIds = new Set(top.map((p) => p.id));
  const severityOf = new Map(severities.map((p) => [p.id, p.severity]));
  const picked = answer.problemIds.filter((id) => severityOf.has(id));
  const bestSeverity = top.reduce((sum, p) => sum + p.severity, 0);
  const pickedSeverity = picked.reduce(
    (sum, id) => sum + (severityOf.get(id) ?? 0),
    0,
  );

  // Solutions, judged for the learner's own problems.
  const basisProblems =
    picked.length > 0
      ? picked.map((id) => ({ id, severity: severityOf.get(id) ?? 0 }))
      : top;
  const ranked = rankSolutions(caseData, basisProblems);
  const priorityOf = new Map(ranked.map((s) => [s.id, s.priority]));
  const ranking = answer.solutionRanking.filter((id) => priorityOf.has(id));
  const bestRanking = ranked.slice(0, MAX_RANKED_SOLUTIONS).map((s) => s.id);
  const bestPriority = ranked[0].priority;
  const firstRatio =
    ranking.length === 0 || bestPriority === 0
      ? 0
      : (priorityOf.get(ranking[0]) ?? 0) / bestPriority;
  const overlap =
    ranking.filter((id) => bestRanking.includes(id)).length /
    MAX_RANKED_SOLUTIONS;

  // Metrics.
  const metricOf = new Map(hidden.metrics.map((m) => [m.id, m]));
  const success = answer.successMetricId
    ? metricOf.get(answer.successMetricId)
    : undefined;
  const guardrail =
    answer.guardrailMetricId &&
    answer.guardrailMetricId !== answer.successMetricId
      ? metricOf.get(answer.guardrailMetricId)
      : undefined;
  const successRatio = (success?.success ?? 0) / 2;
  const guardrailRatio = (guardrail?.guardrail ?? 0) / 2;

  const segmentName = (id: string) =>
    caseData.segments.find((s) => s.id === id)?.name ?? id;
  const fit = chosenId ? (fitOf.get(chosenId) ?? 0) : 0;

  const result = buildScoreResult([
    {
      id: "users",
      label: "Users",
      weight: STRUCTURED_WEIGHTS.users,
      ratio: fit / 3,
      detail: !chosenId
        ? "You did not choose a segment."
        : chosenId === bestId
          ? `${segmentName(chosenId)} is the segment where the users' pain and the business's value overlap most.`
          : `You chose ${segmentName(chosenId)}; ${segmentName(bestId)} was the stronger choice.`,
    },
    {
      id: "problems",
      label: "Problems",
      weight: STRUCTURED_WEIGHTS.problems,
      ratio: bestSeverity === 0 ? 0 : clamp01(pickedSeverity / bestSeverity),
      detail:
        picked.length === 0
          ? "You did not choose any problem."
          : picked.every((id) => topIds.has(id)) &&
              picked.length === MAX_PROBLEMS
            ? `You picked the problems that hurt ${segmentName(basisId)} most.`
            : `Some of the problems you picked hurt ${segmentName(basisId)} less than others on the list.`,
    },
    {
      id: "priorities",
      label: "Priorities",
      weight: STRUCTURED_WEIGHTS.priorities,
      ratio: clamp01(
        FIRST_PICK_SHARE * firstRatio + (1 - FIRST_PICK_SHARE) * overlap,
      ),
      detail:
        ranking.length === 0
          ? "You did not rank any solution."
          : ranking[0] === bestRanking[0]
            ? "Your first solution gives the most relief per unit of effort for the problems you chose."
            : "Another solution gives more relief per unit of effort for the problems you chose.",
    },
    {
      id: "metrics",
      label: "Metrics",
      weight: STRUCTURED_WEIGHTS.metrics,
      ratio: clamp01(
        SUCCESS_SHARE * successRatio + (1 - SUCCESS_SHARE) * guardrailRatio,
      ),
      detail:
        !success && !guardrail
          ? "You did not choose metrics."
          : successRatio === 1 && guardrailRatio === 1
            ? "A success metric that measures the change directly, and a guardrail that catches its likely harm."
            : successRatio < 1
              ? "Your success metric is indirect, slow or a vanity number."
              : "Your guardrail would not catch the most likely harm.",
    },
  ]);

  const learnerPosition = new Map(ranking.map((id, index) => [id, index + 1]));
  const report: StructuredReport = {
    kind: "structured",
    segment: { chosenId, bestId, basisId },
    problems: severities.map((p) => ({
      id: p.id,
      severity: p.severity,
      top: topIds.has(p.id),
      picked: picked.includes(p.id),
    })),
    problemBasis: basisProblems.map((p) => p.id),
    solutions: ranked.map((s, index) => ({
      ...s,
      priority: Math.round(s.priority * 100) / 100,
      rank: index + 1,
      learnerPosition: learnerPosition.get(s.id) ?? null,
    })),
    bestRanking,
    metrics: {
      successId: success ? answer.successMetricId : null,
      guardrailId: guardrail ? answer.guardrailMetricId : null,
    },
  };
  return { ...result, report };
}

// ------------------------------------------------------------ estimation

/** Share of credit for an estimate `ratio` times the truth. */
export function estimateAccuracy(ratio: number): number {
  if (!(ratio > 0)) return 0;
  const error = Math.abs(Math.log(ratio));
  const full = Math.log(ESTIMATE_FULL_CREDIT);
  const zero = Math.log(ESTIMATE_ZERO_CREDIT);
  return clamp01(1 - (error - full) / (zero - full));
}

const timesOff = (ratio: number) =>
  ratio >= 1
    ? `${ratio.toFixed(1)}x too high`
    : `${(1 / ratio).toFixed(1)}x too low`;

export function scoreEstimation(
  caseData: EstimationCase,
  answer: EstimationAnswer,
): ProductCaseResult {
  const { hidden } = caseData;
  const factIds = new Set(caseData.facts.map((f) => f.id));
  const used = [...new Set(answer.factIds)].filter((id) => factIds.has(id));
  const required = new Set(hidden.requiredFactIds);
  const hits = used.filter((id) => required.has(id)).length;
  const precision = used.length === 0 ? 0 : hits / used.length;
  const recall = hits / required.size;
  const f1 =
    precision + recall === 0
      ? 0
      : (2 * precision * recall) / (precision + recall);
  const ratio = answer.estimate ? answer.estimate / hidden.truth : null;
  const extra = used.filter((id) => !required.has(id)).length;
  const missing = required.size - hits;

  const result = buildScoreResult([
    {
      id: "drivers",
      label: "Drivers",
      weight: ESTIMATION_WEIGHTS.drivers,
      ratio: f1,
      detail:
        used.length === 0
          ? "You did not use any fact."
          : missing === 0 && extra === 0
            ? "You used exactly the facts the estimate needs."
            : `You left out ${missing} needed ${missing === 1 ? "fact" : "facts"} and used ${extra} that ${extra === 1 ? "does" : "do"} not belong.`,
    },
    {
      id: "estimate",
      label: "Estimate",
      weight: ESTIMATION_WEIGHTS.estimate,
      ratio: ratio === null ? 0 : estimateAccuracy(ratio),
      detail:
        ratio === null
          ? "You did not give an estimate."
          : Math.abs(Math.log(ratio)) <= Math.log(ESTIMATE_FULL_CREDIT)
            ? "Your estimate is within 25% of the answer."
            : `Your estimate is ${timesOff(ratio)}.`,
    },
  ]);

  const report: EstimationReport = {
    kind: "estimation",
    facts: caseData.facts.map((fact) => ({
      id: fact.id,
      required: required.has(fact.id),
      used: used.includes(fact.id),
    })),
    estimate: answer.estimate,
    truth: hidden.truth,
    ratio: ratio === null ? null : Math.round(ratio * 1000) / 1000,
    trapEstimate: hidden.trapEstimate,
    formula: hidden.formula,
  };
  return { ...result, report };
}
