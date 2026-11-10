/**
 * Full Feedback Triage definition: schemas, ground-truth stripping and the
 * scoring engine. Server only.
 */
import "server-only";

import type { SimulationModule } from "@/core/case-engine";

import { buildTriageFeedbackContext } from "./feedback";
import { feedbackTriageMeta } from "./module";
import { toPublicTriageCase } from "./public";
import {
  feedbackTriageAnswerSchema,
  feedbackTriageCaseSchema,
  publicFeedbackTriageCaseSchema,
  type FeedbackTriageAnswer,
  type FeedbackTriageCase,
  type PublicFeedbackTriageCase,
} from "./schema";
import { scoreTriageAnswer, type TriageResult } from "./scoring";

export const TRIAGE_FEEDBACK_RUBRIC = `Assess the learner's triage on these points, in this order:
1. Themes: do their clusters match the real themes, or do they mix problems or split one problem in two? Name the clearest example.
2. Critical problem: did they spot the rare, recent and severe problem, and treat it as urgent?
3. Ranking: does their order reflect reach times severity rather than volume alone?
4. Opportunities: for each opportunity they wrote, is it framed as a user problem (not a solution), specific to the evidence, and sized to the theme? Quote their wording when you comment.
5. Noise: did they set aside praise, spam and off-topic items without discarding real feedback?

Finish with one product discovery principle that would have helped the most.`;

export const feedbackTriageModule: SimulationModule<
  FeedbackTriageCase,
  PublicFeedbackTriageCase,
  FeedbackTriageAnswer,
  TriageResult
> = {
  meta: feedbackTriageMeta,
  caseSchema: feedbackTriageCaseSchema,
  publicCaseSchema: publicFeedbackTriageCaseSchema,
  answerSchema: feedbackTriageAnswerSchema,
  toPublicCase: toPublicTriageCase,
  score: scoreTriageAnswer,
  feedbackRubric: TRIAGE_FEEDBACK_RUBRIC,
  feedbackContext: buildTriageFeedbackContext,
};
