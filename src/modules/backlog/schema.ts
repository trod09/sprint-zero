/**
 * Data model of the Backlog Simulator.
 *
 * Schemas and types only, so this file is safe to import from Client
 * Components. Case data itself lives in `cases/*.json` and is only read on the
 * server.
 *
 * Ground truth sits under `hidden` keys (per ticket and per case) and in
 * `midSprintEvents`, which the learner must not see before committing a sprint.
 */
import { z } from "zod";

import { baseCaseSchema, publicBaseCaseSchema } from "@/core/case-engine";

export const BACKLOG_MODULE_ID = "backlog";

export const TICKET_TYPES = [
  "feature",
  "bug",
  "tech_debt",
  "sales_request",
  "ceo_request",
] as const;
export const ticketTypeSchema = z.enum(TICKET_TYPES);
export type TicketType = z.infer<typeof ticketTypeSchema>;

export const TICKET_TRAPS = [
  "none",
  /** Same work as another ticket, written by someone else. */
  "duplicate",
  /** Loud request that only matters to one customer. */
  "single_customer",
  /** Looks minor, but the description hides a critical problem. */
  "hidden_critical_bug",
  /** Looks impressive, moves no metric that matters. */
  "vanity",
  /** Big claim with no data behind it. */
  "low_evidence",
] as const;
export const ticketTrapSchema = z.enum(TICKET_TRAPS);
export type TicketTrap = z.infer<typeof ticketTrapSchema>;

/** Story points follow the usual modified Fibonacci scale. */
export const EFFORT_POINTS = [1, 2, 3, 5, 8, 13] as const;
export const effortSchema = z
  .number()
  .int()
  .refine((value) => (EFFORT_POINTS as readonly number[]).includes(value), {
    message: `Effort must be one of ${EFFORT_POINTS.join(", ")}`,
  });

export const ticketIdSchema = z
  .string()
  .regex(/^[A-Z]{2,5}-\d{1,4}$/, "Ticket ids look like PAY-142");

/** Product metrics a ticket can move. Tech debt is tracked separately. */
export const METRIC_KEYS = [
  "activation",
  "retention",
  "nps",
  "revenue",
] as const;
export type MetricKey = (typeof METRIC_KEYS)[number];

/** What the learner can see on a ticket: incomplete and sometimes misleading. */
export const ticketVisibleSchema = z.object({
  /** Users affected per month, as claimed by the requester. */
  reach: z.number().int().nonnegative().optional(),
  /** The requester's pitch, quoted. */
  impactHint: z.string().min(1).optional(),
  /** Support tickets linked to this issue in the last 30 days. */
  supportTickets: z.number().int().nonnegative().optional(),
  /** Annual revenue the requester says is at risk, in USD. */
  revenueAtRisk: z.number().int().nonnegative().optional(),
});
export type TicketVisible = z.infer<typeof ticketVisibleSchema>;

export const ticketHiddenSchema = z.object({
  /** Real value of shipping this ticket, 0..100. */
  trueValue: z.number().int().min(0).max(100),
  trap: ticketTrapSchema,
  /** Id of the ticket this one duplicates. Required when `trap` is "duplicate". */
  duplicateOf: ticketIdSchema.optional(),
  /** Critical tickets must be in the sprint whatever else gets cut. */
  critical: z.boolean(),
  /** Tech debt added (positive) or paid down (negative) by shipping it. */
  debtImpact: z.number().int().min(-20).max(20),
  /** Change in each product metric if shipped, in that metric's own unit. */
  metricEffects: z.object({
    activation: z.number(),
    retention: z.number(),
    nps: z.number(),
    revenue: z.number(),
  }),
  /** Why the ticket is worth what it is worth. Shown after submitting. */
  explanation: z.string().min(1),
});
export type TicketHidden = z.infer<typeof ticketHiddenSchema>;

const ticketPublicShape = {
  id: ticketIdSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  type: ticketTypeSchema,
  /** Display label, e.g. "Sales – Laura". */
  requester: z.string().min(1),
  /** Id of the stakeholder behind the request. */
  stakeholderId: z.string().min(1),
  effort: effortSchema,
  visible: ticketVisibleSchema,
};

export const publicTicketSchema = z.object(ticketPublicShape);
export type PublicTicket = z.infer<typeof publicTicketSchema>;

export const ticketSchema = z.object({
  ...ticketPublicShape,
  hidden: ticketHiddenSchema,
});
export type Ticket = z.infer<typeof ticketSchema>;

export const stakeholderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  /** What this person pushes for, in their own words. */
  priorities: z.array(z.string().min(1)).min(1).max(4),
});
export type Stakeholder = z.infer<typeof stakeholderSchema>;

export const EVENT_TYPES = [
  "production_outage",
  "sales_promise",
  "dev_unavailable",
  "compliance_deadline",
  "ceo_escalation",
] as const;
export const eventTypeSchema = z.enum(EVENT_TYPES);
export type EventType = z.infer<typeof eventTypeSchema>;

const eventPublicShape = {
  id: z.string().min(1),
  type: eventTypeSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  /** Story points lost (negative) or gained for the rest of the sprint. */
  capacityDelta: z.number().int().max(0),
};

/** A mid-sprint event: it changes capacity, adds an urgent ticket, or both. */
export const midSprintEventSchema = z.object({
  ...eventPublicShape,
  addedTicket: ticketSchema.optional(),
  hidden: z.object({
    /** What a good PM does when this happens. Shown after submitting. */
    guidance: z.string().min(1),
  }),
});
export type MidSprintEvent = z.infer<typeof midSprintEventSchema>;

/** The event as revealed to the learner once the first sprint is committed. */
export const publicMidSprintEventSchema = z.object({
  ...eventPublicShape,
  addedTicket: publicTicketSchema.optional(),
});
export type PublicMidSprintEvent = z.infer<typeof publicMidSprintEventSchema>;

export const baselineMetricsSchema = z.object({
  /** Share of new users who reach the activation milestone, in %. */
  activation: z.number().min(0).max(100),
  /** Share of users still active after 90 days, in %. */
  retention: z.number().min(0).max(100),
  /** Net Promoter Score, -100..100. */
  nps: z.number().min(-100).max(100),
  /** Monthly recurring revenue in USD. */
  revenue: z.number().nonnegative(),
  /** Tech debt index, 0 (clean) to 100 (frozen codebase). */
  techDebt: z.number().min(0).max(100),
});
export type BaselineMetrics = z.infer<typeof baselineMetricsSchema>;

const caseSharedShape = {
  moduleId: z.literal(BACKLOG_MODULE_ID),
  /** Story points the team can deliver in the sprint. */
  sprintCapacity: z.number().int().min(8).max(120),
  sprintLengthWeeks: z.number().int().min(1).max(4),
  teamSize: z.number().int().min(2).max(20),
  /** Monthly active users, for judging the `reach` of a ticket. */
  activeUsers: z.number().int().positive(),
  stakeholders: z.array(stakeholderSchema).min(3).max(8),
  baselineMetrics: baselineMetricsSchema,
};

export const backlogCaseSchema = baseCaseSchema
  .extend({
    ...caseSharedShape,
    tickets: z.array(ticketSchema).min(20).max(40),
    midSprintEvents: z.array(midSprintEventSchema).min(1).max(2),
    hidden: z.object({
      /** The one thing this backlog is really testing. */
      keyInsight: z.string().min(1),
      /** PM principle to remember, quoted in the results. */
      principle: z.string().min(1),
    }),
  })
  .superRefine((caseData, context) => {
    for (const issue of findCaseIssues(caseData)) {
      context.addIssue({ code: "custom", message: issue });
    }
  });
export type BacklogCase = z.infer<typeof backlogCaseSchema>;

export const publicBacklogCaseSchema = publicBaseCaseSchema.extend({
  ...caseSharedShape,
  tickets: z.array(publicTicketSchema).min(20).max(40),
  /** How many mid-sprint events to expect; their content stays on the server. */
  eventCount: z.number().int().min(1).max(2),
});
export type PublicBacklogCase = z.infer<typeof publicBacklogCaseSchema>;

export const PLANNING_METHODS = ["drag", "rice", "moscow"] as const;
export const planningMethodSchema = z.enum(PLANNING_METHODS);
export type PlanningMethod = z.infer<typeof planningMethodSchema>;

export const DISCARD_REASONS = [
  "single_customer",
  "no_evidence",
  "no_impact",
  "too_expensive",
  "not_now",
] as const;
export const discardReasonSchema = z.enum(DISCARD_REASONS);
export type DiscardReason = z.infer<typeof discardReasonSchema>;

/** A judgment the learner records on a ticket they are leaving out. */
export const ticketMarkSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("duplicate"),
    /** The ticket the learner believes describes the same work. */
    duplicateOfId: ticketIdSchema,
  }),
  z.object({
    kind: z.literal("discard"),
    reason: discardReasonSchema,
    note: z.string().max(280).optional(),
  }),
]);
export type TicketMark = z.infer<typeof ticketMarkSchema>;

const MAX_ANSWER_TICKETS = 60;

/** The learner's plan. The sprint is ordered: the team works top to bottom. */
export const backlogAnswerSchema = z.object({
  /** How the learner prioritised. Recorded for feedback, never scored. */
  method: planningMethodSchema.default("drag"),
  sprintTicketIds: z
    .array(ticketIdSchema)
    .max(MAX_ANSWER_TICKETS)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "A ticket can only be in the sprint once",
    }),
  /** Tickets flagged as duplicates or discarded, by ticket id. */
  marks: z
    .record(ticketIdSchema, ticketMarkSchema)
    .refine((marks) => Object.keys(marks).length <= MAX_ANSWER_TICKETS, {
      message: "Too many marked tickets",
    })
    .default({}),
});
export type BacklogAnswer = z.infer<typeof backlogAnswerSchema>;

interface CaseIntegrityInput {
  sprintCapacity: number;
  tickets: readonly Ticket[];
  stakeholders: readonly Stakeholder[];
  midSprintEvents: readonly MidSprintEvent[];
}

/** Cross-field rules that a per-field schema cannot express. */
export function findCaseIssues(caseData: CaseIntegrityInput): string[] {
  const issues: string[] = [];
  const stakeholderIds = new Set<string>();
  for (const stakeholder of caseData.stakeholders) {
    if (stakeholderIds.has(stakeholder.id)) {
      issues.push(`Duplicate stakeholder id "${stakeholder.id}"`);
    }
    stakeholderIds.add(stakeholder.id);
  }

  const eventTickets = caseData.midSprintEvents.flatMap((event) =>
    event.addedTicket ? [event.addedTicket] : [],
  );
  const allTickets = [...caseData.tickets, ...eventTickets];
  const byId = new Map<string, Ticket>();
  for (const ticket of allTickets) {
    if (byId.has(ticket.id)) issues.push(`Duplicate ticket id "${ticket.id}"`);
    byId.set(ticket.id, ticket);
  }

  for (const ticket of allTickets) {
    if (!stakeholderIds.has(ticket.stakeholderId)) {
      issues.push(
        `Ticket ${ticket.id} points to unknown stakeholder "${ticket.stakeholderId}"`,
      );
    }
    const { trap, duplicateOf, critical } = ticket.hidden;
    if ((trap === "duplicate") !== (duplicateOf !== undefined)) {
      issues.push(
        `Ticket ${ticket.id}: "duplicateOf" must be set exactly when the trap is "duplicate"`,
      );
    }
    if (duplicateOf !== undefined) {
      const original = byId.get(duplicateOf);
      if (!original || duplicateOf === ticket.id) {
        issues.push(
          `Ticket ${ticket.id} duplicates unknown ticket "${duplicateOf}"`,
        );
      } else if (original.hidden.trap === "duplicate") {
        issues.push(`Ticket ${ticket.id} duplicates another duplicate`);
      } else if (original.hidden.critical) {
        issues.push(`Ticket ${ticket.id} duplicates a critical ticket`);
      }
    }
    if (trap === "hidden_critical_bug" && !critical) {
      issues.push(
        `Ticket ${ticket.id}: a hidden critical bug must be critical`,
      );
    }
    if (critical && trap !== "none" && trap !== "hidden_critical_bug") {
      issues.push(`Ticket ${ticket.id}: a "${trap}" trap cannot be critical`);
    }
  }

  const eventIds = new Set<string>();
  let capacity = caseData.sprintCapacity;
  for (const event of caseData.midSprintEvents) {
    if (eventIds.has(event.id)) issues.push(`Duplicate event id "${event.id}"`);
    eventIds.add(event.id);
    if (event.capacityDelta === 0 && !event.addedTicket) {
      issues.push(`Event "${event.id}" changes nothing`);
    }
    capacity += event.capacityDelta;
  }
  if (capacity < 5) {
    issues.push("Mid-sprint events leave the team with almost no capacity");
  }

  const criticalEffort = (tickets: readonly Ticket[]) =>
    tickets
      .filter((ticket) => ticket.hidden.critical)
      .reduce((sum, ticket) => sum + ticket.effort, 0);
  if (criticalEffort(caseData.tickets) > caseData.sprintCapacity) {
    issues.push("Critical tickets do not fit in the sprint");
  }
  if (criticalEffort(allTickets) > capacity) {
    issues.push("Critical tickets do not fit in the sprint after the events");
  }
  return issues;
}
