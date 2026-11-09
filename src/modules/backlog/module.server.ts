/**
 * Full Backlog Simulator definition: schemas, ground-truth stripping and the
 * scoring engine. Server only.
 */
import "server-only";

import type { SimulationModule } from "@/core/case-engine";
import type { ScoreResult } from "@/core/scoring";

import { backlogMeta } from "./module";
import { toPublicBacklogCase } from "./public";
import {
  backlogAnswerSchema,
  backlogCaseSchema,
  publicBacklogCaseSchema,
  type BacklogAnswer,
  type BacklogCase,
  type PublicBacklogCase,
} from "./schema";
import { scoreBacklogAnswer } from "./scoring";

export const BACKLOG_FEEDBACK_RUBRIC = `Assess the learner's sprint plan on these points, in this order:
1. Value: did they pick the tickets with the highest real value for their effort, or were they drawn to the loudest requests?
2. Critical work: did they recognise the critical tickets, especially the ones written to look minor?
3. Traps: did they avoid duplicates, single-customer requests, vanity features and claims without evidence? Name each trap they fell for and the clue they missed.
4. Capacity: did they stay within the team's capacity, and what was cut when the plan changed?
5. Mid-sprint event: did they replan by removing the weakest work, or just add scope?

Finish with one product management principle that would have changed their weakest decision.`;

export const backlogModule: SimulationModule<
  BacklogCase,
  PublicBacklogCase,
  BacklogAnswer,
  ScoreResult
> = {
  meta: backlogMeta,
  caseSchema: backlogCaseSchema,
  publicCaseSchema: publicBacklogCaseSchema,
  answerSchema: backlogAnswerSchema,
  toPublicCase: toPublicBacklogCase,
  score: scoreBacklogAnswer,
  feedbackRubric: BACKLOG_FEEDBACK_RUBRIC,
};
