/**
 * Deterministic scoring of a Metric Drop diagnosis.
 *
 * Weights follow MASTER_PROMPT (Hito 1.7): affected segment 40, cause
 * category 25, exploration efficiency 15, not falling for false leads 10,
 * recommended action 10. The action is a choice between options, so the
 * official score stays deterministic; the AI coach comments on the written
 * justification without changing the score.
 */
import { z } from "zod";

import { buildScoreResult, clamp01, scoreResultSchema } from "@/core/scoring";

import { enumerateCells, matchesSegment } from "./dataset";
import {
  explorationSchema,
  rootCauseCategorySchema,
  segmentAnswerSchema,
  type Exploration,
  type MetricDropAnswer,
  type MetricDropCase,
  type SegmentAnswer,
} from "./schema";

export const METRIC_DROP_WEIGHTS = {
  segment: 40,
  category: 25,
  efficiency: 15,
  falseLeads: 10,
  action: 10,
} as const;

/** Views a direct investigation needs before it looks at the right dimension. */
export const IDEAL_STEPS = 4;
/** Extra views after which efficiency bottoms out. */
const EXTRA_STEPS_TO_FLOOR = 16;
const EFFICIENCY_FLOOR = 0.25;

/** Cells (combinations of dimensions) a segment answer covers. */
function cellsOf(
  caseData: MetricDropCase,
  segment: SegmentAnswer,
): Set<string> {
  return new Set(
    enumerateCells(caseData.release)
      .filter((dims) =>
        matchesSegment(dims, { [segment.dimension]: segment.value }),
      )
      .map((dims) => Object.values(dims).join("|")),
  );
}

/**
 * How well the answered segment matches the real one: the share of the
 * answer that is affected times the share of the affected cells it covers.
 * "web" as a platform and as an app version are the same cells, so both are
 * right; "android" for "android-4.2.0" covers it but is twice too wide (0.5).
 */
export function segmentMatch(
  caseData: MetricDropCase,
  answer: SegmentAnswer,
  truth: SegmentAnswer,
): number {
  const answered = cellsOf(caseData, answer);
  const affected = cellsOf(caseData, truth);
  if (answered.size === 0 || affected.size === 0) return 0;
  let overlap = 0;
  for (const cell of answered) if (affected.has(cell)) overlap += 1;
  return (overlap / answered.size) * (overlap / affected.size);
}

/** True when a view looks at the root cause's dimension or value. */
function revealsCause(exploration: Exploration, truth: SegmentAnswer): boolean {
  return (
    exploration.breakdown === truth.dimension ||
    (exploration.filters[truth.dimension]?.includes(truth.value) ?? false)
  );
}

export const metricDropReportSchema = z.object({
  truth: z.object({
    segment: segmentAnswerSchema,
    category: rootCauseCategorySchema,
    summary: z.string(),
    explanation: z.string(),
    idealAction: z.string(),
    idealActionId: z.string(),
    idealPath: z.array(z.string()),
  }),
  falseLeads: z.array(
    z.object({
      segment: segmentAnswerSchema,
      category: rootCauseCategorySchema,
      explanation: z.string(),
      chosen: z.boolean(),
    }),
  ),
  segmentMatch: z.number(),
  /** 1-based view at which the right dimension was first examined. */
  stepsToCause: z.number().int().nullable(),
  totalViews: z.number().int(),
  actionCredit: z.number(),
  explorations: z.array(explorationSchema),
});
export type MetricDropReport = z.infer<typeof metricDropReportSchema>;

export const metricDropResultSchema = scoreResultSchema.extend({
  report: metricDropReportSchema,
});
export type MetricDropResult = ReturnType<typeof scoreMetricDropAnswer>;

export function scoreMetricDropAnswer(
  caseData: MetricDropCase,
  answer: MetricDropAnswer,
) {
  const { rootCause, falseLeads } = caseData.hidden;
  const truth = rootCause.segment;

  const match = segmentMatch(caseData, answer.segment, truth);
  const categoryRight = answer.category === rootCause.category;

  const firstHit = answer.explorations.findIndex((view) =>
    revealsCause(view, truth),
  );
  const stepsToCause = firstHit === -1 ? null : firstHit + 1;
  const efficiency =
    stepsToCause === null
      ? 0
      : Math.max(
          EFFICIENCY_FLOOR,
          clamp01(
            1 - Math.max(0, stepsToCause - IDEAL_STEPS) / EXTRA_STEPS_TO_FLOOR,
          ),
        );

  const leads = falseLeads.map((lead) => ({
    segment: lead.segment,
    category: lead.category,
    explanation: lead.explanation,
    chosen: segmentMatch(caseData, answer.segment, lead.segment) >= 0.5,
  }));
  const fellForLead = leads.some((lead) => lead.chosen) && match < 0.5;

  const actionCredit =
    answer.actionId === rootCause.idealActionId
      ? 1
      : rootCause.partialActionIds.includes(answer.actionId)
        ? 0.5
        : 0;

  const actionLabel = (id: string) =>
    caseData.actionOptions.find((option) => option.id === id)?.label ?? id;

  const result = buildScoreResult([
    {
      id: "segment",
      label: "Affected segment",
      weight: METRIC_DROP_WEIGHTS.segment,
      ratio: match,
      detail:
        match === 1
          ? `Right: the drop is in ${truth.dimension} = ${truth.value}.`
          : match > 0
            ? `Partly right: the drop is in ${truth.dimension} = ${truth.value}; your segment was ${answer.segment.dimension} = ${answer.segment.value}.`
            : `The drop is in ${truth.dimension} = ${truth.value}, not in ${answer.segment.dimension} = ${answer.segment.value}.`,
    },
    {
      id: "category",
      label: "Cause category",
      weight: METRIC_DROP_WEIGHTS.category,
      ratio: categoryRight ? 1 : 0,
      detail: categoryRight
        ? `Right: the cause is ${rootCause.category}.`
        : `The cause is ${rootCause.category}, not ${answer.category}.`,
    },
    {
      id: "efficiency",
      label: "Exploration efficiency",
      weight: METRIC_DROP_WEIGHTS.efficiency,
      ratio: efficiency,
      detail:
        stepsToCause === null
          ? `You never looked at the data by ${truth.dimension}.`
          : `You looked at ${truth.dimension} on view ${stepsToCause} of ${answer.explorations.length}; a direct path needs about ${IDEAL_STEPS}.`,
    },
    {
      id: "false_leads",
      label: "False leads avoided",
      weight: METRIC_DROP_WEIGHTS.falseLeads,
      ratio: fellForLead ? 0 : 1,
      detail: fellForLead
        ? "Your diagnosis points at a false lead."
        : `You did not fall for ${falseLeads.length === 1 ? "the false lead" : `the ${falseLeads.length} false leads`}.`,
    },
    {
      id: "action",
      label: "Recommended next step",
      weight: METRIC_DROP_WEIGHTS.action,
      ratio: actionCredit,
      detail:
        actionCredit === 1
          ? "Right next step."
          : `Best next step: ${actionLabel(rootCause.idealActionId)}.`,
    },
  ]);

  const report: MetricDropReport = {
    truth: {
      segment: truth,
      category: rootCause.category,
      summary: rootCause.summary,
      explanation: rootCause.explanation,
      idealAction: rootCause.idealAction,
      idealActionId: rootCause.idealActionId,
      idealPath: rootCause.idealPath,
    },
    falseLeads: leads,
    segmentMatch: match,
    stepsToCause,
    totalViews: answer.explorations.length,
    actionCredit,
    explorations: answer.explorations,
  };
  return { ...result, report };
}
