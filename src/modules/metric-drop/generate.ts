/**
 * On-demand Metric Drop cases: a product of the chosen industry and one of
 * five root cause archetypes, with the segment, the dates and the red
 * herrings drawn from the seed. `buildMetricDropCase` then measures the drop
 * and rejects any case whose headline metric barely moves.
 */
import type { Difficulty, GenerateParams } from "@/core/case-engine";
import { createRng, type Rng } from "@/core/rng";

import { buildMetricDropCase } from "./build-case";
import type { MetricDropCaseSpec } from "./content/cases";
import { dropProducts, type DropProduct } from "./content/products";
import type { MetricDropCase } from "./schema";

type Hidden = MetricDropCase["hidden"];
type FalseLead = Hidden["falseLeads"][number];
type Annotation = MetricDropCase["annotations"][number];

const COUNTRY_NAME = {
  US: "the US",
  GB: "the UK",
  DE: "Germany",
  BR: "Brazil",
  IN: "India",
} as const;
type Country = keyof typeof COUNTRY_NAME;

const CHANNEL_NAME = {
  paid_social: "paid social",
  paid_search: "paid search",
} as const;

const PLATFORM_NAME = { ios: "iOS", android: "Android" } as const;
type MobilePlatform = keyof typeof PLATFORM_NAME;

interface Context {
  product: DropProduct;
  rng: Rng;
  difficulty: Difficulty;
  previous: string;
  next: string;
  /** How many red herrings the difficulty asks for. */
  leadCount: 1 | 2;
  /** Days until the root cause reaches its full effect. */
  ramp: number;
}

type Archetype = (
  context: Context,
) => Pick<
  MetricDropCaseSpec,
  | "title"
  | "briefTemplate"
  | "headlineMetric"
  | "annotations"
  | "actionOptions"
  | "hidden"
> & { releaseDay: number };

function releaseNote(day: number, version: string): Annotation {
  return {
    day,
    kind: "release",
    label: `Mobile app ${version} released (iOS and Android)`,
  };
}

/** A short holiday that moves one country a little; never the real cause. */
function holidayLead(
  country: Country,
  day: number,
  target: "signups" | "returning",
): { lead: FalseLead; annotation: Annotation } {
  return {
    annotation: {
      day,
      kind: "holiday",
      label: `Public holiday in ${COUNTRY_NAME[country]}`,
    },
    lead: {
      segment: { dimension: "country", value: country },
      category: "seasonality",
      anomalies: [
        {
          segment: { country },
          target,
          multiplier: 0.85,
          startDay: day,
          rampDays: 1,
          endDay: day + 1,
        },
      ],
      explanation: `The holiday in ${COUNTRY_NAME[country]} lowers activity there for two days: a small, short dip that recovers on its own.`,
    },
  };
}

/** A release that shipped the same week and changed nothing. */
function innocentRelease(
  context: Context,
  platform: MobilePlatform,
): FalseLead {
  return {
    segment: {
      dimension: "appVersion",
      value: `${platform}-${context.next}`,
    },
    category: "bug",
    anomalies: [],
    explanation: `${context.next} shipped the same week, which makes it a tempting suspect, but its users behave like users on ${context.previous}, and the web, which had no release, moved the same way.`,
  };
}

const releaseBug: Archetype = (context) => {
  const { product, rng, next, previous } = context;
  const platform = rng.pick(["ios", "android"] as const);
  const channel = rng.pick(["paid_social", "paid_search"] as const);
  const holiday = holidayLead(
    rng.pick(["GB", "DE", "BR", "IN"] as const),
    69,
    "signups",
  );
  const name = PLATFORM_NAME[platform];
  const leads: FalseLead[] = [
    {
      segment: { dimension: "channel", value: channel },
      category: "marketing",
      anomalies: [
        {
          segment: { channel, userType: "new" },
          target: "activation",
          multiplier: 0.9,
          startDay: 66,
          rampDays: 2,
        },
      ],
      explanation: `The new ${CHANNEL_NAME[channel]} campaign brings slightly less motivated users, but their activation dips by a few points on every platform. It cannot explain a drop concentrated in one app version.`,
    },
    holiday.lead,
  ];
  return {
    releaseDay: 67,
    title: `${product.company.name}: fewer new users get started`,
    briefTemplate: `Activation, the share of new users who ${product.milestone} on day one, fell {change} in the last 7 days compared with the week before. Growth reviews it every Monday and wants an answer before then. Find where the drop comes from and what to do about it.`,
    headlineMetric: "activation",
    annotations: [
      {
        day: 66,
        kind: "campaign",
        label: `New ${CHANNEL_NAME[channel]} campaign starts`,
      },
      releaseNote(67, next),
      ...(context.leadCount === 2 ? [holiday.annotation] : []),
    ],
    actionOptions: [
      {
        id: "halt-rollout",
        label: `Halt the ${name} ${next} rollout and ship a hotfix for onboarding`,
      },
      {
        id: "pause-campaign",
        label: `Pause the ${CHANNEL_NAME[channel]} campaign until activation recovers`,
      },
      {
        id: "redesign-onboarding",
        label: "Start a redesign of the onboarding flow on every platform",
      },
      {
        id: "monitor",
        label: "Wait another week to see whether activation recovers",
      },
    ],
    hidden: {
      rootCause: {
        category: "bug",
        segment: { dimension: "appVersion", value: `${platform}-${next}` },
        anomalies: [
          {
            segment: { appVersion: `${platform}-${next}`, userType: "new" },
            target: "activation",
            multiplier: 0.3,
            startDay: 67,
            rampDays: 1,
          },
        ],
        summary: `${name} ${next} breaks the step where new users ${product.milestone}.`,
        explanation: `Activation collapsed only for new users on ${name} ${next}, from the day it shipped. The other platform on ${next}, users still on ${previous} and the web are flat, so the change is in that build, not in who is signing up.`,
        idealAction: `Halt the ${name} ${next} rollout, ship a hotfix for onboarding, and check crash reports for that step.`,
        idealActionId: "halt-rollout",
        partialActionIds: [],
        idealPath: [
          "Confirm the drop in activation over time",
          `Break down by platform: only ${name} drops`,
          `Break down by app version: only ${name} ${next}, starting on release day`,
          `Rule out the ${CHANNEL_NAME[channel]} campaign: its users activate a little less, but only by a few points`,
        ],
      },
      falseLeads: leads.slice(0, context.leadCount),
    },
  };
};

const campaignEnded: Archetype = (context) => {
  const { product, rng, next, ramp } = context;
  const channel = rng.pick(["paid_social", "paid_search"] as const);
  const platform = rng.pick(["ios", "android"] as const);
  const holiday = holidayLead(
    rng.pick(["GB", "DE", "BR", "IN"] as const),
    69,
    "signups",
  );
  const channelName = CHANNEL_NAME[channel];
  return {
    releaseDay: 67,
    title: `${product.company.name}: where did the signups go?`,
    briefTemplate: `New signups fell {change} in the last 7 days compared with the week before. Engineering shipped a new app version the same week, and the CEO is convinced it broke signup. Work out what actually happened before anyone starts a rollback.`,
    headlineMetric: "signups",
    annotations: [
      releaseNote(67, next),
      {
        day: 67,
        kind: "campaign",
        label: `The quarter's ${channelName} flight ends`,
      },
      ...(context.leadCount === 2 ? [holiday.annotation] : []),
    ],
    actionOptions: [
      { id: "rollback-release", label: `Roll back app version ${next}` },
      {
        id: "decide-channel",
        label: `Keep ${next}; agree with marketing on restarting or replacing ${channelName}`,
      },
      { id: "reset-target", label: "Lower the signup target for the quarter" },
      { id: "fix-signup", label: "Open an incident on the signup flow" },
    ],
    hidden: {
      rootCause: {
        category: "marketing",
        segment: { dimension: "channel", value: channel },
        anomalies: [
          {
            segment: { channel },
            target: "signups",
            multiplier: 0.15,
            startDay: 67,
            rampDays: ramp,
          },
        ],
        summary: `The ${channelName} campaign ended and nothing replaced it, so signups from that channel fell by about 85%.`,
        explanation: `The drop is entirely in ${channelName}, on every platform and in every country, including the web, which did not get a release. The ${next} release is a coincidence of timing.`,
        idealAction: `Do not roll back ${next}. Agree with marketing whether to restart or replace the ${channelName} budget, and reset the signup target to the baseline without it.`,
        idealActionId: "decide-channel",
        partialActionIds: ["reset-target"],
        idealPath: [
          "Confirm the drop in signups",
          `Break down by channel: ${channelName} collapses, other channels are flat`,
          "Check the web: it fell too, so the mobile release is not the cause",
          "Check each country: the drop is the same everywhere",
        ],
      },
      falseLeads: [innocentRelease(context, platform), holiday.lead].slice(
        0,
        context.leadCount,
      ),
    },
  };
};

const paymentsOutage: Archetype = (context) => {
  const { product, rng, next } = context;
  const country = rng.pick(["BR", "IN", "DE", "GB"] as const);
  const other = rng.pick(
    (["BR", "IN", "DE", "GB"] as const).filter((c) => c !== country),
  );
  const holiday = holidayLead(other, 70, "returning");
  const place = COUNTRY_NAME[country];
  const leads: FalseLead[] = [
    {
      segment: { dimension: "platform", value: "web" },
      category: "product",
      anomalies: [
        {
          segment: { platform: "web" },
          target: "conversion",
          multiplier: 0.96,
          startDay: 66,
          rampDays: 1,
        },
      ],
      explanation:
        "The checkout copy experiment lowers web conversion by a few percent, which is worth watching but far too small to explain the overall drop.",
    },
    {
      ...holiday.lead,
      explanation: `${holiday.lead.explanation} It moves usage, not the share of users who ${product.purchase}.`,
    },
  ];
  return {
    releaseDay: 60,
    title: `${product.company.name}: ${product.purchases} are down`,
    briefTemplate: `Conversion, the share of daily active users who ${product.purchase}, fell {change} in the last 7 days compared with the week before. Revenue is behind plan for the quarter and finance wants to know if this is temporary. Find the cause, and say how sure you are.`,
    headlineMetric: "conversion",
    annotations: [
      releaseNote(60, next),
      {
        day: 66,
        kind: "experiment",
        label: "Web checkout copy test starts (50/50)",
      },
      ...(context.leadCount === 2 ? [holiday.annotation] : []),
    ],
    actionOptions: [
      {
        id: "escalate-provider",
        label: `Escalate to the payment provider in ${place} and add a fallback payment method`,
      },
      { id: "stop-experiment", label: "Stop the web checkout copy experiment" },
      {
        id: "discount-country",
        label: `Launch a discount for users in ${place}`,
      },
      { id: "wait", label: "Wait a week for conversion to recover by itself" },
    ],
    hidden: {
      rootCause: {
        category: "external",
        segment: { dimension: "country", value: country },
        anomalies: [
          {
            segment: { country },
            target: "conversion",
            multiplier: 0.2,
            startDay: 68,
            rampDays: 1,
          },
        ],
        summary: `The local payment provider in ${place} is failing most transactions.`,
        explanation: `Conversion collapsed in ${place} on every platform and app version at once, overnight, while usage there stayed normal. People still try to ${product.purchase}; their payments fail. Nothing in the product changed that day.`,
        idealAction: `Escalate to the payment provider, add a fallback payment method for ${place}, and tell affected users that they were not charged.`,
        idealActionId: "escalate-provider",
        partialActionIds: [],
        idealPath: [
          "Confirm the drop in conversion",
          `Break down by country: ${place} collapses, other countries are flat`,
          `Within ${place}, break down by platform: every platform drops together`,
          `Check DAU in ${place}: usage is normal, so demand is not the issue`,
        ],
      },
      falseLeads: leads.slice(0, context.leadCount),
    },
  };
};

const webCheckout: Archetype = (context) => {
  const { product, rng, next } = context;
  const platform = rng.pick(["ios", "android"] as const);
  const leads: FalseLead[] = [
    {
      segment: { dimension: "channel", value: "paid_search" },
      category: "marketing",
      anomalies: [
        {
          segment: { channel: "paid_search" },
          target: "signups",
          multiplier: 0.55,
          startDay: 68,
          rampDays: 2,
        },
      ],
      explanation: `Halving paid search brings fewer new users, which lowers traffic, not the share of users who ${product.purchase}.`,
    },
    innocentRelease(context, platform),
  ];
  return {
    releaseDay: context.leadCount === 2 ? 66 : 62,
    title: `${product.company.name}: ${product.purchases} are slipping`,
    briefTemplate: `Conversion, the share of daily active users who ${product.purchase}, fell {change} in the last 7 days compared with the week before. The design team shipped a redesigned web checkout the same week and says users love it. Find out what is going on.`,
    headlineMetric: "conversion",
    annotations: [
      releaseNote(context.leadCount === 2 ? 66 : 62, next),
      {
        day: 67,
        kind: "experiment",
        label: "New web checkout rolled out to 100%",
      },
      { day: 68, kind: "campaign", label: "Paid search budget cut by half" },
    ],
    actionOptions: [
      {
        id: "rollback-checkout",
        label: "Roll back the web checkout, then A/B test the redesign",
      },
      { id: "restore-search", label: "Restore the paid search budget" },
      {
        id: "fix-forward",
        label: "Keep the new checkout and polish it over the next sprints",
      },
      { id: "rollback-app", label: `Roll back app version ${next}` },
    ],
    hidden: {
      rootCause: {
        category: "product",
        segment: { dimension: "platform", value: "web" },
        anomalies: [
          {
            segment: { platform: "web" },
            target: "conversion",
            multiplier: 0.4,
            startDay: 67,
            rampDays: 1,
          },
        ],
        summary:
          "The redesigned web checkout converts far worse than the old one.",
        explanation:
          "Conversion fell only on the web, in every country and channel, from the day the new checkout reached all users. The apps, which kept the old checkout, convert as before.",
        idealAction:
          "Roll the web checkout back to the old version, then reintroduce the redesign as an A/B test with conversion as the primary metric.",
        idealActionId: "rollback-checkout",
        partialActionIds: ["fix-forward"],
        idealPath: [
          "Confirm the drop in conversion",
          "Break down by platform: only the web drops",
          "Check that the web drop is the same in every country and channel",
          "Rule out the paid search cut: it lowers signups, not the conversion rate",
        ],
      },
      falseLeads: leads.slice(0, context.leadCount),
    },
  };
};

const holidaySlump: Archetype = (context) => {
  const { product, rng, next, previous } = context;
  const country = rng.pick(["US", "IN"] as const);
  const platform = rng.pick(["ios", "android"] as const);
  const place = COUNTRY_NAME[country];
  const leads: FalseLead[] = [
    innocentRelease(context, platform),
    {
      segment: { dimension: "channel", value: "paid_social" },
      category: "marketing",
      anomalies: [
        {
          segment: { channel: "paid_social", userType: "new" },
          target: "signups",
          multiplier: 0.8,
          startDay: 69,
          rampDays: 2,
        },
      ],
      explanation:
        "Trimming paid social costs a few hundred signups a day, a small slice of daily active users.",
    },
  ];
  return {
    releaseDay: 68,
    title: `${product.company.name}: the holiday-week slump`,
    briefTemplate: `Daily active users fell {change} in the last 7 days compared with the week before. A new app version shipped the same week, and the board meeting is on Monday. The CEO wants to know whether to roll back. Find the cause, and recommend what to do.`,
    headlineMetric: "dau",
    annotations: [
      releaseNote(68, next),
      ...(context.leadCount === 2
        ? [
            {
              day: 69,
              kind: "campaign" as const,
              label: "Paid social budget trimmed by 20%",
            },
          ]
        : []),
      {
        day: 70,
        kind: "holiday",
        label: `National holiday week in ${place}`,
      },
    ],
    actionOptions: [
      { id: "rollback-release", label: `Roll back app version ${next}` },
      {
        id: "annotate-seasonality",
        label: `Keep ${next}; compare with last year and add the holiday to the forecast`,
      },
      { id: "restore-social", label: "Raise the paid social budget" },
      {
        id: "push-campaign",
        label: `Send a push campaign to users in ${place} this week`,
      },
    ],
    hidden: {
      rootCause: {
        category: "seasonality",
        segment: { dimension: "country", value: country },
        anomalies: [
          {
            segment: { country, userType: "returning" },
            target: "returning",
            multiplier: country === "US" ? 0.62 : 0.45,
            startDay: 68,
            rampDays: 3,
          },
          {
            segment: { country, userType: "new" },
            target: "signups",
            multiplier: 0.7,
            startDay: 68,
            rampDays: 3,
          },
        ],
        summary: `A national holiday week in ${place}: fewer people there use the product, as every year.`,
        explanation: `The drop is in ${place} only, on every platform and app version including the web, and it builds up around the holiday. Users on ${next} are as active as users on ${previous}.`,
        idealAction: `Do not roll back ${next}. Compare with the same week last year, add the holiday to the forecast, and check that activity in ${place} recovers the following week.`,
        idealActionId: "annotate-seasonality",
        partialActionIds: [],
        idealPath: [
          "Confirm the drop in DAU",
          `Break down by country: ${place} accounts for nearly all of it`,
          `Break down by app version within ${place}: ${next} and ${previous} move together`,
          `Check the web in ${place}: it drops too, so the release is not the cause`,
        ],
      },
      falseLeads: leads.slice(0, context.leadCount),
    },
  };
};

const ARCHETYPES: readonly Archetype[] = [
  releaseBug,
  campaignEnded,
  paymentsOutage,
  webCheckout,
  holidaySlump,
];

export function generateMetricDropOnDemand(
  params: GenerateParams & { caseId: string },
): MetricDropCase {
  const rng = createRng(params.seed);
  const pool = dropProducts.filter((p) => p.industry === params.industry);
  if (pool.length === 0) {
    throw new Error(`No Metric Drop product for "${params.industry}"`);
  }
  const product = rng.fork("product").pick(pool);
  const versions = rng.fork("version");
  const major = versions.int(2, 9);
  const minor = versions.int(1, 18);
  const context: Context = {
    product,
    rng: rng.fork("archetype-details"),
    difficulty: params.difficulty,
    previous: `${major}.${minor}.${versions.int(0, 4)}`,
    next: `${major}.${minor + 1}.0`,
    leadCount: params.difficulty === "apm" ? 1 : 2,
    ramp: params.difficulty === "senior" ? 3 : 2,
  };
  const { releaseDay, title, ...parts } = rng
    .fork("archetype")
    .pick(ARCHETYPES)(context);
  const jitter = rng.fork("scale");
  return buildMetricDropCase({
    ...parts,
    id: params.caseId,
    moduleId: "metric-drop",
    seed: params.seed,
    difficulty: params.difficulty,
    company: product.company,
    title: `${title} (case #${params.seed})`,
    startDate: "2026-06-01",
    days: 75,
    release: {
      previous: context.previous,
      next: context.next,
      day: releaseDay,
    },
    scale: {
      signups: Math.round(product.scale.signups * jitter.float(0.85, 1.15)),
      returning: Math.round(product.scale.returning * jitter.float(0.85, 1.15)),
    },
    rates: product.rates,
  });
}
