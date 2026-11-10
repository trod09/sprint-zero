/**
 * Sprint maths for the Backlog Simulator: what a plan delivers and what the
 * best possible plan is. Pure and deterministic; no randomness, no LLM.
 *
 * The optimal sprint is never stored in the case JSON. It is derived from the
 * tickets here, so it cannot drift from the data.
 */
import { splitByCapacity } from "./planning";
import type { BacklogCase, Ticket } from "./schema";

/** A planning problem: the tickets on the table and the points available. */
export interface SprintScenario {
  capacity: number;
  tickets: readonly Ticket[];
}

export interface OptimalSprint {
  /** Chosen tickets, in backlog order. */
  ticketIds: string[];
  /** Real value delivered (duplicates counted once). */
  value: number;
  effort: number;
  /** Critical tickets that could not fit. Empty in every valid case. */
  missedCriticalIds: string[];
}

export interface SprintEvaluation {
  /** Tickets the team finishes: the plan from the top until capacity runs out. */
  deliveredIds: string[];
  /** Planned tickets that do not get done because the sprint was overbooked. */
  spilledIds: string[];
  /** Ids in the answer that are not tickets of this scenario. */
  unknownIds: string[];
  plannedEffort: number;
  deliveredEffort: number;
  /** Real value of the delivered tickets (duplicates counted once). */
  value: number;
  overCapacityBy: number;
}

export function initialScenario(caseData: BacklogCase): SprintScenario {
  return { capacity: caseData.sprintCapacity, tickets: caseData.tickets };
}

/** The planning problem once every mid-sprint event has fired. */
export function scenarioAfterEvents(caseData: BacklogCase): SprintScenario {
  let capacity = caseData.sprintCapacity;
  const tickets = [...caseData.tickets];
  for (const event of caseData.midSprintEvents) {
    capacity += event.capacityDelta;
    if (event.addedTicket) tickets.push(event.addedTicket);
  }
  return { capacity: Math.max(0, capacity), tickets };
}

/** Tickets that describe the same work share a group key. */
export function duplicateGroupKey(ticket: Ticket): string {
  return ticket.hidden.duplicateOf ?? ticket.id;
}

/**
 * Real value of shipping a set of tickets. Two tickets for the same work only
 * deliver that work once, so each duplicate group counts its best member.
 */
export function deliveredValue(tickets: readonly Ticket[]): number {
  const bestByGroup = new Map<string, number>();
  for (const ticket of tickets) {
    const key = duplicateGroupKey(ticket);
    const best = bestByGroup.get(key) ?? 0;
    bestByGroup.set(key, Math.max(best, ticket.hidden.trueValue));
  }
  let total = 0;
  for (const value of bestByGroup.values()) total += value;
  return total;
}

/**
 * Best sprint for a scenario: an exact multiple-choice knapsack.
 *
 * - Maximizes real value within capacity.
 * - Critical tickets are mandatory: covering them outranks any amount of value.
 * - At most one ticket per duplicate group, since the second adds nothing.
 * - Ties go to the plan that uses fewer points, then to earlier tickets.
 */
export function solveOptimalSprint(scenario: SprintScenario): OptimalSprint {
  const capacity = Math.max(0, Math.floor(scenario.capacity));
  const groups = new Map<string, Ticket[]>();
  for (const ticket of scenario.tickets) {
    const key = duplicateGroupKey(ticket);
    const members = groups.get(key);
    if (!members) groups.set(key, [ticket]);
    // The original goes first, so it wins a tie against its duplicates.
    else if (ticket.id === key) members.unshift(ticket);
    else members.push(ticket);
  }
  const groupList = [...groups.values()];

  // Any single critical ticket outweighs every non-critical ticket combined.
  const criticalBonus = scenario.tickets.length * 100 + 1;
  const scoreOf = (ticket: Ticket) =>
    ticket.hidden.trueValue + (ticket.hidden.critical ? criticalBonus : 0);

  // best[c]: highest score using exactly c points. choices[g][c]: the member of
  // group g picked to reach it, or -1 when the group is skipped.
  let best = new Array<number>(capacity + 1).fill(Number.NEGATIVE_INFINITY);
  best[0] = 0;
  const choices: Int16Array[] = [];
  for (const members of groupList) {
    const next = [...best];
    const choice = new Int16Array(capacity + 1).fill(-1);
    members.forEach((ticket, memberIndex) => {
      const score = scoreOf(ticket);
      for (let used = ticket.effort; used <= capacity; used++) {
        const candidate = best[used - ticket.effort] + score;
        if (candidate > next[used]) {
          next[used] = candidate;
          choice[used] = memberIndex;
        }
      }
    });
    choices.push(choice);
    best = next;
  }

  let bestUsed = 0;
  for (let used = 1; used <= capacity; used++) {
    if (best[used] > best[bestUsed]) bestUsed = used;
  }

  const chosen = new Set<string>();
  let remaining = bestUsed;
  for (let g = groupList.length - 1; g >= 0; g--) {
    const memberIndex = choices[g][remaining];
    if (memberIndex >= 0) {
      const ticket = groupList[g][memberIndex];
      chosen.add(ticket.id);
      remaining -= ticket.effort;
    }
  }

  const chosenTickets = scenario.tickets.filter((t) => chosen.has(t.id));
  return {
    ticketIds: chosenTickets.map((ticket) => ticket.id),
    value: deliveredValue(chosenTickets),
    effort: chosenTickets.reduce((sum, ticket) => sum + ticket.effort, 0),
    missedCriticalIds: scenario.tickets
      .filter((ticket) => ticket.hidden.critical && !chosen.has(ticket.id))
      .map((ticket) => ticket.id),
  };
}

/**
 * What an ordered plan actually delivers. The team works top to bottom and
 * stops at the first ticket that no longer fits, so overbooking a sprint
 * costs whatever sits at the bottom of the list.
 */
export function evaluateSprint(
  scenario: SprintScenario,
  orderedTicketIds: readonly string[],
): SprintEvaluation {
  const byId = new Map(scenario.tickets.map((ticket) => [ticket.id, ticket]));
  const planned: Ticket[] = [];
  const unknownIds: string[] = [];
  const seen = new Set<string>();
  for (const id of orderedTicketIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const ticket = byId.get(id);
    if (ticket) planned.push(ticket);
    else unknownIds.push(id);
  }

  const split = splitByCapacity(planned, scenario.capacity);
  const delivered = split.deliveredIds.map((id) => byId.get(id)!);
  return {
    deliveredIds: split.deliveredIds,
    spilledIds: split.spilledIds,
    unknownIds,
    plannedEffort: split.plannedEffort,
    deliveredEffort: split.deliveredEffort,
    value: deliveredValue(delivered),
    overCapacityBy: split.overCapacityBy,
  };
}
