/**
 * Deterministic case generator for the Backlog Simulator.
 *
 * The same options always produce the same case: every number comes from the
 * seeded RNG and every sentence from the hand-written content bank. The LLM is
 * not involved here.
 *
 * A candidate case is only accepted if it is fair to play: critical tickets
 * fit in the sprint, and the best possible plan never needs a trap ticket.
 * Otherwise the next deterministic attempt is tried.
 */
import type { Difficulty } from "@/core/case-engine";
import { createRng, type Rng } from "@/core/rng";

import {
  CUSTOMER_NAMES,
  eventPool,
  FIRST_NAMES,
  getCompany,
  ticketPool,
  type CompanyTemplate,
  type Effort,
  type EventTemplate,
  type Level,
  type RoleKey,
  type TicketSignals,
  type TicketTemplate,
} from "./content";
import {
  initialScenario,
  scenarioAfterEvents,
  solveOptimalSprint,
} from "./plan";
import {
  BACKLOG_MODULE_ID,
  backlogCaseSchema,
  type BacklogCase,
  type EventType,
  type MidSprintEvent,
  type Stakeholder,
  type Ticket,
  type TicketTrap,
  type TicketVisible,
} from "./schema";

export interface GenerateBacklogCaseOptions {
  /** Kebab-case id of the case, e.g. "backlog-fintech-01". */
  caseId: string;
  seed: number;
  difficulty: Difficulty;
  /** Key of a company in the content bank. */
  companyKey: string;
  /**
   * Keys of the mid-sprint events to use, for curated cases. When omitted the
   * events are drawn from the seed.
   */
  eventKeys?: readonly string[];
}

interface DifficultyProfile {
  tickets: readonly [number, number];
  obviousCritical: number;
  hiddenCritical: number;
  duplicates: number;
  singleCustomer: number;
  vanity: number;
  lowEvidence: number;
  /** Sprint capacity as a share of the total effort in the backlog. */
  capacityShare: readonly [number, number];
  events: number;
}

export const DIFFICULTY_PROFILES: Record<Difficulty, DifficultyProfile> = {
  apm: {
    tickets: [20, 24],
    obviousCritical: 2,
    hiddenCritical: 1,
    duplicates: 1,
    singleCustomer: 1,
    vanity: 1,
    lowEvidence: 1,
    capacityShare: [0.34, 0.38],
    events: 1,
  },
  pm: {
    tickets: [28, 32],
    obviousCritical: 1,
    hiddenCritical: 2,
    duplicates: 2,
    singleCustomer: 2,
    vanity: 2,
    lowEvidence: 2,
    capacityShare: [0.3, 0.34],
    events: 1,
  },
  senior: {
    tickets: [36, 40],
    obviousCritical: 1,
    hiddenCritical: 3,
    duplicates: 3,
    singleCustomer: 3,
    vanity: 3,
    lowEvidence: 3,
    capacityShare: [0.26, 0.3],
    events: 2,
  },
};

/** Events that force a replan versus events that test judgment. */
const FORCING_EVENTS: readonly EventType[] = [
  "production_outage",
  "dev_unavailable",
  "compliance_deadline",
];

const EFFORT_SCALE: readonly Effort[] = [1, 2, 3, 5, 8, 13];

/** How each event is named in the case's key insight. */
const EVENT_PHRASES: Record<EventType, string> = {
  production_outage: "a production incident",
  dev_unavailable: "losing an engineer",
  compliance_deadline: "a legal deadline",
  sales_promise: "a promise made to a customer",
  ceo_escalation: "a CEO request",
};
const MAX_ATTEMPTS = 300;
const SPRINT_LENGTH_WEEKS = 2;
/** Critical work may take at most this share of the sprint. */
const MAX_CRITICAL_SHARE = 0.5;

type Range = readonly [number, number];

const LEVEL_RANGES: Record<
  "reach" | "support" | "revenue",
  Record<Level, Range>
> = {
  /** Share of active users. */
  reach: { low: [0.005, 0.03], mid: [0.06, 0.18], high: [0.3, 0.65] },
  /** Tickets per month for a company with 30k active users. */
  support: { low: [2, 7], mid: [12, 35], high: [50, 140] },
  /** Share of annual recurring revenue. */
  revenue: { low: [0.003, 0.008], mid: [0.012, 0.03], high: [0.04, 0.09] },
};

/** Largest effect a perfect ticket has on each metric, in the metric's unit. */
const METRIC_SCALE = { activation: 2.4, retention: 1.6, nps: 3 } as const;
/** Largest monthly revenue effect, as a share of MRR. */
const REVENUE_SCALE = 0.018;

function roundSignificant(value: number, digits: number): number {
  if (value === 0) return 0;
  const magnitude =
    10 ** (Math.floor(Math.log10(Math.abs(value))) + 1 - digits);
  return Math.round(value / magnitude) * magnitude;
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function fillText(text: string, values: Record<string, string>): string {
  const filled = text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? values[name] : match,
  );
  const leftover = /\{\w+\}/.exec(filled);
  if (leftover) {
    throw new Error(`Unfilled placeholder ${leftover[0]} in "${text}"`);
  }
  return filled;
}

interface CompanyFacts {
  template: CompanyTemplate;
  activeUsers: number;
  mrr: number;
  stakeholders: Stakeholder[];
  /** Stakeholder and display label for each role present in the company. */
  byRole: Map<RoleKey, { stakeholder: Stakeholder; label: string }>;
  engineerName: string;
}

function buildCompanyFacts(template: CompanyTemplate, rng: Rng): CompanyFacts {
  const numbers = rng.fork("company");
  const names = rng
    .fork("names")
    .sample(FIRST_NAMES, template.stakeholders.length + 1);
  const byRole: CompanyFacts["byRole"] = new Map();
  const stakeholders = template.stakeholders.map((entry, index) => {
    const stakeholder: Stakeholder = {
      id: entry.role,
      name: names[index],
      role: entry.title,
      priorities: [...entry.priorities],
    };
    byRole.set(entry.role, { stakeholder, label: entry.label });
    return stakeholder;
  });
  return {
    template,
    activeUsers: roundSignificant(numbers.int(...template.activeUsers), 2),
    mrr: roundSignificant(numbers.int(...template.mrr), 2),
    stakeholders,
    byRole,
    engineerName: names[names.length - 1],
  };
}

function buildVisible(
  signals: TicketSignals | undefined,
  facts: CompanyFacts,
  rng: Rng,
  text: Record<string, string>,
): TicketVisible {
  const visible: TicketVisible = {};
  if (!signals) return visible;
  if (signals.reach) {
    const share = rng.float(...LEVEL_RANGES.reach[signals.reach]);
    visible.reach = Math.max(
      10,
      roundSignificant(facts.activeUsers * share, 2),
    );
  }
  if (signals.support) {
    const scale = Math.min(
      2.5,
      Math.max(0.6, Math.sqrt(facts.activeUsers / 30_000)),
    );
    const count = rng.float(...LEVEL_RANGES.support[signals.support]) * scale;
    visible.supportTickets = Math.max(1, Math.round(count));
  }
  if (signals.revenue) {
    const share = rng.float(...LEVEL_RANGES.revenue[signals.revenue]);
    visible.revenueAtRisk = roundSignificant(facts.mrr * 12 * share, 2);
  }
  if (signals.hint) visible.impactHint = fillText(signals.hint, text);
  return visible;
}

/** A ticket before it has an id: ids are assigned once the backlog order is known. */
interface TicketDraft {
  key: string;
  duplicateOfKey?: string;
  ticket: Omit<Ticket, "id" | "hidden"> & {
    hidden: Omit<Ticket["hidden"], "duplicateOf">;
  };
}

function buildDraft(
  template: TicketTemplate,
  facts: CompanyFacts,
  rng: Rng,
  customer: string | undefined,
): TicketDraft {
  const role = facts.byRole.get(template.by);
  if (!role) {
    throw new Error(
      `Ticket "${template.key}" is requested by "${template.by}", which ${facts.template.name} does not have`,
    );
  }
  const text: Record<string, string> = { company: facts.template.name };
  if (customer) text.customer = customer;

  const trueValue = rng.int(...template.value);
  const moves = template.moves ?? [];
  const share = moves.length > 0 ? 1 / moves.length : 0;
  const strength = (trueValue / 100) * share * rng.float(0.85, 1.15);
  const effect = (metric: keyof typeof METRIC_SCALE) =>
    moves.includes(metric)
      ? Math.round(strength * METRIC_SCALE[metric] * 10) / 10
      : 0;

  const trap: TicketTrap = template.trap ?? "none";
  return {
    key: template.key,
    ticket: {
      title: fillText(template.title, text),
      description: fillText(template.description, text),
      type: template.type,
      requester: `${role.label} – ${role.stakeholder.name}`,
      stakeholderId: role.stakeholder.id,
      effort: rng.pick(template.effort),
      visible: buildVisible(template.signals, facts, rng, text),
      hidden: {
        trueValue,
        trap,
        critical: template.critical ?? false,
        debtImpact: template.debt ? rng.int(...template.debt) : 0,
        metricEffects: {
          activation: effect("activation"),
          retention: effect("retention"),
          nps: effect("nps"),
          revenue: moves.includes("revenue")
            ? roundToStep(strength * REVENUE_SCALE * facts.mrr, 10)
            : 0,
        },
        explanation: fillText(template.why, text),
      },
    },
  };
}

function buildDuplicateDraft(
  original: TicketDraft,
  template: TicketTemplate,
  facts: CompanyFacts,
  rng: Rng,
): TicketDraft {
  const variant = template.duplicate;
  if (!variant) throw new Error(`Ticket "${template.key}" has no duplicate`);
  const role = facts.byRole.get(variant.by);
  if (!role) {
    throw new Error(`Duplicate of "${template.key}" has no stakeholder`);
  }
  const text = { company: facts.template.name };
  // Someone else estimated the same work: the same size, or one step bigger.
  const effortIndex = EFFORT_SCALE.indexOf(original.ticket.effort as Effort);
  const effort = rng.bool(0.5)
    ? original.ticket.effort
    : EFFORT_SCALE[Math.min(effortIndex + 1, EFFORT_SCALE.length - 1)];
  return {
    key: `${template.key}:duplicate`,
    duplicateOfKey: original.key,
    ticket: {
      title: fillText(variant.title, text),
      description: fillText(variant.description, text),
      type: variant.type,
      requester: `${role.label} – ${role.stakeholder.name}`,
      stakeholderId: role.stakeholder.id,
      effort,
      visible: buildVisible(variant.signals, facts, rng, text),
      hidden: {
        ...original.ticket.hidden,
        trap: "duplicate",
        critical: false,
        explanation: "", // Written once ids exist, see assignIds.
      },
    },
  };
}

function selectTemplates(
  pool: readonly TicketTemplate[],
  profile: DifficultyProfile,
  rng: Rng,
): { templates: TicketTemplate[]; duplicated: Set<string> } {
  const take = (
    label: string,
    candidates: readonly TicketTemplate[],
    count: number,
  ): TicketTemplate[] => {
    if (candidates.length < count) {
      throw new Error(
        `The content bank has ${candidates.length} "${label}" tickets, ${count} needed`,
      );
    }
    return rng.fork(label).sample(candidates, count);
  };
  const withTrap = (trap: TicketTrap) =>
    pool.filter((template) => (template.trap ?? "none") === trap);

  const honest = withTrap("none").filter((template) => !template.critical);
  const fixed = [
    ...take(
      "obvious-critical",
      withTrap("none").filter((template) => template.critical),
      profile.obviousCritical,
    ),
    ...take(
      "hidden-critical",
      withTrap("hidden_critical_bug"),
      profile.hiddenCritical,
    ),
    ...take(
      "single-customer",
      withTrap("single_customer"),
      profile.singleCustomer,
    ),
    ...take("vanity", withTrap("vanity"), profile.vanity),
    ...take("low-evidence", withTrap("low_evidence"), profile.lowEvidence),
  ];

  const duplicated = take(
    "duplicated",
    honest.filter((template) => template.duplicate),
    profile.duplicates,
  );
  const duplicatedKeys = new Set(duplicated.map((template) => template.key));
  const total = rng.fork("size").int(...profile.tickets);
  const otherHonestCount = total - fixed.length - duplicated.length * 2;
  const otherHonest = take(
    "honest",
    honest.filter((template) => !duplicatedKeys.has(template.key)),
    otherHonestCount,
  );

  return {
    templates: [...fixed, ...duplicated, ...otherHonest],
    duplicated: duplicatedKeys,
  };
}

/** Turns drafts into tickets with ids, resolving duplicate references. */
function assignIds(
  drafts: readonly TicketDraft[],
  prefix: string,
  ids: Iterator<number>,
): Ticket[] {
  const idByKey = new Map<string, string>();
  for (const draft of drafts) {
    idByKey.set(draft.key, `${prefix}-${ids.next().value}`);
  }
  const titleByKey = new Map(drafts.map((d) => [d.key, d.ticket.title]));
  return drafts.map((draft) => {
    const id = idByKey.get(draft.key)!;
    if (!draft.duplicateOfKey) {
      return { id, ...draft.ticket };
    }
    const duplicateOf = idByKey.get(draft.duplicateOfKey)!;
    return {
      id,
      ...draft.ticket,
      hidden: {
        ...draft.ticket.hidden,
        duplicateOf,
        explanation: `Same work as ${duplicateOf} ("${titleByKey.get(draft.duplicateOfKey)}"), described by a different team. Shipping both delivers the value once and pays for the effort twice.`,
      },
    };
  });
}

function* ticketNumbers(rng: Rng): Generator<number, never> {
  let current = rng.int(101, 480);
  while (true) {
    yield current;
    current += rng.int(1, 4);
  }
}

function selectEvents(
  pool: readonly EventTemplate[],
  count: number,
  rng: Rng,
): EventTemplate[] {
  const forcing = pool.filter((event) => FORCING_EVENTS.includes(event.type));
  const judgment = pool.filter((event) => !FORCING_EVENTS.includes(event.type));
  // One event: something that forces a replan, or occasionally a judgment call.
  if (count === 1) return [rng.pick(rng.bool(0.75) ? forcing : judgment)];
  // Two events: one of each kind, so the replan needs both reflexes.
  return [rng.pick(forcing), rng.pick(judgment)];
}

function buildEvent(
  template: EventTemplate,
  index: number,
  capacity: number,
  facts: CompanyFacts,
  rng: Rng,
  customer: string,
  ids: Iterator<number>,
): MidSprintEvent {
  const requester = template.ticket
    ? facts.byRole.get(template.ticket.by)?.stakeholder.name
    : undefined;
  const text: Record<string, string> = {
    company: facts.template.name,
    engineer: facts.engineerName,
    customer,
    ...(requester ? { requester } : {}),
  };
  const capacityDelta = template.capacityLoss
    ? -Math.max(2, Math.round(capacity * rng.float(...template.capacityLoss)))
    : 0;
  const addedTicket = template.ticket
    ? assignIds(
        [buildDraft(template.ticket, facts, rng.fork("ticket"), customer)],
        facts.template.ticketPrefix,
        ids,
      )[0]
    : undefined;
  return {
    id: `event-${index + 1}`,
    type: template.type,
    title: fillText(template.title, text),
    description: fillText(template.description, text),
    capacityDelta,
    ...(addedTicket ? { addedTicket } : {}),
    hidden: { guidance: template.guidance },
  };
}

const AVOIDABLE_TRAPS: readonly TicketTrap[] = [
  "duplicate",
  "single_customer",
  "vanity",
  "low_evidence",
];

/** Why a candidate case is not fair to play, or null if it is. */
export function findFairnessIssue(caseData: BacklogCase): string | null {
  const scenarios = [
    { name: "initial", scenario: initialScenario(caseData) },
    { name: "after events", scenario: scenarioAfterEvents(caseData) },
  ];
  for (const { name, scenario } of scenarios) {
    const optimal = solveOptimalSprint(scenario);
    if (optimal.missedCriticalIds.length > 0) {
      return `critical tickets do not fit (${name})`;
    }
    const criticalEffort = scenario.tickets
      .filter((ticket) => ticket.hidden.critical)
      .reduce((sum, ticket) => sum + ticket.effort, 0);
    if (criticalEffort > scenario.capacity * MAX_CRITICAL_SHARE) {
      return `critical tickets take more than half of the sprint (${name})`;
    }
    const chosen = new Set(optimal.ticketIds);
    const trapInOptimal = scenario.tickets.find(
      (ticket) =>
        chosen.has(ticket.id) && AVOIDABLE_TRAPS.includes(ticket.hidden.trap),
    );
    if (trapInOptimal) {
      return `the optimal sprint needs trap ticket ${trapInOptimal.id} (${name})`;
    }
  }
  return null;
}

function buildCandidate(
  options: GenerateBacklogCaseOptions,
  rng: Rng,
): BacklogCase {
  const company = getCompany(options.companyKey);
  const profile = DIFFICULTY_PROFILES[options.difficulty];
  const facts = buildCompanyFacts(company, rng);
  const customers = rng.fork("customers").shuffle(CUSTOMER_NAMES);
  const nextCustomer = () => {
    const customer = customers.pop();
    if (!customer) throw new Error("Ran out of customer names");
    return customer;
  };

  const { templates, duplicated } = selectTemplates(
    ticketPool(company.industry),
    profile,
    rng.fork("selection"),
  );
  const drafts: TicketDraft[] = [];
  for (const template of templates) {
    const ticketRng = rng.fork(`ticket:${template.key}`);
    const needsCustomer = /\{customer\}/.test(
      `${template.title}${template.description}${template.signals?.hint ?? ""}${template.why}`,
    );
    const draft = buildDraft(
      template,
      facts,
      ticketRng,
      needsCustomer ? nextCustomer() : undefined,
    );
    drafts.push(draft);
    if (duplicated.has(template.key)) {
      drafts.push(
        buildDuplicateDraft(
          draft,
          template,
          facts,
          ticketRng.fork("duplicate"),
        ),
      );
    }
  }

  const ids = ticketNumbers(rng.fork("ids"));
  const tickets = assignIds(
    rng.fork("order").shuffle(drafts),
    company.ticketPrefix,
    ids,
  );

  const totalEffort = tickets.reduce((sum, ticket) => sum + ticket.effort, 0);
  const sprintCapacity = Math.round(
    totalEffort * rng.fork("capacity").float(...profile.capacityShare),
  );

  const eventRng = rng.fork("events");
  const availableEvents = eventPool(company.industry);
  const chosenEvents = options.eventKeys
    ? options.eventKeys.map((key) => {
        const event = availableEvents.find(
          (candidate) => candidate.key === key,
        );
        if (!event) {
          throw new Error(
            `Event "${key}" is not available for ${company.name}`,
          );
        }
        return event;
      })
    : selectEvents(availableEvents, profile.events, eventRng);
  const midSprintEvents = chosenEvents.map((template, index) =>
    buildEvent(
      template,
      index,
      sprintCapacity,
      facts,
      eventRng.fork(template.key),
      nextCustomer(),
      ids,
    ),
  );

  const metrics = rng.fork("metrics");
  const draftCase = {
    id: options.caseId,
    moduleId: BACKLOG_MODULE_ID,
    seed: options.seed,
    difficulty: options.difficulty,
    company: {
      name: company.name,
      industry: company.industryLabel,
      stage: company.stage,
      description: company.description,
    },
    title: company.caseTitle,
    brief: company.brief,
    sprintCapacity,
    sprintLengthWeeks: SPRINT_LENGTH_WEEKS,
    teamSize: Math.min(12, Math.max(3, Math.round(sprintCapacity / 8))),
    activeUsers: facts.activeUsers,
    stakeholders: facts.stakeholders,
    baselineMetrics: {
      activation: metrics.int(...company.metrics.activation),
      retention: metrics.int(...company.metrics.retention),
      nps: metrics.int(...company.metrics.nps),
      revenue: facts.mrr,
      techDebt: metrics.int(...company.metrics.techDebt),
    },
    tickets,
    midSprintEvents,
    hidden: { keyInsight: "pending", principle: company.principle },
  } satisfies BacklogCase;

  const trapCount = tickets.filter((ticket) =>
    AVOIDABLE_TRAPS.includes(ticket.hidden.trap),
  ).length;
  const disguised = tickets.filter(
    (ticket) => ticket.hidden.trap === "hidden_critical_bug",
  ).length;
  const eventPhrases = midSprintEvents.map(
    (event) => EVENT_PHRASES[event.type],
  );
  return {
    ...draftCase,
    hidden: {
      principle: company.principle,
      keyInsight: `Of the ${tickets.length} tickets, ${trapCount} are traps and ${disguised} critical ${disguised === 1 ? "problem is" : "problems are"} filed as minor. Mid-sprint, ${eventPhrases.join(" and ")} ${eventPhrases.length === 1 ? "forces" : "force"} a replan: the plan that wins keeps room to react.`,
    },
  };
}

/**
 * Generates one case. Deterministic: identical options give an identical case.
 * Throws if the content bank cannot produce a fair case for these options.
 */
export function generateBacklogCase(
  options: GenerateBacklogCaseOptions,
): BacklogCase {
  const root = createRng(options.seed);
  let lastIssue = "unknown";
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = buildCandidate(options, root.fork(`attempt-${attempt}`));
    const parsed = backlogCaseSchema.safeParse(candidate);
    if (!parsed.success) {
      lastIssue = parsed.error.issues.map((issue) => issue.message).join("; ");
      continue;
    }
    const issue = findFairnessIssue(parsed.data);
    if (!issue) return parsed.data;
    lastIssue = issue;
  }
  throw new Error(
    `No fair case for "${options.caseId}" after ${MAX_ATTEMPTS} attempts: ${lastIssue}`,
  );
}
