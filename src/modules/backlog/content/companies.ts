/**
 * The fictional companies behind the cases: one per pregenerated case.
 */
import type {
  CompanyTemplate,
  Industry,
  RoleKey,
  StakeholderTemplate,
} from "./types";

const ROLE_DEFAULTS: Record<RoleKey, StakeholderTemplate> = {
  ceo: {
    role: "ceo",
    title: "CEO and co-founder",
    label: "CEO",
    priorities: [
      "Hit the growth number promised to the board",
      "Have something impressive to show investors",
      "No public incidents",
    ],
  },
  sales: {
    role: "sales",
    title: "Head of Sales",
    label: "Sales",
    priorities: [
      "Close the deals in this quarter's pipeline",
      "Never tell a prospect 'it is not on the roadmap'",
      "Keep the biggest accounts happy",
    ],
  },
  support: {
    role: "support",
    title: "Support Lead",
    label: "Support",
    priorities: [
      "Fewer repeat tickets",
      "Fix what customers complain about every day",
      "Shorter resolution times",
    ],
  },
  engineering: {
    role: "engineering",
    title: "Engineering Manager",
    label: "Eng",
    priorities: [
      "A stable platform",
      "Time to pay down tech debt",
      "No last-minute scope changes",
    ],
  },
  design: {
    role: "design",
    title: "Lead Product Designer",
    label: "Design",
    priorities: [
      "Fix the first-run experience",
      "A coherent, usable product",
      "Ship fewer, better things",
    ],
  },
  marketing: {
    role: "marketing",
    title: "Head of Marketing",
    label: "Marketing",
    priorities: [
      "More signups from the same traffic",
      "A launch to talk about every month",
      "A polished brand",
    ],
  },
  compliance: {
    role: "compliance",
    title: "Compliance Officer",
    label: "Compliance",
    priorities: [
      "Zero regulatory findings",
      "Regulator deadlines are not negotiable",
      "Customer money and data handled by the book",
    ],
  },
  operations: {
    role: "operations",
    title: "Head of Operations",
    label: "Ops",
    priorities: [
      "Fewer manual processes",
      "Disputes and payouts resolved on time",
      "Trust between buyers and sellers",
    ],
  },
  success: {
    role: "success",
    title: "Head of Customer Success",
    label: "CS",
    priorities: [
      "Renewals and expansion",
      "Faster onboarding for new accounts",
      "Fewer escalations from admins",
    ],
  },
  growth: {
    role: "growth",
    title: "Growth Lead",
    label: "Growth",
    priorities: [
      "Activation and day-7 retention",
      "Trial-to-paid conversion",
      "Experiments backed by data",
    ],
  },
};

const CORE_ROLES: readonly RoleKey[] = [
  "ceo",
  "sales",
  "support",
  "engineering",
  "design",
  "marketing",
];

const EXTRA_ROLE: Record<Industry, RoleKey> = {
  fintech: "compliance",
  marketplace: "operations",
  saas: "success",
  consumer: "growth",
};

function roster(
  industry: Industry,
  overrides: Partial<Record<RoleKey, Partial<StakeholderTemplate>>> = {},
): StakeholderTemplate[] {
  return [...CORE_ROLES, EXTRA_ROLE[industry]].map((role) => ({
    ...ROLE_DEFAULTS[role],
    ...overrides[role],
  }));
}

const PARTNERSHIPS: Partial<StakeholderTemplate> = {
  title: "Head of Partnerships",
  label: "Partnerships",
  priorities: [
    "Sign the corporate partners in the pipeline",
    "Give partners what they ask for",
    "Revenue beyond individual subscriptions",
  ],
};

const SELLER_SALES: Partial<StakeholderTemplate> = {
  title: "Head of Seller Partnerships",
  label: "Sales",
  priorities: [
    "Keep the top sellers on the platform",
    "Bring in large sellers this quarter",
    "Never tell a seller 'we cannot do that'",
  ],
};

export const companies: readonly CompanyTemplate[] = [
  // ---------------------------------------------------------------- fintech
  {
    key: "ledgerly",
    industry: "fintech",
    industryLabel: "Fintech",
    name: "Ledgerly",
    stage: "Seed",
    description:
      "Invoicing and payments for freelancers and small businesses: send an invoice, get paid by transfer, keep the books tidy.",
    ticketPrefix: "LED",
    caseTitle: "Ledgerly: your first sprint as PM",
    brief:
      "You joined Ledgerly on Monday. The previous PM left a backlog that mixes customer bugs, promises from sales and ideas from the founder, and nobody has ranked it. Growth has slowed because new signups do not finish setting up. Plan the next two-week sprint: the team can only deliver part of this list.",
    principle:
      "Loud is not the same as important. Weigh a request by how many customers it helps and what happens if you wait, not by who asked or how often.",
    activeUsers: [9_000, 16_000],
    mrr: [70_000, 120_000],
    metrics: {
      activation: [34, 44],
      retention: [48, 58],
      nps: [22, 34],
      techDebt: [35, 48],
    },
    stakeholders: roster("fintech"),
  },
  {
    key: "tallybridge",
    industry: "fintech",
    industryLabel: "Fintech",
    name: "Tallybridge",
    stage: "Series A",
    description:
      "Expense management for mid-size companies: employees pay, finance teams approve, and every payment lands in the ledger.",
    ticketPrefix: "TAL",
    caseTitle: "Tallybridge: month-end is coming",
    brief:
      "Tallybridge closed its Series A on a promise of moving upmarket. Sales is bringing larger prospects with long lists of demands, support is drowning ahead of month-end, and the engineering manager warns the platform is getting fragile. You have one sprint before the busiest week of the month. Decide what the team commits to.",
    principle:
      "One customer is an anecdote, five are a pattern. Build for the pattern and negotiate with the anecdote.",
    activeUsers: [38_000, 60_000],
    mrr: [320_000, 480_000],
    metrics: {
      activation: [40, 52],
      retention: [58, 68],
      nps: [18, 30],
      techDebt: [48, 62],
    },
    stakeholders: roster("fintech"),
  },
  {
    key: "cobalt-pay",
    industry: "fintech",
    industryLabel: "Fintech",
    name: "Cobalt Pay",
    stage: "Series B",
    description:
      "Payouts platform for online businesses: pay suppliers and contractors in bulk, with the paperwork handled.",
    ticketPrefix: "CBP",
    caseTitle: "Cobalt Pay: everything is a priority",
    brief:
      "Cobalt Pay is growing fast and every team has a top priority that cannot wait. The CEO wants a headline for the next board meeting, sales has two large accounts making demands, and the regulator's annual review is on the calendar. Several tickets in this backlog are not what their titles suggest. Plan the sprint, and expect it to be interrupted.",
    principle:
      "Protect the foundations first: money, data, access and legal deadlines come before any feature.",
    activeUsers: [110_000, 170_000],
    mrr: [1_100_000, 1_700_000],
    metrics: {
      activation: [44, 56],
      retention: [62, 72],
      nps: [14, 28],
      techDebt: [55, 70],
    },
    stakeholders: roster("fintech"),
  },
  // ------------------------------------------------------------ marketplace
  {
    key: "loopcart",
    industry: "marketplace",
    industryLabel: "Marketplace",
    name: "Loopcart",
    stage: "Series A",
    description:
      "Marketplace for refurbished phones, laptops and consoles, sold by vetted refurbishers with a one-year warranty.",
    ticketPrefix: "LOOP",
    caseTitle: "Loopcart: more buyers than listings",
    brief:
      "Loopcart's traffic is up after a TV mention, but conversion is flat: buyers search, do not find what they want and leave. Sellers complain that listing an item takes too long and that they never know when they will be paid. Plan a two-week sprint that turns the extra traffic into orders.",
    principle:
      "Value per point, not value alone. A small sure win usually beats a large uncertain one.",
    activeUsers: [60_000, 95_000],
    mrr: [140_000, 220_000],
    metrics: {
      activation: [18, 28],
      retention: [30, 40],
      nps: [20, 34],
      techDebt: [38, 52],
    },
    stakeholders: roster("marketplace", { sales: SELLER_SALES }),
  },
  {
    key: "crateful",
    industry: "marketplace",
    industryLabel: "Marketplace",
    name: "Crateful",
    stage: "Series B",
    description:
      "Wholesale marketplace where independent shops order from small brands, with payment terms and returns handled by the platform.",
    ticketPrefix: "CRT",
    caseTitle: "Crateful: the top sellers want more",
    brief:
      "A handful of large brands generate a big share of Crateful's volume, and they know it. Their requests arrive through sales marked as urgent. Meanwhile operations handles disputes by email and the payment provider has sent a deprecation notice. Decide what goes into the sprint and what you will say no to.",
    principle:
      "Saying no is part of the job. Explain the trade-off with data and offer a smaller alternative.",
    activeUsers: [22_000, 36_000],
    mrr: [420_000, 640_000],
    metrics: {
      activation: [26, 36],
      retention: [44, 56],
      nps: [16, 30],
      techDebt: [46, 60],
    },
    stakeholders: roster("marketplace", { sales: SELLER_SALES }),
  },
  // ------------------------------------------------------------------- saas
  {
    key: "stackwise",
    industry: "saas",
    industryLabel: "SaaS B2B",
    name: "Stackwise",
    stage: "Seed",
    description:
      "Project management for creative agencies: briefs, tasks and client approvals in one place, billed per seat.",
    ticketPrefix: "STK",
    caseTitle: "Stackwise: trials that go nowhere",
    brief:
      "Stackwise gets plenty of trial signups from agencies, but few become paying teams. The founder has a list of features competitors have, and support has a list of things that break every week. You have one sprint and a small team. Choose the work that turns trials into customers.",
    principle:
      "A sprint is a bet on outcomes. If a ticket cannot name the metric it moves, it is decoration.",
    activeUsers: [6_000, 11_000],
    mrr: [55_000, 95_000],
    metrics: {
      activation: [22, 32],
      retention: [56, 66],
      nps: [26, 38],
      techDebt: [30, 44],
    },
    stakeholders: roster("saas"),
  },
  {
    key: "relaydesk",
    industry: "saas",
    industryLabel: "SaaS B2B",
    name: "Relaydesk",
    stage: "Series A",
    description:
      "Shared inbox and helpdesk for support teams of 10 to 200 agents, with automations and reporting.",
    ticketPrefix: "RLY",
    caseTitle: "Relaydesk: renewal season",
    brief:
      "A third of Relaydesk's annual contracts renew this quarter. Customer success is collecting complaints from admins, sales wants enterprise features for two open deals, and a security audit starts in three weeks. Not every urgent request is important, and not every dull ticket is harmless. Plan the sprint.",
    principle:
      "Evidence beats confidence. Ask 'how do we know?' before 'how long will it take?'",
    activeUsers: [28_000, 45_000],
    mrr: [380_000, 560_000],
    metrics: {
      activation: [30, 42],
      retention: [66, 76],
      nps: [20, 32],
      techDebt: [44, 58],
    },
    stakeholders: roster("saas"),
  },
  {
    key: "fieldnote",
    industry: "saas",
    industryLabel: "SaaS B2B",
    name: "Fieldnote",
    stage: "Series B",
    description:
      "Scheduling and dispatch software for field service companies: plan the day, route technicians, invoice on site.",
    ticketPrefix: "FLD",
    caseTitle: "Fieldnote: forty tickets, one sprint",
    brief:
      "Fieldnote has outgrown its processes. The backlog has grown to dozens of tickets filed by seven different teams, some describing the same problem in different words. Two enterprise customers are negotiating expansions with conditions attached, and the platform has had three incidents this quarter. Build a sprint you can defend, then defend it when the plan changes.",
    principle:
      "Read the description, not the label. The most dangerous tickets are filed as low priority by people who did not see what they were looking at.",
    activeUsers: [85_000, 130_000],
    mrr: [1_300_000, 1_900_000],
    metrics: {
      activation: [34, 46],
      retention: [70, 80],
      nps: [12, 26],
      techDebt: [56, 72],
    },
    stakeholders: roster("saas"),
  },
  // --------------------------------------------------------------- consumer
  {
    key: "pacewell",
    industry: "consumer",
    industryLabel: "Consumer",
    name: "Pacewell",
    stage: "Series A",
    description:
      "Running coach in your pocket: adaptive training plans, audio-guided runs and progress tracking, sold as a monthly subscription.",
    ticketPrefix: "PACE",
    caseTitle: "Pacewell: January installs, February churn",
    brief:
      "Pacewell gets a wave of installs every January and loses most of them by February. Growth has experiments ready, the CEO wants features that make headlines, and the partnerships team is chasing corporate deals. The team is small and the sprint is two weeks. Pick the work that keeps new runners running.",
    principle:
      "Capacity is a fact, not a negotiation. Every ticket you add is a ticket you take out, so say which one.",
    activeUsers: [180_000, 290_000],
    mrr: [210_000, 330_000],
    metrics: {
      activation: [36, 48],
      retention: [16, 26],
      nps: [28, 42],
      techDebt: [40, 55],
    },
    stakeholders: roster("consumer", { sales: PARTNERSHIPS }),
  },
  {
    key: "parla",
    industry: "consumer",
    industryLabel: "Consumer",
    name: "Parla",
    stage: "Series B",
    description:
      "Language learning app built around ten-minute speaking sessions, with a free tier and a paid subscription.",
    ticketPrefix: "PRL",
    caseTitle: "Parla: growth at any cost?",
    brief:
      "Parla has two million installs and a retention problem. The board wants growth, the CEO has seen what competitors launched, and partnerships has three companies asking for custom versions. Buried in the backlog are a few tickets that look like housekeeping and are not. Plan the sprint, and be ready to replan it.",
    principle:
      "Tech debt is paid in capacity, and risk is paid all at once. Know which dull tickets buy time and which prevent a disaster.",
    activeUsers: [520_000, 780_000],
    mrr: [690_000, 980_000],
    metrics: {
      activation: [40, 52],
      retention: [12, 20],
      nps: [24, 38],
      techDebt: [54, 68],
    },
    stakeholders: roster("consumer", { sales: PARTNERSHIPS }),
  },
];
