/**
 * Hand-written Roadmap & OKRs specifications, one company per industry.
 * Words and base numbers live here; the generator picks the initiatives for
 * the level, nudges efforts and values with the seed and checks the result
 * is a fair puzzle.
 *
 * Key results are rated 2 (measurable outcome), 1 (weak: restates the goal
 * or measures activity) or 0 (an output, a vanity number or not measurable).
 * `level` is the lowest difficulty that includes an initiative.
 */
import type { Company, Difficulty, IndustryKey } from "@/core/case-engine";

export interface RoadmapSpec {
  key: string;
  industry: IndustryKey;
  company: Company;
  title: string;
  brief: string;
  objectives: { id: string; title: string; description: string }[];
  keyResults: {
    id: string;
    objectiveId: string;
    text: string;
    rating: 0 | 1 | 2;
    why: string;
  }[];
  teams: { id: string; name: string; focus: string }[];
  initiatives: {
    id: string;
    title: string;
    description: string;
    teamId: string;
    effort: number;
    dependsOn: string[];
    requester: string;
    objectiveId: string | null;
    value: number;
    why: string;
    level: Difficulty;
  }[];
  principle: string;
}

const OUTPUT = "An output: it says what ships, not what changes for users.";
const VAGUE =
  "Not measurable: nobody could say at the end of the quarter whether it happened.";

const coinpath: RoadmapSpec = {
  key: "coinpath",
  industry: "fintech",
  company: {
    name: "Coinpath",
    industry: "Fintech",
    stage: "Series A, 310k monthly active savers",
    description:
      "A savings app that rounds up card payments into goals. Revenue comes from Coinpath Plus, a paid plan with higher interest.",
  },
  title: "Coinpath: plan the third quarter",
  brief:
    "Leadership set three company objectives for the quarter and every team sent its wish list. Three squads, six sprints each, and more work than fits. Pick the key results you will be held to, then build a roadmap that ships what moves them. Watch the dependencies between squads.",
  objectives: [
    {
      id: "savers",
      title: "Grow active savers",
      description:
        "Reach 400k monthly active savers, from 310k today. Most new users never make a first deposit.",
    },
    {
      id: "plus",
      title: "Make Coinpath Plus worth paying for",
      description:
        "Raise the share of active savers on the paid plan from 3.1% to 4.5%.",
    },
    {
      id: "audit",
      title: "Pass the regulator's audit",
      description:
        "The audit is at the end of the quarter. A critical finding freezes new sign-ups.",
    },
  ],
  keyResults: [
    {
      id: "savers_first_deposit",
      objectiveId: "savers",
      text: "New users who make a first deposit within 7 days: from 36% to 48%",
      rating: 2,
      why: "A measurable outcome on the step where most new users are lost.",
    },
    {
      id: "savers_retention",
      objectiveId: "savers",
      text: "Day-30 retention of new savers: from 41% to 50%",
      rating: 2,
      why: "A measurable outcome: active savers grow when new ones stay.",
    },
    {
      id: "savers_restated",
      objectiveId: "savers",
      text: "Reach 400k monthly active savers",
      rating: 1,
      why: "Measurable, but it only restates the objective: it does not say which lever the teams will move.",
    },
    {
      id: "savers_streaks",
      objectiveId: "savers",
      text: "Launch savings streaks on iOS and Android",
      rating: 0,
      why: OUTPUT,
    },
    {
      id: "savers_downloads",
      objectiveId: "savers",
      text: "Reach 1 million app downloads",
      rating: 0,
      why: "A vanity number: downloads grow while active savers stay flat.",
    },
    {
      id: "plus_trial",
      objectiveId: "plus",
      text: "Trial-to-paid conversion: from 22% to 30%",
      rating: 2,
      why: "A measurable outcome at the step that decides who pays.",
    },
    {
      id: "plus_churn",
      objectiveId: "plus",
      text: "Plus subscribers who cancel in their first 60 days: from 18% to 12%",
      rating: 2,
      why: "A measurable outcome: the paid share only grows if subscribers stay.",
    },
    {
      id: "plus_views",
      objectiveId: "plus",
      text: "Increase paywall views by 40%",
      rating: 1,
      why: "Measurable, but it counts activity: more views do not mean more subscribers.",
    },
    {
      id: "plus_redesign",
      objectiveId: "plus",
      text: "Redesign the Plus paywall",
      rating: 0,
      why: OUTPUT,
    },
    {
      id: "plus_love",
      objectiveId: "plus",
      text: "Make savers love Coinpath Plus",
      rating: 0,
      why: VAGUE,
    },
    {
      id: "audit_findings",
      objectiveId: "audit",
      text: "Close all 14 open findings rated high before the audit date",
      rating: 2,
      why: "Measurable and tied to what the regulator will check.",
    },
    {
      id: "audit_identity",
      objectiveId: "audit",
      text: "New accounts that pass identity checks before a first deposit: from 92% to 100%",
      rating: 2,
      why: "A measurable outcome on the gap most likely to become a critical finding.",
    },
    {
      id: "audit_mock",
      objectiveId: "audit",
      text: "Run three internal mock audits",
      rating: 1,
      why: "Countable, but it measures activity: three mock audits can still leave findings open.",
    },
    {
      id: "audit_compliant",
      objectiveId: "audit",
      text: "Be fully compliant",
      rating: 0,
      why: VAGUE,
    },
    {
      id: "audit_hire",
      objectiveId: "audit",
      text: "Hire a compliance officer",
      rating: 0,
      why: "A task, not a result: the hire does not close a single finding by itself.",
    },
  ],
  teams: [
    {
      id: "growth",
      name: "Growth squad",
      focus: "Onboarding, paywall, notifications",
    },
    {
      id: "core",
      name: "Core banking squad",
      focus: "Accounts, payments, billing",
    },
    {
      id: "platform",
      name: "Platform squad",
      focus: "Data, infrastructure, security",
    },
  ],
  initiatives: [
    {
      id: "deposit_nudges",
      title: "First-deposit nudges",
      description:
        "Onboarding prompts that walk new users to a first deposit during their first week.",
      teamId: "growth",
      effort: 3,
      dependsOn: [],
      requester: "Growth lead",
      objectiveId: "savers",
      value: 70,
      why: "Aims at the biggest leak: new users who never deposit.",
      level: "apm",
    },
    {
      id: "trial_flow",
      title: "Free trial of Plus",
      description:
        "A 14-day trial offered when a saver reaches their first goal. Needs trial billing from the core squad.",
      teamId: "growth",
      effort: 2,
      dependsOn: ["trial_billing"],
      requester: "Head of Monetization",
      objectiveId: "plus",
      value: 65,
      why: "The most direct lever on paid conversion, but it cannot start until trial billing exists.",
      level: "apm",
    },
    {
      id: "referral_board",
      title: "Referral leaderboard",
      description:
        "A public ranking of the savers who invited the most friends. The CEO saw it in a competitor's app.",
      teamId: "growth",
      effort: 2,
      dependsOn: [],
      requester: "CEO",
      objectiveId: null,
      value: 0,
      why: "No objective needs it: invited users are the ones who fail to make a first deposit.",
      level: "apm",
    },
    {
      id: "streaks",
      title: "Savings streaks",
      description:
        "Weekly streaks with rewards for saving several weeks in a row. Needs the new event pipeline.",
      teamId: "growth",
      effort: 3,
      dependsOn: ["event_pipeline"],
      requester: "Design lead",
      objectiveId: "savers",
      value: 55,
      why: "Helps retention, but costs more and unlocks less than the nudges and the trial.",
      level: "pm",
    },
    {
      id: "identity_checks",
      title: "Identity checks before the first deposit",
      description:
        "Blocks deposits until the identity check is complete. Today 8% of accounts deposit first.",
      teamId: "core",
      effort: 3,
      dependsOn: [],
      requester: "Head of Compliance",
      objectiveId: "audit",
      value: 90,
      why: "Closes the gap most likely to become a critical finding.",
      level: "apm",
    },
    {
      id: "trial_billing",
      title: "Trial billing",
      description:
        "Lets a subscription start free and charge on day 15. Invisible to users on its own.",
      teamId: "core",
      effort: 2,
      dependsOn: [],
      requester: "Head of Monetization",
      objectiveId: "plus",
      value: 10,
      why: "Worth little alone, but the free trial depends on it: it has to go early.",
      level: "apm",
    },
    {
      id: "dark_mode",
      title: "Dark mode",
      description: "The most voted request in the community forum.",
      teamId: "core",
      effort: 1,
      dependsOn: [],
      requester: "Community manager",
      objectiveId: null,
      value: 0,
      why: "Popular, but it moves none of the three objectives.",
      level: "apm",
    },
    {
      id: "joint_goals",
      title: "Joint savings goals",
      description:
        "Two people save towards the same goal. A Plus feature asked for in interviews.",
      teamId: "core",
      effort: 4,
      dependsOn: [],
      requester: "Head of Monetization",
      objectiveId: "plus",
      value: 40,
      why: "A real Plus feature, but four sprints crowd out the audit work and trial billing.",
      level: "senior",
    },
    {
      id: "audit_log",
      title: "Audit log for money movements",
      description:
        "An immutable record of every deposit, withdrawal and transfer, as the regulator requires.",
      teamId: "platform",
      effort: 3,
      dependsOn: [],
      requester: "Head of Compliance",
      objectiveId: "audit",
      value: 80,
      why: "Several of the open findings are about missing records.",
      level: "apm",
    },
    {
      id: "event_pipeline",
      title: "Event pipeline upgrade",
      description:
        "Reliable, real-time product events. Streaks and churn alerts need it.",
      teamId: "platform",
      effort: 2,
      dependsOn: [],
      requester: "Data lead",
      objectiveId: "savers",
      value: 5,
      why: "An enabler: only worth doing if something that depends on it also ships.",
      level: "pm",
    },
    {
      id: "churn_alerts",
      title: "Churn-risk alerts for Plus",
      description:
        "Flags subscribers about to cancel and offers them a reason to stay. Needs the new event pipeline.",
      teamId: "platform",
      effort: 2,
      dependsOn: ["event_pipeline"],
      requester: "Head of Monetization",
      objectiveId: "plus",
      value: 45,
      why: "Useful for churn, but with its dependency it does not fit next to the audit log.",
      level: "senior",
    },
    {
      id: "cloud_region",
      title: "Move to a second cloud region",
      description:
        "Engineering wants a second region for resilience. No incident has needed it so far.",
      teamId: "platform",
      effort: 4,
      dependsOn: [],
      requester: "Engineering manager",
      objectiveId: null,
      value: 0,
      why: "Sensible some day, but no objective this quarter depends on it.",
      level: "senior",
    },
  ],
  principle:
    "A roadmap is a set of bets on outcomes. Pick key results that measure a change in behaviour, schedule enablers before what they unlock, and say no to work that moves none of them, whoever asks.",
};

const fixly: RoadmapSpec = {
  key: "fixly",
  industry: "marketplace",
  company: {
    name: "Fixly",
    industry: "Marketplace",
    stage: "Seed, live in two cities",
    description:
      "A marketplace that matches households with vetted tradespeople for small repairs and takes a commission on every job.",
  },
  title: "Fixly: plan the quarter before the city launch",
  brief:
    "Fixly has three company objectives this quarter: more repeat customers, jobs that actually get filled, and a launch in a third city. Three squads, six sprints each. Pick the key results, then build a roadmap that ships what moves them, in an order the dependencies allow.",
  objectives: [
    {
      id: "repeat",
      title: "Turn first-time customers into regulars",
      description:
        "Raise the share of customers who book a second job within 90 days from 24% to 32%.",
    },
    {
      id: "fill",
      title: "Fill every job fast",
      description:
        "Raise the share of jobs accepted by a tradesperson within 24 hours from 71% to 85%.",
    },
    {
      id: "launch",
      title: "Launch in Marlow Bay",
      description:
        "Open the third city this quarter with enough tradespeople to serve demand from day one.",
    },
  ],
  keyResults: [
    {
      id: "repeat_second_job",
      objectiveId: "repeat",
      text: "Customers who book a second job within 90 days: from 24% to 32%",
      rating: 2,
      why: "A measurable outcome that is exactly the behaviour the objective wants.",
    },
    {
      id: "repeat_rating",
      objectiveId: "repeat",
      text: "Jobs rated 4 stars or more: from 78% to 88%",
      rating: 2,
      why: "A measurable outcome and the main driver of booking again.",
    },
    {
      id: "repeat_emails",
      objectiveId: "repeat",
      text: "Send a reminder email to every past customer each month",
      rating: 0,
      why: OUTPUT,
    },
    {
      id: "repeat_app_opens",
      objectiveId: "repeat",
      text: "Increase app opens per customer by 25%",
      rating: 1,
      why: "Measurable, but opening the app is activity: nobody books a repair for fun.",
    },
    {
      id: "repeat_delight",
      objectiveId: "repeat",
      text: "Delight customers at every step",
      rating: 0,
      why: VAGUE,
    },
    {
      id: "fill_24h",
      objectiveId: "fill",
      text: "Jobs accepted within 24 hours: from 71% to 85%",
      rating: 2,
      why: "A measurable outcome on the exact promise customers care about.",
    },
    {
      id: "fill_unfilled",
      objectiveId: "fill",
      text: "Jobs cancelled because nobody accepted them: from 9% to 3%",
      rating: 2,
      why: "A measurable outcome on the worst failure of the marketplace.",
    },
    {
      id: "fill_signups",
      objectiveId: "fill",
      text: "Sign up 2,000 new tradespeople",
      rating: 1,
      why: "Countable, but sign-ups who never accept a job fill nothing.",
    },
    {
      id: "fill_matching",
      objectiveId: "fill",
      text: "Ship the new matching algorithm",
      rating: 0,
      why: OUTPUT,
    },
    {
      id: "fill_best",
      objectiveId: "fill",
      text: "Become the most reliable repair service",
      rating: 0,
      why: VAGUE,
    },
    {
      id: "launch_supply",
      objectiveId: "launch",
      text: "300 vetted tradespeople who accepted a job in Marlow Bay in the launch month",
      rating: 2,
      why: "Measurable, and it counts supply that actually works, not sign-ups.",
    },
    {
      id: "launch_fill",
      objectiveId: "launch",
      text: "80% of Marlow Bay jobs accepted within 24 hours in the first month",
      rating: 2,
      why: "A measurable outcome that says the new city works for customers.",
    },
    {
      id: "launch_date",
      objectiveId: "launch",
      text: "Launch Marlow Bay by week 10",
      rating: 1,
      why: "A date is checkable, but a launch with no supply would still meet it.",
    },
    {
      id: "launch_press",
      objectiveId: "launch",
      text: "Get 20 press mentions of the launch",
      rating: 0,
      why: "A vanity number: press does not fill jobs.",
    },
    {
      id: "launch_buzz",
      objectiveId: "launch",
      text: "Create buzz in Marlow Bay",
      rating: 0,
      why: VAGUE,
    },
  ],
  teams: [
    {
      id: "customer",
      name: "Customer squad",
      focus: "Booking, payments, reviews",
    },
    {
      id: "supply",
      name: "Supply squad",
      focus: "Tradespeople app, vetting, matching",
    },
    {
      id: "ops",
      name: "Operations tools squad",
      focus: "City setup, pricing, support tools",
    },
  ],
  initiatives: [
    {
      id: "rebook",
      title: "One-tap rebooking",
      description:
        "Book the same tradesperson again from a past job, with their next free slots. Needs the availability calendar.",
      teamId: "customer",
      effort: 2,
      dependsOn: ["calendar"],
      requester: "Head of Product",
      objectiveId: "repeat",
      value: 75,
      why: "The shortest path to a second job, but it needs to know when tradespeople are free.",
      level: "apm",
    },
    {
      id: "quality_guarantee",
      title: "Job guarantee",
      description:
        "If a repair fails within 30 days, Fixly sends someone back for free.",
      teamId: "customer",
      effort: 3,
      dependsOn: [],
      requester: "Support lead",
      objectiveId: "repeat",
      value: 55,
      why: "Raises trust and ratings, the main driver of booking again.",
      level: "apm",
    },
    {
      id: "gift_cards",
      title: "Gift cards",
      description:
        "Customers buy repair credit for someone else. Marketing wants it for the holidays.",
      teamId: "customer",
      effort: 2,
      dependsOn: [],
      requester: "Head of Marketing",
      objectiveId: null,
      value: 0,
      why: "A new revenue idea that moves none of the three objectives this quarter.",
      level: "apm",
    },
    {
      id: "subscriptions",
      title: "Home care subscription",
      description:
        "A monthly plan with two visits a year and priority booking.",
      teamId: "customer",
      effort: 4,
      dependsOn: ["calendar"],
      requester: "CEO",
      objectiveId: "repeat",
      value: 50,
      why: "Could build habit, but four sprints after the calendar leave no room for anything else.",
      level: "senior",
    },
    {
      id: "calendar",
      title: "Availability calendar for tradespeople",
      description:
        "Tradespeople mark the hours they can work, so jobs are offered only to people who are free.",
      teamId: "supply",
      effort: 2,
      dependsOn: [],
      requester: "Supply lead",
      objectiveId: "fill",
      value: 45,
      why: "Fills jobs faster on its own and unlocks rebooking: it goes first.",
      level: "apm",
    },
    {
      id: "instant_offer",
      title: "Instant job offers",
      description:
        "Pushes a new job to the three best-placed tradespeople at once instead of one after another. Needs the availability calendar.",
      teamId: "supply",
      effort: 2,
      dependsOn: ["calendar"],
      requester: "Supply lead",
      objectiveId: "fill",
      value: 70,
      why: "Attacks time-to-accept directly.",
      level: "apm",
    },
    {
      id: "vetting_flow",
      title: "Self-serve vetting",
      description:
        "Tradespeople upload licences and insurance in the app instead of visiting an office. Needed to recruit in a city with no office.",
      teamId: "supply",
      effort: 3,
      dependsOn: [],
      requester: "City launch lead",
      objectiveId: "launch",
      value: 60,
      why: "Without it there is no way to vet supply in Marlow Bay.",
      level: "pm",
    },
    {
      id: "badges",
      title: "Tradesperson badges",
      description:
        "Profile badges for years of experience and jobs completed. Tradespeople ask for them often.",
      teamId: "supply",
      effort: 1,
      dependsOn: [],
      requester: "Community manager",
      objectiveId: null,
      value: 0,
      why: "Nice to have: no evidence that badges fill jobs faster or bring customers back.",
      level: "pm",
    },
    {
      id: "city_config",
      title: "City configuration",
      description:
        "Service areas, taxes and prices per city without a code change. Today each city is hard-coded.",
      teamId: "ops",
      effort: 3,
      dependsOn: [],
      requester: "City launch lead",
      objectiveId: "launch",
      value: 80,
      why: "The launch cannot happen without it.",
      level: "apm",
    },
    {
      id: "surge_pricing",
      title: "Urgency pricing",
      description:
        "Customers can pay extra for same-day jobs, and the extra goes to the tradesperson. Needs city configuration.",
      teamId: "ops",
      effort: 2,
      dependsOn: ["city_config"],
      requester: "Head of Product",
      objectiveId: "fill",
      value: 40,
      why: "Gives tradespeople a reason to accept urgent jobs.",
      level: "pm",
    },
    {
      id: "support_macros",
      title: "Support console revamp",
      description:
        "A new console for the support team with saved replies and a better search.",
      teamId: "ops",
      effort: 3,
      dependsOn: [],
      requester: "Support lead",
      objectiveId: null,
      value: 0,
      why: "Makes support faster, but none of the objectives is about support speed.",
      level: "apm",
    },
    {
      id: "launch_dashboard",
      title: "Launch health dashboard",
      description:
        "Supply, demand and fill rate per neighbourhood for a new city, updated daily. Needs city configuration.",
      teamId: "ops",
      effort: 1,
      dependsOn: ["city_config"],
      requester: "City launch lead",
      objectiveId: "launch",
      value: 25,
      why: "Cheap, and it tells the launch team where supply is missing.",
      level: "senior",
    },
  ],
  principle:
    "In a marketplace, supply-side enablers come first: schedule what other squads depend on at the start of the quarter, and measure results as jobs filled and customers who return, not as features shipped.",
};

const docketly: RoadmapSpec = {
  key: "docketly",
  industry: "saas",
  company: {
    name: "Docketly",
    industry: "SaaS B2B",
    stage: "Series A, 9,000 paying teams",
    description:
      "Shared task boards for small agencies. Teams start free and pay per seat for automations and reporting.",
  },
  title: "Docketly: plan the quarter",
  brief:
    "Three company objectives: get new teams to value faster, grow revenue from existing customers, and stop the outages that hit the last two months. Three squads, six sprints each. Pick the key results, then build a roadmap that ships what moves them, in an order the dependencies allow.",
  objectives: [
    {
      id: "activation",
      title: "Get new teams to value in their first week",
      description:
        "Raise the share of new workspaces with three active members in week one from 38% to 50%.",
    },
    {
      id: "expansion",
      title: "Grow revenue from existing customers",
      description: "Raise net revenue retention from 98% to 106%.",
    },
    {
      id: "reliability",
      title: "Be boringly reliable",
      description:
        "Two outages last quarter cost three enterprise renewals. Uptime was 99.5%; contracts promise 99.9%.",
    },
  ],
  keyResults: [
    {
      id: "activation_three_members",
      objectiveId: "activation",
      text: "New workspaces with three active members in week one: from 38% to 50%",
      rating: 2,
      why: "A measurable outcome and the best predictor that a team will stay.",
    },
    {
      id: "activation_first_board",
      objectiveId: "activation",
      text: "Median time from sign-up to a first shared board: from 3 days to 1 day",
      rating: 2,
      why: "A measurable outcome on how fast teams reach value.",
    },
    {
      id: "activation_signups",
      objectiveId: "activation",
      text: "Grow sign-ups by 30%",
      rating: 1,
      why: "Measurable, but more sign-ups do not mean more teams reach value.",
    },
    {
      id: "activation_tour",
      objectiveId: "activation",
      text: "Ship the new onboarding tour",
      rating: 0,
      why: OUTPUT,
    },
    {
      id: "activation_easy",
      objectiveId: "activation",
      text: "Make Docketly easier to start with",
      rating: 0,
      why: VAGUE,
    },
    {
      id: "expansion_nrr",
      objectiveId: "expansion",
      text: "Seats added by existing teams per quarter: from 4,200 to 6,000",
      rating: 2,
      why: "A measurable outcome and the main lever on net revenue retention.",
    },
    {
      id: "expansion_churn",
      objectiveId: "expansion",
      text: "Paying teams that cancel per quarter: from 4.1% to 3%",
      rating: 2,
      why: "A measurable outcome: retention is half of net revenue retention.",
    },
    {
      id: "expansion_qbr",
      objectiveId: "expansion",
      text: "Hold a business review with the top 100 accounts",
      rating: 1,
      why: "Countable, but it measures meetings, not what the accounts do afterwards.",
    },
    {
      id: "expansion_reporting",
      objectiveId: "expansion",
      text: "Launch the reporting add-on",
      rating: 0,
      why: OUTPUT,
    },
    {
      id: "expansion_logo",
      objectiveId: "expansion",
      text: "Sign 5 well-known logos",
      rating: 0,
      why: "New logos are not revenue from existing customers, and 'well-known' is a matter of taste.",
    },
    {
      id: "reliability_uptime",
      objectiveId: "reliability",
      text: "Monthly uptime: from 99.5% to 99.9%, every month of the quarter",
      rating: 2,
      why: "Measurable and exactly what the contracts promise.",
    },
    {
      id: "reliability_recovery",
      objectiveId: "reliability",
      text: "Median time to recover from an incident: from 95 minutes to 20",
      rating: 2,
      why: "A measurable outcome: short outages are what customers forgive.",
    },
    {
      id: "reliability_postmortems",
      objectiveId: "reliability",
      text: "Write a post-mortem for every incident",
      rating: 1,
      why: "Checkable, but it measures paperwork: incidents can keep happening.",
    },
    {
      id: "reliability_migration",
      objectiveId: "reliability",
      text: "Finish the database migration",
      rating: 0,
      why: OUTPUT,
    },
    {
      id: "reliability_rock",
      objectiveId: "reliability",
      text: "Have a rock-solid platform",
      rating: 0,
      why: VAGUE,
    },
  ],
  teams: [
    {
      id: "onboarding",
      name: "Onboarding squad",
      focus: "Sign-up, templates, invites",
    },
    { id: "revenue", name: "Revenue squad", focus: "Billing, add-ons, admin" },
    {
      id: "infra",
      name: "Infrastructure squad",
      focus: "Database, deploys, monitoring",
    },
  ],
  initiatives: [
    {
      id: "invite_flow",
      title: "Invite teammates during sign-up",
      description:
        "Asks for teammates' emails before the first board and lets them join without a password.",
      teamId: "onboarding",
      effort: 2,
      dependsOn: [],
      requester: "Growth lead",
      objectiveId: "activation",
      value: 75,
      why: "Goes straight at the metric: three active members in week one.",
      level: "apm",
    },
    {
      id: "templates",
      title: "Board templates by agency type",
      description:
        "Ready-made boards for design, marketing and development agencies.",
      teamId: "onboarding",
      effort: 3,
      dependsOn: [],
      requester: "Design lead",
      objectiveId: "activation",
      value: 55,
      why: "Shortens the time to a first useful board.",
      level: "apm",
    },
    {
      id: "mascot",
      title: "Animated mascot in onboarding",
      description:
        "A character that celebrates each step of the set-up. The founders like the idea.",
      teamId: "onboarding",
      effort: 2,
      dependsOn: [],
      requester: "CEO",
      objectiveId: null,
      value: 0,
      why: "Decoration: nothing suggests teams fail to activate for lack of a mascot.",
      level: "apm",
    },
    {
      id: "import",
      title: "Import from spreadsheets",
      description:
        "Turns a spreadsheet of tasks into a board. Needs the background jobs queue from infrastructure.",
      teamId: "onboarding",
      effort: 2,
      dependsOn: ["jobs_queue"],
      requester: "Sales lead",
      objectiveId: "activation",
      value: 50,
      why: "Removes the main reason agencies give for not switching, once the queue exists.",
      level: "pm",
    },
    {
      id: "seat_requests",
      title: "Seat requests",
      description:
        "Guests ask for a paid seat from inside a board, and an admin approves in one click.",
      teamId: "revenue",
      effort: 2,
      dependsOn: [],
      requester: "Head of Revenue",
      objectiveId: "expansion",
      value: 70,
      why: "Turns the demand for seats that already exists into revenue.",
      level: "apm",
    },
    {
      id: "usage_reports",
      title: "Workload reports add-on",
      description:
        "A paid add-on with hours per client and per person. Needs the background jobs queue to build reports.",
      teamId: "revenue",
      effort: 3,
      dependsOn: ["jobs_queue"],
      requester: "Head of Revenue",
      objectiveId: "expansion",
      value: 60,
      why: "A new reason to pay more, but it waits for the queue.",
      level: "apm",
    },
    {
      id: "annual_discount",
      title: "Annual plan discount page",
      description: "A page that offers two months free for paying yearly.",
      teamId: "revenue",
      effort: 1,
      dependsOn: [],
      requester: "Finance",
      objectiveId: "expansion",
      value: 20,
      why: "Small but cheap: annual plans cancel less.",
      level: "pm",
    },
    {
      id: "custom_invoices",
      title: "Custom invoice layouts",
      description:
        "One enterprise prospect wants invoices with their own layout and purchase order fields.",
      teamId: "revenue",
      effort: 3,
      dependsOn: [],
      requester: "Sales lead",
      objectiveId: null,
      value: 0,
      why: "A single prospect's request: it does not grow revenue from existing customers.",
      level: "senior",
    },
    {
      id: "db_failover",
      title: "Automatic database failover",
      description:
        "Both outages last quarter were a database node failing with no automatic switch.",
      teamId: "infra",
      effort: 3,
      dependsOn: [],
      requester: "Engineering manager",
      objectiveId: "reliability",
      value: 90,
      why: "Removes the cause of both outages.",
      level: "apm",
    },
    {
      id: "jobs_queue",
      title: "Background jobs queue",
      description:
        "Runs slow work outside the request. Imports and reports are waiting for it.",
      teamId: "infra",
      effort: 2,
      dependsOn: [],
      requester: "Engineering manager",
      objectiveId: "expansion",
      value: 10,
      why: "An enabler for two other squads: late in the quarter it blocks both.",
      level: "apm",
    },
    {
      id: "alerting",
      title: "On-call alerting and runbooks",
      description:
        "Alerts that page the right person, with a runbook for each. Today incidents are found by customers.",
      teamId: "infra",
      effort: 2,
      dependsOn: [],
      requester: "Support lead",
      objectiveId: "reliability",
      value: 50,
      why: "Cuts the time to recover, the other half of reliability.",
      level: "pm",
    },
    {
      id: "kubernetes",
      title: "Move to Kubernetes",
      description:
        "The infrastructure squad wants to replace the current deploy system. It works, but it is old.",
      teamId: "infra",
      effort: 4,
      dependsOn: [],
      requester: "Staff engineer",
      objectiveId: null,
      value: 0,
      why: "A rewrite with no link to the outages; it would add risk in a quarter about stability.",
      level: "senior",
    },
  ],
  principle:
    "Platform work that other squads wait for is a product decision, not an engineering detail: put it early, and judge every initiative by the key result it moves rather than by who asked for it.",
};

const potluck: RoadmapSpec = {
  key: "potluck",
  industry: "consumer",
  company: {
    name: "Potluck",
    industry: "Consumer",
    stage: "Series B, 180k weekly cooks",
    description:
      "A social cooking app: follow home cooks, save recipes and order ingredient boxes for the dishes you like.",
  },
  title: "Potluck: plan the autumn quarter",
  brief:
    "Three company objectives: more people cooking every week, more ingredient boxes per buyer, and more cooks publishing recipes. Three squads, six sprints each. Pick the key results, then build a roadmap that ships what moves them, in an order the dependencies allow.",
  objectives: [
    {
      id: "cooks",
      title: "More people cooking every week",
      description:
        "Grow weekly cooks (people who mark a recipe as cooked) from 180k to 230k.",
    },
    {
      id: "boxes",
      title: "More boxes per buyer",
      description:
        "Raise ingredient boxes per buyer per month from 1.8 to 2.4.",
    },
    {
      id: "creators",
      title: "More cooks publishing",
      description:
        "Grow creators who publish at least one recipe a week from 2,100 to 3,000.",
    },
  ],
  keyResults: [
    {
      id: "cooks_weekly",
      objectiveId: "cooks",
      text: "Savers who cook a saved recipe within 7 days: from 14% to 22%",
      rating: 2,
      why: "A measurable outcome on the gap between saving and cooking.",
    },
    {
      id: "cooks_second_week",
      objectiveId: "cooks",
      text: "New cooks who cook again the following week: from 31% to 40%",
      rating: 2,
      why: "A measurable outcome: weekly cooks grow when the habit forms.",
    },
    {
      id: "cooks_time",
      objectiveId: "cooks",
      text: "Increase time spent in the feed by 20%",
      rating: 1,
      why: "Measurable, but scrolling is not cooking, and it can even replace it.",
    },
    {
      id: "cooks_planner",
      objectiveId: "cooks",
      text: "Launch the weekly meal planner",
      rating: 0,
      why: OUTPUT,
    },
    {
      id: "cooks_followers",
      objectiveId: "cooks",
      text: "Reach 500k followers on social media",
      rating: 0,
      why: "A vanity number outside the product.",
    },
    {
      id: "boxes_per_buyer",
      objectiveId: "boxes",
      text: "Buyers who order a second box within 30 days: from 35% to 48%",
      rating: 2,
      why: "A measurable outcome on the step that drives boxes per buyer.",
    },
    {
      id: "boxes_late",
      objectiveId: "boxes",
      text: "Boxes delivered late or incomplete: from 7% to 2%",
      rating: 2,
      why: "A measurable outcome on the main reason buyers do not order again.",
    },
    {
      id: "boxes_promos",
      objectiveId: "boxes",
      text: "Send three promotions a month to every buyer",
      rating: 0,
      why: OUTPUT,
    },
    {
      id: "boxes_views",
      objectiveId: "boxes",
      text: "Increase views of the box page by 50%",
      rating: 1,
      why: "Measurable, but views are activity, not orders.",
    },
    {
      id: "boxes_best",
      objectiveId: "boxes",
      text: "Offer the best boxes on the market",
      rating: 0,
      why: VAGUE,
    },
    {
      id: "creators_weekly",
      objectiveId: "creators",
      text: "New creators who publish a second recipe within 14 days: from 28% to 40%",
      rating: 2,
      why: "A measurable outcome on where new creators drop off.",
    },
    {
      id: "creators_time",
      objectiveId: "creators",
      text: "Median time to publish a recipe: from 25 minutes to 10",
      rating: 2,
      why: "A measurable outcome on the effort that keeps cooks from publishing weekly.",
    },
    {
      id: "creators_signups",
      objectiveId: "creators",
      text: "Sign up 5,000 new creator accounts",
      rating: 1,
      why: "Countable, but accounts that never publish add nothing.",
    },
    {
      id: "creators_program",
      objectiveId: "creators",
      text: "Launch the creator programme",
      rating: 0,
      why: OUTPUT,
    },
    {
      id: "creators_happy",
      objectiveId: "creators",
      text: "Make creators feel valued",
      rating: 0,
      why: VAGUE,
    },
  ],
  teams: [
    {
      id: "feed",
      name: "Feed squad",
      focus: "Home feed, recipes, saved lists",
    },
    {
      id: "commerce",
      name: "Commerce squad",
      focus: "Boxes, checkout, delivery",
    },
    {
      id: "creator",
      name: "Creator squad",
      focus: "Publishing tools, profiles, payouts",
    },
  ],
  initiatives: [
    {
      id: "cook_tonight",
      title: "Cook-tonight reminders",
      description:
        "On the evening after saving a recipe, a reminder with the steps and what to buy.",
      teamId: "feed",
      effort: 2,
      dependsOn: [],
      requester: "Growth lead",
      objectiveId: "cooks",
      value: 70,
      why: "Aims at the gap between saving a recipe and cooking it.",
      level: "apm",
    },
    {
      id: "meal_planner",
      title: "Weekly meal planner",
      description:
        "Drag saved recipes into the days of the week, and order one box for the whole plan. Needs multi-recipe boxes.",
      teamId: "feed",
      effort: 3,
      dependsOn: ["multi_box"],
      requester: "Head of Product",
      objectiveId: "cooks",
      value: 65,
      why: "Builds the weekly habit and feeds box orders, once a box can hold several recipes.",
      level: "apm",
    },
    {
      id: "stories",
      title: "24-hour stories",
      description:
        "Short videos that disappear after a day, like on social networks. The CEO wants parity.",
      teamId: "feed",
      effort: 3,
      dependsOn: [],
      requester: "CEO",
      objectiveId: null,
      value: 0,
      why: "More scrolling, no more cooking: none of the objectives asks for it.",
      level: "apm",
    },
    {
      id: "shopping_list",
      title: "Shared shopping list",
      description:
        "A list built from saved recipes that a household edits together.",
      teamId: "feed",
      effort: 2,
      dependsOn: [],
      requester: "Design lead",
      objectiveId: "cooks",
      value: 40,
      why: "Helps people cook without a box, a smaller lever than the reminders.",
      level: "pm",
    },
    {
      id: "multi_box",
      title: "Multi-recipe boxes",
      description:
        "One box with the ingredients for several recipes. Today each box is one recipe.",
      teamId: "commerce",
      effort: 2,
      dependsOn: [],
      requester: "Head of Commerce",
      objectiveId: "boxes",
      value: 35,
      why: "Useful on its own and the base of the meal planner: it goes first.",
      level: "apm",
    },
    {
      id: "delivery_tracking",
      title: "Delivery tracking and substitutions",
      description:
        "Live tracking, and buyers choose a replacement when an ingredient is missing.",
      teamId: "commerce",
      effort: 3,
      dependsOn: [],
      requester: "Support lead",
      objectiveId: "boxes",
      value: 75,
      why: "Late and incomplete boxes are the main reason buyers do not order again.",
      level: "apm",
    },
    {
      id: "wine_pairing",
      title: "Wine pairing shop",
      description:
        "A partner would sell wine next to each recipe. Needs age checks at checkout.",
      teamId: "commerce",
      effort: 3,
      dependsOn: [],
      requester: "Partnerships lead",
      objectiveId: null,
      value: 0,
      why: "A new business line: it sells wine, not more ingredient boxes per buyer.",
      level: "pm",
    },
    {
      id: "box_subscription",
      title: "Weekly box subscription",
      description:
        "Buyers get a box every week from their meal plan and can skip any week. Needs the weekly meal planner.",
      teamId: "commerce",
      effort: 2,
      dependsOn: ["meal_planner"],
      requester: "Head of Commerce",
      objectiveId: "boxes",
      value: 60,
      why: "A strong lever, but it sits behind two other initiatives and barely fits in the quarter.",
      level: "senior",
    },
    {
      id: "quick_publish",
      title: "Publish from a photo",
      description:
        "A creator photographs handwritten notes or dictates the steps, and the app drafts the recipe.",
      teamId: "creator",
      effort: 3,
      dependsOn: [],
      requester: "Creator lead",
      objectiveId: "creators",
      value: 80,
      why: "Cuts the time to publish, the main reason creators stop after one recipe.",
      level: "apm",
    },
    {
      id: "creator_stats",
      title: "Creator stats",
      description:
        "Shows creators how many people saved and cooked each recipe.",
      teamId: "creator",
      effort: 2,
      dependsOn: [],
      requester: "Creator lead",
      objectiveId: "creators",
      value: 50,
      why: "Gives creators a reason to come back and publish again.",
      level: "apm",
    },
    {
      id: "box_revenue_share",
      title: "Box revenue share",
      description:
        "Creators earn a share of every box sold from their recipes. Needs multi-recipe boxes to split a box between creators.",
      teamId: "creator",
      effort: 2,
      dependsOn: ["multi_box"],
      requester: "Head of Commerce",
      objectiveId: "creators",
      value: 45,
      why: "A real incentive, but less urgent than making publishing easy.",
      level: "pm",
    },
    {
      id: "verified_badge",
      title: "Verified chef badge",
      description:
        "A badge for professional chefs. Three well-known chefs asked for it.",
      teamId: "creator",
      effort: 1,
      dependsOn: [],
      requester: "Partnerships lead",
      objectiveId: null,
      value: 0,
      why: "It pleases three accounts; it does not make more cooks publish every week.",
      level: "senior",
    },
  ],
  principle:
    "Measure the behaviour you want (cooking, ordering again, publishing), not the attention around it, and order the roadmap so that what several squads build on ships first.",
};

export const roadmapSpecs: readonly RoadmapSpec[] = [
  coinpath,
  fixly,
  docketly,
  potluck,
];
