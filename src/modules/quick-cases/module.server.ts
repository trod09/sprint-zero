/**
 * Full Quick Cases definition: schemas, ground-truth stripping and the
 * scoring engine. Server only.
 */
import "server-only";

import type { SimulationModule } from "@/core/case-engine";

import { buildQuickFeedbackContext } from "./feedback";
import { quickCasesMeta } from "./module";
import { toPublicQuickCase } from "./public";
import {
  publicQuickCaseSchema,
  quickAnswerSchema,
  quickCaseSchema,
  type PublicQuickCase,
  type QuickAnswer,
  type QuickCase,
} from "./schema";
import { scoreQuickCase, type QuickResult } from "./scoring";

export const QUICK_FEEDBACK_RUBRIC = `Review the learner's quick case the way an interviewer debriefs a 15-minute exercise:
1. For each decision where they did not pick the best option, explain with the numbers from the exhibits why the best option beats theirs.
2. Reasoning: did they use the exhibits and do the arithmetic, or argue from instinct? Quote what they wrote.
3. The written piece: is it specific, honest and short? Quote the sentence you would change and rewrite it.

Finish with the one habit that would most improve their next quick case.`;

export const quickCasesModule: SimulationModule<
  QuickCase,
  PublicQuickCase,
  QuickAnswer,
  QuickResult
> = {
  meta: quickCasesMeta,
  caseSchema: quickCaseSchema,
  publicCaseSchema: publicQuickCaseSchema,
  answerSchema: quickAnswerSchema,
  toPublicCase: toPublicQuickCase,
  score: scoreQuickCase,
  feedbackRubric: QUICK_FEEDBACK_RUBRIC,
  feedbackContext: buildQuickFeedbackContext,
};
