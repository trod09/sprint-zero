/**
 * Full Product Case definition: schemas, ground-truth stripping and the
 * scoring engine. Server only.
 */
import "server-only";

import type { SimulationModule } from "@/core/case-engine";

import { buildProductCaseFeedbackContext } from "./feedback";
import { productCaseMeta } from "./module";
import { toPublicProductCase } from "./public";
import {
  productCaseAnswerSchema,
  productCaseSchema,
  publicProductCaseSchema,
  type ProductCase,
  type ProductCaseAnswer,
  type PublicProductCase,
} from "./schema";
import { scoreProductCase, type ProductCaseResult } from "./scoring";

export const PRODUCT_CASE_FEEDBACK_RUBRIC = `Assess the learner's answer like a PM interviewer, step by step, on these points:
1. Structure: did they move from users to problems to solutions to metrics (or, for an estimate, from the right base to each factor), with each step following from the one before?
2. Users and problems: is their reasoning grounded in the research given, or in assumptions? Point to the evidence they used or missed.
3. Priorities: did they weigh relief against effort, and resist the tempting option? Comment on their own ideas: which would be worth exploring.
4. Metrics or sanity check: does the success metric measure the change directly and quickly, and does the guardrail catch the likely harm? For an estimate, did they check the result against something they know?
5. Communication: is their reasoning concise and easy to follow, as an interviewer would want to hear it?

Quote their words where useful. Finish with the one habit that would most improve their next interview answer.`;

export const productCaseModule: SimulationModule<
  ProductCase,
  PublicProductCase,
  ProductCaseAnswer,
  ProductCaseResult
> = {
  meta: productCaseMeta,
  caseSchema: productCaseSchema,
  publicCaseSchema: publicProductCaseSchema,
  answerSchema: productCaseAnswerSchema,
  toPublicCase: toPublicProductCase,
  score: scoreProductCase,
  feedbackRubric: PRODUCT_CASE_FEEDBACK_RUBRIC,
  feedbackContext: buildProductCaseFeedbackContext,
};
