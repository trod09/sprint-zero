import { describe, expect, it } from "vitest";

import {
  computeSkillRatings,
  expectedScore,
  firstAttempts,
  ratingToLevel,
  recommendCases,
  START_RATING,
  targetDifficulty,
  type RatedAttempt,
} from "@/core/skills";

const attempt = (
  caseId: string,
  score: number,
  overrides: Partial<RatedAttempt> = {},
): RatedAttempt => ({
  caseId,
  skills: ["analytics"],
  difficulty: "pm",
  score,
  submittedAt: `2026-11-0${caseId.length % 9}T10:00:00.000Z`,
  ...overrides,
});

describe("skill ratings", () => {
  it("starts every skill at the same rating with no attempts", () => {
    const ratings = computeSkillRatings([]);
    for (const entry of Object.values(ratings)) {
      expect(entry.rating).toBe(START_RATING);
      expect(entry.attempts).toBe(0);
    }
  });

  it("follows the Elo expectation", () => {
    expect(expectedScore(1000, 1000)).toBe(0.5);
    expect(expectedScore(1200, 1000)).toBeGreaterThan(0.75);
  });

  it("rises with good scores and falls with bad ones, more on harder cases", () => {
    const good = computeSkillRatings([attempt("a", 90)]);
    const bad = computeSkillRatings([attempt("a", 10)]);
    expect(good.analytics.rating).toBeGreaterThan(START_RATING);
    expect(bad.analytics.rating).toBeLessThan(START_RATING);
    const senior = computeSkillRatings([
      attempt("a", 70, { difficulty: "senior" }),
    ]);
    const apm = computeSkillRatings([attempt("a", 70, { difficulty: "apm" })]);
    expect(senior.analytics.rating).toBeGreaterThan(apm.analytics.rating);
  });

  it("counts secondary skills at half weight", () => {
    const ratings = computeSkillRatings([
      attempt("a", 100, { skills: ["execution", "strategy"] }),
    ]);
    const primaryGain = ratings.execution.rating - START_RATING;
    const secondaryGain = ratings.strategy.rating - START_RATING;
    expect(Math.abs(secondaryGain - primaryGain / 2)).toBeLessThanOrEqual(1);
    expect(ratings.analytics.attempts).toBe(0);
  });

  it("ignores replays of a case and is order independent of input", () => {
    const first = attempt("a", 40, { submittedAt: "2026-11-01T10:00:00Z" });
    const replay = attempt("a", 100, { submittedAt: "2026-11-02T10:00:00Z" });
    expect(firstAttempts([replay, first])).toEqual([first]);
    expect(computeSkillRatings([replay, first])).toEqual(
      computeSkillRatings([first]),
    );
  });

  it("maps ratings to a 0-100 level and to a target difficulty", () => {
    expect(ratingToLevel(800)).toBe(0);
    expect(ratingToLevel(1200)).toBe(50);
    expect(ratingToLevel(2000)).toBe(100);
    expect(targetDifficulty(1000)).toBe("apm");
    expect(targetDifficulty(1200)).toBe("pm");
    expect(targetDifficulty(1350)).toBe("senior");
  });
});

describe("recommendCases", () => {
  const cases = [
    {
      id: "md-1",
      moduleId: "metric-drop",
      difficulty: "apm" as const,
      skills: ["analytics" as const],
    },
    {
      id: "md-2",
      moduleId: "metric-drop",
      difficulty: "pm" as const,
      skills: ["analytics" as const],
    },
    {
      id: "bl-1",
      moduleId: "backlog",
      difficulty: "apm" as const,
      skills: ["execution" as const, "strategy" as const],
    },
    {
      id: "ft-1",
      moduleId: "feedback-triage",
      difficulty: "apm" as const,
      skills: ["product_sense" as const, "analytics" as const],
    },
  ];

  it("starts with skills never practiced and skips played cases", () => {
    const ratings = computeSkillRatings([
      attempt("md-1", 90, { submittedAt: "2026-11-01T10:00:00Z" }),
    ]);
    const recs = recommendCases(ratings, cases, new Set(["md-1"]));
    expect(recs.map((r) => r.skill)).toEqual([
      "execution",
      "product_sense",
      // Strategy only has bl-1, already picked for execution.
      "analytics",
    ]);
    expect(recs.map((r) => r.reason)).toEqual([
      "not_practiced",
      "not_practiced",
      "weakest",
    ]);
    expect(recs.map((r) => r.caseId)).not.toContain("md-1");
    expect(new Set(recs.map((r) => r.caseId)).size).toBe(recs.length);
  });

  it("prefers modules where the skill comes first", () => {
    const ratings = computeSkillRatings([]);
    const recs = recommendCases(ratings, cases, new Set(), 5);
    expect(recs.find((r) => r.skill === "analytics")?.caseId).toMatch(/^md-/);
  });
});
