/**
 * Full UX Critique definition: schemas, ground-truth stripping and the
 * scoring engine. Server only.
 */
import "server-only";

import type { SimulationModule } from "@/core/case-engine";

import { buildUxFeedbackContext } from "./feedback";
import { uxCritiqueMeta } from "./module";
import { toPublicUxCase } from "./public";
import {
  publicUxCritiqueCaseSchema,
  uxCritiqueAnswerSchema,
  uxCritiqueCaseSchema,
  type PublicUxCritiqueCase,
  type UxCritiqueAnswer,
  type UxCritiqueCase,
} from "./schema";
import { scoreUxAnswer, type UxResult } from "./scoring";

export const UX_FEEDBACK_RUBRIC = `Assess the learner's critique on these points, in this order:
1. Coverage: which planted problems did they find, and which did they miss? For each miss, say what in the screen should have caught their eye.
2. Diagnosis: for each finding, did they name the real problem and describe its effect on the user's goal, not just its look?
3. False alarms: did they flag parts that work? Explain briefly why those parts are fine.
4. Notes: are their notes specific (what, where, who it hurts) and do they suggest a fix?

Finish with one usability principle that would have helped the most.`;

export const uxCritiqueModule: SimulationModule<
  UxCritiqueCase,
  PublicUxCritiqueCase,
  UxCritiqueAnswer,
  UxResult
> = {
  meta: uxCritiqueMeta,
  caseSchema: uxCritiqueCaseSchema,
  publicCaseSchema: publicUxCritiqueCaseSchema,
  answerSchema: uxCritiqueAnswerSchema,
  toPublicCase: toPublicUxCase,
  score: scoreUxAnswer,
  feedbackRubric: UX_FEEDBACK_RUBRIC,
  feedbackContext: buildUxFeedbackContext,
};
