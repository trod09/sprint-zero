/**
 * The pregenerated Feedback Triage cases: product, the six themes in its
 * inbox and its own critical problem. `npm run generate:feedback-triage`
 * turns them into `cases/<id>.json`.
 */
import type { Company, Difficulty } from "@/core/case-engine";

import type { Source } from "../schema";
import type { ThemeKey } from "./themes";

export interface ProductSlots {
  product: string;
  item: string;
  items: string;
  coreAction: string;
  plan: string;
  feature: string;
}

export interface TriageCaseSpec {
  id: string;
  seed: number;
  difficulty: Difficulty;
  company: Company;
  title: string;
  slots: ProductSlots;
  /** Last day of the 30-day inbox. */
  periodEnd: string;
  themes: readonly ThemeKey[];
  critical: {
    key: string;
    label: string;
    summary: string;
    opportunity: string;
    /** Where people report it most. */
    source: Source;
    texts: readonly string[];
  };
}

export const triageCaseSpecs: readonly TriageCaseSpec[] = [
  {
    id: "feedback-triage-trailhead",
    seed: 4101,
    difficulty: "apm",
    company: {
      name: "Trailhead",
      industry: "Consumer",
      stage: "Series A",
      description:
        "A hiking app: plan routes, record hikes with GPS and keep a history of every trail. Trailhead Plus adds offline maps and 3D views.",
    },
    title: "Trailhead: a month of feedback",
    slots: {
      product: "Trailhead",
      item: "route",
      items: "routes",
      coreAction: "record a hike",
      plan: "Trailhead Plus",
      feature: "offline maps for Europe",
    },
    periodEnd: "2026-10-31",
    themes: [
      "performance",
      "pricing",
      "feature_request",
      "notifications",
      "crashes",
      "onboarding",
    ],
    critical: {
      key: "lost_hikes",
      label: "Recorded hikes disappear",
      summary:
        "A sync change in the latest release overwrites local history with an empty server copy. People lose years of recorded hikes, and it gets worse every day the release stays live.",
      opportunity:
        "How might we guarantee that a recorded hike is never lost, starting with stopping the sync bug and restoring the deleted history?",
      source: "support",
      texts: [
        "All my recorded hikes from the last two years are gone after the update.",
        "I synced my phone and my hike history is empty. Years of data.",
        "The update wiped my saved routes. Support says they can't recover them.",
        "Recorded a 20 km hike, saved it, and it vanished from my history.",
        "History shows 0 hikes after I logged in on my new phone.",
      ],
    },
  },
  {
    id: "feedback-triage-coinpath",
    seed: 4102,
    difficulty: "pm",
    company: {
      name: "Coinpath",
      industry: "Fintech",
      stage: "Series B",
      description:
        "A budgeting app with a debit card. Every card payment shows up instantly and is sorted into budgets. Coinpath Premium adds savings goals and cashback.",
    },
    title: "Coinpath: a month of feedback",
    slots: {
      product: "Coinpath",
      item: "transaction",
      items: "transactions",
      coreAction: "check my balance",
      plan: "Coinpath Premium",
      feature: "shared budgets with a partner",
    },
    periodEnd: "2026-10-31",
    themes: [
      "pricing",
      "login",
      "feature_request",
      "support",
      "upsell",
      "performance",
    ],
    critical: {
      key: "double_charges",
      label: "Card payments are charged twice",
      summary:
        "A retry in the card processor duplicates some payments, and the money really leaves the account. It is a regulatory and trust incident: people cannot pay rent with money they do not have.",
      opportunity:
        "How might we stop duplicate charges today, refund every affected customer automatically and tell them before they notice?",
      source: "support",
      texts: [
        "I was charged twice for the same coffee and the app shows both.",
        "My card payment went through twice at the supermarket, $86 each. That's rent money.",
        "My balance is $240 lower than it should be: duplicate transactions from yesterday.",
        "Every card payment this week appears twice and the money is actually gone.",
        "Duplicate charge on my subscription renewal, and nobody answers.",
      ],
    },
  },
  {
    id: "feedback-triage-taskhive",
    seed: 4103,
    difficulty: "pm",
    company: {
      name: "Taskhive",
      industry: "SaaS B2B",
      stage: "Series B",
      description:
        "Project management for agencies: tasks, timelines and client portals. Agencies pay per seat on the Business plan.",
    },
    title: "Taskhive: a month of feedback",
    slots: {
      product: "Taskhive",
      item: "task",
      items: "tasks",
      coreAction: "assign a task",
      plan: "Business",
      feature: "a Gantt view",
    },
    periodEnd: "2026-10-31",
    themes: [
      "feature_request",
      "performance",
      "onboarding",
      "notifications",
      "login",
      "support",
    ],
    critical: {
      key: "data_leak",
      label: "Customers see other companies' data",
      summary:
        "A caching change serves some workspaces data from other workspaces. It is a data breach: confidential client work is exposed, with legal and contractual consequences.",
      opportunity:
        "How might we make it impossible for one workspace to see another's data, starting with turning off the cache and telling affected customers?",
      source: "support",
      texts: [
        "I'm seeing tasks from a company I've never heard of in my dashboard.",
        "Search returned documents from another workspace. Is our data visible to others too?",
        "A client's confidential project showed up in our activity feed. It's not ours.",
        "I opened a shared link and landed in someone else's workspace with full access.",
      ],
    },
  },
  {
    id: "feedback-triage-forkful",
    seed: 4104,
    difficulty: "senior",
    company: {
      name: "Forkful",
      industry: "Marketplace",
      stage: "Series C",
      description:
        "A food delivery marketplace with 6,000 restaurants. Menus come from restaurants; Forkful adds dietary and allergen filters on top. Forkful Pass gives free delivery.",
    },
    title: "Forkful: a month of feedback",
    slots: {
      product: "Forkful",
      item: "order",
      items: "orders",
      coreAction: "place an order",
      plan: "Forkful Pass",
      feature: "scheduled weekly orders",
    },
    periodEnd: "2026-10-31",
    themes: [
      "pricing",
      "upsell",
      "crashes",
      "support",
      "notifications",
      "feature_request",
    ],
    critical: {
      key: "allergen_filter",
      label: "Allergen filters show unsafe dishes",
      summary:
        "Since a menu import change, allergen tags are dropped for some restaurants and the filters treat untagged dishes as safe. People with allergies are being served food that can put them in hospital.",
      opportunity:
        "How might we make sure an allergen filter never shows a dish we cannot vouch for, starting with hiding untagged dishes from filtered results today?",
      source: "support",
      texts: [
        "I filtered for nut-free and got a dish with peanuts. My son had a reaction.",
        "The allergen tags disappeared from restaurant menus this week.",
        "The gluten-free filter shows dishes that clearly contain wheat.",
        "Ordered 'dairy-free' based on your label, the restaurant says it was never dairy-free.",
      ],
    },
  },
  {
    id: "feedback-triage-shiftly",
    seed: 4105,
    difficulty: "senior",
    company: {
      name: "Shiftly",
      industry: "SaaS B2B",
      stage: "Series A",
      description:
        "Staff scheduling for shops and restaurants: managers build rotas, staff clock in on their phones, and Shiftly exports hours to payroll. Shops pay for the Pro plan.",
    },
    title: "Shiftly: a month of feedback",
    slots: {
      product: "Shiftly",
      item: "shift",
      items: "shifts",
      coreAction: "publish the schedule",
      plan: "Pro",
      feature: "time-off requests",
    },
    periodEnd: "2026-10-31",
    themes: [
      "feature_request",
      "notifications",
      "login",
      "onboarding",
      "pricing",
      "crashes",
    ],
    critical: {
      key: "payroll_export",
      label: "Payroll export loses hours",
      summary:
        "Since the last release the payroll export drops overtime and split shifts. Staff are underpaid, which is a legal problem for every shop that pays from it.",
      opportunity:
        "How might we make sure every hour worked reaches payroll, starting with fixing the export and recalculating the affected pay periods?",
      source: "support",
      texts: [
        "The payroll export shows half the hours my staff worked. People got underpaid.",
        "Overtime is missing from the export since the last update.",
        "Hours in the timesheet don't match the export we send to payroll.",
        "Two employees were paid for the wrong week because of the export.",
      ],
    },
  },
];
