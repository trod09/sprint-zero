/**
 * Shapes of the hand-written content the case generator combines.
 *
 * Templates hold words and ranges; the generator turns ranges into concrete
 * numbers with the seeded RNG. No template contains a final number that ends
 * up in a score.
 */
import type { EventType, MetricKey, TicketTrap, TicketType } from "../schema";

export type Effort = 1 | 2 | 3 | 5 | 8 | 13;

/** Qualitative size of a visible signal; scaled to the company by the generator. */
export type Level = "low" | "mid" | "high";

export const ROLE_KEYS = [
  "ceo",
  "sales",
  "support",
  "engineering",
  "design",
  "marketing",
  "compliance",
  "operations",
  "success",
  "growth",
] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

export const INDUSTRIES = [
  "fintech",
  "marketplace",
  "saas",
  "consumer",
] as const;
export type Industry = (typeof INDUSTRIES)[number];

export interface TicketSignals {
  /** Share of active users affected. */
  reach?: Level;
  /** Linked support tickets in the last 30 days. */
  support?: Level;
  /** Annual revenue claimed to be at risk. */
  revenue?: Level;
  /** The requester's pitch. May use `{customer}`. */
  hint?: string;
}

/** A second ticket for the same work, filed by someone else in other words. */
export interface DuplicateVariant {
  type: TicketType;
  by: RoleKey;
  title: string;
  description: string;
  signals?: TicketSignals;
}

/**
 * One reusable ticket. Text may use `{company}` and `{customer}`.
 * The trap is part of how the ticket is written, so it is fixed per template.
 */
export interface TicketTemplate {
  key: string;
  type: TicketType;
  /** Role of the requester; resolved to a stakeholder of the company. */
  by: RoleKey;
  title: string;
  description: string;
  /** Defaults to "none". Duplicates are created from `duplicate`, never set here. */
  trap?: Exclude<TicketTrap, "duplicate">;
  critical?: boolean;
  /** Inclusive range for the real value, 0..100. */
  value: readonly [number, number];
  /** Story point options. */
  effort: readonly Effort[];
  /** Inclusive range for tech debt added (+) or removed (-). Defaults to 0. */
  debt?: readonly [number, number];
  signals?: TicketSignals;
  /** Product metrics this ticket moves when shipped. */
  moves?: readonly MetricKey[];
  /** Why it is worth what it is worth. Shown after submitting. */
  why: string;
  duplicate?: DuplicateVariant;
}

export interface StakeholderTemplate {
  role: RoleKey;
  /** Job title, e.g. "Head of Sales". */
  title: string;
  /** Short label used in "Sales – Laura". */
  label: string;
  priorities: readonly string[];
}

export interface CompanyTemplate {
  key: string;
  industry: Industry;
  /** Human-readable industry, e.g. "Fintech". */
  industryLabel: string;
  name: string;
  stage: string;
  description: string;
  /** Prefix of ticket ids, 2-5 capital letters. */
  ticketPrefix: string;
  caseTitle: string;
  /** Situation and sprint goal, shown before the learner starts. */
  brief: string;
  /** PM principle quoted in the results. */
  principle: string;
  activeUsers: readonly [number, number];
  /** Monthly recurring revenue in USD. */
  mrr: readonly [number, number];
  metrics: {
    activation: readonly [number, number];
    retention: readonly [number, number];
    nps: readonly [number, number];
    techDebt: readonly [number, number];
  };
  stakeholders: readonly StakeholderTemplate[];
}

/**
 * A mid-sprint event. Text may use `{company}`, `{customer}`, `{engineer}`
 * and `{requester}` (the first name of the stakeholder behind it).
 */
export interface EventTemplate {
  key: string;
  type: EventType;
  /** Limits the event to some industries. Omitted means all. */
  industries?: readonly Industry[];
  title: string;
  description: string;
  /** Share of sprint capacity lost, as an inclusive range (0..1). */
  capacityLoss?: readonly [number, number];
  ticket?: TicketTemplate;
  /** What a good PM does. Shown after submitting. */
  guidance: string;
}
