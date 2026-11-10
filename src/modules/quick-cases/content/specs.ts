/**
 * Hand-written Quick Case specifications, one per kind. Words live here;
 * every number is drawn from the seed, and where a decision depends on the
 * numbers the rating is a function of them.
 *
 * Ratings: 3 best, 2 defensible, 1 weak, 0 harmful.
 */
import { count, money, type QuickSpec, type Values } from "../generator";

/** Rates options by a measure: the best gets 3, then 2, 1 and 0. */
function rankRating(measures: Record<string, number>, id: string): number {
  const ordered = Object.entries(measures).sort((a, b) => b[1] - a[1]);
  return Math.max(0, 3 - ordered.findIndex(([key]) => key === id));
}

/** True when the two best measures are too close to call. */
function tooClose(measures: number[], margin: number): boolean {
  const [first, second] = [...measures].sort((a, b) => b - a);
  return first / second < 1 + margin;
}

// ---------------------------------------------------------------- pricing

const PRICES = [40, 49, 59, 75] as const;
const stay = (v: Values, price: number) =>
  price === 40 ? 100 : v[`stay${price}`];
const revenue = (v: Values, price: number) => price * stay(v, price);
const revenueByPrice = (v: Values) =>
  Object.fromEntries(PRICES.map((p) => [`price_${p}`, revenue(v, p)]));
const bestPrice = (v: Values) =>
  [...PRICES].sort((a, b) => revenue(v, b) - revenue(v, a))[0];

const pricing: QuickSpec = {
  key: "rosterly-pricing",
  kind: "pricing",
  industry: "saas",
  company: {
    name: "Rosterly",
    industry: "SaaS B2B",
    stage: "Series A, 6,000 paying locations",
    description:
      "Shift scheduling for restaurants and shops. Every location pays the same flat price per month, whatever its size.",
  },
  title: "Rosterly: time to change the price",
  brief:
    "Rosterly has charged $40 per location per month since launch. Costs are up, the board wants 15% more revenue from the customers it already has, and the CEO asks you for a pricing proposal by the end of the day. You have a survey, usage data and a note from finance.",
  numbers: {
    stay49: { min: 88, max: 96, step: 1 },
    stay59: { min: 68, max: 86, step: 2 },
    stay75: { min: 44, max: 58, step: 2 },
    smallStaff: { min: 8, max: 14, step: 1 },
    bigStaff: { min: 45, max: 70, step: 5 },
    ticketShare: { min: 55, max: 65, step: 1 },
  },
  reject: (v) =>
    tooClose(
      PRICES.map((p) => revenue(v, p)),
      0.03,
    ),
  exhibits: [
    {
      id: "survey",
      title: "Would you stay at this price?",
      source: "Survey of 800 paying locations",
      rows: [
        ["$40 a month (today)", "100% stay"],
        ["$49 a month", (v) => `${v.stay49}% stay`],
        ["$59 a month", (v) => `${v.stay59}% stay`],
        ["$75 a month", (v) => `${v.stay75}% stay`],
      ],
    },
    {
      id: "usage",
      title: "Who uses Rosterly",
      source: "Product analytics",
      body: (v) =>
        `80% of locations schedule about ${v.smallStaff} staff. The other 20% schedule about ${v.bigStaff} staff each, create ${v.ticketShare}% of support tickets and use every feature. Both groups pay $40. Each location has one or two admins who build the schedule.`,
    },
    {
      id: "finance",
      title: "Note from finance",
      source: "CFO",
      body: "Churn is low and most customers are on monthly billing, renewed automatically. A price change applied badly is the one thing that could change that: two competitors lost customers last year after raising prices overnight.",
    },
  ],
  hint: {
    title: "How to compare price points",
    body: "For each price, multiply the price by the share of customers who stay. That is the revenue per 100 customers you have today, and the number to compare.",
  },
  steps: [
    {
      id: "price",
      title: "Price point",
      question:
        "If Rosterly keeps one flat price, which one brings the most revenue from today's customers?",
      pick: 1,
      weight: 40,
      options: PRICES.map((price) => ({
        id: `price_${price}`,
        text: price === 40 ? "Keep $40 a month" : `$${price} a month`,
        rating: (v: Values) => rankRating(revenueByPrice(v), `price_${price}`),
        why: (v: Values) =>
          `${stay(v, price)}% stay at $${price}: ${money(revenue(v, price))} a month per 100 of today's customers${price === bestPrice(v) ? ", the highest of the four." : `, against ${money(revenue(v, bestPrice(v)))} at $${bestPrice(v)}.`}`,
      })),
    },
    {
      id: "metric",
      title: "What the price scales with",
      question:
        "Looking further ahead, what should Rosterly's price scale with?",
      pick: 1,
      weight: 30,
      options: [
        {
          id: "per_staff",
          text: "The number of staff a location schedules",
          rating: 3,
          why: (v) =>
            `Value and cost both grow with staff: a location with ${v.bigStaff} staff gets far more out of Rosterly, and costs more to support, than one with ${v.smallStaff}. Customers can predict it, too.`,
        },
        {
          id: "flat",
          text: "Nothing: one flat price per location, as today",
          rating: 1,
          why: "Simple, but the largest customers pay the same as the smallest while using and costing several times more.",
        },
        {
          id: "per_shift",
          text: "The number of shifts created each month",
          rating: 1,
          why: "It tracks usage, but it makes the bill unpredictable and charges customers for using the product more.",
        },
        {
          id: "per_admin",
          text: "The number of admin accounts",
          rating: 0,
          why: "Every location has one or two admins whatever its size, so the price would not follow value at all, and customers would share logins.",
        },
      ],
    },
    {
      id: "rollout",
      title: "Rolling it out",
      question:
        "Choose the two things you would do when applying the new price to existing customers.",
      pick: 2,
      weight: 30,
      options: [
        {
          id: "notice",
          text: "Tell every customer 60 days ahead, with the reason and what they get for it",
          rating: 3,
          why: "Notice and a reason are what separate a price change from a nasty surprise, the exact risk finance warns about.",
        },
        {
          id: "annual_lock",
          text: "Let customers keep the old price for a year if they switch to annual billing",
          rating: 3,
          why: "It gives price-sensitive customers a way to stay, and turns monthly accounts into committed ones.",
        },
        {
          id: "case_by_case",
          text: "Let the sales team negotiate with any customer who pushes back",
          rating: 1,
          why: "It keeps some accounts, but it rewards complaining, cannot scale to thousands of locations and leaves customers paying different prices for the same thing.",
        },
        {
          id: "silent",
          text: "Apply it on the next billing cycle and mention it in the release notes",
          rating: 0,
          why: "The overnight change that cost two competitors their customers.",
        },
        {
          id: "new_only",
          text: "Charge the new price only to new customers, forever",
          rating: 0,
          why: "The board asked for more revenue from existing customers; this brings none.",
        },
      ],
    },
  ],
  writing: {
    label: "The announcement, in two or three sentences",
    placeholder:
      "What you would email customers: the new price, when, why, and what they can do.",
  },
  ideal: (v) =>
    `Compare revenue, not prices: $${bestPrice(v)} keeps ${stay(v, bestPrice(v))}% of customers and brings ${money(revenue(v, bestPrice(v)))} a month per 100 of today's customers, more than any other point. Longer term, charge by staff scheduled, because a ${v.bigStaff}-person location gets and costs far more than a ${v.smallStaff}-person one. Announce it 60 days ahead with the reason, and offer the old price for a year on annual billing.`,
  principle:
    "A price is right when it tracks the value customers get. Compare options by revenue kept, not by sticker price, and treat how you announce a change as part of the price.",
};

// ----------------------------------------------------------- go to market

const reached = (v: Values, segment: "subscribers" | "homeschool" | "all") =>
  Math.round(
    (10_000 /
      v[
        `cac${segment === "subscribers" ? "Subs" : segment === "homeschool" ? "Home" : "All"}`
      ]) *
      (v[
        `conv${segment === "subscribers" ? "Subs" : segment === "homeschool" ? "Home" : "All"}`
      ] /
        100),
  );
const segmentMeasures = (v: Values) => ({
  subscribers: reached(v, "subscribers"),
  homeschool: reached(v, "homeschool"),
  all: reached(v, "all"),
  schools: 0,
});
const winner = (v: Values) =>
  reached(v, "subscribers") > reached(v, "homeschool")
    ? "subscribers"
    : "homeschool";
const SEGMENT_NAME = {
  subscribers: "current subscribers who have children",
  homeschool: "homeschooling families",
} as const;

const goToMarket: QuickSpec = {
  key: "lumen-kids-launch",
  kind: "go_to_market",
  industry: "consumer",
  company: {
    name: "Lumen",
    industry: "Consumer",
    stage: "Series B, 900k subscribers",
    description:
      "A language-learning app for adults with a monthly subscription. Its first product for children, Lumen Kids, is ready.",
  },
  title: "Lumen Kids: who do you launch to first?",
  brief:
    "Lumen Kids ships in three weeks with a launch budget of $10,000 a month for the first quarter. Marketing tested four audiences with small campaigns. Decide who to launch to first, how to reach them and how you will know after 90 days that it worked.",
  numbers: {
    cacSubs: { min: 10, max: 16, step: 1 },
    convSubs: { min: 16, max: 24, step: 1 },
    cacHome: { min: 10, max: 16, step: 1 },
    convHome: { min: 16, max: 24, step: 1 },
    cacAll: { min: 36, max: 50, step: 2 },
    convAll: { min: 3, max: 5, step: 1 },
    schoolMonths: { min: 6, max: 9, step: 1 },
    subsWithKids: { min: 110, max: 150, step: 10 },
    homeFamilies: { min: 240, max: 320, step: 20 },
  },
  reject: (v) =>
    tooClose([reached(v, "subscribers"), reached(v, "homeschool")], 0.12),
  exhibits: [
    {
      id: "tests",
      title: "Audience tests, last four weeks",
      source: "Marketing",
      rows: [
        [
          "Current subscribers with children",
          (v) =>
            `${v.subsWithKids}k households · $${v.cacSubs} per trial · ${v.convSubs}% of trials pay`,
        ],
        [
          "Homeschooling families",
          (v) =>
            `${v.homeFamilies}k households · $${v.cacHome} per trial · ${v.convHome}% of trials pay`,
        ],
        [
          "All parents of children aged 6 to 10",
          (v) =>
            `9,000k households · $${v.cacAll} per trial · ${v.convAll}% of trials pay`,
        ],
        [
          "Primary schools",
          (v) =>
            `28k schools · no trial: a sale takes ${v.schoolMonths} months and a pilot`,
        ],
      ],
    },
    {
      id: "product",
      title: "What testers said",
      source: "Research, 40 families",
      body: "Families who used Lumen Kids three times a week in the first month almost all kept it. Families who used it less dropped it, whatever they said they thought of it. Children did not ask for it on their own: a parent had to start each session.",
    },
  ],
  hint: {
    title: "How to compare audiences",
    body: "Work out how many paying families $10,000 buys in each audience: trials are the budget divided by the cost per trial, and payers are trials times the share who pay. Size matters later; a first launch needs the audience that converts.",
  },
  steps: [
    {
      id: "segment",
      title: "Beachhead",
      question: "Which audience do you launch Lumen Kids to first?",
      pick: 1,
      weight: 40,
      options: [
        {
          id: "subscribers",
          text: "Current subscribers who have children",
          rating: (v) => rankRating(segmentMeasures(v), "subscribers"),
          why: (v) =>
            `$10,000 buys about ${count(reached(v, "subscribers"))} paying families here ($${v.cacSubs} per trial, ${v.convSubs}% pay).`,
        },
        {
          id: "homeschool",
          text: "Homeschooling families",
          rating: (v) => rankRating(segmentMeasures(v), "homeschool"),
          why: (v) =>
            `$10,000 buys about ${count(reached(v, "homeschool"))} paying families here ($${v.cacHome} per trial, ${v.convHome}% pay).`,
        },
        {
          id: "all",
          text: "All parents of children aged 6 to 10",
          rating: 1,
          why: (v) =>
            `The biggest audience and the worst first one: $10,000 buys about ${count(reached(v, "all"))} paying families ($${v.cacAll} per trial, ${v.convAll}% pay).`,
        },
        {
          id: "schools",
          text: "Primary schools",
          rating: 0,
          why: (v) =>
            `A sale takes ${v.schoolMonths} months: nothing would be learned, or earned, in the first quarter.`,
        },
      ],
    },
    {
      id: "channels",
      title: "Channels",
      question: "Choose the two channels you would put the launch behind.",
      pick: 2,
      weight: 30,
      options: [
        {
          id: "in_product",
          text: "An announcement inside Lumen and an email to subscribers",
          rating: (v) => (winner(v) === "subscribers" ? 3 : 1),
          why: (v) =>
            winner(v) === "subscribers"
              ? "It reaches the chosen audience for free, at the moment they are already learning."
              : "Free, but it reaches subscribers, not the homeschooling families who convert best.",
        },
        {
          id: "communities",
          text: "Partnerships with homeschooling groups and their newsletters",
          rating: (v) => (winner(v) === "homeschool" ? 3 : 1),
          why: (v) =>
            winner(v) === "homeschool"
              ? "It reaches the chosen audience where they already trade recommendations."
              : "A good channel for an audience that is not the one that converts best right now.",
        },
        {
          id: "referral",
          text: "A free month for every family that invites another family",
          rating: 2,
          why: "Parents recommend what works for their children to parents like them: it grows the same audience from inside.",
        },
        {
          id: "paid_broad",
          text: "Paid social aimed at all parents",
          rating: 0,
          why: (v) =>
            `The broad audience costs $${v.cacAll} a trial and ${v.convAll}% pay: the budget would be gone in a month.`,
        },
        {
          id: "tv",
          text: "A TV spot during children's programmes",
          rating: 0,
          why: "One spot costs more than the whole quarter's budget, and its effect cannot be measured.",
        },
      ],
    },
    {
      id: "metric",
      title: "Launch metric",
      question: "Which number tells you after 90 days that the launch worked?",
      pick: 1,
      weight: 30,
      options: [
        {
          id: "habit",
          text: "Families who use Lumen Kids three times a week in their fourth week",
          rating: 3,
          why: "The research says this habit is what separates families who keep the product from those who drop it.",
        },
        {
          id: "paid",
          text: "Trials that turn into paid subscriptions",
          rating: 2,
          why: "Real money, but a family can pay once and leave: it says less about whether the product works.",
        },
        {
          id: "trials",
          text: "Trials started",
          rating: 1,
          why: "It measures the campaign, not the product.",
        },
        {
          id: "downloads",
          text: "App downloads",
          rating: 0,
          why: "A vanity number: downloads say nothing about use or revenue.",
        },
      ],
    },
  ],
  writing: {
    label: "The positioning, in one sentence",
    placeholder: "For [who], Lumen Kids is [what] that [why it matters].",
  },
  ideal: (v) =>
    `Launch to ${SEGMENT_NAME[winner(v)]}: $10,000 buys about ${count(reached(v, winner(v)))} paying families there, more than anywhere else, and far more than the ${count(reached(v, "all"))} of a broad campaign. Reach them through ${winner(v) === "subscribers" ? "Lumen itself and email" : "homeschooling groups"} plus a referral offer, and judge the launch on families using it three times a week in their fourth week.`,
  principle:
    "Launch where you convert, not where the market is biggest. A narrow first audience teaches you more and costs less, and the launch metric should be the behaviour that predicts keeping the product.",
};

// --------------------------------------------------------------- incident

const incident: QuickSpec = {
  key: "sendwell-double-charge",
  kind: "incident",
  industry: "fintech",
  company: {
    name: "Sendwell",
    industry: "Fintech",
    stage: "Series B, live in six countries",
    description:
      "International money transfers from the phone or the web. Customers send money to family abroad, often every month.",
  },
  title: "Sendwell: customers were charged twice",
  brief:
    "It is 10:20. You are the product manager on call. A deploy this morning made the app retry card payments that had already gone through, and customers are being charged twice. Engineering has found the cause but the fix is not out yet. Decide what happens in the next few minutes, what customers hear and what follows.",
  numbers: {
    deployMinute: { min: 5, max: 25, step: 5 },
    affected: { min: 1200, max: 2600, step: 100 },
    amount: { min: 180, max: 320, step: 10 },
    tickets: { min: 300, max: 700, step: 50 },
    perMinute: { min: 20, max: 45, step: 5 },
    etaHours: { min: 2, max: 4, step: 1 },
    refundDays: { min: 3, max: 5, step: 1 },
  },
  derived: (v) => ({ total: v.affected * v.amount }),
  exhibits: [
    {
      id: "timeline",
      title: "What we know at 10:20",
      source: "Incident channel",
      rows: [
        ["Deploy", (v) => `09:${String(v.deployMinute).padStart(2, "0")}`],
        ["Customers charged twice so far", (v) => count(v.affected)],
        ["Average extra charge", (v) => money(v.amount)],
        ["Money taken by mistake", (v) => money(v.total)],
        ["New double charges", (v) => `about ${v.perMinute} a minute`],
        ["Cause", "Our own retry code, found at 10:05"],
        [
          "Fix",
          (v) =>
            `Engineering's guess is ${v.etaHours} hours; they are not sure`,
        ],
      ],
    },
    {
      id: "controls",
      title: "What can be done right now",
      source: "Engineering lead",
      body: "We can switch card payments off with a flag in two minutes. Transfers funded by bank account would keep working; that is about a third of them. Rolling the deploy back takes 40 minutes and would also undo a security patch.",
    },
    {
      id: "support",
      title: "Support and legal",
      source: "Support lead, General Counsel",
      body: (v) =>
        `${count(v.tickets)} tickets in the last hour, most asking where their money is. Refunds to cards take ${v.refundDays} business days to arrive. The regulator must be told within 24 hours of any incident that takes customer funds by mistake.`,
    },
  ],
  hint: {
    title: "The order of an incident",
    body: "First stop the harm from growing, then tell the people affected what happened and what you are doing, then repair. An update that is honest about what you do not know yet is better than a confident one that turns out wrong.",
  },
  steps: [
    {
      id: "first_move",
      title: "First move",
      question: "What do you do in the next five minutes?",
      pick: 1,
      weight: 30,
      options: [
        {
          id: "flag_off",
          text: "Switch card payments off with the flag, and keep bank transfers running",
          rating: 3,
          why: (v) =>
            `It stops about ${v.perMinute} new double charges a minute in two minutes, at the cost of pausing part of the service.`,
        },
        {
          id: "rollback",
          text: "Roll the deploy back",
          rating: 1,
          why: (v) =>
            `It would work, but it takes 40 minutes, about ${count(v.perMinute * 40)} more double charges, and removes a security patch.`,
        },
        {
          id: "wait_fix",
          text: "Keep everything running and wait for the fix",
          rating: 0,
          why: (v) =>
            `At ${v.perMinute} double charges a minute, a ${v.etaHours}-hour wait means about ${count(v.perMinute * 60 * v.etaHours)} more customers charged twice.`,
        },
        {
          id: "email_all",
          text: "Email every customer an apology before doing anything else",
          rating: 0,
          why: "Customers are still being charged while you write, and most of the people you would email are not affected.",
        },
      ],
    },
    {
      id: "message",
      title: "What customers hear",
      question: "Which message do you send to the affected customers now?",
      pick: 1,
      weight: 40,
      options: [
        {
          id: "honest",
          text: (v) =>
            `"We charged your card twice for a transfer this morning. This was our mistake. We are refunding the extra charge now; it can take up to ${v.refundDays} business days to reach your card, and you do not need to do anything. Card payments are paused while we fix the cause. We will update you by 13:00."`,
          rating: 3,
          why: "It says what happened, whose fault it was, what the customer has to do (nothing), when the money comes back and when they will hear again.",
        },
        {
          id: "overpromise",
          text: '"We are sorry for the double charge. It will be fixed within the hour, your refund will arrive today and this will never happen again."',
          rating: 1,
          why: (v) =>
            `It apologises, but every promise in it is one you cannot keep: the fix is a guess and refunds take ${v.refundDays} business days.`,
        },
        {
          id: "vague",
          text: '"Some users may be experiencing issues with some payments. We are looking into it and appreciate your patience."',
          rating: 0,
          why: "It tells a customer who lost money nothing: not what happened, not whether they are affected, not when the money returns.",
        },
        {
          id: "blame",
          text: '"Due to a problem at our card processor, some payments were duplicated. We have asked them to resolve it urgently."',
          rating: 0,
          why: "The cause is our own code. Blaming a partner is false, and customers will find out.",
        },
      ],
    },
    {
      id: "after",
      title: "After the fix",
      question: "Choose the two things that must happen in the next 24 hours.",
      pick: 2,
      weight: 30,
      options: [
        {
          id: "refund_all",
          text: "Refund every affected customer automatically and confirm it to each of them",
          rating: 3,
          why: (v) =>
            `${money(v.total)} of customers' money is with us by mistake. Nobody should have to ask for it back.`,
        },
        {
          id: "regulator",
          text: "Notify the regulator, with the number of customers and the amount",
          rating: 3,
          why: "A legal duty with a 24-hour deadline that started when the first customer was charged.",
        },
        {
          id: "postmortem",
          text: "Hold a blameless review and schedule the changes that would have caught this",
          rating: 2,
          why: "Essential, but it can happen this week: the refunds and the regulator cannot wait.",
        },
        {
          id: "on_request",
          text: "Refund the customers who contact support",
          rating: 0,
          why: "It keeps the money of everyone who has not noticed yet.",
        },
        {
          id: "find_culprit",
          text: "Find out which engineer wrote the retry code and record it in their review",
          rating: 0,
          why: "It teaches the team to hide mistakes. The failure is a process that let the change ship untested.",
        },
      ],
    },
  ],
  writing: {
    label: "The status page update",
    placeholder:
      "Three or four sentences for everyone, including customers who were not affected.",
  },
  ideal: (v) =>
    `Stop the harm first: the flag ends about ${v.perMinute} new double charges a minute in two minutes, while a rollback takes 40. Then tell the ${count(v.affected)} affected customers exactly what happened, that it was Sendwell's mistake, that the refund is automatic and takes up to ${v.refundDays} business days, and when the next update comes. Within 24 hours, refund everyone without waiting to be asked and notify the regulator.`,
  principle:
    "In an incident: contain, communicate, repair, in that order. Say what happened, own it, tell people what they need to do and when they will hear again, and never promise what you do not control.",
};

// -------------------------------------------------------------- build/buy

const buildCost = (v: Values) =>
  v.engMonths * v.monthCost * 1000 * (1 + 3 * (v.maintenance / 100));
const buyCost = (v: Values) =>
  v.perCheck * v.checks * 3 + v.integrationMonths * v.monthCost * 1000;
const buildMonths = (v: Values) => Math.ceil(v.engMonths / 2);
const buildInTime = (v: Values) => buildMonths(v) <= v.deadline;
const buildCheaper = (v: Values) => buildCost(v) < buyCost(v);
const sourcingRatings = (v: Values) => {
  if (buildInTime(v)) {
    return buildCheaper(v)
      ? { build: 3, hybrid: 2, buy: 1, partner: 0 }
      : { build: 1, hybrid: 2, buy: 3, partner: 0 };
  }
  return buildCheaper(v)
    ? { build: 0, hybrid: 3, buy: 2, partner: 1 }
    : { build: 0, hybrid: 2, buy: 3, partner: 1 };
};
const sourcingBest = (v: Values) =>
  Object.entries(sourcingRatings(v)).find(([, rating]) => rating === 3)![0];
const SOURCING_NAME: Record<string, string> = {
  build: "build it in-house",
  buy: "buy from the vendor on a three-year contract",
  hybrid:
    "buy on a one-year contract to make the launch, and build to replace it",
};

const buildBuy: QuickSpec = {
  key: "fixly-background-checks",
  kind: "build_buy",
  industry: "marketplace",
  company: {
    name: "Fixly",
    industry: "Marketplace",
    stage: "Seed, live in two cities",
    description:
      "A marketplace that matches households with vetted tradespeople for small repairs. Every tradesperson passes a background check before a first job.",
  },
  title: "Fixly: build, buy or partner for background checks",
  brief:
    "Background checks are done by hand today, which will not survive the launch in a third city. The CTO wants to build an automated system; the COO has a quote from a vendor; an insurer has offered to run checks for free in exchange for selling insurance to Fixly's tradespeople. You have the afternoon to recommend one.",
  numbers: {
    engMonths: { min: 6, max: 14, step: 2 },
    monthCost: { min: 14, max: 18, step: 1 },
    maintenance: { min: 15, max: 25, step: 5 },
    perCheck: { min: 18, max: 44, step: 2 },
    checks: { min: 4000, max: 12_000, step: 1000 },
    integrationMonths: { min: 1, max: 2, step: 1 },
    deadline: { min: 3, max: 6, step: 1 },
  },
  reject: (v) => {
    const ratio = buildCost(v) / buyCost(v);
    return ratio > 0.8 && ratio < 1.25;
  },
  exhibits: [
    {
      id: "build",
      title: "Build estimate",
      source: "CTO",
      rows: [
        ["Work", (v) => `${v.engMonths} engineer-months, two engineers`],
        ["Cost of an engineer-month", (v) => money(v.monthCost * 1000)],
        ["Upkeep every year", (v) => `${v.maintenance}% of the build cost`],
      ],
    },
    {
      id: "buy",
      title: "Vendor quote",
      source: "COO",
      rows: [
        ["Price", (v) => `${money(v.perCheck)} per check`],
        ["Checks a year, all cities", (v) => count(v.checks)],
        [
          "Integration",
          (v) =>
            `${v.integrationMonths} engineer-month${v.integrationMonths === 1 ? "" : "s"}`,
        ],
        ["Contract", "One year, or three years at the same price"],
      ],
    },
    {
      id: "context",
      title: "Context",
      source: "Launch plan, customer research",
      body: (v) =>
        `The third city launches in ${v.deadline} months and needs automated checks on day one. In research, customers say they trust Fixly because of its guarantee and its reviews; none mentions how checks are done. The insurer's offer is free, but the insurer would own the check results and contact tradespeople directly.`,
    },
  ],
  hint: {
    title: "How to compare the options",
    body: "Compare cost over the same period, three years: building costs the engineer-months plus upkeep every year; buying costs the checks plus the integration. Then ask whether each option can be ready before the launch.",
  },
  steps: [
    {
      id: "decision",
      title: "The call",
      question: "What do you recommend?",
      pick: 1,
      weight: 50,
      options: [
        {
          id: "build",
          text: "Build it in-house",
          rating: (v) => sourcingRatings(v).build,
          why: (v) =>
            `Three years of building and upkeep cost ${money(buildCost(v))}, and two engineers need ${buildMonths(v)} months${buildInTime(v) ? `, inside the ${v.deadline} before launch.` : `, more than the ${v.deadline} before launch.`}`,
        },
        {
          id: "buy",
          text: "Buy from the vendor on a three-year contract",
          rating: (v) => sourcingRatings(v).buy,
          why: (v) =>
            `Three years of checks plus integration cost ${money(buyCost(v))}, ready in ${v.integrationMonths} month${v.integrationMonths === 1 ? "" : "s"}.`,
        },
        {
          id: "hybrid",
          text: "Buy on a one-year contract now, and build to replace it",
          rating: (v) => sourcingRatings(v).hybrid,
          why: (v) =>
            buildInTime(v)
              ? "It pays for both the integration and the build when one of them alone does the job in time."
              : buildCheaper(v)
                ? `Building is cheaper over three years (${money(buildCost(v))} against ${money(buyCost(v))}) but cannot be ready for the launch: buying for a year bridges the gap.`
                : "It makes the launch, but then spends on a build that costs more than staying with the vendor.",
        },
        {
          id: "partner",
          text: "Accept the insurer's offer",
          rating: (v) => sourcingRatings(v).partner,
          why: "Free today, but it hands the check results and the relationship with tradespeople, the marketplace's supply, to another company.",
        },
      ],
    },
    {
      id: "diligence",
      title: "Before you commit",
      question: "Choose the two things you would check before committing.",
      pick: 2,
      weight: 30,
      options: [
        {
          id: "coverage",
          text: "How fast and how complete the vendor's checks are in the new city",
          rating: 3,
          why: "A vendor that is slow or blind in the launch city fails the one requirement that cannot move.",
        },
        {
          id: "exit",
          text: "Who owns the check results and how Fixly gets them out if it leaves",
          rating: 3,
          why: "Without the data, switching later means checking every tradesperson again.",
        },
        {
          id: "uptime",
          text: "The vendor's uptime, from two customers of a similar size",
          rating: 2,
          why: "Worth a call, but an outage delays a few sign-ups; it does not sink the launch.",
        },
        {
          id: "logos",
          text: "Which well-known companies are on the vendor's customer list",
          rating: 0,
          why: "A logo wall says nothing about whether it works for Fixly's case.",
        },
        {
          id: "fun",
          text: "Whether the engineers would enjoy building it",
          rating: 0,
          why: "Motivation matters, but it is not a reason to build something customers never see.",
        },
      ],
    },
    {
      id: "pitch",
      title: "Making the case",
      question:
        "The CTO still wants to build. How do you present your recommendation?",
      pick: 1,
      weight: 20,
      options: [
        {
          id: "numbers",
          text: "Show both three-year costs and the launch date, and say what would change your mind",
          rating: 3,
          why: "It puts the disagreement on facts both sides can check, and leaves the door open if they change.",
        },
        {
          id: "prototype",
          text: "Suggest a two-week prototype to see how hard it really is",
          rating: 1,
          why: "It sounds fair, but it spends two of very few weeks and answers a question the estimate already answers.",
        },
        {
          id: "authority",
          text: "Say the COO and the CEO already agree with you",
          rating: 0,
          why: "It wins the meeting and loses the CTO, who has to run whatever is decided.",
        },
        {
          id: "rule",
          text: "Say that vendors are always cheaper than building",
          rating: 0,
          why: (v) =>
            `A slogan, and wrong half the time: here building costs ${money(buildCost(v))} and buying ${money(buyCost(v))} over three years.`,
        },
      ],
    },
  ],
  writing: {
    label: "Your recommendation, in three sentences",
    placeholder:
      "What you would write to the CEO: the call, the reason and the main risk.",
  },
  ideal: (v) =>
    `Over three years, building costs ${money(buildCost(v))} and buying ${money(buyCost(v))}; a build takes ${buildMonths(v)} months and the launch is in ${v.deadline}. So the call is to ${SOURCING_NAME[sourcingBest(v)]}. Checks are not what customers trust Fixly for, so cost and the launch date decide, and the insurer's free offer costs control of the supply side. Before committing, check the vendor's coverage in the new city and who owns the results.`,
  principle:
    "Build what makes you different, buy what does not, and compare the options over the same period and against the date that cannot move. Free offers are paid for in control.",
};

export const quickSpecs: readonly QuickSpec[] = [
  pricing,
  goToMarket,
  incident,
  buildBuy,
];
