/**
 * Experiments for on-demand A/B test cases. Each one is only wording: the
 * numbers and the trap come from a recipe in `generate.ts`, so any experiment
 * can be paired with any trap.
 */
import type { Company, IndustryKey } from "@/core/case-engine";

export interface ExperimentShell {
  industry: IndustryKey;
  company: Company;
  name: string;
  change: string;
  hypothesis: string;
  /** Who is counted: "visitors", "new workspaces". */
  unit: string;
  primaryMetric: { key: string; label: string; description: string };
  /** A rate over all users that should not go up. */
  guardrail: { key: string; label: string; description: string };
  /** Why the change could make the guardrail worse. */
  guardrailStory: string;
  segmentDimension: string;
  /** Two segment names: the one that converts more, then the other. */
  segments: readonly [string, string];
}

export const experimentShells: readonly ExperimentShell[] = [
  {
    industry: "fintech",
    company: {
      name: "Coinpath",
      industry: "Fintech",
      stage: "Series A",
      description:
        "A savings app that rounds up card payments and moves the change into goals. Revenue comes from a monthly plan with higher interest.",
    },
    name: "Round-up boost",
    change:
      "After each card payment, a prompt offers to double the round-up for that purchase with one tap.",
    hypothesis:
      "Asking at the moment of payment will get more users to move money into a goal.",
    unit: "active users",
    primaryMetric: {
      key: "deposit_rate",
      label: "Daily deposit rate",
      description:
        "Share of active users who move money into a savings goal that day.",
    },
    guardrail: {
      key: "notification_opt_out_rate",
      label: "Notification opt-outs",
      description: "Share of active users who turn off notifications that day.",
    },
    guardrailStory:
      "A prompt after every payment is a lot of prompts, and users who mute the app cannot be reached for anything else.",
    segmentDimension: "User type",
    segments: ["Paid plan", "Free plan"],
  },
  {
    industry: "fintech",
    company: {
      name: "Ledgerline",
      industry: "Fintech",
      stage: "Series B",
      description:
        "Invoicing and payments for freelancers. Clients pay invoices by card or bank transfer from a hosted payment page.",
    },
    name: "Pay-by-link reminders",
    change:
      "Overdue invoices send the client an automatic reminder with a one-tap payment link.",
    hypothesis:
      "A payment link inside the reminder will get more invoices paid without the freelancer chasing.",
    unit: "freelancers with open invoices",
    primaryMetric: {
      key: "invoice_paid_rate",
      label: "Invoices paid",
      description:
        "Share of freelancers with open invoices who get at least one paid that day.",
    },
    guardrail: {
      key: "dispute_rate",
      label: "Payment disputes",
      description:
        "Share of freelancers with open invoices who get a payment disputed.",
    },
    guardrailStory:
      "Clients nudged to pay in one tap sometimes pay the wrong invoice or pay twice, and then dispute the charge.",
    segmentDimension: "Account age",
    segments: ["Over a year", "Under a year"],
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
    name: "Instant quotes",
    change:
      "Job requests show an estimated price range straight away instead of waiting for tradespeople to reply.",
    hypothesis:
      "Seeing a price immediately will get more households to book instead of leaving to compare.",
    unit: "visitors",
    primaryMetric: {
      key: "booking_rate",
      label: "Booking rate",
      description: "Share of visitors who book a job that day.",
    },
    guardrail: {
      key: "price_complaint_rate",
      label: "Price complaints",
      description:
        "Share of visitors who contact support about a price that day.",
    },
    guardrailStory:
      "An estimate reads like a promise, and when the final price lands above it, households complain.",
    segmentDimension: "Platform",
    segments: ["App", "Web"],
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
    name: "Make-an-offer button",
    change:
      "Item pages get a Make an offer button next to Buy now, with three suggested discounts.",
    hypothesis:
      "Buyers who hesitate at the listed price will buy if they can haggle in one tap.",
    unit: "visitors",
    primaryMetric: {
      key: "purchase_rate",
      label: "Purchase rate",
      description: "Share of visitors who buy at least one item that day.",
    },
    guardrail: {
      key: "seller_block_rate",
      label: "Blocked buyers",
      description: "Share of visitors blocked by a seller that day.",
    },
    guardrailStory:
      "Suggested discounts make low offers effortless, and sellers flooded with them block the buyers.",
    segmentDimension: "Platform",
    segments: ["App", "Web"],
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
    name: "Template gallery at sign-up",
    change:
      "New workspaces pick a board template from a gallery before they see an empty board.",
    hypothesis:
      "Starting from a template will get more new workspaces to a first real board on day one.",
    unit: "new workspaces",
    primaryMetric: {
      key: "activation",
      label: "Activation",
      description:
        "Share of new workspaces that create a board with three or more tasks on day one.",
    },
    guardrail: {
      key: "support_ticket_rate",
      label: "Support tickets",
      description:
        "Share of new workspaces that open a support ticket on day one.",
    },
    guardrailStory:
      "Templates come with columns and automations people did not choose, and new teams write in to ask how to remove them.",
    segmentDimension: "Team size",
    segments: ["5 or more people", "Under 5 people"],
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
    name: "Usage-limit banner",
    change:
      "Free accounts see a banner with the contracts they have left this month and an Upgrade button.",
    hypothesis:
      "Showing the limit before people hit it will get more accounts to start a plan.",
    unit: "active free accounts",
    primaryMetric: {
      key: "plan_start_rate",
      label: "Plan starts",
      description: "Share of active free accounts that start a plan that day.",
    },
    guardrail: {
      key: "account_closure_rate",
      label: "Account closures",
      description: "Share of active free accounts closed by their owner.",
    },
    guardrailStory:
      "A countdown on every screen reads as pressure, and some accounts leave rather than upgrade.",
    segmentDimension: "Team size",
    segments: ["Sales teams", "Solo users"],
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
    name: "Cook-tonight feed",
    change:
      "The home feed opens on three recipes picked for tonight, each with a one-tap ingredient box.",
    hypothesis:
      "Fewer, timely choices will get more people to order a box instead of only saving recipes.",
    unit: "daily active users",
    primaryMetric: {
      key: "box_order_rate",
      label: "Box order rate",
      description:
        "Share of daily active users who order an ingredient box that day.",
    },
    guardrail: {
      key: "unfollow_rate",
      label: "Unfollows",
      description:
        "Share of daily active users who unfollow at least one cook that day.",
    },
    guardrailStory:
      "Picked recipes push the cooks people follow down the feed, and some users unfollow to clean it up.",
    segmentDimension: "User type",
    segments: ["Has ordered before", "Never ordered"],
  },
  {
    industry: "consumer",
    company: {
      name: "Rally",
      industry: "Consumer",
      stage: "Series C",
      description:
        "A social running app: training plans, group runs and challenges with friends.",
    },
    name: "Weekly challenge invite",
    change:
      "Every Monday the app invites users to a seven-day distance challenge against two friends.",
    hypothesis: "A small weekly competition will get more people to log a run.",
    unit: "daily active users",
    primaryMetric: {
      key: "run_log_rate",
      label: "Runs logged",
      description: "Share of daily active users who log a run that day.",
    },
    guardrail: {
      key: "push_opt_out_rate",
      label: "Push opt-outs",
      description:
        "Share of daily active users who turn off push notifications.",
    },
    guardrailStory:
      "Challenge updates arrive several times a day, and every user who turns push off is one you can no longer reach.",
    segmentDimension: "User type",
    segments: ["Has a training plan", "No training plan"],
  },
];
