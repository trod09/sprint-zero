/**
 * What the AI coach is told about a quick case: each decision with the
 * rating and reason of every option, plus the learner's own words in the
 * untrusted block.
 */
import type { FeedbackContext } from "@/core/case-engine";

import type { QuickAnswer, QuickCase } from "./schema";
import type { QuickResult } from "./scoring";

export function buildQuickFeedbackContext(
  caseData: QuickCase,
  answer: QuickAnswer,
  result: QuickResult,
): FeedbackContext {
  return {
    analysis: {
      kind: caseData.kind,
      exhibits: caseData.exhibits,
      decisions: caseData.steps.map((step, index) => {
        const truth = caseData.hidden.steps[index];
        const report = result.report.steps[index];
        const why = new Map(truth.options.map((o) => [o.id, o.why]));
        const text = new Map(step.options.map((o) => [o.id, o.text]));
        return {
          question: step.question,
          optionsToChoose: step.pick,
          options: report.options.map((option) => ({
            option: text.get(option.id),
            ratingOutOf3: option.rating,
            chosenByLearner: option.picked,
            why: why.get(option.id),
          })),
        };
      }),
      modelAnswer: caseData.hidden.ideal,
      principle: caseData.hidden.principle,
    },
    learnerAnswer: {
      reasoning: answer.reasoning,
      [caseData.writing.label]: answer.writing,
    },
  };
}
