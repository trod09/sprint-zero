/**
 * The hand-written A/B Test Interpreter cases. Each one is a specification:
 * the builder sizes the test plan, simulates the counts from the seed and
 * fills the measured numbers into the texts (`{lift}`, `{p}`...).
 *
 * Placeholders: {days} {plannedDays} {lift} {p} {ci} {share} {srmP}
 * {firstWeekLift} {lastWeekLift} {lastWeekP} {guardrail} {guardrailChange}
 * {guardrailP} {segmentLifts} {segmentShares} {usersPerArm} {samplePerArm}
 * {mde}.
 */
import type { AbTestCase, Simulation } from "../schema";

type Experiment = AbTestCase["experiment"];

export type AbTestCaseSpec = Omit<
  AbTestCase,
  "brief" | "experiment" | "results" | "hidden"
> & {
  briefTemplate: string;
  experiment: Omit<Experiment, "plan"> & {
    plan: Pick<Experiment["plan"], "treatmentShare" | "mde" | "baselineRate">;
  };
  hidden: Omit<AbTestCase["hidden"], "simulation"> & {
    simulation: Omit<Simulation, "attempt">;
  };
};

export const abTestCaseSpecs: readonly AbTestCaseSpec[] = [
  {
    id: "ab-test-one-tap-reorder",
    moduleId: "ab-test",
    seed: 3101,
    difficulty: "apm",
    company: {
      name: "Harvest Lane",
      industry: "Marketplace",
      stage: "Series B",
      description:
        "An online grocery marketplace that delivers from local stores in under two hours. Most revenue comes from households that order every week.",
    },
    title: "Harvest Lane: one-tap reorder",
    briefTemplate:
      "The growth team ran One-tap reorder for {days} days on half of Harvest Lane's traffic. Order rate is {lift} in treatment, and the team wants to roll it out to everyone on Monday. Read the results and make the call.",
    experiment: {
      name: "One-tap reorder",
      change:
        "Past orders on the home screen get a Reorder button that refills the cart with everything from that order.",
      hypothesis:
        "Shoppers who buy the same groceries every week will order more often if they can rebuild their cart in one tap.",
      primaryMetric: {
        key: "order_rate",
        label: "Order rate",
        description: "Share of visitors who place an order that day.",
      },
      guardrails: [
        {
          key: "order_issue_rate",
          label: "Orders with issues",
          description:
            "Share of orders with a wrong or missing item reported to support.",
          goodDirection: "down",
          tolerance: 5,
          denominator: "primary",
        },
      ],
      segmentDimension: "Platform",
      plan: { treatmentShare: 0.5, mde: 0.05, baselineRate: 0.08 },
    },
    hidden: {
      issues: [],
      acceptableIssues: [],
      effect: "improves",
      partialEffects: [],
      decision: "ship",
      partialDecisions: ["iterate"],
      summary:
        "A clean win: the test ran as planned and order rate really went up.",
      explanation:
        "The split is {share} treatment, in line with the 50/50 plan (SRM check: {srmP}). The test reached its planned sample ({usersPerArm} visitors per arm against {samplePerArm} needed). The lift of {lift} (95% CI {ci}, {p}) is there in the first week ({firstWeekLift}) and in the last ({lastWeekLift}), and on every platform ({segmentLifts}). The orders-with-issues guardrail did not move. Nothing in the readout argues against the result: sometimes the right call is simply to ship.",
      issueNotes: {},
      recommendation:
        "Ship it to everyone, and keep an eye on order rate and order issues for two weeks after the rollout.",
      simulation: {
        visitorsPerDay: 12000,
        treatmentShare: 0.5,
        baselineRate: 0.08,
        trueLift: 0.07,
        segments: [
          { value: "App", share: 0.7, rateMultiplier: 1.15 },
          { value: "Web", share: 0.3, rateMultiplier: 0.65 },
        ],
        guardrails: [
          { key: "order_issue_rate", baselineRate: 0.03, trueLift: 0 },
        ],
      },
    },
  },
  {
    id: "ab-test-onboarding-checklist",
    moduleId: "ab-test",
    seed: 3102,
    difficulty: "apm",
    company: {
      name: "Draftboard",
      industry: "SaaS B2B",
      stage: "Series A",
      description:
        "A collaborative whiteboard for product teams. Teams sign up for free and upgrade once several people use it every week.",
    },
    title: "Draftboard: the onboarding checklist",
    briefTemplate:
      "Draftboard's growth squad ran an onboarding checklist for {days} days with a planned 50/50 split. Activation is {lift} in treatment, and the squad lead wants to ship before the next release. Read the results and make the call.",
    experiment: {
      name: "Onboarding checklist",
      change:
        "New workspaces see a five-step checklist (invite a teammate, create a board, add a template...). The checklist loads as a separate script right after sign-up.",
      hypothesis:
        "A visible checklist will get more new workspaces to a first real board on day one.",
      primaryMetric: {
        key: "activation",
        label: "Activation",
        description:
          "Share of new workspaces that create a board with three or more items on day one.",
      },
      guardrails: [
        {
          key: "support_ticket_rate",
          label: "Support tickets",
          description:
            "Share of new workspaces that open a support ticket on day one.",
          goodDirection: "down",
          tolerance: 10,
          denominator: "users",
        },
      ],
      segmentDimension: "Platform",
      plan: { treatmentShare: 0.5, mde: 0.05, baselineRate: 0.3 },
    },
    hidden: {
      issues: ["srm"],
      acceptableIssues: [],
      effect: "inconclusive",
      partialEffects: [],
      decision: "iterate",
      partialDecisions: [],
      summary:
        "The split is broken: treatment lost users, so its lift cannot be trusted.",
      explanation:
        "The event that puts a workspace in treatment fires from the checklist script. When that script loads slowly or fails, the workspace is never counted in treatment. Those are the workspaces on slow connections and the least engaged ones, so the treatment users who remain convert better for reasons that have nothing to do with the checklist. That is why activation looks {lift}. When the split misses the plan this badly (SRM check: {srmP}), no metric in the readout can be trusted, however significant it looks.",
      issueNotes: {
        srm: "The plan was a 50/50 split, but only {share} of users landed in treatment. With this many users, a gap like that is not chance ({srmP}). Treatment is missing users.",
      },
      recommendation:
        "Do not ship or kill on this data. Fire the assignment event on the server before the checklist loads, check that the split is back to 50/50, and run the test again.",
      simulation: {
        visitorsPerDay: 2500,
        treatmentShare: 0.5,
        baselineRate: 0.3,
        trueLift: 0.01,
        missing: { share: 0.08, relativeRate: 0.3 },
        segments: [
          { value: "Desktop", share: 0.75, rateMultiplier: 1.1 },
          { value: "Mobile web", share: 0.25, rateMultiplier: 0.7 },
        ],
        guardrails: [
          { key: "support_ticket_rate", baselineRate: 0.02, trueLift: 0 },
        ],
      },
    },
  },
  {
    id: "ab-test-scarcity-banner",
    moduleId: "ab-test",
    seed: 3103,
    difficulty: "apm",
    company: {
      name: "Stayloop",
      industry: "Marketplace",
      stage: "Series C",
      description:
        "A vacation rental marketplace with 80,000 listings. Hosts are paid when the stay happens, and a cancelled booking blocks their calendar for nothing.",
    },
    title: "Stayloop: the scarcity banner",
    briefTemplate:
      "Stayloop ran a scarcity banner on listing pages for {days} days. Booking conversion is {lift}, and the marketplace team calls it the best result of the quarter. Read the results and make the call.",
    experiment: {
      name: "Scarcity banner",
      change:
        "When less than 30% of a listing's nights are free for the searched dates, the page shows 'Only a few nights left at this price' with a countdown timer.",
      hypothesis:
        "Urgency helps undecided guests commit, so booking conversion will go up.",
      primaryMetric: {
        key: "booking_conversion",
        label: "Booking conversion",
        description: "Share of listing page visitors who book.",
      },
      guardrails: [
        {
          key: "cancellation_rate",
          label: "Cancellations within 48 hours",
          description: "Share of bookings cancelled within 48 hours.",
          goodDirection: "down",
          tolerance: 5,
          denominator: "primary",
        },
        {
          key: "support_contact_rate",
          label: "Support contacts",
          description: "Share of visitors who contact support that day.",
          goodDirection: "down",
          tolerance: 10,
          denominator: "users",
        },
      ],
      segmentDimension: "Platform",
      plan: { treatmentShare: 0.5, mde: 0.06, baselineRate: 0.04 },
    },
    hidden: {
      issues: ["guardrail"],
      acceptableIssues: [],
      effect: "improves",
      partialEffects: [],
      decision: "iterate",
      partialDecisions: ["kill"],
      summary:
        "Bookings went up, but so did cancellations: the banner rushes guests into bookings they regret.",
      explanation:
        "The primary metric is a real win: {lift} (95% CI {ci}, {p}), on both platforms and with a healthy split. But the guardrail exists for exactly this case. Cancellations within 48 hours rose {guardrailChange}. Each cancelled booking costs the host a blocked calendar and Stayloop a refund and a support contact, so net bookings and trust grow much less than the headline suggests. A guardrail breach means you do not ship as is, even with a significant win on the primary metric.",
      issueNotes: {
        guardrail:
          "{guardrail} rose {guardrailChange} ({guardrailP}), far beyond the 5% the team accepts. Many of the extra bookings come from guests rushed into dates they cancel days later.",
      },
      recommendation:
        "Do not ship this version. Keep urgency only when it is true and specific (real availability, no countdown), make net bookings after cancellations the primary metric, and test again.",
      simulation: {
        visitorsPerDay: 16000,
        treatmentShare: 0.5,
        baselineRate: 0.04,
        trueLift: 0.09,
        segments: [
          { value: "App", share: 0.55, rateMultiplier: 1.2 },
          { value: "Web", share: 0.45, rateMultiplier: 0.76 },
        ],
        guardrails: [
          { key: "cancellation_rate", baselineRate: 0.06, trueLift: 0.3 },
          { key: "support_contact_rate", baselineRate: 0.01, trueLift: 0 },
        ],
      },
    },
  },
  {
    id: "ab-test-annual-paywall",
    moduleId: "ab-test",
    seed: 3104,
    difficulty: "pm",
    company: {
      name: "Stillwater",
      industry: "Consumer",
      stage: "Series A",
      description:
        "A meditation and sleep app. The free tier has a few sessions; everything else needs a subscription, sold on a paywall shown after the third session.",
    },
    title: "Stillwater: annual plan by default",
    briefTemplate:
      "Stillwater tested an annual-first paywall for {days} days. The CEO is convinced annual plans are the future and asks whether to roll it out. Read the results and make the call.",
    experiment: {
      name: "Annual plan by default",
      change:
        "The paywall preselects the annual plan ($59.99 a year) instead of the monthly one ($9.99 a month), and moves the monthly plan behind 'See other plans'.",
      hypothesis:
        "Most subscribers who stay a year save money on the annual plan, so defaulting to it will raise paywall conversion.",
      primaryMetric: {
        key: "paywall_conversion",
        label: "Paywall conversion",
        description: "Share of paywall visitors who start a subscription.",
      },
      guardrails: [
        {
          key: "refund_request_rate",
          label: "Refund requests",
          description:
            "Share of new subscriptions with a refund request within 14 days.",
          goodDirection: "down",
          tolerance: 10,
          denominator: "primary",
        },
      ],
      segmentDimension: "User type",
      plan: { treatmentShare: 0.5, mde: 0.08, baselineRate: 0.05 },
    },
    hidden: {
      issues: [],
      acceptableIssues: [],
      effect: "harms",
      partialEffects: [],
      decision: "kill",
      partialDecisions: ["iterate"],
      summary: "A real loss: the annual-first paywall converts fewer visitors.",
      explanation:
        "The test is healthy: the split is {share} treatment (SRM check: {srmP}), it reached its planned sample and ran its full {days} days. Paywall conversion moved {lift} (95% CI {ci}, {p}), for new and returning users alike ({segmentLifts}). A bigger upfront price scares off people who were ready to pay monthly. A clean negative result is a result: the right call is to stop, not to keep testing until it turns green.",
      issueNotes: {},
      recommendation:
        "Kill this version. If annual plans matter, test a paywall that shows both plans side by side with the annual savings, and judge it on revenue per visitor as well as conversion.",
      simulation: {
        visitorsPerDay: 8000,
        treatmentShare: 0.5,
        baselineRate: 0.05,
        trueLift: -0.08,
        segments: [
          { value: "New", share: 0.65, rateMultiplier: 0.8 },
          { value: "Returning", share: 0.35, rateMultiplier: 1.37 },
        ],
        guardrails: [
          { key: "refund_request_rate", baselineRate: 0.04, trueLift: 0.05 },
        ],
      },
    },
  },
  {
    id: "ab-test-savings-streaks",
    moduleId: "ab-test",
    seed: 3105,
    difficulty: "pm",
    company: {
      name: "Mintwise",
      industry: "Fintech",
      stage: "Series A",
      description:
        "A savings app for young professionals: round-ups, savings goals and automatic transfers. Revenue comes from interest on deposits, so saving often is the core habit.",
    },
    title: "Mintwise: savings streaks",
    briefTemplate:
      "Mintwise ran savings streaks for {days} days. Over the whole test the daily deposit rate is {lift}, and the team wants to ship it in the next release. Read the results and make the call.",
    experiment: {
      name: "Savings streaks",
      change:
        "Adds a streak counter and a confetti animation on every day a user moves money into a savings goal.",
      hypothesis: "Turning saving into a game will make users save more often.",
      primaryMetric: {
        key: "deposit_rate",
        label: "Daily deposit rate",
        description:
          "Share of active users who move money into a savings goal that day.",
      },
      guardrails: [
        {
          key: "withdrawal_rate",
          label: "Goal withdrawals",
          description:
            "Share of active users who withdraw from a savings goal that day.",
          goodDirection: "down",
          tolerance: 10,
          denominator: "users",
        },
      ],
      segmentDimension: "User type",
      plan: { treatmentShare: 0.5, mde: 0.05, baselineRate: 0.1 },
    },
    hidden: {
      issues: ["novelty"],
      acceptableIssues: [],
      effect: "no_effect",
      partialEffects: ["inconclusive"],
      decision: "kill",
      partialDecisions: ["iterate"],
      summary:
        "A novelty effect: the lift fades to nothing within three weeks.",
      explanation:
        "The overall {lift} ({p}) averages a big first-week spike with weeks where the effect is gone. The daily lift starts high and decays towards zero, and the last week alone shows {lastWeekLift}, which cannot be told apart from no effect. Shipping on the average would promise a gain that has already disappeared. The split, the sample and the guardrail are fine; the trap is the pattern over time.",
      issueNotes: {
        novelty:
          "The lift was {firstWeekLift} in the first week and {lastWeekLift} in the last ({lastWeekP}). The daily lift falls steadily: users reacted to something new, not to something better.",
      },
      recommendation:
        "Do not ship. The lasting effect is about zero, and a streak adds complexity to every screen it touches. If the team believes in habits, test another mechanic, such as automatic weekly transfers, and judge it on its last weeks rather than its average.",
      simulation: {
        visitorsPerDay: 8000,
        treatmentShare: 0.5,
        baselineRate: 0.1,
        trueLift: 0,
        novelty: { initialLift: 0.3, decayDays: 4 },
        segments: [
          { value: "New", share: 0.3, rateMultiplier: 1.3 },
          { value: "Returning", share: 0.7, rateMultiplier: 0.87 },
        ],
        guardrails: [
          { key: "withdrawal_rate", baselineRate: 0.02, trueLift: 0 },
        ],
      },
    },
  },
  {
    id: "ab-test-ai-email-drafts",
    moduleId: "ab-test",
    seed: 3106,
    difficulty: "pm",
    company: {
      name: "Pipestream",
      industry: "SaaS B2B",
      stage: "Series B",
      description:
        "A sales engagement platform: reps build email sequences, and Pipestream sends them and tracks replies. Pricing is per seat, so active reps are the metric everyone watches.",
    },
    title: "Pipestream: AI email drafts",
    briefTemplate:
      "Pipestream planned a {plannedDays}-day test of AI email drafts. After {days} days the result looked so good ({lift}) that the team stopped it and asked for approval to launch. Read the results and make the call.",
    experiment: {
      name: "AI email drafts",
      change:
        "The sequence editor offers an AI-written first draft of each email, based on the prospect's company and role.",
      hypothesis:
        "Reps who do not have to start from a blank page will launch more sequences.",
      primaryMetric: {
        key: "sequence_launch_rate",
        label: "Sequence launch rate",
        description:
          "Share of active reps who launch at least one email sequence that day.",
      },
      guardrails: [
        {
          key: "reply_rate",
          label: "Prospect replies",
          description: "Share of launched sequences that get a reply.",
          goodDirection: "up",
          tolerance: 5,
          denominator: "primary",
        },
      ],
      segmentDimension: "Team size",
      plan: { treatmentShare: 0.5, mde: 0.05, baselineRate: 0.12 },
    },
    hidden: {
      issues: ["underpowered"],
      acceptableIssues: [],
      effect: "inconclusive",
      partialEffects: [],
      decision: "iterate",
      partialDecisions: [],
      summary:
        "Stopped too early: the test has a fraction of the sample it needs, and the result is not significant.",
      explanation:
        "Big early lifts are common in small samples and usually shrink as data comes in. With {usersPerArm} reps per arm, the observed {lift} has {p} and a 95% interval of {ci}: it is compatible with no effect at all. Stopping as soon as the result 'looks good' (peeking) inflates false positives. The split and the guardrail are fine; the problem is that there is not enough data to decide.",
      issueNotes: {
        underpowered:
          "The plan needed {samplePerArm} reps per arm to detect a {mde} lift, and the test stopped at {usersPerArm}. The 95% interval ({ci}) includes zero and effects far smaller than the one the team is celebrating.",
      },
      recommendation:
        "Resume the test and let it run to the planned sample ({samplePerArm} per arm) before deciding. Agree on the stopping rule before the test starts, not while watching the numbers.",
      simulation: {
        visitorsPerDay: 3000,
        treatmentShare: 0.5,
        baselineRate: 0.12,
        trueLift: 0.03,
        stoppedAfterDays: 4,
        segments: [
          { value: "Small teams", share: 0.4, rateMultiplier: 0.9 },
          { value: "Large teams", share: 0.6, rateMultiplier: 1.07 },
        ],
        guardrails: [{ key: "reply_rate", baselineRate: 0.18, trueLift: 0 }],
      },
    },
  },
  {
    id: "ab-test-card-activation",
    moduleId: "ab-test",
    seed: 3107,
    difficulty: "senior",
    company: {
      name: "Northvault",
      industry: "Fintech",
      stage: "Series B",
      description:
        "A digital bank for freelancers. Interchange on card spending is the main revenue line, so a card that never gets activated is a customer who never pays off.",
    },
    title: "Northvault: one-screen card activation",
    briefTemplate:
      "Northvault tested a one-screen card activation for {days} days. Activation is {lift} overall, and the cards team wants to ship. Read the results and make the call.",
    experiment: {
      name: "One-screen card activation",
      change:
        "Replaces the three-step card activation flow with a single screen that asks for the last four digits of the card and a new PIN.",
      hypothesis:
        "Fewer steps will get more new cardholders to activate their card within 7 days.",
      primaryMetric: {
        key: "card_activation",
        label: "Card activation",
        description:
          "Share of new cardholders who activate their card within 7 days.",
      },
      guardrails: [
        {
          key: "activation_support_rate",
          label: "Activation support contacts",
          description:
            "Share of new cardholders who contact support about activating their card.",
          goodDirection: "down",
          tolerance: 10,
          denominator: "users",
        },
      ],
      segmentDimension: "Platform",
      plan: { treatmentShare: 0.5, mde: 0.05, baselineRate: 0.4 },
    },
    hidden: {
      issues: ["simpson"],
      acceptableIssues: ["srm"],
      effect: "harms",
      partialEffects: ["inconclusive"],
      decision: "kill",
      partialDecisions: ["iterate"],
      summary:
        "Simpson's paradox: the new screen loses on every platform but wins overall, because treatment got more mobile users.",
      explanation:
        "A routing rule sent more mobile app users to treatment and more desktop users to control, while the total split stayed close to 50/50, so the usual SRM check on totals looks fine. Mobile users activate their card almost three times as often as desktop users, so the arm with more of them looks better overall. Compared like for like, within each platform, the one-screen flow does worse ({segmentLifts}). The overall {lift} is an artefact of the mix.",
      issueNotes: {
        simpson:
          "Treatment is worse on both platforms ({segmentLifts}) yet better overall. The arms mix platforms in different proportions ({segmentShares}), and mobile app users activate far more often, so the arm with more of them wins overall whatever the screen does.",
        srm: "The total split looks fine, but each platform is split unevenly between the arms. Checking the split per segment is what reveals the broken assignment.",
      },
      recommendation:
        "Do not ship. The fair comparison, within each platform, shows the new flow hurts activation. Fix the assignment so each platform splits 50/50, and if the team still believes in the idea, test a revised flow.",
      simulation: {
        visitorsPerDay: 1500,
        treatmentShare: 0.5,
        baselineRate: 0.4,
        trueLift: -0.08,
        segments: [
          {
            value: "Mobile app",
            share: 0.55,
            rateMultiplier: 1.4,
            treatmentShare: 0.6,
          },
          {
            value: "Desktop web",
            share: 0.45,
            rateMultiplier: 0.5,
            treatmentShare: 0.378,
          },
        ],
        guardrails: [
          {
            key: "activation_support_rate",
            baselineRate: 0.03,
            trueLift: 0,
          },
        ],
      },
    },
  },
  {
    id: "ab-test-friends-push",
    moduleId: "ab-test",
    seed: 3108,
    difficulty: "senior",
    company: {
      name: "Snapdeck",
      industry: "Consumer",
      stage: "Series A",
      description:
        "A photo-sharing app for close friends. Growth depends on people posting: every post brings friends back, and push notifications are the main way to reach them.",
    },
    title: "Snapdeck: the evening friends push",
    briefTemplate:
      "Snapdeck sent an evening push to half of its users for {days} days. Posting rate is {lift} over the test, and the growth lead wants it on for everyone. Read the results and make the call.",
    experiment: {
      name: "Evening friends push",
      change:
        "Sends a push notification every evening listing the friends who posted that day.",
      hypothesis:
        "Reminding people that their friends are active will get more of them to post.",
      primaryMetric: {
        key: "post_rate",
        label: "Posting rate",
        description: "Share of daily active users who post at least one photo.",
      },
      guardrails: [
        {
          key: "push_opt_out_rate",
          label: "Push opt-outs",
          description:
            "Share of daily active users who turn off push notifications.",
          goodDirection: "down",
          tolerance: 10,
          denominator: "users",
        },
        {
          key: "uninstall_rate",
          label: "Uninstalls",
          description: "Share of daily active users who uninstall the app.",
          goodDirection: "down",
          tolerance: 10,
          denominator: "users",
        },
      ],
      segmentDimension: "User type",
      plan: { treatmentShare: 0.5, mde: 0.04, baselineRate: 0.15 },
    },
    hidden: {
      issues: ["novelty", "guardrail"],
      acceptableIssues: [],
      effect: "no_effect",
      partialEffects: ["inconclusive"],
      decision: "kill",
      partialDecisions: ["iterate"],
      summary:
        "The push wears off within a week, and it costs push permission for good.",
      explanation:
        "The overall {lift} ({p}) is the average of a first week where the push felt new and a second week where it barely matters. Meanwhile push opt-outs rose {guardrailChange}, and opt-outs do not come back when the novelty fades. The trade is a temporary bump in posting for the permanent loss of a channel.",
      issueNotes: {
        novelty:
          "The lift in posting was {firstWeekLift} in the first week but only {lastWeekLift} in the last ({lastWeekP}): the push stopped working as people got used to it.",
        guardrail:
          "{guardrail} rose {guardrailChange} ({guardrailP}). Every user who turns off push is a user you can no longer reach, for this feature or any other.",
      },
      recommendation:
        "Kill the daily push. To nudge posting, test a rarer, more personal trigger (a close friend posting for the first time in a while) and judge it on its last week and on opt-outs.",
      simulation: {
        visitorsPerDay: 20000,
        treatmentShare: 0.5,
        baselineRate: 0.15,
        trueLift: 0,
        novelty: { initialLift: 0.2, decayDays: 3 },
        segments: [
          { value: "New", share: 0.25, rateMultiplier: 1.3 },
          { value: "Established", share: 0.75, rateMultiplier: 0.9 },
        ],
        guardrails: [
          { key: "push_opt_out_rate", baselineRate: 0.004, trueLift: 0.5 },
          { key: "uninstall_rate", baselineRate: 0.0015, trueLift: 0.15 },
        ],
      },
    },
  },
];
