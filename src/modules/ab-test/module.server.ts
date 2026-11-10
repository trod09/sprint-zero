/**
 * Full A/B Test Interpreter definition: schemas, ground-truth stripping and
 * the scoring engine. Server only.
 */
import "server-only";

import type { SimulationModule } from "@/core/case-engine";

import { buildAbTestFeedbackContext } from "./feedback";
import { abTestMeta } from "./module";
import { toPublicAbTestCase } from "./public";
import {
  abTestAnswerSchema,
  abTestCaseSchema,
  publicAbTestCaseSchema,
  type AbTestAnswer,
  type AbTestCase,
  type PublicAbTestCase,
} from "./schema";
import { scoreAbTestAnswer, type AbTestResult } from "./scoring";

export const AB_TEST_FEEDBACK_RUBRIC = `Assess the learner's read of the experiment on these points, in this order:
1. Trust: did they check that the experiment ran as designed (split vs. plan, sample vs. plan, duration) before reading the lift?
2. Traps: did they catch the problems the readout hides, and avoid flagging problems that are not there? Name the evidence in the data they should have used.
3. Effect: is their read of the real effect on the primary metric consistent with the evidence (significance, interval, time pattern, segments)?
4. Decision: does ship / iterate / kill follow from the evidence, including the guardrails?
5. Justification: is their reasoning, as written, specific and backed by numbers from the readout?

Finish with one experimentation principle that would have helped the most.`;

export const abTestModule: SimulationModule<
  AbTestCase,
  PublicAbTestCase,
  AbTestAnswer,
  AbTestResult
> = {
  meta: abTestMeta,
  caseSchema: abTestCaseSchema,
  publicCaseSchema: publicAbTestCaseSchema,
  answerSchema: abTestAnswerSchema,
  toPublicCase: toPublicAbTestCase,
  score: scoreAbTestAnswer,
  feedbackRubric: AB_TEST_FEEDBACK_RUBRIC,
  feedbackContext: buildAbTestFeedbackContext,
};
