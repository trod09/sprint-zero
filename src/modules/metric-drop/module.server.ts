/**
 * Full Metric Drop definition: schemas, ground-truth stripping and the
 * scoring engine. Server only.
 */
import "server-only";

import type { SimulationModule } from "@/core/case-engine";

import { buildMetricDropFeedbackContext } from "./feedback";
import { metricDropMeta } from "./module";
import { toPublicMetricDropCase } from "./public";
import {
  metricDropAnswerSchema,
  metricDropCaseSchema,
  publicMetricDropCaseSchema,
  type MetricDropAnswer,
  type MetricDropCase,
  type PublicMetricDropCase,
} from "./schema";
import { scoreMetricDropAnswer, type MetricDropResult } from "./scoring";

export const METRIC_DROP_FEEDBACK_RUBRIC = `Assess the learner's investigation on these points, in this order:
1. Diagnosis: did they name the right segment and the right kind of cause? If not, what in the data should have pointed them there?
2. Method: did they confirm the drop, slice by the dimensions that split it, and check the obvious suspects (releases, campaigns, holidays) against the data instead of the calendar?
3. False leads: did they rule out the tempting explanations with evidence?
4. Action: is the recommended next step proportionate and does it follow from the diagnosis?
5. Justification: is their reasoning, as written, specific and backed by numbers from the dashboard?

Finish with one analytics principle that would have helped the most.`;

export const metricDropModule: SimulationModule<
  MetricDropCase,
  PublicMetricDropCase,
  MetricDropAnswer,
  MetricDropResult
> = {
  meta: metricDropMeta,
  caseSchema: metricDropCaseSchema,
  publicCaseSchema: publicMetricDropCaseSchema,
  answerSchema: metricDropAnswerSchema,
  toPublicCase: toPublicMetricDropCase,
  score: scoreMetricDropAnswer,
  feedbackRubric: METRIC_DROP_FEEDBACK_RUBRIC,
  feedbackContext: buildMetricDropFeedbackContext,
};
