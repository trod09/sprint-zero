/**
 * The readout of an experiment, computed from its public counts. Client-safe:
 * the dashboard shows exactly these numbers, and the case builder checks
 * them to make sure every case shows the pattern it is meant to show.
 */
import type { Arms, Guardrail, PublicAbTestCase } from "./schema";
import {
  compareProportions,
  sampleRatioCheck,
  sumProportions,
  type Comparison,
  type SampleRatioCheck,
} from "./stats";

export const SIGNIFICANCE = 0.05;
/** Days compared at the start and the end of a run to see a trend. */
export const WEEK = 7;

export interface GuardrailReadout {
  guardrail: Guardrail;
  comparison: Comparison;
  /** Relative change in the bad direction, in percent (positive = worse). */
  worseningPercent: number;
  /** Significantly worse than the team's tolerance allows. */
  breached: boolean;
}

export interface ExperimentReadout {
  totals: Arms;
  primary: Comparison;
  sampleRatio: SampleRatioCheck;
  /** Users in the smaller arm, against the plan. */
  usersPerArm: number;
  reachedSample: boolean;
  daily: { day: number; comparison: Comparison; cumulative: Comparison }[];
  /** First and last week of the run, when it lasted two weeks or more. */
  firstWeek: Comparison | null;
  lastWeek: Comparison | null;
  segments: {
    value: string;
    comparison: Comparison;
    users: number;
    treatmentShare: number;
  }[];
  guardrails: GuardrailReadout[];
}

type ReadableCase = Pick<PublicAbTestCase, "experiment" | "results">;

function totalsOf(days: readonly Arms[]): Arms {
  return {
    control: sumProportions(days.map((day) => day.control)),
    treatment: sumProportions(days.map((day) => day.treatment)),
  };
}

const compareArms = (arms: Arms) =>
  compareProportions(arms.control, arms.treatment);

export function readExperiment(caseData: ReadableCase): ExperimentReadout {
  const { experiment, results } = caseData;
  const totals = totalsOf(results.daily);
  const usersPerArm = Math.min(totals.control.users, totals.treatment.users);

  const daily: ExperimentReadout["daily"] = [];
  for (let day = 0; day < results.daily.length; day++) {
    daily.push({
      day,
      comparison: compareArms(results.daily[day]),
      cumulative: compareArms(totalsOf(results.daily.slice(0, day + 1))),
    });
  }
  const twoWeeks = results.daily.length >= 2 * WEEK;

  return {
    totals,
    primary: compareArms(totals),
    sampleRatio: sampleRatioCheck(
      totals.control.users,
      totals.treatment.users,
      experiment.plan.treatmentShare,
    ),
    usersPerArm,
    reachedSample: usersPerArm >= 0.9 * experiment.plan.samplePerArm,
    daily,
    firstWeek: twoWeeks
      ? compareArms(totalsOf(results.daily.slice(0, WEEK)))
      : null,
    lastWeek: twoWeeks
      ? compareArms(totalsOf(results.daily.slice(-WEEK)))
      : null,
    segments: results.segments.map((segment) => {
      const users = segment.control.users + segment.treatment.users;
      return {
        value: segment.value,
        comparison: compareArms(segment),
        users,
        treatmentShare: users === 0 ? 0 : segment.treatment.users / users,
      };
    }),
    guardrails: experiment.guardrails.map((guardrail, index) => {
      const comparison = compareArms(results.guardrails[index]);
      const sign = guardrail.goodDirection === "down" ? 1 : -1;
      const worseningPercent = sign * comparison.relativeLift * 100;
      return {
        guardrail,
        comparison,
        worseningPercent,
        breached:
          worseningPercent > guardrail.tolerance &&
          comparison.pValue < SIGNIFICANCE,
      };
    }),
  };
}

/** "+6.1%" / "−3.2%" for a relative change (0.061 → "+6.1%"). */
export function formatLift(relative: number, decimals = 1): string {
  const value = relative * 100;
  const rounded = value.toFixed(decimals);
  if (Number(rounded) === 0) return `${(0).toFixed(decimals)}%`;
  return value > 0 ? `+${rounded}%` : `−${rounded.replace("-", "")}%`;
}

/** A rate as a percentage: 0.0812 → "8.12%". */
export function formatRate(rate: number): string {
  const percent = rate * 100;
  const decimals = percent < 1 ? 3 : 2;
  return `${percent.toFixed(decimals)}%`;
}

export function formatPValue(p: number): string {
  if (p < 0.001) return "<0.001";
  return p.toFixed(3);
}
