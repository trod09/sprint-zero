/**
 * Full User Interview definition: schemas, ground-truth stripping and the
 * scoring engine. Server only.
 */
import "server-only";

import type { SimulationModule } from "@/core/case-engine";

import { buildInterviewFeedbackContext } from "./feedback";
import { userInterviewMeta } from "./module";
import { toPublicInterviewCase } from "./public";
import {
  interviewAnswerSchema,
  interviewCaseSchema,
  publicInterviewCaseSchema,
  type InterviewAnswer,
  type InterviewCase,
  type PublicInterviewCase,
} from "./schema";
import { scoreInterview, type InterviewResult } from "./scoring";

export const INTERVIEW_FEEDBACK_RUBRIC = `Coach the learner on their interview the way a senior researcher reviews a recording:
1. Pick their two weakest questions (leading, hypothetical, closed or two-in-one), quote them, say what the wording did to the answer, and rewrite each as an open question about past behaviour.
2. Pick their best question, quote it and say why it worked.
3. For each finding that never came out, name the topic they skimmed past and the question that would have reached it.
4. Synthesis: for each claim the interview does not support, explain where the belief came from (a polite "sure", their own assumption) and why it is not evidence.
5. Their summary: is it specific, in the customer's own terms, and does it separate what was said from what they infer?

Finish with the one habit to practise in the next interview.`;

export const userInterviewModule: SimulationModule<
  InterviewCase,
  PublicInterviewCase,
  InterviewAnswer,
  InterviewResult
> = {
  meta: userInterviewMeta,
  caseSchema: interviewCaseSchema,
  publicCaseSchema: publicInterviewCaseSchema,
  answerSchema: interviewAnswerSchema,
  toPublicCase: toPublicInterviewCase,
  score: scoreInterview,
  feedbackRubric: INTERVIEW_FEEDBACK_RUBRIC,
  feedbackContext: buildInterviewFeedbackContext,
};
