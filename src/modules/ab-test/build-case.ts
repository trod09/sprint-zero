/**
 * Turns a hand-written A/B test specification into a stored case:
 *
 * 1. sizes the test plan from the baseline and the minimum detectable effect;
 * 2. simulates the counts from the seed, retrying with a new attempt until the
 *    data shows exactly the problems the case claims and no others;
 * 3. fills the measured numbers into the brief and the explanations.
 */
import { formatInteger } from "@/lib/format";

import {
  formatLift,
  formatPValue,
  readExperiment,
  SIGNIFICANCE,
  type ExperimentReadout,
} from "./analysis";
import type { AbTestCaseSpec } from "./content/cases";
import { abTestCaseSchema, type AbTestCase, type Issue } from "./schema";
import { simulateResults } from "./simulate";
import { requiredSamplePerArm } from "./stats";

const MAX_ATTEMPTS = 300;
const MIN_DAYS = 14;
const MAX_DAYS = 56;

/** Planned duration: enough whole weeks to reach the sample, two at least. */
export function plannedDays(
  samplePerArm: number,
  visitorsPerDay: number,
  treatmentShare: number,
): number {
  const smallerShare = Math.min(treatmentShare, 1 - treatmentShare);
  const days = samplePerArm / (visitorsPerDay * smallerShare);
  return Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.ceil(days / 7) * 7));
}

const significant = (p: number) => p < SIGNIFICANCE;

/**
 * Why the readout does not show what the case says, or `null` when it does.
 * Every issue must be visible when present and absent when not.
 */
export function findPatternProblem(
  caseData: Pick<AbTestCase, "experiment" | "results"> & {
    hidden: Pick<
      AbTestCase["hidden"],
      "issues" | "acceptableIssues" | "effect"
    >;
  },
  readout: ExperimentReadout = readExperiment(caseData),
): string | null {
  const { hidden, experiment } = caseData;
  const has = (issue: Issue) => hidden.issues.includes(issue);
  const tolerated = (issue: Issue) => hidden.acceptableIssues.includes(issue);
  const { primary, sampleRatio, firstWeek, lastWeek } = readout;

  // Sample ratio mismatch.
  if (has("srm") && !(sampleRatio.pValue < 0.001)) {
    return "the sample ratio mismatch is not visible";
  }
  if (!has("srm") && !tolerated("srm") && sampleRatio.pValue < 0.05) {
    return "the split looks broken by chance";
  }

  // Novelty: a strong start that fades.
  const fades =
    firstWeek !== null &&
    lastWeek !== null &&
    firstWeek.relativeLift > 0 &&
    firstWeek.pValue < 0.01 &&
    lastWeek.pValue > 0.1 &&
    lastWeek.relativeLift < firstWeek.relativeLift / 2;
  if (has("novelty")) {
    if (!fades) return "the novelty effect does not show";
    if (!(primary.relativeLift > 0 && significant(primary.pValue))) {
      return "the novelty case needs a significant overall lift";
    }
  } else if (fades) {
    return "the lift fades by chance";
  }

  // Simpson's paradox: every segment against the total.
  const segmentsAgainst = readout.segments.filter(
    (segment) =>
      Math.sign(segment.comparison.relativeLift) !==
      Math.sign(primary.relativeLift),
  );
  if (has("simpson")) {
    if (!(primary.relativeLift > 0 && significant(primary.pValue))) {
      return "the overall lift must be significant for the paradox";
    }
    if (segmentsAgainst.length !== readout.segments.length) {
      return "not every segment goes against the total";
    }
  } else if (
    significant(primary.pValue) &&
    segmentsAgainst.some((segment) => significant(segment.comparison.pValue))
  ) {
    return "a segment goes significantly against the total by chance";
  }

  // Guardrails.
  const breached = readout.guardrails.some((guardrail) => guardrail.breached);
  const clearlyBreached = readout.guardrails.some(
    (guardrail) => guardrail.breached && guardrail.comparison.pValue < 0.01,
  );
  if (has("guardrail") && !clearlyBreached) {
    return "no guardrail is clearly breached";
  }
  if (!has("guardrail") && breached) return "a guardrail breaches by chance";

  // Power.
  if (has("underpowered")) {
    if (readout.usersPerArm >= 0.5 * experiment.plan.samplePerArm) {
      return "the underpowered test has too much data";
    }
    if (!(primary.pValue > 0.05 && primary.pValue < 0.4)) {
      return "the underpowered result must look promising but not significant";
    }
    if (primary.relativeLift < experiment.plan.mde) {
      return "the underpowered result must look big";
    }
  } else if (!readout.reachedSample) {
    return "the test did not reach its planned sample";
  }

  // The effect on a clean, trustworthy readout.
  const clean = hidden.issues.every((issue) => issue === "guardrail");
  if (clean && hidden.effect === "improves") {
    if (!(primary.relativeLift > 0 && primary.pValue < 0.01)) {
      return "the win is not clear";
    }
    if (segmentsAgainst.length > 0) return "a segment goes against the win";
    if (
      firstWeek &&
      lastWeek &&
      !(lastWeek.relativeLift > 0 && firstWeek.relativeLift > 0)
    ) {
      return "the win is not there in both weeks";
    }
  }
  if (clean && hidden.effect === "harms") {
    if (!(primary.relativeLift < 0 && primary.pValue < 0.01)) {
      return "the loss is not clear";
    }
    if (segmentsAgainst.length > 0) return "a segment goes against the loss";
  }
  return null;
}

const percent = (share: number) => `${(share * 100).toFixed(1)}%`;

/** "p = 0.004", or "p < 0.001" for tiny values. */
const pText = (p: number) =>
  p < 0.001 ? "p < 0.001" : `p = ${formatPValue(p)}`;

/** The numbers the texts may quote, all measured on the generated data. */
function placeholderValues(
  caseData: Pick<AbTestCase, "experiment" | "results">,
  readout: ExperimentReadout,
): Record<string, string> {
  const { primary, sampleRatio, firstWeek, lastWeek } = readout;
  const worst = [...readout.guardrails].sort(
    (a, b) => b.worseningPercent - a.worseningPercent,
  )[0];
  return {
    days: String(caseData.results.daysRun),
    plannedDays: String(caseData.experiment.plan.days),
    lift: formatLift(primary.relativeLift),
    p: pText(primary.pValue),
    ci: `${formatLift(primary.ciLow)} to ${formatLift(primary.ciHigh)}`,
    share: percent(sampleRatio.observedShare),
    srmP: pText(sampleRatio.pValue),
    firstWeekLift: firstWeek ? formatLift(firstWeek.relativeLift) : "",
    lastWeekLift: lastWeek ? formatLift(lastWeek.relativeLift) : "",
    lastWeekP: lastWeek ? pText(lastWeek.pValue) : "",
    guardrail: worst.guardrail.label,
    guardrailChange: `${Math.abs(worst.comparison.relativeLift * 100).toFixed(1)}%`,
    guardrailP: pText(worst.comparison.pValue),
    segmentLifts: readout.segments
      .map((s) => `${s.value} ${formatLift(s.comparison.relativeLift)}`)
      .join(", "),
    segmentShares: readout.segments
      .map((s) => `${s.value} ${percent(s.treatmentShare)} in treatment`)
      .join(", "),
    usersPerArm: formatInteger(readout.usersPerArm),
    samplePerArm: formatInteger(caseData.experiment.plan.samplePerArm),
    mde: `${Math.round(caseData.experiment.plan.mde * 100)}%`,
  };
}

function fill(
  template: string,
  values: Record<string, string>,
  where: string,
): string {
  const text = template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    if (value === undefined || value === "") {
      throw new Error(`${where}: no value for placeholder ${match}`);
    }
    return value;
  });
  return text;
}

export function buildAbTestCase(spec: AbTestCaseSpec): AbTestCase {
  const { briefTemplate, experiment: experimentSpec, hidden, ...rest } = spec;
  const { simulation } = hidden;
  const samplePerArm = requiredSamplePerArm(
    experimentSpec.plan.baselineRate,
    experimentSpec.plan.mde,
  );
  const experiment = {
    ...experimentSpec,
    plan: {
      ...experimentSpec.plan,
      samplePerArm,
      days: plannedDays(
        samplePerArm,
        simulation.visitorsPerDay,
        experimentSpec.plan.treatmentShare,
      ),
    },
  };

  const problems = new Map<string, number>();
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const results = simulateResults(
      spec.seed,
      { ...simulation, attempt },
      experiment.plan.days,
      experiment.guardrails,
    );
    const draft = { experiment, results, hidden };
    const readout = readExperiment(draft);
    const problem = findPatternProblem(draft, readout);
    if (problem) {
      problems.set(problem, (problems.get(problem) ?? 0) + 1);
      continue;
    }

    const values = placeholderValues(draft, readout);
    const text = (template: string, where: string) =>
      fill(template, values, `Case "${spec.id}" ${where}`);
    return abTestCaseSchema.parse({
      ...rest,
      brief: text(briefTemplate, "brief"),
      experiment,
      results,
      hidden: {
        ...hidden,
        summary: text(hidden.summary, "summary"),
        explanation: text(hidden.explanation, "explanation"),
        recommendation: text(hidden.recommendation, "recommendation"),
        issueNotes: Object.fromEntries(
          Object.entries(hidden.issueNotes).map(([issue, note]) => [
            issue,
            text(note, `note for ${issue}`),
          ]),
        ),
        simulation: { ...simulation, attempt },
      },
    });
  }
  const summary = [...problems.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([problem, count]) => `${problem} (${count})`)
    .join("; ");
  throw new Error(
    `Case "${spec.id}": no attempt shows the intended pattern: ${summary}`,
  );
}
