/**
 * Planning state of the Backlog Simulator: the sprint being built, the
 * learner's marks and their RICE and MoSCoW inputs.
 *
 * Pure and framework-free, so the rules are unit-tested without a browser.
 * It only ever sees public ticket data: nothing here knows the ground truth.
 */
import { z } from "zod";

import {
  planningMethodSchema,
  publicMidSprintEventSchema,
  ticketIdSchema,
  ticketMarkSchema,
  type PlanningMethod,
  type PublicMidSprintEvent,
  type TicketMark,
} from "./schema";

/** What planning needs to know about a ticket. */
export interface PlannableTicket {
  id: string;
  effort: number;
}

// ------------------------------------------------------------------ capacity

export interface CapacitySplit {
  /** Tickets the team finishes, in order. */
  deliveredIds: string[];
  /** Planned tickets that do not get done. */
  spilledIds: string[];
  plannedEffort: number;
  deliveredEffort: number;
  overCapacityBy: number;
}

/**
 * Splits an ordered plan at the capacity line. The team works top to bottom
 * and stops at the first ticket that no longer fits, so overbooking costs
 * whatever sits at the bottom of the list.
 */
export function splitByCapacity(
  orderedTickets: readonly PlannableTicket[],
  capacity: number,
): CapacitySplit {
  const deliveredIds: string[] = [];
  const spilledIds: string[] = [];
  let plannedEffort = 0;
  let deliveredEffort = 0;
  let sprintIsFull = false;
  for (const ticket of orderedTickets) {
    plannedEffort += ticket.effort;
    if (!sprintIsFull && deliveredEffort + ticket.effort <= capacity) {
      deliveredIds.push(ticket.id);
      deliveredEffort += ticket.effort;
    } else {
      sprintIsFull = true;
      spilledIds.push(ticket.id);
    }
  }
  return {
    deliveredIds,
    spilledIds,
    plannedEffort,
    deliveredEffort,
    overCapacityBy: Math.max(0, plannedEffort - capacity),
  };
}

/**
 * Takes tickets in the given order and keeps each one that still fits.
 * Used to turn a RICE ranking or MoSCoW buckets into a sprint.
 */
export function fillSprint(
  rankedTickets: readonly PlannableTicket[],
  capacity: number,
): string[] {
  const ids: string[] = [];
  let used = 0;
  for (const ticket of rankedTickets) {
    if (used + ticket.effort > capacity) continue;
    ids.push(ticket.id);
    used += ticket.effort;
  }
  return ids;
}

// ---------------------------------------------------------------------- RICE

/** Share of active users reached, from "a handful" to "almost everyone". */
export const RICE_REACH_SHARES = [0.01, 0.05, 0.2, 0.5, 0.9] as const;
/** Standard RICE impact scale: minimal, low, medium, high, massive. */
export const RICE_IMPACTS = [0.25, 0.5, 1, 2, 3] as const;
/** Standard RICE confidence scale: low, medium, high. */
export const RICE_CONFIDENCES = [0.5, 0.8, 1] as const;

const scaleIndex = (length: number) =>
  z
    .number()
    .int()
    .min(0)
    .max(length - 1);

/** The learner's own estimates, stored as positions on each scale. */
export const riceInputSchema = z.object({
  reach: scaleIndex(RICE_REACH_SHARES.length).optional(),
  impact: scaleIndex(RICE_IMPACTS.length).optional(),
  confidence: scaleIndex(RICE_CONFIDENCES.length).optional(),
});
export type RiceInput = z.infer<typeof riceInputSchema>;

/** Reach x Impact x Confidence / Effort, or null until all three are set. */
export function riceScore(
  input: RiceInput | undefined,
  effort: number,
  activeUsers: number,
): number | null {
  if (
    !input ||
    input.reach === undefined ||
    input.impact === undefined ||
    input.confidence === undefined ||
    effort <= 0
  ) {
    return null;
  }
  const reach = activeUsers * RICE_REACH_SHARES[input.reach];
  const score =
    (reach * RICE_IMPACTS[input.impact] * RICE_CONFIDENCES[input.confidence]) /
    effort;
  return Math.round(score);
}

/** Scored tickets from highest to lowest RICE score. Ties keep backlog order. */
export function rankByRice<T extends PlannableTicket>(
  tickets: readonly T[],
  rice: Readonly<Record<string, RiceInput>>,
  activeUsers: number,
): { ticket: T; score: number }[] {
  return tickets
    .flatMap((ticket) => {
      const score = riceScore(rice[ticket.id], ticket.effort, activeUsers);
      return score === null ? [] : [{ ticket, score }];
    })
    .sort((a, b) => b.score - a.score);
}

// -------------------------------------------------------------------- MoSCoW

export const MOSCOW_BUCKETS = ["must", "should", "could", "wont"] as const;
export const moscowBucketSchema = z.enum(MOSCOW_BUCKETS);
export type MoscowBucket = z.infer<typeof moscowBucketSchema>;

/** Buckets that can go into a sprint, most important first. */
const MOSCOW_SPRINT_ORDER: readonly MoscowBucket[] = [
  "must",
  "should",
  "could",
];

/** Must, then Should, then Could, each in backlog order. Won't is left out. */
export function orderByMoscow<T extends PlannableTicket>(
  tickets: readonly T[],
  moscow: Readonly<Record<string, MoscowBucket>>,
): T[] {
  return MOSCOW_SPRINT_ORDER.flatMap((bucket) =>
    tickets.filter((ticket) => moscow[ticket.id] === bucket),
  );
}

// --------------------------------------------------------------------- state

export const planningStateSchema = z.object({
  method: planningMethodSchema,
  /** Ordered ticket ids. */
  sprint: z.array(ticketIdSchema),
  marks: z.record(ticketIdSchema, ticketMarkSchema),
  rice: z.record(ticketIdSchema, riceInputSchema),
  moscow: z.record(ticketIdSchema, moscowBucketSchema),
});
export type PlanningState = z.infer<typeof planningStateSchema>;

export const initialPlanningState: PlanningState = {
  method: "drag",
  sprint: [],
  marks: {},
  rice: {},
  moscow: {},
};

export type PlanningAction =
  | { type: "set_method"; method: PlanningMethod }
  /** Adds a ticket at `index` (end by default), or moves it if already in. */
  | { type: "add_to_sprint"; id: string; index?: number }
  | { type: "remove_from_sprint"; id: string }
  | { type: "move_in_sprint"; id: string; toIndex: number }
  | { type: "set_sprint"; ids: readonly string[] }
  | { type: "clear_sprint" }
  | { type: "mark"; id: string; mark: TicketMark }
  | { type: "unmark"; id: string }
  | { type: "set_rice"; id: string; input: RiceInput }
  | { type: "set_moscow"; id: string; bucket: MoscowBucket | null }
  | { type: "reset" };

function without<T>(record: Record<string, T>, key: string): Record<string, T> {
  if (!(key in record)) return record;
  const { [key]: _removed, ...rest } = record;
  return rest;
}

function clampIndex(index: number, length: number): number {
  return Math.min(Math.max(0, Math.trunc(index)), length);
}

function unique(ids: readonly string[]): string[] {
  return [...new Set(ids)];
}

export function planningReducer(
  state: PlanningState,
  action: PlanningAction,
): PlanningState {
  switch (action.type) {
    case "set_method":
      return state.method === action.method
        ? state
        : { ...state, method: action.method };

    case "add_to_sprint": {
      // A ticket the learner flagged cannot be planned until it is restored.
      if (action.id in state.marks) return state;
      const rest = state.sprint.filter((id) => id !== action.id);
      const index = clampIndex(action.index ?? rest.length, rest.length);
      return {
        ...state,
        sprint: [...rest.slice(0, index), action.id, ...rest.slice(index)],
      };
    }

    case "remove_from_sprint":
      return state.sprint.includes(action.id)
        ? { ...state, sprint: state.sprint.filter((id) => id !== action.id) }
        : state;

    case "move_in_sprint": {
      if (!state.sprint.includes(action.id)) return state;
      const rest = state.sprint.filter((id) => id !== action.id);
      const index = clampIndex(action.toIndex, rest.length);
      return {
        ...state,
        sprint: [...rest.slice(0, index), action.id, ...rest.slice(index)],
      };
    }

    case "set_sprint":
      return {
        ...state,
        sprint: unique(action.ids).filter((id) => !(id in state.marks)),
      };

    case "clear_sprint":
      return state.sprint.length === 0 ? state : { ...state, sprint: [] };

    case "mark": {
      if (
        action.mark.kind === "duplicate" &&
        action.mark.duplicateOfId === action.id
      ) {
        return state;
      }
      return {
        ...state,
        sprint: state.sprint.filter((id) => id !== action.id),
        marks: { ...state.marks, [action.id]: action.mark },
      };
    }

    case "unmark":
      return action.id in state.marks
        ? { ...state, marks: without(state.marks, action.id) }
        : state;

    case "set_rice": {
      const isEmpty = Object.values(action.input).every(
        (value) => value === undefined,
      );
      return {
        ...state,
        rice: isEmpty
          ? without(state.rice, action.id)
          : { ...state.rice, [action.id]: action.input },
      };
    }

    case "reset":
      return initialPlanningState;

    case "set_moscow":
      return {
        ...state,
        moscow:
          action.bucket === null
            ? without(state.moscow, action.id)
            : { ...state.moscow, [action.id]: action.bucket },
      };
  }
}

/** Drops anything that refers to tickets the case does not have. */
export function sanitizePlanningState(
  state: PlanningState,
  ticketIds: ReadonlySet<string>,
): PlanningState {
  const keep = <T>(record: Record<string, T>): Record<string, T> =>
    Object.fromEntries(
      Object.entries(record).filter(([id]) => ticketIds.has(id)),
    );
  const marks = Object.fromEntries(
    Object.entries(keep(state.marks)).filter(
      ([id, mark]) =>
        mark.kind !== "duplicate" ||
        (ticketIds.has(mark.duplicateOfId) && mark.duplicateOfId !== id),
    ),
  );
  return {
    method: state.method,
    sprint: unique(state.sprint).filter(
      (id) => ticketIds.has(id) && !(id in marks),
    ),
    marks,
    rice: keep(state.rice),
    moscow: keep(state.moscow),
  };
}

// --------------------------------------------------------------------- draft

/** Everything needed to resume a case after a reload. */
export const planningDraftSchema = z.object({
  planning: planningStateSchema,
  /** Set once the first sprint is committed and the events are known. */
  committed: z
    .object({
      sprint: z.array(ticketIdSchema).min(1),
      events: z.array(publicMidSprintEventSchema).min(1).max(2),
    })
    .optional(),
});
export type PlanningDraft = z.infer<typeof planningDraftSchema>;

export const initialPlanningDraft: PlanningDraft = {
  planning: initialPlanningState,
};

/** Tickets added by events join the backlog once the sprint has started. */
export function addedTickets(events: readonly PublicMidSprintEvent[]) {
  return events.flatMap((event) =>
    event.addedTicket ? [event.addedTicket] : [],
  );
}

/** Capacity for the rest of the sprint once the events have happened. */
export function capacityAfterEvents(
  capacity: number,
  events: readonly PublicMidSprintEvent[],
): number {
  return Math.max(
    0,
    events.reduce((total, event) => total + event.capacityDelta, capacity),
  );
}

/** Validates a saved draft against the case's tickets. */
export function sanitizePlanningDraft(
  draft: PlanningDraft,
  backlogTicketIds: ReadonlySet<string>,
): PlanningDraft {
  if (!draft.committed) {
    return {
      planning: sanitizePlanningState(draft.planning, backlogTicketIds),
    };
  }
  const known = new Set(backlogTicketIds);
  for (const ticket of addedTickets(draft.committed.events))
    known.add(ticket.id);
  const sprint = draft.committed.sprint.filter((id) =>
    backlogTicketIds.has(id),
  );
  if (sprint.length === 0) {
    return {
      planning: sanitizePlanningState(draft.planning, backlogTicketIds),
    };
  }
  return {
    planning: sanitizePlanningState(draft.planning, known),
    committed: { sprint, events: draft.committed.events },
  };
}
