/**
 * What the AI coach is told about a Metric Drop attempt. The justification
 * is the learner's own text and goes in the untrusted block.
 */
import type { FeedbackContext } from "@/core/case-engine";

import type { MetricDropAnswer, MetricDropCase } from "./schema";
import type { MetricDropResult } from "./scoring";

export function buildMetricDropFeedbackContext(
  caseData: MetricDropCase,
  answer: MetricDropAnswer,
  result: MetricDropResult,
): FeedbackContext {
  const { report } = result;
  const actionLabel = (id: string) =>
    caseData.actionOptions.find((option) => option.id === id)?.label ?? id;
  return {
    analysis: {
      company: `${caseData.company.name} (${caseData.company.industry})`,
      question: caseData.brief,
      rootCause: report.truth,
      falseLeads: report.falseLeads,
      investigation: {
        viewsOpened: report.totalViews,
        viewWhereTheRightDimensionWasFirstExamined: report.stepsToCause,
        directPathNeedsAbout: 4,
      },
      bestAction: actionLabel(report.truth.idealActionId),
    },
    learnerAnswer: {
      segment: `${answer.segment.dimension} = ${answer.segment.value}`,
      category: answer.category,
      action: actionLabel(answer.actionId),
      justification: answer.justification,
      views: answer.explorations.map((view) => ({
        metric: view.metric,
        ...(view.breakdown ? { breakdown: view.breakdown } : {}),
        ...(Object.keys(view.filters).length > 0
          ? { filters: view.filters }
          : {}),
      })),
    },
  };
}
