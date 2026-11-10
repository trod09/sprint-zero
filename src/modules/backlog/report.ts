/**
 * What a Backlog Simulator answer actually did, computed from the case's
 * ground truth. Pure and deterministic: the score and the results screen are
 * both built from this report, so they can never disagree.
 */
import { z } from "zod";

import { clamp, clamp01, roundTo } from "@/core/scoring";

import {
  duplicateGroupKey,
  evaluateSprint,
  initialScenario,
  scenarioAfterEvents,
  solveOptimalSprint,
} from "./plan";
import {
  EVENT_TYPES,
  TICKET_TRAPS,
  type BacklogAnswer,
  type BacklogCase,
  type DiscardReason,
  type Ticket,
  type TicketTrap,
} from "./schema";

/** Traps a good plan leaves out. Hidden critical bugs are covered by "critical". */
export const AVOIDABLE_TRAPS = [
  "duplicate",
  "single_customer",
  "vanity",
  "low_evidence",
] as const satisfies readonly TicketTrap[];
type AvoidableTrap = (typeof AVOIDABLE_TRAPS)[number];

/** The discard reason that names each trap correctly. */
const TRAP_REASON: Record<
  Exclude<AvoidableTrap, "duplicate">,
  DiscardReason
> = {
  single_customer: "single_customer",
  vanity: "no_impact",
  low_evidence: "no_evidence",
};

/** Overbooking by this share of capacity counts as not respecting it at all. */
export const OVERBOOKING_TOLERANCE = 0.25;
/** Tech debt grows a little every sprint unless someone pays it down. */
export const DEBT_DRIFT_PER_SPRINT = 2;
/** Leaving traps out only counts once the sprint is at least this full. */
const ENGAGED_SHARE = 0.5;

export const TRAP_CREDIT = { identified: 1, avoided: 0.75, fell_for: 0 };

const trapOutcomeSchema = z.enum(["identified", "avoided", "fell_for"]);
export type TrapOutcome = z.infer<typeof trapOutcomeSchema>;

const sprintSummarySchema = z.object({
  ticketIds: z.array(z.string()),
  effort: z.number(),
  capacity: z.number(),
  value: z.number(),
});

const metricChangeSchema = z.object({
  key: z.enum(["activation", "retention", "nps", "revenue", "techDebt"]),
  before: z.number(),
  after: z.number(),
});

export const backlogReportSchema = z.object({
  /** First commit, against the initial backlog and capacity. */
  committed: sprintSummarySchema,
  /** The replanned sprint against the backlog after the events. */
  delivered: sprintSummarySchema.extend({
    /** Planned tickets that do not get done because the sprint was overbooked. */
    spilledIds: z.array(z.string()),
    /** Effort of everything planned, delivered or not. */
    plannedEffort: z.number(),
  }),
  optimal: sprintSummarySchema,
  metrics: z.array(metricChangeSchema),
  stakeholders: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
      requested: z.number().int(),
      delivered: z.number().int(),
      /** 0..100, or null when the stakeholder asked for nothing. */
      satisfaction: z.number().int().min(0).max(100).nullable(),
    }),
  ),
  traps: z.array(
    z.object({
      ticketId: z.string(),
      trap: z.enum(TICKET_TRAPS),
      outcome: trapOutcomeSchema,
      explanation: z.string(),
    }),
  ),
  criticals: z.array(
    z.object({
      ticketId: z.string(),
      /** Filed as minor: the trap is that it does not look critical. */
      disguised: z.boolean(),
      delivered: z.boolean(),
      explanation: z.string(),
    }),
  ),
  events: z.array(
    z.object({
      id: z.string(),
      type: z.enum(EVENT_TYPES),
      title: z.string(),
      guidance: z.string(),
      /** 0..1: how well the replan responded to this event. */
      handling: z.number().min(0).max(1),
    }),
  ),
  /** 0..1 shares used by the score. */
  ratios: z.object({
    value: z.number(),
    critical: z.number(),
    traps: z.number(),
    events: z.number(),
    capacity: z.number(),
  }),
  keyInsight: z.string(),
  principle: z.string(),
});
export type BacklogReport = z.infer<typeof backlogReportSchema>;

/** 1 within capacity, falling to 0 at OVERBOOKING_TOLERANCE over it. */
export function capacityFit(plannedEffort: number, capacity: number): number {
  if (plannedEffort <= capacity) return 1;
  if (capacity <= 0) return 0;
  return clamp01(
    1 - (plannedEffort - capacity) / (capacity * OVERBOOKING_TOLERANCE),
  );
}

const mean = (values: readonly number[]) =>
  values.length === 0
    ? 1
    : values.reduce((sum, value) => sum + value, 0) / values.length;

function isAvoidable(trap: TicketTrap): trap is AvoidableTrap {
  return (AVOIDABLE_TRAPS as readonly TicketTrap[]).includes(trap);
}

function trapOutcome(
  ticket: Ticket,
  planned: ReadonlySet<string>,
  answer: BacklogAnswer,
  byId: ReadonlyMap<string, Ticket>,
): TrapOutcome {
  const trap = ticket.hidden.trap;
  const mark = answer.marks[ticket.id];
  if (trap === "duplicate") {
    const originalId = ticket.hidden.duplicateOf!;
    // Doing one of the two is fine; doing both pays twice for the same work.
    if (planned.has(ticket.id) && planned.has(originalId)) return "fell_for";
    const group = duplicateGroupKey(ticket);
    const markedPair = [ticket.id, originalId].some((id) => {
      const pairMark = answer.marks[id];
      if (pairMark?.kind !== "duplicate") return false;
      const target = byId.get(pairMark.duplicateOfId);
      return target !== undefined && duplicateGroupKey(target) === group;
    });
    return markedPair ? "identified" : "avoided";
  }
  if (planned.has(ticket.id)) return "fell_for";
  if (
    isAvoidable(trap) &&
    mark?.kind === "discard" &&
    mark.reason === TRAP_REASON[trap as Exclude<AvoidableTrap, "duplicate">]
  ) {
    return "identified";
  }
  return "avoided";
}

export function buildBacklogReport(
  caseData: BacklogCase,
  answer: BacklogAnswer,
): BacklogReport {
  const start = initialScenario(caseData);
  const after = scenarioAfterEvents(caseData);
  const finalPlanIds = answer.replanTicketIds ?? answer.sprintTicketIds;

  const committedEval = evaluateSprint(start, answer.sprintTicketIds);
  const deliveredEval = evaluateSprint(after, finalPlanIds);
  const optimal = solveOptimalSprint(after);

  const byId = new Map(after.tickets.map((ticket) => [ticket.id, ticket]));
  const delivered = new Set(deliveredEval.deliveredIds);
  const planned = new Set(finalPlanIds.filter((id) => byId.has(id)));
  const deliveredTickets = deliveredEval.deliveredIds.map((id) =>
    byId.get(id)!,
  );

  // ---------------------------------------------------------------- traps
  const traps = after.tickets
    .filter((ticket) => isAvoidable(ticket.hidden.trap))
    .map((ticket) => ({
      ticketId: ticket.id,
      trap: ticket.hidden.trap,
      outcome: trapOutcome(ticket, planned, answer, byId),
      explanation: ticket.hidden.explanation,
    }));
  const engagement = clamp01(
    deliveredEval.plannedEffort / Math.max(1, after.capacity * ENGAGED_SHARE),
  );
  const trapRatio =
    mean(traps.map((trap) => TRAP_CREDIT[trap.outcome])) * engagement;

  // ------------------------------------------------------------- critical
  const criticals = after.tickets
    .filter((ticket) => ticket.hidden.critical)
    .map((ticket) => ({
      ticketId: ticket.id,
      disguised: ticket.hidden.trap === "hidden_critical_bug",
      delivered: delivered.has(ticket.id),
      explanation: ticket.hidden.explanation,
    }));
  const criticalRatio =
    criticals.length === 0
      ? 1
      : criticals.filter((entry) => entry.delivered).length / criticals.length;

  // --------------------------------------------------------------- events
  const finalFit = capacityFit(deliveredEval.plannedEffort, after.capacity);
  const optimalIds = new Set(optimal.ticketIds);
  const events = caseData.midSprintEvents.map((event) => {
    const parts: number[] = [];
    if (event.capacityDelta < 0) parts.push(finalFit);
    const added = event.addedTicket;
    if (added) {
      const shouldInclude = added.hidden.critical || optimalIds.has(added.id);
      if (shouldInclude) {
        // Take it in, and make room for it instead of overbooking.
        parts.push(delivered.has(added.id) ? 1 : 0, finalFit);
      } else if (isAvoidable(added.hidden.trap)) {
        parts.push(planned.has(added.id) ? 0 : 1);
      }
    }
    return {
      id: event.id,
      type: event.type,
      title: event.title,
      guidance: event.hidden.guidance,
      handling: roundTo(mean(parts), 4),
    };
  });
  const eventRatio = mean(events.map((event) => event.handling));

  // ------------------------------------------------------------- capacity
  const capacityRatio = mean([
    capacityFit(committedEval.plannedEffort, start.capacity),
    finalFit,
  ]);

  // -------------------------------------------------------------- metrics
  const base = caseData.baselineMetrics;
  const sumEffect = (key: "activation" | "retention" | "nps" | "revenue") =>
    deliveredTickets.reduce(
      (total, ticket) => total + ticket.hidden.metricEffects[key],
      0,
    );
  const debtChange = deliveredTickets.reduce(
    (total, ticket) => total + ticket.hidden.debtImpact,
    DEBT_DRIFT_PER_SPRINT,
  );
  const metrics: BacklogReport["metrics"] = [
    {
      key: "activation",
      before: base.activation,
      after: roundTo(
        clamp(base.activation + sumEffect("activation"), 0, 100),
        1,
      ),
    },
    {
      key: "retention",
      before: base.retention,
      after: roundTo(clamp(base.retention + sumEffect("retention"), 0, 100), 1),
    },
    {
      key: "nps",
      before: base.nps,
      after: roundTo(clamp(base.nps + sumEffect("nps"), -100, 100), 1),
    },
    {
      key: "revenue",
      before: base.revenue,
      after: Math.round(base.revenue + sumEffect("revenue")),
    },
    {
      key: "techDebt",
      before: base.techDebt,
      after: clamp(base.techDebt + debtChange, 0, 100),
    },
  ];

  // --------------------------------------------------------- stakeholders
  const stakeholders = caseData.stakeholders.map((stakeholder) => {
    const requests = after.tickets.filter(
      (ticket) => ticket.stakeholderId === stakeholder.id,
    );
    const done = requests.filter((ticket) => delivered.has(ticket.id)).length;
    return {
      id: stakeholder.id,
      name: stakeholder.name,
      role: stakeholder.role,
      requested: requests.length,
      delivered: done,
      satisfaction:
        requests.length === 0
          ? null
          : Math.round((100 * done) / requests.length),
    };
  });

  return {
    committed: {
      ticketIds: committedEval.deliveredIds.concat(committedEval.spilledIds),
      effort: committedEval.plannedEffort,
      capacity: start.capacity,
      value: committedEval.value,
    },
    delivered: {
      ticketIds: deliveredEval.deliveredIds,
      spilledIds: deliveredEval.spilledIds,
      plannedEffort: deliveredEval.plannedEffort,
      effort: deliveredEval.deliveredEffort,
      capacity: after.capacity,
      value: deliveredEval.value,
    },
    optimal: {
      ticketIds: optimal.ticketIds,
      effort: optimal.effort,
      capacity: after.capacity,
      value: optimal.value,
    },
    metrics,
    stakeholders,
    traps,
    criticals,
    events,
    ratios: {
      value: clamp01(
        optimal.value === 0 ? 1 : deliveredEval.value / optimal.value,
      ),
      critical: criticalRatio,
      traps: clamp01(trapRatio),
      events: clamp01(eventRatio),
      capacity: clamp01(capacityRatio),
    },
    keyInsight: caseData.hidden.keyInsight,
    principle: caseData.hidden.principle,
  };
}
