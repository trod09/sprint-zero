/**
 * Deterministic scoring of a Backlog Simulator answer.
 *
 * Provisional until Hito 1.5: it scores the sprint the team actually delivers,
 * that is the replanned sprint against the backlog after the mid-sprint
 * events. Traps and event handling join the breakdown in Hito 1.5.
 */
import {
  buildScoreResult,
  clamp01,
  safeRatio,
  type ScoreResult,
} from "@/core/scoring";

import {
  evaluateSprint,
  scenarioAfterEvents,
  solveOptimalSprint,
} from "./plan";
import type { BacklogAnswer, BacklogCase } from "./schema";

/** Going over capacity by this share of the sprint zeroes the capacity criterion. */
const OVERBOOKING_TOLERANCE = 0.25;

/** The sprint the team works on once the events have happened. */
export function deliveredPlan(answer: BacklogAnswer): string[] {
  return answer.replanTicketIds ?? answer.sprintTicketIds;
}

export function scoreBacklogAnswer(
  caseData: BacklogCase,
  answer: BacklogAnswer,
): ScoreResult {
  const scenario = scenarioAfterEvents(caseData);
  const optimal = solveOptimalSprint(scenario);
  const evaluation = evaluateSprint(scenario, deliveredPlan(answer));

  const delivered = new Set(evaluation.deliveredIds);
  const criticalIds = scenario.tickets
    .filter((ticket) => ticket.hidden.critical)
    .map((ticket) => ticket.id);
  const criticalDone = criticalIds.filter((id) => delivered.has(id)).length;

  return buildScoreResult([
    {
      id: "value",
      label: "Value delivered vs. the optimal sprint",
      weight: 50,
      ratio: safeRatio(evaluation.value, optimal.value, 0),
      detail: `Your sprint delivers ${evaluation.value} of the ${optimal.value} value points the best sprint delivers.`,
    },
    {
      id: "critical",
      label: "Critical tickets addressed",
      weight: 30,
      ratio: safeRatio(criticalDone, criticalIds.length),
      detail: `${criticalDone} of ${criticalIds.length} critical tickets are delivered.`,
    },
    {
      id: "capacity",
      label: "Capacity respected",
      weight: 20,
      ratio: clamp01(
        1 -
          evaluation.overCapacityBy /
            (scenario.capacity * OVERBOOKING_TOLERANCE),
      ),
      detail:
        evaluation.overCapacityBy === 0
          ? `You planned ${evaluation.plannedEffort} of ${scenario.capacity} story points.`
          : `You planned ${evaluation.plannedEffort} story points for a capacity of ${scenario.capacity}; ${evaluation.spilledIds.length} ticket(s) will not be finished.`,
    },
  ]);
}
