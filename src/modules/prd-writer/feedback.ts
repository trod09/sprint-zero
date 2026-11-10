/**
 * What the AI coach is told about a PRD: what code checked and why each
 * choice was right or wrong, plus every sentence the learner wrote, by
 * section, in the untrusted block.
 */
import type { FeedbackContext } from "@/core/case-engine";

import type { PrdAnswer, PrdCase } from "./schema";
import type { PrdResult } from "./scoring";

export function buildPrdFeedbackContext(
  caseData: PrdCase,
  answer: PrdAnswer,
  result: PrdResult,
): FeedbackContext {
  const { hidden } = caseData;
  const { report } = result;
  const titleOf = new Map<string, string>([
    ...caseData.evidence.map((e) => [e.id, e.text] as const),
    ...caseData.metrics.map((m) => [m.id, m.name] as const),
    ...caseData.requirements.map((r) => [r.id, r.title] as const),
    ...caseData.risks.map((r) => [r.id, r.title] as const),
  ]);
  const evidenceWhy = new Map(hidden.evidence.map((e) => [e.id, e.why]));
  const scopeWhy = new Map(hidden.requirements.map((r) => [r.id, r.why]));
  const riskWhy = new Map(hidden.risks.map((r) => [r.id, r.why]));

  return {
    analysis: {
      feature: caseData.feature,
      documents: caseData.documents.map((d) => ({
        from: d.from,
        title: d.title,
        body: d.body,
      })),
      evidence: report.evidence.map((e) => ({
        evidence: titleOf.get(e.id),
        strength: e.strength,
        citedByLearner: e.picked,
        why: evidenceWhy.get(e.id),
      })),
      metric: {
        ...report.metric,
        chosen: report.metric.chosenId
          ? titleOf.get(report.metric.chosenId)
          : null,
        primary: titleOf.get(report.metric.primaryId),
      },
      scope: report.scope.map((s) => ({
        requirement: titleOf.get(s.id),
        rightBucket: s.expected,
        learnerBucket: s.learner,
        why: scopeWhy.get(s.id),
      })),
      risks: report.risks.map((r) => ({
        risk: titleOf.get(r.id),
        relevance: r.relevance,
        namedByLearner: r.picked,
        why: riskWhy.get(r.id),
      })),
      idealOnePager: hidden.ideal,
    },
    learnerAnswer: {
      problemStatement: answer.problem,
      goals: answer.goals,
      riskMitigations: answer.risks.map((risk) => ({
        risk: titleOf.get(risk.riskId) ?? risk.riskId,
        mitigation: risk.mitigation,
      })),
      openQuestions: answer.openQuestions,
    },
  };
}
