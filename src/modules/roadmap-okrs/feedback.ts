/**
 * What the AI coach is told about a quarterly plan: what code checked, with
 * the reason behind every key result and initiative, plus the learner's own
 * words in the untrusted block.
 */
import type { FeedbackContext } from "@/core/case-engine";

import type { RoadmapAnswer, RoadmapCase } from "./schema";
import type { RoadmapResult } from "./scoring";

export function buildRoadmapFeedbackContext(
  caseData: RoadmapCase,
  answer: RoadmapAnswer,
  result: RoadmapResult,
): FeedbackContext {
  const { hidden } = caseData;
  const { report } = result;
  const objectiveTitle = new Map(
    caseData.objectives.map((o) => [o.id, o.title]),
  );
  const keyResult = new Map(caseData.keyResults.map((k) => [k.id, k]));
  const keyResultWhy = new Map(hidden.keyResults.map((k) => [k.id, k.why]));
  const initiative = new Map(caseData.initiatives.map((i) => [i.id, i]));
  const initiativeWhy = new Map(hidden.initiatives.map((i) => [i.id, i.why]));

  return {
    analysis: {
      objectives: caseData.objectives,
      keyResults: report.keyResults.map((k) => ({
        objective: objectiveTitle.get(k.objectiveId),
        keyResult: keyResult.get(k.id)?.text,
        rating: k.rating,
        chosenByLearner: k.picked,
        why: keyResultWhy.get(k.id),
      })),
      initiatives: report.initiatives.map((i) => ({
        initiative: initiative.get(i.id)?.title,
        team: initiative.get(i.id)?.teamId,
        effortSprints: initiative.get(i.id)?.effort,
        dependsOn: initiative
          .get(i.id)
          ?.dependsOn.map((id) => initiative.get(id)?.title),
        servesObjective: i.objectiveId
          ? objectiveTitle.get(i.objectiveId)
          : "none",
        value: i.value,
        learnerStartSprint: i.startSprint,
        learnerStatus: i.status,
        bestPlanStartSprint: i.optimalStart,
        why: initiativeWhy.get(i.id),
      })),
      valueShipped: report.deliveredValue,
      bestPossibleValue: report.optimalValue,
      principle: hidden.principle,
    },
    learnerAnswer: {
      rationale: answer.rationale,
      messageToStakeholdersLeftOut: answer.tradeoffs,
    },
  };
}
