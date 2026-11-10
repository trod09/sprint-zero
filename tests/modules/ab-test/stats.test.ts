import { describe, expect, it } from "vitest";

import {
  compareProportions,
  normalCdf,
  requiredSamplePerArm,
  sampleRatioCheck,
  twoSidedP,
} from "@/modules/ab-test/stats";

describe("normal distribution", () => {
  it("matches known values of the standard normal", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.959964)).toBeCloseTo(0.975, 5);
    expect(normalCdf(-1)).toBeCloseTo(0.158655, 5);
    expect(twoSidedP(1.959964)).toBeCloseTo(0.05, 4);
    expect(twoSidedP(0)).toBe(1);
  });
});

describe("compareProportions", () => {
  it("computes rates, lift, interval and p-value of a two-proportion test", () => {
    const result = compareProportions(
      { users: 10000, conversions: 1000 },
      { users: 10000, conversions: 1100 },
    );
    expect(result.controlRate).toBeCloseTo(0.1);
    expect(result.treatmentRate).toBeCloseTo(0.11);
    expect(result.relativeLift).toBeCloseTo(0.1);
    // z = 0.01 / sqrt(0.105 * 0.895 * 2 / 10000) = 2.303
    expect(result.pValue).toBeCloseTo(0.0213, 3);
    expect(result.ciLow).toBeLessThan(0.1);
    expect(result.ciHigh).toBeGreaterThan(0.1);
    expect(result.ciLow).toBeGreaterThan(0);
  });

  it("is neutral with no difference or no users", () => {
    const same = compareProportions(
      { users: 500, conversions: 50 },
      { users: 500, conversions: 50 },
    );
    expect(same.relativeLift).toBe(0);
    expect(same.pValue).toBe(1);
    const empty = compareProportions(
      { users: 0, conversions: 0 },
      { users: 10, conversions: 1 },
    );
    expect(empty.pValue).toBe(1);
  });
});

describe("sampleRatioCheck", () => {
  it("accepts a split close to plan and flags a broken one", () => {
    expect(sampleRatioCheck(10050, 9950, 0.5).pValue).toBeGreaterThan(0.4);
    const broken = sampleRatioCheck(10500, 9500, 0.5);
    expect(broken.observedShare).toBeCloseTo(0.475);
    expect(broken.pValue).toBeLessThan(0.001);
  });
});

describe("requiredSamplePerArm", () => {
  it("matches the textbook formula for 80% power at 5% significance", () => {
    // p1 = 0.1, p2 = 0.11: 7.849 * (0.09 + 0.0979) / 0.0001 = 14,749
    expect(requiredSamplePerArm(0.1, 0.1)).toBe(14749);
    expect(requiredSamplePerArm(0.1, 0.05)).toBeGreaterThan(
      requiredSamplePerArm(0.1, 0.1) * 3.5,
    );
  });
});
