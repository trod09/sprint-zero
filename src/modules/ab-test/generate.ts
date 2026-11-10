/**
 * On-demand A/B test cases: an experiment of the chosen industry paired with
 * a trap recipe. The recipe owns every number, so `buildAbTestCase` can
 * simulate the counts and check that the readout shows exactly that trap.
 */
import type { Difficulty, GenerateParams } from "@/core/case-engine";
import { createRng } from "@/core/rng";

import { buildAbTestCase } from "./build-case";
import type { AbTestCaseSpec } from "./content/cases";
import { experimentShells, type ExperimentShell } from "./content/experiments";
import type { AbTestCase } from "./schema";

type SpecHidden = AbTestCaseSpec["hidden"];

interface Recipe {
  key: string;
  /** Title suffix and brief, with the shell's wording filled in by `words`. */
  brief: string;
  mde: number;
  baselineRate: number;
  /** Rate multipliers of the two segments, strongest first. */
  segments: readonly [
    SpecHidden["simulation"]["segments"][number],
    SpecHidden["simulation"]["segments"][number],
  ];
  simulation: Pick<
    SpecHidden["simulation"],
    "visitorsPerDay" | "trueLift" | "novelty" | "missing" | "stoppedAfterDays"
  >;
  guardrail: { baselineRate: number; trueLift: number };
  hidden: Omit<SpecHidden, "simulation">;
}

const segment = (
  share: number,
  rateMultiplier: number,
  treatmentShare?: number,
) => ({ value: "", share, rateMultiplier, treatmentShare });

/**
 * Wording slots: [name] experiment, [metric] primary metric in lower case,
 * [unit] who is counted, [dimension] segment dimension in lower case,
 * [story] why the guardrail gets worse, [strong] the segment that converts
 * more. Measured numbers use the builder's {placeholders}.
 */
const RECIPES: Record<string, Recipe> = {
  clean: {
    key: "clean",
    brief:
      "The team ran [name] for {days} days on half of the traffic. The [metric] is {lift} in treatment, and the team wants to roll it out to everyone on Monday. Read the results and make the call.",
    mde: 0.05,
    baselineRate: 0.08,
    segments: [segment(0.7, 1.15), segment(0.3, 0.65)],
    simulation: { visitorsPerDay: 12000, trueLift: 0.07 },
    guardrail: { baselineRate: 0.03, trueLift: 0 },
    hidden: {
      issues: [],
      acceptableIssues: [],
      effect: "improves",
      partialEffects: [],
      decision: "ship",
      partialDecisions: ["iterate"],
      summary:
        "A clean win: the test ran as planned and the [metric] really went up.",
      explanation:
        "The split is {share} treatment, in line with the 50/50 plan (SRM check: {srmP}). The test reached its planned sample ({usersPerArm} [unit] per arm against {samplePerArm} needed). The lift of {lift} (95% CI {ci}, {p}) is there in the first week ({firstWeekLift}) and in the last ({lastWeekLift}), and in every segment ({segmentLifts}). The guardrail did not move. Nothing in the readout argues against the result: sometimes the right call is simply to ship.",
      issueNotes: {},
      recommendation:
        "Ship it to everyone, and keep an eye on the [metric] and the guardrail for two weeks after the rollout.",
    },
  },
  srm: {
    key: "srm",
    brief:
      "The team ran [name] for {days} days with a planned 50/50 split. The [metric] is {lift} in treatment, and the team lead wants to ship before the next release. Read the results and make the call.",
    mde: 0.05,
    baselineRate: 0.3,
    segments: [segment(0.75, 1.1), segment(0.25, 0.7)],
    simulation: {
      visitorsPerDay: 2500,
      trueLift: 0.01,
      missing: { share: 0.08, relativeRate: 0.3 },
    },
    guardrail: { baselineRate: 0.02, trueLift: 0 },
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
        "The event that counts someone in treatment fires from the new code itself. When that code loads slowly or fails, the user is never logged in treatment. Those are the users on slow connections and the least engaged ones, so the treatment users who remain convert better for reasons that have nothing to do with [name]. That is why the [metric] looks {lift}. When the split misses the plan this badly (SRM check: {srmP}), no metric in the readout can be trusted, however significant it looks.",
      issueNotes: {
        srm: "The plan was a 50/50 split, but only {share} of [unit] landed in treatment. With this many users, a gap like that is not chance ({srmP}). Treatment is missing users.",
      },
      recommendation:
        "Do not ship or kill on this data. Log the assignment on the server before the new code loads, check that the split is back to 50/50, and run the test again.",
    },
  },
  guardrail: {
    key: "guardrail",
    brief:
      "The team ran [name] for {days} days. The [metric] is {lift}, and the team calls it the best result of the quarter. Read the results and make the call.",
    mde: 0.06,
    baselineRate: 0.04,
    segments: [segment(0.55, 1.2), segment(0.45, 0.76)],
    simulation: { visitorsPerDay: 16000, trueLift: 0.09 },
    guardrail: { baselineRate: 0.02, trueLift: 0.3 },
    hidden: {
      issues: ["guardrail"],
      acceptableIssues: [],
      effect: "improves",
      partialEffects: [],
      decision: "iterate",
      partialDecisions: ["kill"],
      summary:
        "The [metric] went up, but so did the guardrail: the win comes at a cost the team said it would not pay.",
      explanation:
        "The primary metric is a real win: {lift} (95% CI {ci}, {p}), in both segments and with a healthy split. But the guardrail exists for exactly this case: {guardrail} rose {guardrailChange}. [story] A guardrail breach means you do not ship as is, even with a significant win on the primary metric.",
      issueNotes: {
        guardrail:
          "{guardrail} rose {guardrailChange} ({guardrailP}), far beyond the 10% the team accepts. [story]",
      },
      recommendation:
        "Do not ship this version. Keep the part that helps, redesign the part that drives the guardrail up, and test again with the guardrail as a launch condition.",
    },
  },
  harms: {
    key: "harms",
    brief:
      "The team tested [name] for {days} days. Leadership is convinced it is the future and asks whether to roll it out. Read the results and make the call.",
    mde: 0.08,
    baselineRate: 0.05,
    segments: [segment(0.35, 1.37), segment(0.65, 0.8)],
    simulation: { visitorsPerDay: 8000, trueLift: -0.08 },
    guardrail: { baselineRate: 0.04, trueLift: 0.02 },
    hidden: {
      issues: [],
      acceptableIssues: [],
      effect: "harms",
      partialEffects: [],
      decision: "kill",
      partialDecisions: ["iterate"],
      summary: "A real loss: with [name] the [metric] goes down.",
      explanation:
        "The test is healthy: the split is {share} treatment (SRM check: {srmP}), it reached its planned sample and ran its full {days} days. The [metric] moved {lift} (95% CI {ci}, {p}), in both segments ({segmentLifts}). A clean negative result is a result: the right call is to stop, not to keep testing until it turns green.",
      issueNotes: {},
      recommendation:
        "Kill this version. If the idea still matters, change the mechanism rather than the styling, and test the new version from scratch.",
    },
  },
  novelty: {
    key: "novelty",
    brief:
      "The team ran [name] for {days} days. Over the whole test the [metric] is {lift}, and the team wants to ship it in the next release. Read the results and make the call.",
    mde: 0.05,
    baselineRate: 0.1,
    segments: [segment(0.3, 1.3), segment(0.7, 0.87)],
    simulation: {
      visitorsPerDay: 8000,
      trueLift: 0,
      novelty: { initialLift: 0.3, decayDays: 4 },
    },
    guardrail: { baselineRate: 0.02, trueLift: 0 },
    hidden: {
      issues: ["novelty"],
      acceptableIssues: [],
      effect: "no_effect",
      partialEffects: ["inconclusive"],
      decision: "kill",
      partialDecisions: ["iterate"],
      summary: "A novelty effect: the lift fades to nothing within weeks.",
      explanation:
        "The overall {lift} ({p}) averages a big first-week spike with weeks where the effect is gone. The daily lift starts high and decays towards zero, and the last week alone shows {lastWeekLift}, which cannot be told apart from no effect. Shipping on the average would promise a gain that has already disappeared. The split, the sample and the guardrail are fine; the trap is the pattern over time.",
      issueNotes: {
        novelty:
          "The lift was {firstWeekLift} in the first week and {lastWeekLift} in the last ({lastWeekP}). The daily lift falls steadily: users reacted to something new, not to something better.",
      },
      recommendation:
        "Do not ship. The lasting effect is about zero, and every feature adds complexity. If the team believes in the idea, test another mechanic and judge it on its last weeks rather than its average.",
    },
  },
  underpowered: {
    key: "underpowered",
    brief:
      "The team planned a {plannedDays}-day test of [name]. After {days} days the result looked so good ({lift}) that the team stopped it and asked for approval to launch. Read the results and make the call.",
    mde: 0.05,
    baselineRate: 0.12,
    segments: [segment(0.6, 1.07), segment(0.4, 0.9)],
    simulation: { visitorsPerDay: 3000, trueLift: 0.03, stoppedAfterDays: 4 },
    guardrail: { baselineRate: 0.03, trueLift: 0 },
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
        "Big early lifts are common in small samples and usually shrink as data comes in. With {usersPerArm} [unit] per arm, the observed {lift} has {p} and a 95% interval of {ci}: it is compatible with no effect at all. Stopping as soon as the result 'looks good' (peeking) inflates false positives. The split and the guardrail are fine; the problem is that there is not enough data to decide.",
      issueNotes: {
        underpowered:
          "The plan needed {samplePerArm} [unit] per arm to detect a {mde} lift, and the test stopped at {usersPerArm}. The 95% interval ({ci}) includes zero and effects far smaller than the one the team is celebrating.",
      },
      recommendation:
        "Resume the test and let it run to the planned sample ({samplePerArm} per arm) before deciding. Agree on the stopping rule before the test starts, not while watching the numbers.",
    },
  },
  simpson: {
    key: "simpson",
    brief:
      "The team tested [name] for {days} days. The [metric] is {lift} overall, and the team wants to ship. Read the results and make the call.",
    mde: 0.05,
    baselineRate: 0.4,
    segments: [segment(0.55, 1.4, 0.6), segment(0.45, 0.5, 0.378)],
    simulation: { visitorsPerDay: 1500, trueLift: -0.08 },
    guardrail: { baselineRate: 0.03, trueLift: 0 },
    hidden: {
      issues: ["simpson"],
      acceptableIssues: ["srm"],
      effect: "harms",
      partialEffects: ["inconclusive"],
      decision: "kill",
      partialDecisions: ["iterate"],
      summary:
        "Simpson's paradox: the change loses in every segment but wins overall, because treatment got more of the users who convert most.",
      explanation:
        "A routing rule sent more '[strong]' users to treatment and more of the others to control, while the total split stayed close to 50/50, so the usual SRM check on totals looks fine. '[strong]' users convert far more often, so the arm with more of them looks better overall. Compared like for like, within each segment, [name] does worse ({segmentLifts}). The overall {lift} is an artefact of the mix.",
      issueNotes: {
        simpson:
          "Treatment is worse in both segments ({segmentLifts}) yet better overall. The arms mix segments in different proportions ({segmentShares}), and '[strong]' users convert far more often, so the arm with more of them wins overall whatever the change does.",
        srm: "The total split looks fine, but each segment is split unevenly between the arms. Checking the split per segment is what reveals the broken assignment.",
      },
      recommendation:
        "Do not ship. The fair comparison, within each segment, shows the change hurts the [metric]. Fix the assignment so each segment splits 50/50, and if the team still believes in the idea, test a revised version.",
    },
  },
};

/** Harder levels get subtler traps. */
const RECIPES_BY_DIFFICULTY: Record<Difficulty, readonly string[]> = {
  apm: ["clean", "srm", "guardrail", "harms"],
  pm: ["guardrail", "harms", "novelty", "underpowered"],
  senior: ["simpson", "novelty", "underpowered", "srm"],
};

function words(shell: ExperimentShell): (text: string) => string {
  const slots: Record<string, string> = {
    name: shell.name,
    metric: shell.primaryMetric.label.toLowerCase(),
    unit: shell.unit,
    dimension: shell.segmentDimension.toLowerCase(),
    story: shell.guardrailStory,
    strong: shell.segments[0],
  };
  return (text) =>
    text.replace(/\[(\w+)\]/g, (match, key: string) => slots[key] ?? match);
}

export function generateAbTestOnDemand(
  params: GenerateParams & { caseId: string },
): AbTestCase {
  const rng = createRng(params.seed);
  const pool = experimentShells.filter((s) => s.industry === params.industry);
  if (pool.length === 0) {
    throw new Error(`No experiment for industry "${params.industry}"`);
  }
  const shell = rng.fork("experiment").pick(pool);
  const recipe =
    RECIPES[rng.fork("recipe").pick(RECIPES_BY_DIFFICULTY[params.difficulty])];
  const say = words(shell);
  const { hidden } = recipe;

  return buildAbTestCase({
    id: params.caseId,
    moduleId: "ab-test",
    seed: params.seed,
    difficulty: params.difficulty,
    company: shell.company,
    title: `${shell.company.name}: ${shell.name.toLowerCase()} (case #${params.seed})`,
    briefTemplate: say(recipe.brief),
    experiment: {
      name: shell.name,
      change: shell.change,
      hypothesis: shell.hypothesis,
      primaryMetric: shell.primaryMetric,
      guardrails: [
        {
          ...shell.guardrail,
          goodDirection: "down",
          tolerance: 10,
          denominator: "users",
        },
      ],
      segmentDimension: shell.segmentDimension,
      plan: {
        treatmentShare: 0.5,
        mde: recipe.mde,
        baselineRate: recipe.baselineRate,
      },
    },
    hidden: {
      ...hidden,
      summary: say(hidden.summary),
      explanation: say(hidden.explanation),
      recommendation: say(hidden.recommendation),
      issueNotes: Object.fromEntries(
        Object.entries(hidden.issueNotes).map(([issue, note]) => [
          issue,
          say(note),
        ]),
      ),
      simulation: {
        ...recipe.simulation,
        treatmentShare: 0.5,
        baselineRate: recipe.baselineRate,
        segments: recipe.segments.map((part, index) => ({
          ...part,
          value: shell.segments[index],
        })),
        guardrails: [{ key: shell.guardrail.key, ...recipe.guardrail }],
      },
    },
  });
}
