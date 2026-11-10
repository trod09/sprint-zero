/**
 * Full Roadmap & OKRs definition: schemas, ground-truth stripping and the
 * scoring engine. Server only.
 */
import "server-only";

import type { SimulationModule } from "@/core/case-engine";

import { buildRoadmapFeedbackContext } from "./feedback";
import { roadmapMeta } from "./module";
import { toPublicRoadmapCase } from "./public";
import {
  publicRoadmapCaseSchema,
  roadmapAnswerSchema,
  roadmapCaseSchema,
  type PublicRoadmapCase,
  type RoadmapAnswer,
  type RoadmapCase,
} from "./schema";
import { scoreRoadmap, type RoadmapResult } from "./scoring";

export const ROADMAP_FEEDBACK_RUBRIC = `Review the learner's quarterly plan the way a head of product reviews a roadmap before it goes to leadership:
1. Key results: for each weak or bad one they chose, say why it would not tell the team whether the objective was met, and name the better one.
2. Sequencing: point out enablers scheduled too late and dependent work that could not ship, naming the initiatives.
3. Trade-offs: name the valuable work they left out and the low-value work they kept, and what the best plan does instead.
4. Rationale: does their reasoning tie initiatives to key results, or to who asked for them?
5. The message to stakeholders whose work was left out: is it honest, specific about why, and does it say what would change the decision?

Finish with the one change that would most improve the plan.`;

export const roadmapModule: SimulationModule<
  RoadmapCase,
  PublicRoadmapCase,
  RoadmapAnswer,
  RoadmapResult
> = {
  meta: roadmapMeta,
  caseSchema: roadmapCaseSchema,
  publicCaseSchema: publicRoadmapCaseSchema,
  answerSchema: roadmapAnswerSchema,
  toPublicCase: toPublicRoadmapCase,
  score: scoreRoadmap,
  feedbackRubric: ROADMAP_FEEDBACK_RUBRIC,
  feedbackContext: buildRoadmapFeedbackContext,
};
