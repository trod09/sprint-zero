/**
 * What the AI coach is told about a critique: the planted problems, what the
 * learner found, and their notes, which go in the untrusted block.
 */
import type { FeedbackContext } from "@/core/case-engine";

import type { UxCritiqueAnswer, UxCritiqueCase } from "./schema";
import type { UxResult } from "./scoring";

export function buildUxFeedbackContext(
  caseData: UxCritiqueCase,
  answer: UxCritiqueAnswer,
  result: UxResult,
): FeedbackContext {
  const labelOf = new Map(
    caseData.screen.regions.map((region) => [region.id, region.label]),
  );
  return {
    analysis: {
      product: `${caseData.company.name} (${caseData.company.industry})`,
      screen: caseData.screen.template,
      userGoal: caseData.userGoal,
      plantedProblems: result.report.issues.map((issue) => ({
        where: issue.regionLabel,
        kind: issue.type,
        whyItHurts: issue.explanation,
        fix: issue.fix,
        learnerOutcome: issue.outcome,
      })),
      falseAlarms: result.report.falseAlarms.map((alarm) => ({
        where: alarm.regionLabel,
        kind: alarm.type,
      })),
    },
    learnerAnswer: {
      findings: answer.findings.map((finding) => ({
        where: labelOf.get(finding.regionId) ?? finding.regionId,
        kind: finding.type,
        note: finding.note,
      })),
    },
  };
}
