import { describe, expect, it } from "vitest";

import {
  buildScoreResult,
  clamp,
  clamp01,
  roundTo,
  safeRatio,
  scoreResultSchema,
  type ScoreCriterionInput,
} from "@/core/scoring";

const criteria: ScoreCriterionInput[] = [
  { id: "value", label: "Value delivered", weight: 40, ratio: 0.8 },
  { id: "critical", label: "Critical tickets", weight: 20, ratio: 1 },
  { id: "traps", label: "Traps avoided", weight: 15, ratio: 1 / 3 },
  { id: "event", label: "Mid-sprint event", weight: 15, ratio: 0.5 },
  { id: "capacity", label: "Capacity respected", weight: 10, ratio: 0 },
];

describe("buildScoreResult", () => {
  it("computes weighted points and an integer total", () => {
    const result = buildScoreResult(criteria);
    // 32 + 20 + 5 + 7.5 + 0 = 64.5 -> 65
    expect(result.total).toBe(65);
    expect(result.criteria.map((c) => c.points)).toEqual([32, 20, 5, 7.5, 0]);
    expect(scoreResultSchema.safeParse(result).success).toBe(true);
  });

  it("is reproducible: same input, same output", () => {
    expect(buildScoreResult(criteria)).toEqual(buildScoreResult(criteria));
  });

  it("spans the full 0..100 range", () => {
    const all = (ratio: number) =>
      buildScoreResult(criteria.map((c) => ({ ...c, ratio }))).total;
    expect(all(0)).toBe(0);
    expect(all(1)).toBe(100);
  });

  it("is not thrown off by floating point noise at .5 boundaries", () => {
    // 45 * 0.7 is 31.499999999999996 in binary floating point; the score is 31.5 -> 32.
    expect(45 * 0.7).toBeLessThan(31.5);
    const result = buildScoreResult([
      { id: "a", label: "A", weight: 45, ratio: 0.7 },
      { id: "b", label: "B", weight: 55, ratio: 0 },
    ]);
    expect(result.total).toBe(32);
    expect(result.criteria[0].points).toBe(31.5);
  });

  it("keeps the optional detail", () => {
    const [first] = buildScoreResult([
      { id: "a", label: "A", weight: 100, ratio: 1, detail: "All good" },
    ]).criteria;
    expect(first.detail).toBe("All good");
  });

  it("rejects programming errors in a scoring engine", () => {
    expect(() => buildScoreResult([])).toThrow(/at least one/);
    expect(() =>
      buildScoreResult([{ id: "a", label: "A", weight: 90, ratio: 1 }]),
    ).toThrow(/add up to 100/);
    expect(() =>
      buildScoreResult([
        { id: "a", label: "A", weight: 50, ratio: 1 },
        { id: "a", label: "A again", weight: 50, ratio: 1 },
      ]),
    ).toThrow(/Duplicate/);
    expect(() =>
      buildScoreResult([{ id: "a", label: "A", weight: 100, ratio: 1.2 }]),
    ).toThrow(/ratio/);
    expect(() =>
      buildScoreResult([
        { id: "a", label: "A", weight: 100, ratio: Number.NaN },
      ]),
    ).toThrow(/ratio/);
  });
});

describe("scoring helpers", () => {
  it("clamp and clamp01", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(Number.NaN, 0, 3)).toBe(0);
    expect(clamp01(1.4)).toBe(1);
    expect(clamp01(-0.2)).toBe(0);
  });

  it("safeRatio handles empty denominators and clamps", () => {
    expect(safeRatio(1, 4)).toBe(0.25);
    expect(safeRatio(5, 4)).toBe(1);
    expect(safeRatio(-1, 4)).toBe(0);
    expect(safeRatio(0, 0)).toBe(1);
    expect(safeRatio(0, 0, 0)).toBe(0);
  });

  it("roundTo rounds half up without float artefacts", () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(7.45, 1)).toBe(7.5);
    expect(roundTo(12.34, 0)).toBe(12);
  });
});
