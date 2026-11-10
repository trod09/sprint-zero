/**
 * Frequentist statistics for two-arm experiments on conversion rates.
 *
 * Pure and client-safe: the dashboard computes what it shows from the public
 * counts with these same functions, and the case builder uses them to check
 * that each case shows the pattern it is meant to show.
 */

/** Standard normal cumulative distribution (Abramowitz-Stegun 7.1.26, error < 1.5e-7). */
export function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const poly =
    t *
    (0.254829592 +
      t *
        (-0.284496736 +
          t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
}

/** Two-sided p-value of a z statistic. */
export function twoSidedP(z: number): number {
  if (!Number.isFinite(z)) return 0;
  if (z === 0) return 1;
  return Math.min(1, 2 * (1 - normalCdf(Math.abs(z))));
}

const Z_95 = 1.959964;
const Z_POWER_80 = 0.841621;

export interface Proportion {
  users: number;
  conversions: number;
}

export interface Comparison {
  controlRate: number;
  treatmentRate: number;
  /** Treatment minus control, in rate points (0.004 = 0.4 pp). */
  difference: number;
  /** Relative change of treatment over control (0.05 = +5%). */
  relativeLift: number;
  /** 95% interval of the relative lift. */
  ciLow: number;
  ciHigh: number;
  pValue: number;
}

const rate = ({ users, conversions }: Proportion) =>
  users === 0 ? 0 : conversions / users;

/**
 * Two-proportion z-test (pooled) with a 95% interval for the difference
 * (unpooled), expressed relative to the control rate.
 */
export function compareProportions(
  control: Proportion,
  treatment: Proportion,
): Comparison {
  const p1 = rate(control);
  const p2 = rate(treatment);
  const difference = p2 - p1;
  const relativeLift = p1 === 0 ? 0 : difference / p1;
  const n1 = control.users;
  const n2 = treatment.users;
  if (n1 === 0 || n2 === 0) {
    return {
      controlRate: p1,
      treatmentRate: p2,
      difference,
      relativeLift,
      ciLow: 0,
      ciHigh: 0,
      pValue: 1,
    };
  }
  const pooled = (control.conversions + treatment.conversions) / (n1 + n2);
  const pooledSe = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));
  const z = pooledSe === 0 ? 0 : difference / pooledSe;
  const se = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
  const scale = p1 === 0 ? 0 : 1 / p1;
  return {
    controlRate: p1,
    treatmentRate: p2,
    difference,
    relativeLift,
    ciLow: (difference - Z_95 * se) * scale,
    ciHigh: (difference + Z_95 * se) * scale,
    pValue: twoSidedP(z),
  };
}

export interface SampleRatioCheck {
  /** Share of users in treatment. */
  observedShare: number;
  expectedShare: number;
  /** Chi-square goodness of fit with one degree of freedom. */
  pValue: number;
}

/** Sample ratio mismatch test: is the observed split compatible with the plan? */
export function sampleRatioCheck(
  controlUsers: number,
  treatmentUsers: number,
  expectedShare: number,
): SampleRatioCheck {
  const total = controlUsers + treatmentUsers;
  if (total === 0) {
    return { observedShare: 0, expectedShare, pValue: 1 };
  }
  const expectedTreatment = total * expectedShare;
  const expectedControl = total - expectedTreatment;
  const chiSquare =
    (treatmentUsers - expectedTreatment) ** 2 / expectedTreatment +
    (controlUsers - expectedControl) ** 2 / expectedControl;
  return {
    observedShare: treatmentUsers / total,
    expectedShare,
    // With one degree of freedom, chi-square is the square of a standard normal.
    pValue: twoSidedP(Math.sqrt(chiSquare)),
  };
}

/**
 * Users per arm needed to detect a relative lift of `mde` over `baseline`
 * with a two-sided 5% test and 80% power.
 */
export function requiredSamplePerArm(baseline: number, mde: number): number {
  const p1 = baseline;
  const p2 = baseline * (1 + mde);
  const variance = p1 * (1 - p1) + p2 * (1 - p2);
  return Math.ceil(((Z_95 + Z_POWER_80) ** 2 * variance) / (p2 - p1) ** 2);
}

/** Adds up counts, e.g. several days or several segments. */
export function sumProportions(items: readonly Proportion[]): Proportion {
  let users = 0;
  let conversions = 0;
  for (const item of items) {
    users += item.users;
    conversions += item.conversions;
  }
  return { users, conversions };
}
