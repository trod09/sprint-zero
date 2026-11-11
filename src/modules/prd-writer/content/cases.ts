/**
 * Hand-written PRD Writer specifications. Every number in the documents is
 * a `{slot}` drawn from the seed; the baseline and target range the scoring
 * checks are computed from the same numbers.
 *
 * Evidence strength and risk relevance are on a 0-2 scale. Requirements go
 * in "v1", "later" or "out" (a non-goal), as the documents justify.
 */
import type { PrdSpec } from "../generator";

const trailheadOffline: PrdSpec = {
  id: "prd-writer-trailhead-offline-maps",
  industry: "consumer",
  seed: 61_101,
  difficulty: "apm",
  feature: "Offline maps",
  company: {
    name: "Trailhead",
    industry: "Outdoor and hiking app",
    stage: "Series A, 2M monthly hikers",
    description:
      "Trailhead helps hikers find trails, follow them on a map and record their hikes.",
  },
  title: "Write the one-pager for offline maps",
  brief:
    "Your manager asked you for a one-pager on offline maps before the team starts building next week. Read the documents, then write the problem, the goal and how you will measure it, what is in and out of the first version, and the main risks.",
  numbers: {
    noSignal: { min: 35, max: 45, step: 1 },
    weeks: { min: 8, max: 10, step: 1 },
    baseline: { min: 58, max: 64, step: 1 },
    lowSignal: { min: 31, max: 38, step: 1 },
    lift: { min: 6, max: 9, step: 1 },
    tickets: { min: 120, max: 180, step: 10 },
  },
  derived: (v) => ({ goal: v.baseline + v.lift }),
  documents: [
    {
      id: "memo",
      kind: "memo",
      title: "Offline maps for the summer release",
      from: "Head of Product",
      body: 'Hikers lose signal on {noSignal}% of the trails we track, and "the map stopped working on the trail" is the top reason for one-star reviews this quarter. Offline maps go in the summer release, which ships in {weeks} weeks. The team is two mobile engineers and one designer. We will judge the launch over the first quarter after it ships.',
    },
    {
      id: "data",
      kind: "data",
      title: "Trail completion, last month",
      from: "Data team",
      body: "Trail completion (share of started trail recordings that reach the end of the trail): {baseline}% across all trails. On trails without signal: {lowSignal}%.",
    },
    {
      id: "ceo",
      kind: "email",
      title: "Re: offline maps",
      from: "CEO",
      body: "If offline maps work, completion should get to around {goal}%, which is what we see in regions with good coverage. Let's aim for that.",
    },
    {
      id: "licensing",
      kind: "notes",
      title: "Map tile licence",
      from: "Legal",
      body: "Our map provider lets us store tiles on the device for up to 30 days, after which they must be deleted or refreshed. Downloading whole countries or regions needs a new contract, which we do not have.",
    },
    {
      id: "support",
      kind: "notes",
      title: "Support themes",
      from: "Support lead",
      body: "{tickets} tickets last quarter were about the app taking too much storage on the phone.",
    },
  ],
  evidence: [
    {
      id: "reviews",
      text: "Maps that stop working on the trail are the top reason for one-star reviews.",
      strength: 2,
      why: "Direct, recent and frequent: it names the problem in the users' words.",
    },
    {
      id: "completion_gap",
      text: "Completion is {lowSignal}% on trails without signal, against {baseline}% overall.",
      strength: 2,
      why: "Shows the problem costs the outcome you care about, and by how much.",
    },
    {
      id: "no_signal_share",
      text: "Hikers lose signal on {noSignal}% of the trails we track.",
      strength: 2,
      why: "Shows how many hikes the problem can touch.",
    },
    {
      id: "competitors",
      text: "Other hiking apps already offer offline maps.",
      strength: 1,
      why: "Context, not proof that our users have the problem.",
    },
    {
      id: "dark_mode",
      text: "Hikers on the forum asked for a dark mode.",
      strength: 0,
      why: "Unrelated to offline maps.",
    },
    {
      id: "ceo_hikes",
      text: "The CEO uses the app on weekend hikes.",
      strength: 0,
      why: "An anecdote from one person, and not a user problem.",
    },
  ],
  metrics: [
    {
      id: "completion",
      name: "Trail completion",
      definition:
        "Share of started trail recordings that reach the end of the trail.",
      unit: "%",
      note: "The outcome the problem hurts, with a baseline ({baseline}%) and a target from the CEO (around {goal}%).",
    },
    {
      id: "downloads",
      name: "Offline downloads",
      definition: "Number of maps downloaded for offline use.",
      unit: "downloads",
      note: "Shows adoption, not whether hikers finish their trails. A good secondary metric.",
    },
    {
      id: "rating",
      name: "App store rating",
      definition: "Average rating in the app stores.",
      unit: "stars",
      note: "Slow and noisy; many things move it.",
    },
    {
      id: "dau",
      name: "Daily active users",
      definition: "Hikers who open the app each day.",
      unit: "users",
      note: "Depends on the season and the weather more than on this feature.",
    },
  ],
  primaryMetricId: "completion",
  baseline: (v) => v.baseline,
  targetRange: (v) => [v.goal - 2, v.goal + 2],
  horizon: "quarter",
  requirements: [
    {
      id: "download_trail",
      title: "Download a trail's map",
      description: "Save the map area around a trail before the hike.",
      bucket: "v1",
      why: "The core of the feature.",
    },
    {
      id: "offline_position",
      title: "Position on the offline map",
      description: "Show the hiker's position and the route without signal.",
      bucket: "v1",
      why: "Without it, a downloaded map does not keep anyone on the trail.",
    },
    {
      id: "manage_storage",
      title: "Manage downloaded maps",
      description: "See how much space each map takes and delete it.",
      bucket: "v1",
      why: "Storage is already a top support theme; downloads would make it worse.",
    },
    {
      id: "expiry",
      title: "Map expiry",
      description:
        "Refresh or delete maps older than 30 days, and tell the hiker.",
      bucket: "v1",
      why: "Required by the map licence, so it cannot wait.",
    },
    {
      id: "auto_download",
      title: "Automatic downloads",
      description: "Download maps of saved trails on wifi without asking.",
      bucket: "later",
      why: "Useful, but not needed to solve the problem, and risky for storage.",
    },
    {
      id: "offline_search",
      title: "Offline search",
      description: "Search for new trails while offline.",
      bucket: "later",
      why: "Hikers choose trails at home, with signal; this can wait.",
    },
    {
      id: "country_download",
      title: "Download a whole country",
      description: "Save every map of a country or region at once.",
      bucket: "out",
      why: "The licence does not allow it. Say so explicitly as a non-goal.",
    },
    {
      id: "live_sharing",
      title: "Live location sharing",
      description: "Share your position with friends during the hike.",
      bucket: "out",
      why: "Needs signal, which is the whole problem, and is a different feature.",
    },
  ],
  risks: [
    {
      id: "storage",
      title: "Phones run out of storage",
      description: "Downloaded maps fill the phone.",
      relevance: 2,
      why: "Already a top support theme, and downloads make it worse.",
    },
    {
      id: "licence",
      title: "Breaking the map licence",
      description: "Tiles kept longer than 30 days.",
      relevance: 2,
      why: "A legal risk with a clear rule to design for.",
    },
    {
      id: "battery",
      title: "Battery drain",
      description: "GPS without signal uses more battery.",
      relevance: 2,
      why: "A dead phone on a trail is a safety problem, not just a bad review.",
    },
    {
      id: "stale_maps",
      title: "Out-of-date trails",
      description: "A trail is rerouted after the map was downloaded.",
      relevance: 1,
      why: "Real but rare, and the 30-day refresh limits it.",
    },
    {
      id: "competitor",
      title: "A competitor launches first",
      description: "Another app ships a similar feature before us.",
      relevance: 0,
      why: "Others already have offline maps; it does not change what we build.",
    },
    {
      id: "premium",
      title: "Fewer premium upgrades",
      description: "Hikers stop upgrading if offline maps are free.",
      relevance: 0,
      why: "The documents say nothing about pricing this feature.",
    },
  ],
  ideal: {
    problem:
      "Hikers lose signal on {noSignal}% of our trails, and when they do the map stops working: it is the top reason for one-star reviews, and completion drops to {lowSignal}% on those trails against {baseline}% overall.",
    metrics:
      "Primary metric: trail completion, from {baseline}% to around {goal}% within the first quarter after launch. Offline downloads are a useful adoption metric, but they do not show hikers finish their trails.",
    scope:
      "Version 1: download a trail's map, see your position on it offline, manage storage and handle the 30-day expiry the licence requires. Later: automatic downloads and offline search. Non-goals: whole-country downloads (not allowed by the licence) and live location sharing.",
    risks:
      "Storage (already a support theme), the licence's 30-day rule, and battery drain, which on a trail is a safety issue.",
  },
  principle:
    "A good one-pager ties the problem to evidence, measures the outcome rather than the output, and writes down what it will not do and why.",
};

const coinpathSavings: PrdSpec = {
  id: "prd-writer-coinpath-round-ups",
  industry: "fintech",
  seed: 61_202,
  difficulty: "pm",
  feature: "Automatic savings with round-ups",
  company: {
    name: "Coinpath",
    industry: "Personal finance app",
    stage: "Series B, 900k monthly users",
    description:
      "Coinpath is a budgeting app with a debit card, a main account and savings pots, through a partner bank.",
  },
  title: "Write the PRD for automatic savings",
  brief:
    "Leadership wants more users to save. You own the savings team and need a PRD the team, compliance and the partner bank can agree on. The documents disagree in places; decide what goes in the first version.",
  numbers: {
    baseline: { min: 18, max: 24, step: 1 },
    churn: { min: 2, max: 3, step: 0.5 },
    weeks: { min: 10, max: 12, step: 1 },
    approval: { min: 14, max: 18, step: 1 },
    overdrafts: { min: 40, max: 80, step: 5 },
    n: { min: 8, max: 10, step: 1 },
    total: { min: 12, max: 12, step: 1 },
  },
  derived: (v) => ({ doubled: v.baseline * 2 }),
  documents: [
    {
      id: "memo",
      kind: "memo",
      title: "Savings: the opportunity",
      from: "VP Product",
      body: "Users who save every month churn {churn}x less than users who don't. We want an automatic way to save live in {weeks} weeks, before the board meeting. Team: three engineers and one designer, with a compliance reviewer shared with other teams.",
    },
    {
      id: "data",
      kind: "data",
      title: "Savings activity, last month",
      from: "Data team",
      body: "Monthly active savers (users who moved money into a savings pot in the month): {baseline}% of monthly active users.",
    },
    {
      id: "cfo",
      kind: "email",
      title: "Board goal",
      from: "CFO",
      body: "The board's goal is simple: double the share of monthly active savers within two quarters of launch.",
    },
    {
      id: "compliance",
      kind: "notes",
      title: "What we can and cannot do",
      from: "Compliance",
      body: "Transfers between a user's own Coinpath accounts and pots need no new approval. Any other new transfer type needs the partner bank's approval, which takes about {approval} weeks. Paying interest on pots requires a banking licence we do not have.",
    },
    {
      id: "support",
      kind: "notes",
      title: "Support themes",
      from: "Support lead",
      body: "{overdrafts} tickets last quarter came from users whose main account went overdrawn after a scheduled transfer to savings.",
    },
  ],
  evidence: [
    {
      id: "few_savers",
      text: "Only {baseline}% of monthly users moved money to savings last month.",
      strength: 2,
      why: "Sizes the problem with the metric you will move.",
    },
    {
      id: "churn_link",
      text: "Users who save every month churn {churn}x less.",
      strength: 2,
      why: "Ties the user problem to the business outcome.",
    },
    {
      id: "forget",
      text: "{n} of {total} users we interviewed said they mean to save but forget.",
      strength: 2,
      why: "Explains why they do not save, and points straight at automation.",
    },
    {
      id: "press",
      text: "Savings features are a hot topic in the fintech press.",
      strength: 1,
      why: "Context, not evidence about our users.",
    },
    {
      id: "crypto",
      text: "A competitor launched crypto savings.",
      strength: 0,
      why: "Says nothing about our users' problem.",
    },
    {
      id: "theme",
      text: "Users love the new dark theme.",
      strength: 0,
      why: "Unrelated.",
    },
  ],
  metrics: [
    {
      id: "active_savers",
      name: "Monthly active savers",
      definition:
        "Share of monthly active users who moved money into a savings pot in the month.",
      unit: "%",
      note: "The board's goal, with a baseline of {baseline}% to double.",
    },
    {
      id: "total_saved",
      name: "Total amount saved",
      definition: "Money held in savings pots across all users.",
      unit: "USD",
      note: "A few large savers can move it without more people saving.",
    },
    {
      id: "round_ups_on",
      name: "Users with round-ups on",
      definition: "Number of users who switched round-ups on.",
      unit: "users",
      note: "Adoption of the feature, not the habit: people can switch it on and off.",
    },
    {
      id: "app_opens",
      name: "App opens",
      definition: "Sessions per user per week.",
      unit: "sessions",
      note: "Automatic saving should need fewer visits, not more.",
    },
  ],
  primaryMetricId: "active_savers",
  baseline: (v) => v.baseline,
  targetRange: (v) => [v.doubled - 3, v.doubled + 3],
  horizon: "half_year",
  requirements: [
    {
      id: "round_ups",
      title: "Round-ups",
      description:
        "Round card purchases up and move the change to a savings pot.",
      bucket: "v1",
      why: "Automatic, small amounts, and a transfer between the user's own accounts, so no bank approval.",
    },
    {
      id: "pause",
      title: "Pause and resume",
      description: "Switch round-ups off and on at any time.",
      bucket: "v1",
      why: "People must stay in control of their money, or they will not trust it.",
    },
    {
      id: "balance_guard",
      title: "Low-balance guard",
      description: "Skip round-ups when the main account is below a threshold.",
      bucket: "v1",
      why: "Overdrafts after transfers to savings are already a support theme.",
    },
    {
      id: "external_transfers",
      title: "Save to another bank",
      description: "Send savings to an account at another bank.",
      bucket: "later",
      why: "A new transfer type: bank approval takes longer than the {weeks} weeks you have.",
    },
    {
      id: "multiplier",
      title: "Round-up multiplier",
      description: "Save two or three times the change.",
      bucket: "later",
      why: "A good second step once the habit exists.",
    },
    {
      id: "named_goals",
      title: "Named goals",
      description: "Goals with a name and a progress bar.",
      bucket: "later",
      why: "Nice motivation, not needed to start saving.",
    },
    {
      id: "interest",
      title: "Interest on pots",
      description: "Pay interest on money in savings pots.",
      bucket: "out",
      why: "Needs a banking licence Coinpath does not have.",
    },
    {
      id: "crypto",
      title: "Invest in crypto",
      description: "Invest round-ups in crypto.",
      bucket: "out",
      why: "Off the problem, and a different regulatory world.",
    },
  ],
  risks: [
    {
      id: "overdraft",
      title: "Overdrafts",
      description: "Round-ups push the main account below zero.",
      relevance: 2,
      why: "Already a support theme with scheduled transfers.",
    },
    {
      id: "trust",
      title: "Money feels like it disappears",
      description: "Users do not understand where small amounts went.",
      relevance: 2,
      why: "Automatic transfers break trust if they are not visible and reversible.",
    },
    {
      id: "approval_delay",
      title: "Partner bank approval",
      description:
        "Something in scope needs bank approval that will not arrive in time.",
      relevance: 2,
      why: "Approval takes {approval} weeks; scope must stay within the user's own accounts.",
    },
    {
      id: "switch_off",
      title: "Users switch it off",
      description: "People try round-ups and then turn them off.",
      relevance: 1,
      why: "Worth watching, and the reason to measure savers rather than switches.",
    },
    {
      id: "competitor",
      title: "Competitor launches crypto savings",
      description: "A rival's crypto product gets attention.",
      relevance: 0,
      why: "Does not change this plan.",
    },
    {
      id: "fees",
      title: "Card fees change",
      description: "Card network fees go up.",
      relevance: 0,
      why: "Nothing in the documents points to it.",
    },
  ],
  ideal: {
    problem:
      "Only {baseline}% of users save in a month, and most say they mean to save but forget. Savers churn {churn}x less, so helping people save without thinking is good for them and for Coinpath.",
    metrics:
      "Primary metric: monthly active savers, from {baseline}% to about {doubled}% within two quarters of launch, as the board asked. Track users with round-ups on and the amount saved as secondary metrics.",
    scope:
      "Version 1: round-ups between the user's own accounts, pause and resume, and a low-balance guard. Later: saving to another bank (bank approval takes {approval} weeks), multipliers and named goals. Non-goals: interest (no banking licence) and crypto.",
    risks:
      "Overdrafts, users feeling money disappears, and anything that needs partner bank approval sneaking into scope.",
  },
  principle:
    "Constraints belong in the PRD: what legal, compliance or partners rule out is as important as what the team will build.",
};

const shiftlySwaps: PrdSpec = {
  id: "prd-writer-shiftly-shift-swaps",
  industry: "saas",
  seed: 61_303,
  difficulty: "senior",
  feature: "Shift swaps",
  company: {
    name: "Shiftly",
    industry: "Workforce scheduling for restaurants and retail",
    stage: "Series B, 4,000 business customers",
    description:
      "Shiftly lets managers build staff schedules and lets hourly workers see their shifts on their phone.",
  },
  title: "Write the PRD for shift swaps",
  brief:
    "Sales has a large chain ready to sign if shift swaps ship, legal has concerns, and another team owns payroll. You are the senior PM writing the PRD that leadership will approve. Make the scope and the trade-offs explicit.",
  numbers: {
    baseline: { min: 6, max: 9, step: 0.5 },
    hours: { min: 5, max: 7, step: 1 },
    weeks: { min: 6, max: 8, step: 1 },
    states: { min: 4, max: 6, step: 1 },
    n: { min: 11, max: 13, step: 1 },
    total: { min: 15, max: 15, step: 1 },
  },
  derived: (v) => ({ half: v.baseline / 2 }),
  documents: [
    {
      id: "memo",
      kind: "memo",
      title: "Why shift swaps",
      from: "Head of Product",
      body: "{baseline}% of shifts went uncovered last month, mostly after a late change of plans. Managers spend {hours} hours a week on average fixing schedules by phone and chat. A chain with 420 locations will sign if swaps ship in {weeks} weeks; they will review the pilot three months after rollout.",
    },
    {
      id: "chain",
      kind: "email",
      title: "What the chain expects",
      from: "Head of Sales",
      body: "Their operations director wants uncovered shifts cut in half. They also asked for a marketplace where any employee in the region can pick up open shifts at any location. Can we include that?",
    },
    {
      id: "legal",
      kind: "notes",
      title: "Predictive scheduling laws",
      from: "Legal",
      body: "In {states} states where our customers operate, changing a shift less than 7 days ahead means premium pay, unless the employee asked for the change. Employee-requested swaps are exempt if we keep a record of who asked, for 3 years. Workers in some roles (food handling, alcohol sales) need a certificate.",
    },
    {
      id: "engineering",
      kind: "notes",
      title: "Dependencies",
      from: "Engineering lead",
      body: "Payroll export belongs to the payroll team, which is booked until next quarter. Anything that changes pay calculations has to wait for them.",
    },
  ],
  evidence: [
    {
      id: "uncovered",
      text: "{baseline}% of shifts went uncovered last month, mostly after a late change.",
      strength: 2,
      why: "The outcome the business and the chain care about, with a number.",
    },
    {
      id: "manager_hours",
      text: "Managers spend {hours} hours a week fixing schedules by phone and chat.",
      strength: 2,
      why: "Shows the cost of today's workaround for the buyer.",
    },
    {
      id: "approval_gap",
      text: "{n} of {total} workers we interviewed found someone to cover but could not get approval in time.",
      strength: 2,
      why: "Explains why shifts go uncovered: the bottleneck is approval, not finding a colleague.",
    },
    {
      id: "chain_deal",
      text: "A 420-location chain will sign if swaps ship.",
      strength: 1,
      why: "A strong commercial reason, but not evidence of the user problem.",
    },
    {
      id: "marketplace_competitor",
      text: "A competitor offers a regional shift marketplace.",
      strength: 0,
      why: "Says nothing about our users' problem.",
    },
    {
      id: "smartwatch",
      text: "Workers want to see their schedule on a smartwatch.",
      strength: 0,
      why: "Unrelated to covering shifts.",
    },
  ],
  metrics: [
    {
      id: "uncovered_shifts",
      name: "Uncovered shifts",
      definition: "Share of scheduled shifts nobody worked.",
      unit: "%",
      note: "The problem itself, the chain's goal, and a baseline of {baseline}%.",
    },
    {
      id: "swaps_completed",
      name: "Swaps completed",
      definition: "Number of approved swaps.",
      unit: "swaps",
      note: "An output: more swaps is good only if fewer shifts go uncovered.",
    },
    {
      id: "manager_hours",
      name: "Manager hours on schedules",
      definition: "Hours a week managers spend changing schedules.",
      unit: "hours",
      note: "A good secondary metric, but self-reported and noisy.",
    },
    {
      id: "deal_signed",
      name: "Chain contract signed",
      definition: "Whether the 420-location chain signs.",
      unit: "deal",
      note: "A business milestone, not a product metric.",
    },
  ],
  primaryMetricId: "uncovered_shifts",
  baseline: (v) => v.baseline,
  targetRange: (v) => [v.half - 0.5, v.half + 0.5],
  horizon: "quarter",
  requirements: [
    {
      id: "request_swap",
      title: "Request a swap",
      description: "A worker asks a named coworker to take a shift.",
      bucket: "v1",
      why: "The core flow, and it records that the employee asked, which keeps swaps exempt from premium pay.",
    },
    {
      id: "quick_approval",
      title: "One-tap approval",
      description:
        "The manager approves or rejects in one tap, with a reminder before the shift.",
      bucket: "v1",
      why: "Approval is the bottleneck the interviews found.",
    },
    {
      id: "audit_log",
      title: "Request record",
      description: "Keep who asked for each change, for 3 years.",
      bucket: "v1",
      why: "The law requires it for swaps to stay exempt from premium pay.",
    },
    {
      id: "certificates",
      title: "Certificate check",
      description: "Only offer a shift to coworkers certified for the role.",
      bucket: "v1",
      why: "A swap to an uncertified worker is a compliance problem for the customer.",
    },
    {
      id: "marketplace",
      title: "Regional marketplace",
      description:
        "Any employee in the region can pick up open shifts at any location.",
      bucket: "later",
      why: "The chain asked for it, but it is a bigger product, and not what makes shifts go uncovered. Agree it as a later phase.",
    },
    {
      id: "auto_approve",
      title: "Auto-approval",
      description:
        "Approve swaps between qualified coworkers without the manager.",
      bucket: "later",
      why: "A good next step once managers trust the checks.",
    },
    {
      id: "premium_pay",
      title: "Premium pay in payroll",
      description:
        "Calculate predictive-scheduling premium pay in the payroll export.",
      bucket: "out",
      why: "Employee-requested swaps are exempt, and payroll belongs to a team booked until next quarter. Write it down as a non-goal.",
    },
    {
      id: "smartwatch_app",
      title: "Smartwatch app",
      description: "See shifts on a smartwatch.",
      bucket: "out",
      why: "Unrelated to covering shifts.",
    },
  ],
  risks: [
    {
      id: "legal",
      title: "Premium pay liability",
      description:
        "A swap is not clearly requested by the employee and triggers premium pay.",
      relevance: 2,
      why: "The legal exposure in {states} states; the record of who asked is the mitigation.",
    },
    {
      id: "uncertified",
      title: "Uncertified cover",
      description: "Someone without the required certificate covers a shift.",
      relevance: 2,
      why: "A compliance problem for the customer, prevented by the certificate check.",
    },
    {
      id: "slow_approval",
      title: "Managers approve too late",
      description: "Swaps fail because managers do not respond in time.",
      relevance: 2,
      why: "The root cause of uncovered shifts today; if it stays, the feature fails.",
    },
    {
      id: "payroll",
      title: "Payroll dependency",
      description: "Something in scope needs the payroll team this quarter.",
      relevance: 1,
      why: "Avoided by keeping pay calculations out of scope.",
    },
    {
      id: "scope_creep",
      title: "The chain wants the marketplace first",
      description: "The deal is held up until the marketplace ships.",
      relevance: 1,
      why: "A commercial risk to manage with sales, not a product risk of the swap flow.",
    },
    {
      id: "competitor",
      title: "Competitor marketplace",
      description: "A rival's marketplace wins deals.",
      relevance: 0,
      why: "Does not change what solves this problem.",
    },
  ],
  ideal: {
    problem:
      "{baseline}% of shifts go uncovered, mostly after late changes, and managers spend {hours} hours a week fixing schedules by phone. Workers usually find someone to cover; what fails is getting approval in time.",
    metrics:
      "Primary metric: uncovered shifts, from {baseline}% to about {half}% within a quarter of rollout, which is what the chain will review. Manager hours and swaps completed are secondary.",
    scope:
      "Version 1: request a swap with a named coworker, one-tap approval with reminders, a 3-year record of who asked, and a certificate check. Later: the regional marketplace and auto-approval. Non-goals: premium pay in payroll (swaps requested by employees are exempt, and payroll is booked) and a smartwatch app.",
    risks:
      "Premium pay liability if a swap is not clearly employee-requested, uncertified cover, and managers who still approve too late.",
  },
  principle:
    "A senior PRD makes trade-offs explicit: it names who asked for what, what was deferred and why, so leadership approves a decision instead of a wish list.",
};

export const prdSpecs: readonly PrdSpec[] = [
  trailheadOffline,
  coinpathSavings,
  shiftlySwaps,
];
