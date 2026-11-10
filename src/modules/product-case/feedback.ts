/**
 * What the AI coach is told about a Product Case answer: each step's choice
 * with how good it was and why, the ideal answer, and the learner's written
 * reasoning in the untrusted block.
 */
import type { FeedbackContext } from "@/core/case-engine";

import type { ProductCase, ProductCaseAnswer } from "./schema";
import type { ProductCaseResult } from "./scoring";

export function buildProductCaseFeedbackContext(
  caseData: ProductCase,
  answer: ProductCaseAnswer,
  result: ProductCaseResult,
): FeedbackContext {
  const { report } = result;
  if (caseData.kind === "estimation" || report.kind === "estimation") {
    if (caseData.kind !== "estimation" || report.kind !== "estimation") {
      return { analysis: { mismatch: true }, learnerAnswer: {} };
    }
    const factOf = new Map(caseData.facts.map((f) => [f.id, f]));
    return {
      analysis: {
        question: caseData.prompt,
        unit: caseData.answerUnit,
        facts: report.facts.map((fact) => ({
          fact: factOf.get(fact.id)?.label,
          needed: fact.required,
          usedByLearner: fact.used,
          why: caseData.hidden.factNotes[fact.id],
        })),
        constants: caseData.hidden.constants,
        correctFormula: report.formula,
        trueEstimate: report.truth,
        learnerEstimate: report.estimate,
        learnerOverTruth: report.ratio,
        estimateIfFallingForTheTrap: report.trapEstimate,
        idealAnswer: caseData.hidden.ideal,
      },
      learnerAnswer:
        answer.kind === "estimation"
          ? {
              multipliers: answer.multipliers,
              approach: answer.approach,
              sanityCheck: answer.sanityCheck,
            }
          : {},
    };
  }

  const { hidden } = caseData;
  const nameOf = new Map<string, string>([
    ...caseData.segments.map((s) => [s.id, s.name] as const),
    ...caseData.problems.map((p) => [p.id, p.statement] as const),
    ...caseData.solutions.map((s) => [s.id, s.name] as const),
    ...caseData.metrics.map((m) => [m.id, m.name] as const),
  ]);
  const why = new Map<string, string>([
    ...hidden.segments.map((s) => [s.id, s.why] as const),
    ...hidden.problems.map((p) => [p.id, p.why] as const),
    ...hidden.solutions.map((s) => [s.id, s.why] as const),
    ...hidden.metrics.map((m) => [m.id, m.why] as const),
  ]);
  const describe = (id: string | null) =>
    id ? { option: nameOf.get(id), why: why.get(id) } : null;

  return {
    analysis: {
      question: caseData.prompt,
      kind: caseData.kind,
      users: {
        learnerChoice: describe(report.segment.chosenId),
        bestChoice: describe(report.segment.bestId),
      },
      problems: {
        judgedForSegment: nameOf.get(report.segment.basisId),
        learnerChoices: report.problems
          .filter((p) => p.picked)
          .map((p) => ({ ...describe(p.id), severity: p.severity })),
        mostSevere: report.problems
          .filter((p) => p.top)
          .map((p) => ({ ...describe(p.id), severity: p.severity })),
      },
      priorities: {
        learnerOrder: report.solutions
          .filter((s) => s.learnerPosition !== null)
          .sort((a, b) => a.learnerPosition! - b.learnerPosition!)
          .map((s) => ({ ...describe(s.id), priority: s.priority })),
        bestOrder: report.bestRanking.map((id) => describe(id)),
      },
      metrics: {
        learnerSuccess: describe(report.metrics.successId),
        learnerGuardrail: describe(report.metrics.guardrailId),
        best: hidden.metrics
          .filter((m) => m.success === 2 || m.guardrail === 2)
          .map((m) => describe(m.id)),
      },
      idealAnswer: hidden.ideal,
    },
    learnerAnswer:
      answer.kind === "estimation"
        ? {}
        : {
            whyTheseUsers: answer.usersWhy,
            whyTheseProblems: answer.problemsWhy,
            ownIdeas: answer.ideas,
            whyThisOrder: answer.solutionsWhy,
            whyTheseMetrics: answer.metricsWhy,
          },
  };
}
