/**
 * Products for on-demand Metric Drop cases. The wording slots let one root
 * cause archetype read naturally in any industry.
 */
import type { Company, IndustryKey } from "@/core/case-engine";

export interface DropProduct {
  industry: IndustryKey;
  company: Company;
  /** What a new user does to count as activated: "finish a first lesson". */
  milestone: string;
  /** What a paying user does: "upgrade to the paid plan". */
  purchase: string;
  /** Plural noun for those purchases: "upgrades". */
  purchases: string;
  /** Typical signups and returning users per day. */
  scale: { signups: number; returning: number };
  rates: { activation: number; sessionsPerUser: number; conversion: number };
}

export const dropProducts: readonly DropProduct[] = [
  {
    industry: "fintech",
    company: {
      name: "Pennywise",
      industry: "Fintech",
      stage: "Series A",
      description:
        "A budgeting app that links to bank accounts and sorts spending into envelopes. A paid plan adds shared budgets and savings goals.",
    },
    milestone: "link a bank account",
    purchase: "upgrade to the paid plan",
    purchases: "upgrades",
    scale: { signups: 5200, returning: 76000 },
    rates: { activation: 0.4, sessionsPerUser: 1.7, conversion: 0.011 },
  },
  {
    industry: "fintech",
    company: {
      name: "Sendwell",
      industry: "Fintech",
      stage: "Series B",
      description:
        "International money transfers from the phone or the web, with local payout methods in each country.",
    },
    milestone: "send a first transfer",
    purchase: "send a transfer",
    purchases: "transfers",
    scale: { signups: 7400, returning: 118000 },
    rates: { activation: 0.33, sessionsPerUser: 1.5, conversion: 0.041 },
  },
  {
    industry: "marketplace",
    company: {
      name: "Loop & Thread",
      industry: "Marketplace",
      stage: "Series A",
      description:
        "A marketplace for second-hand clothes. Buyers browse on the web and in the app; sellers list from their phone.",
    },
    milestone: "save a first item",
    purchase: "buy an item",
    purchases: "orders",
    scale: { signups: 6100, returning: 94000 },
    rates: { activation: 0.46, sessionsPerUser: 2.4, conversion: 0.026 },
  },
  {
    industry: "marketplace",
    company: {
      name: "Fixly",
      industry: "Marketplace",
      stage: "Seed",
      description:
        "A marketplace that matches households with vetted tradespeople for small repairs, booked and paid in the app or on the web.",
    },
    milestone: "request a first quote",
    purchase: "book a job",
    purchases: "bookings",
    scale: { signups: 2400, returning: 31000 },
    rates: { activation: 0.37, sessionsPerUser: 1.6, conversion: 0.032 },
  },
  {
    industry: "saas",
    company: {
      name: "Docketly",
      industry: "SaaS B2B",
      stage: "Series A",
      description:
        "Shared task boards for small agencies, on the web and mobile. Teams start on a free plan and pay per seat for automations.",
    },
    milestone: "create a first board",
    purchase: "start a paid seat",
    purchases: "paid seats",
    scale: { signups: 1900, returning: 47000 },
    rates: { activation: 0.52, sessionsPerUser: 3.1, conversion: 0.008 },
  },
  {
    industry: "saas",
    company: {
      name: "Quillmark",
      industry: "SaaS B2B",
      stage: "Series B",
      description:
        "E-signature and contract tracking for sales teams. Anyone can sign for free; sending more than three contracts a month needs a plan.",
    },
    milestone: "send a first contract",
    purchase: "start a plan",
    purchases: "plan starts",
    scale: { signups: 3300, returning: 58000 },
    rates: { activation: 0.44, sessionsPerUser: 2.2, conversion: 0.014 },
  },
  {
    industry: "consumer",
    company: {
      name: "Stillwater",
      industry: "Consumer",
      stage: "Series A",
      description:
        "A guided meditation app with a free daily session and a subscription for the full library.",
    },
    milestone: "finish a first session",
    purchase: "subscribe",
    purchases: "subscriptions",
    scale: { signups: 8800, returning: 132000 },
    rates: { activation: 0.49, sessionsPerUser: 1.4, conversion: 0.007 },
  },
  {
    industry: "consumer",
    company: {
      name: "Potluck",
      industry: "Consumer",
      stage: "Series B",
      description:
        "A social cooking app: follow home cooks, save recipes and buy ingredient boxes for the dishes you like.",
    },
    milestone: "save a first recipe",
    purchase: "order an ingredient box",
    purchases: "box orders",
    scale: { signups: 10400, returning: 165000 },
    rates: { activation: 0.41, sessionsPerUser: 2.0, conversion: 0.018 },
  },
];
