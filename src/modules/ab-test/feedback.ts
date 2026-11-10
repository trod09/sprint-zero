/**
 * What the AI coach is told about an A/B test attempt: the key numbers of the
 * readout, the truth and the learner's call. The justification is the
 * learner's own text and goes in the untrusted block.
 */
import type { FeedbackContext } from "@/core/case-engine";

import { formatLift, formatPValue, readExperiment } from "./analysis";
import type { AbTestAnswer, AbTestCase } from "./schema";
import type { AbTestResult } from "./scoring";

export function buildAbTestFeedbackContext(
  caseData: AbTestCase,
  answer: AbTestAnswer,
  result: AbTestResult,
): FeedbackContext {
  const readout = readExperiment(caseData);
  const { experiment } = caseData;
  return {
    analysis: {
      company: `${caseData.company.name} (${caseData.company.industry})`,
      experiment: {
        name: experiment.name,
        change: experiment.change,
        primaryMetric: experiment.primaryMetric.label,
        plannedDays: experiment.plan.days,
        daysRun: caseData.results.daysRun,
        plannedSamplePerArm: experiment.plan.samplePerArm,
      },
      readout: {
        primaryLift: formatLift(readout.primary.relativeLift),
        primaryPValue: formatPValue(readout.primary.pValue),
        primaryInterval: `${formatLift(readout.primary.ciLow)} to ${formatLift(readout.primary.ciHigh)}`,
        treatmentShareOfUsers: `${(readout.sampleRatio.observedShare * 100).toFixed(1)}%`,
        sampleRatioPValue: formatPValue(readout.sampleRatio.pValue),
        usersPerArm: readout.usersPerArm,
        firstWeekLift: readout.firstWeek
          ? formatLift(readout.firstWeek.relativeLift)
          : null,
        lastWeekLift: readout.lastWeek
          ? formatLift(readout.lastWeek.relativeLift)
          : null,
        segments: readout.segments.map((segment) => ({
          [experiment.segmentDimension]: segment.value,
          lift: formatLift(segment.comparison.relativeLift),
          treatmentShare: `${(segment.treatmentShare * 100).toFixed(1)}%`,
        })),
        guardrails: readout.guardrails.map((guardrail) => ({
          metric: guardrail.guardrail.label,
          change: formatLift(guardrail.comparison.relativeLift),
          pValue: formatPValue(guardrail.comparison.pValue),
          tolerancePercent: guardrail.guardrail.tolerance,
          breached: guardrail.breached,
        })),
      },
      truth: result.report.truth,
      scoredOutcome: {
        problems: result.report.issues.filter((i) => i.status !== "clear"),
        decisionCredit: result.report.decisionCredit,
        effectCredit: result.report.effectCredit,
      },
    },
    learnerAnswer: {
      problemsFlagged: answer.issues,
      effect: answer.effect,
      decision: answer.decision,
      justification: answer.justification,
      tabsOpened: answer.viewed,
    },
  };
}
