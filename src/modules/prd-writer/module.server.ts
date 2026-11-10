/**
 * Full PRD Writer definition: schemas, ground-truth stripping and the
 * scoring engine. Server only.
 */
import "server-only";

import type { SimulationModule } from "@/core/case-engine";

import { buildPrdFeedbackContext } from "./feedback";
import { prdWriterMeta } from "./module";
import { toPublicPrdCase } from "./public";
import {
  prdAnswerSchema,
  prdCaseSchema,
  publicPrdCaseSchema,
  type PrdAnswer,
  type PrdCase,
  type PublicPrdCase,
} from "./schema";
import { scorePrd, type PrdResult } from "./scoring";

export const PRD_FEEDBACK_RUBRIC = `Review the learner's one-pager section by section, the way a senior PM reviews a PRD. Anchor every comment: name the section and quote the exact sentence you are commenting on.
1. Problem: is it a user problem stated with evidence and numbers from the documents, or a solution in disguise? Is it short?
2. Goals: is the goal an outcome, with the baseline, target and time frame the documents support?
3. Risks and mitigations: is each mitigation concrete enough that an engineer could act on it?
4. Open questions: are they real unknowns with an owner, or things the documents already answer?
5. Clarity: cut words, vague terms ("improve", "better", "seamless") and claims without evidence.

For scope, explain the requirements the learner put in the wrong place, using what the documents say. Finish with the one rewrite that would most improve the document.`;

export const prdWriterModule: SimulationModule<
  PrdCase,
  PublicPrdCase,
  PrdAnswer,
  PrdResult
> = {
  meta: prdWriterMeta,
  caseSchema: prdCaseSchema,
  publicCaseSchema: publicPrdCaseSchema,
  answerSchema: prdAnswerSchema,
  toPublicCase: toPublicPrdCase,
  score: scorePrd,
  feedbackRubric: PRD_FEEDBACK_RUBRIC,
  feedbackContext: buildPrdFeedbackContext,
};
