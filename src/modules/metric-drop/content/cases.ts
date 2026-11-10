/**
 * The hand-written Metric Drop cases. Each one is a specification: the seeded
 * generator turns it into daily data, and `npm run generate:metric-drop`
 * fills the measured size of the drop into the brief (`{change}`).
 *
 * Every case has 75 days. The last 7 days (68-74) are compared with the 7
 * before (61-67), so root causes start on day 67 or 68.
 */
import type { MetricDropCase } from "../schema";

export type MetricDropCaseSpec = Omit<MetricDropCase, "brief"> & {
  /** Brief with a `{change}` placeholder for the measured drop, e.g. "18%". */
  briefTemplate: string;
};

export const metricDropCaseSpecs: readonly MetricDropCaseSpec[] = [
  {
    id: "metric-drop-android-onboarding",
    moduleId: "metric-drop",
    seed: 2101,
    difficulty: "apm",
    company: {
      name: "Brightpath",
      industry: "Edtech",
      stage: "Series A",
      description:
        "Bite-sized courses for professionals, on iOS, Android and the web. New users pick a goal during onboarding and finish a first lesson.",
    },
    title: "Brightpath: fewer new users get started",
    briefTemplate:
      "Activation, the share of new users who finish their first lesson on day one, fell {change} in the last 7 days compared with the week before. Growth reviews it every Monday, and the head of growth wants an answer before then. Find where the drop comes from and what to do about it.",
    startDate: "2026-06-01",
    days: 75,
    headlineMetric: "activation",
    release: { previous: "4.1.3", next: "4.2.0", day: 67 },
    scale: { signups: 4200, returning: 52000 },
    rates: { activation: 0.42, sessionsPerUser: 2.1, conversion: 0.012 },
    annotations: [
      {
        day: 66,
        kind: "campaign",
        label: "Paid social campaign 'Learn in 10' starts",
      },
      {
        day: 67,
        kind: "release",
        label: "Mobile app 4.2.0 released (iOS and Android)",
      },
    ],
    actionOptions: [
      {
        id: "halt-rollout",
        label:
          "Halt the Android 4.2.0 rollout and ship a hotfix for onboarding",
      },
      {
        id: "pause-campaign",
        label: "Pause the paid social campaign until activation recovers",
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
        segment: { dimension: "appVersion", value: "android-4.2.0" },
        anomalies: [
          {
            segment: { appVersion: "android-4.2.0", userType: "new" },
            target: "activation",
            multiplier: 0.3,
            startDay: 67,
            rampDays: 1,
          },
        ],
        summary:
          "Android 4.2.0 crashes on the goal-picker screen during onboarding.",
        explanation:
          "Activation collapsed only for new users on Android 4.2.0, from the day it shipped. iOS 4.2.0, older Android versions and the web are flat, so the change is in that build, not in who is signing up.",
        idealAction:
          "Halt the Android 4.2.0 rollout, ship a hotfix for the onboarding crash, and check crash reports for that screen.",
        idealActionId: "halt-rollout",
        partialActionIds: [],
        idealPath: [
          "Confirm the drop in activation over time",
          "Break down by platform: only Android drops",
          "Break down by app version: only Android 4.2.0, starting on release day",
          "Rule out the paid social campaign: its users activate a little less, but only by a few points",
        ],
      },
      falseLeads: [
        {
          segment: { dimension: "channel", value: "paid_social" },
          category: "marketing",
          anomalies: [
            {
              segment: { channel: "paid_social", userType: "new" },
              target: "activation",
              multiplier: 0.9,
              startDay: 66,
              rampDays: 2,
            },
          ],
          explanation:
            "The new paid social campaign brings slightly less motivated users, but their activation dips by a few points on every platform. It cannot explain a drop concentrated in one app version.",
        },
      ],
    },
  },
  {
    id: "metric-drop-campaign-ended",
    moduleId: "metric-drop",
    seed: 2102,
    difficulty: "pm",
    company: {
      name: "Simmer",
      industry: "Consumer",
      stage: "Series B",
      description:
        "A recipe and meal-planning app with a free tier and a paid plan. Most new users come from organic search and paid social.",
    },
    title: "Simmer: where did the signups go?",
    briefTemplate:
      "New signups fell {change} in the last 7 days compared with the week before. Engineering shipped a new app version the same week, and the CEO is convinced it broke signup. Work out what actually happened before anyone starts a rollback.",
    startDate: "2026-06-01",
    days: 75,
    headlineMetric: "signups",
    release: { previous: "6.3.1", next: "6.4.0", day: 67 },
    scale: { signups: 9800, returning: 140000 },
    rates: { activation: 0.38, sessionsPerUser: 1.8, conversion: 0.009 },
    annotations: [
      {
        day: 67,
        kind: "release",
        label: "Mobile app 6.4.0 released (iOS and Android)",
      },
      {
        day: 67,
        kind: "campaign",
        label: "Paid social 'Summer Kitchen' flight ends",
      },
      { day: 69, kind: "holiday", label: "Public holiday in India" },
    ],
    actionOptions: [
      { id: "rollback-release", label: "Roll back app version 6.4.0" },
      {
        id: "decide-paid-social",
        label:
          "Keep 6.4.0; agree with marketing on restarting or replacing paid social",
      },
      { id: "reset-target", label: "Lower the signup target for the quarter" },
      { id: "fix-signup", label: "Open an incident on the signup flow" },
    ],
    hidden: {
      rootCause: {
        category: "marketing",
        segment: { dimension: "channel", value: "paid_social" },
        anomalies: [
          {
            segment: { channel: "paid_social" },
            target: "signups",
            multiplier: 0.15,
            startDay: 67,
            rampDays: 2,
          },
        ],
        summary:
          "The paid social campaign ended and nothing replaced it, so paid social signups fell by about 85%.",
        explanation:
          "The drop is entirely in the paid social channel, on every platform and in every country, including the web, which did not get a release. The 6.4.0 release is a coincidence of timing.",
        idealAction:
          "Do not roll back 6.4.0. Agree with marketing whether to restart or replace the paid social budget, and reset the signup target to the organic baseline.",
        idealActionId: "decide-paid-social",
        partialActionIds: ["reset-target"],
        idealPath: [
          "Confirm the drop in signups",
          "Break down by channel: paid social collapses, other channels are flat",
          "Check the web: it fell too, so the mobile release is not the cause",
          "Check India: the holiday dip is small and short",
        ],
      },
      falseLeads: [
        {
          segment: { dimension: "appVersion", value: "ios-6.4.0" },
          category: "bug",
          anomalies: [],
          explanation:
            "6.4.0 shipped the same day, which makes it a tempting suspect, but users on 6.4.0 sign up at the same rate as on 6.3.1, and the web, which has no release, dropped as well.",
        },
        {
          segment: { dimension: "country", value: "IN" },
          category: "seasonality",
          anomalies: [
            {
              segment: { country: "IN" },
              target: "signups",
              multiplier: 0.85,
              startDay: 69,
              rampDays: 1,
              endDay: 70,
            },
          ],
          explanation:
            "The holiday in India lowers signups there for two days, a small, short dip that recovers on its own.",
        },
      ],
    },
  },
  {
    id: "metric-drop-payments-brazil",
    moduleId: "metric-drop",
    seed: 2103,
    difficulty: "senior",
    company: {
      name: "Tandem",
      industry: "Consumer",
      stage: "Series B",
      description:
        "A language exchange app. Learners chat with native speakers and buy lesson packs inside the app, with local payment methods in each country.",
    },
    title: "Tandem: purchases are down",
    briefTemplate:
      "Conversion, the share of daily active users who buy a lesson pack, fell {change} in the last 7 days compared with the week before. Revenue is behind plan for the quarter and finance wants to know if this is temporary. Find the cause, and say how sure you are.",
    startDate: "2026-06-01",
    days: 75,
    headlineMetric: "conversion",
    release: { previous: "3.8.0", next: "3.9.0", day: 60 },
    scale: { signups: 5600, returning: 88000 },
    rates: { activation: 0.47, sessionsPerUser: 2.6, conversion: 0.028 },
    annotations: [
      {
        day: 60,
        kind: "release",
        label: "Mobile app 3.9.0 released (iOS and Android)",
      },
      {
        day: 66,
        kind: "experiment",
        label: "Web checkout copy test starts (50/50)",
      },
      { day: 70, kind: "holiday", label: "Bank holiday in the UK" },
    ],
    actionOptions: [
      {
        id: "escalate-provider",
        label:
          "Escalate to the Brazilian payment provider and add a fallback payment method",
      },
      { id: "stop-experiment", label: "Stop the web checkout copy experiment" },
      { id: "discount-brazil", label: "Launch a discount for users in Brazil" },
      {
        id: "wait-holiday",
        label: "Wait for the UK bank holiday effect to pass",
      },
    ],
    hidden: {
      rootCause: {
        category: "external",
        segment: { dimension: "country", value: "BR" },
        anomalies: [
          {
            segment: { country: "BR" },
            target: "conversion",
            multiplier: 0.2,
            startDay: 68,
            rampDays: 1,
          },
        ],
        summary:
          "The local payment provider in Brazil is failing most transactions.",
        explanation:
          "Conversion collapsed in Brazil on every platform and app version at once, overnight, while usage in Brazil stayed normal. People still want to buy; their payments fail. Nothing in our product changed that day.",
        idealAction:
          "Escalate to the payment provider, add a fallback payment method for Brazil, and tell affected users that they were not charged.",
        idealActionId: "escalate-provider",
        partialActionIds: [],
        idealPath: [
          "Confirm the drop in conversion",
          "Break down by country: Brazil collapses, other countries are flat",
          "Within Brazil, break down by platform: every platform drops together",
          "Check DAU in Brazil: usage is normal, so demand is not the issue",
        ],
      },
      falseLeads: [
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
          segment: { dimension: "country", value: "GB" },
          category: "seasonality",
          anomalies: [
            {
              segment: { country: "GB" },
              target: "returning",
              multiplier: 0.85,
              startDay: 70,
              rampDays: 1,
              endDay: 71,
            },
          ],
          explanation:
            "The UK bank holiday lowers activity for a weekend. It moves usage, not the share of users who buy.",
        },
      ],
    },
  },
  {
    id: "metric-drop-web-checkout",
    moduleId: "metric-drop",
    seed: 2104,
    difficulty: "pm",
    company: {
      name: "Northstar",
      industry: "Marketplace",
      stage: "Series A",
      description:
        "A marketplace for weekend trips. Travellers book stays and experiences on the web and in the app; most bookings happen on the web.",
    },
    title: "Northstar: bookings are slipping",
    briefTemplate:
      "Conversion, the share of daily active users who book, fell {change} in the last 7 days compared with the week before. The design team shipped a redesigned checkout the same week and says users love it. Find out what is going on.",
    startDate: "2026-06-01",
    days: 75,
    headlineMetric: "conversion",
    release: { previous: "2.14.0", next: "2.15.0", day: 62 },
    scale: { signups: 3100, returning: 41000 },
    rates: { activation: 0.35, sessionsPerUser: 1.9, conversion: 0.034 },
    annotations: [
      {
        day: 62,
        kind: "release",
        label: "Mobile app 2.15.0 released (iOS and Android)",
      },
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
      { id: "rollback-app", label: "Roll back app version 2.15.0" },
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
      falseLeads: [
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
          explanation:
            "Halving paid search brings fewer new users, which lowers traffic, not the share of visitors who book.",
        },
      ],
    },
  },
  {
    id: "metric-drop-us-holiday",
    moduleId: "metric-drop",
    seed: 2105,
    difficulty: "senior",
    company: {
      name: "Rally",
      industry: "Consumer",
      stage: "Series C",
      description:
        "A social running app: training plans, group runs and challenges with friends. The US is the largest market.",
    },
    title: "Rally: the July slump",
    briefTemplate:
      "Daily active users fell {change} in the last 7 days compared with the week before. A new app version shipped the same week, and the board meeting is on Monday. The CEO wants to know whether to roll back. Find the cause, and recommend what to do.",
    startDate: "2026-04-24",
    days: 75,
    headlineMetric: "dau",
    release: { previous: "8.1.2", next: "8.2.0", day: 68 },
    scale: { signups: 12500, returning: 210000 },
    rates: { activation: 0.44, sessionsPerUser: 2.3, conversion: 0.006 },
    annotations: [
      {
        day: 68,
        kind: "release",
        label: "Mobile app 8.2.0 released (iOS and Android)",
      },
      { day: 69, kind: "campaign", label: "Paid social budget trimmed by 20%" },
      { day: 71, kind: "holiday", label: "Independence Day (US)" },
    ],
    actionOptions: [
      { id: "rollback-release", label: "Roll back app version 8.2.0" },
      {
        id: "annotate-seasonality",
        label:
          "Keep 8.2.0; compare with last year and add the holiday to the forecast",
      },
      { id: "restore-social", label: "Restore the paid social budget" },
      {
        id: "push-campaign",
        label: "Send a push campaign to US users this week",
      },
    ],
    hidden: {
      rootCause: {
        category: "seasonality",
        segment: { dimension: "country", value: "US" },
        anomalies: [
          {
            segment: { country: "US", userType: "returning" },
            target: "returning",
            multiplier: 0.62,
            startDay: 68,
            rampDays: 3,
          },
          {
            segment: { country: "US", userType: "new" },
            target: "signups",
            multiplier: 0.7,
            startDay: 68,
            rampDays: 3,
          },
        ],
        summary:
          "The Independence Day holiday week: fewer people in the US run with the app, as every year.",
        explanation:
          "The drop is in the US only, on every platform and app version including the web, and it builds up around July 4. Users on 8.2.0 are as active as users on 8.1.2.",
        idealAction:
          "Do not roll back 8.2.0. Compare with the same week last year, add the holiday to the forecast, and check that US activity recovers the following week.",
        idealActionId: "annotate-seasonality",
        partialActionIds: [],
        idealPath: [
          "Confirm the drop in DAU",
          "Break down by country: the US accounts for nearly all of it",
          "Break down by app version within the US: 8.2.0 and 8.1.2 move together",
          "Check the web in the US: it drops too, so the release is not the cause",
        ],
      },
      falseLeads: [
        {
          segment: { dimension: "appVersion", value: "ios-8.2.0" },
          category: "bug",
          anomalies: [],
          explanation:
            "8.2.0 shipped the same week, but its users are as active as everyone else, and the web fell as well.",
        },
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
      ],
    },
  },
];
