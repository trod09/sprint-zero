import { describe, expect, it } from "vitest";

import {
  caseXp,
  computeProgress,
  levelFor,
  localDayKey,
  rewardFor,
  starsFor,
  streaks,
  type CaseInfo,
  type ProgressAttempt,
} from "@/core/progress";

const catalog: CaseInfo[] = [
  { id: "a-1", moduleId: "a", difficulty: "apm" },
  { id: "a-2", moduleId: "a", difficulty: "senior" },
  { id: "b-1", moduleId: "b", difficulty: "pm" },
];

/** Noon local time, so the day key never depends on the time zone. */
const day = (d: number) => new Date(2026, 10, d, 12).toISOString();

let counter = 0;
const attempt = (
  caseId: string,
  score: number,
  d: number,
  moduleId = caseId.split("-")[0],
): ProgressAttempt => ({
  id: `t${(counter += 1)}`,
  caseId,
  moduleId,
  submittedAt: day(d),
  score,
});

describe("stars, XP and levels", () => {
  it("gives stars at 50, 75 and 90", () => {
    expect([0, 49.9, 50, 74, 75, 89, 90, 100].map(starsFor)).toEqual([
      0, 0, 1, 1, 2, 2, 3, 3,
    ]);
  });

  it("adds 25 XP per star to the best score", () => {
    expect(caseXp(40)).toBe(40);
    expect(caseXp(80)).toBe(130);
    expect(caseXp(100)).toBe(175);
  });

  it("makes each level cost 200 x level", () => {
    expect(levelFor(0)).toEqual({ level: 1, into: 0, needed: 200 });
    expect(levelFor(199).level).toBe(1);
    expect(levelFor(200)).toEqual({ level: 2, into: 0, needed: 400 });
    expect(levelFor(650)).toEqual({ level: 3, into: 50, needed: 600 });
  });
});

describe("streaks", () => {
  it("counts consecutive days ending today or yesterday", () => {
    const days = ["2026-11-03", "2026-11-04", "2026-11-05", "2026-11-08"];
    expect(streaks(days, "2026-11-08")).toEqual({ current: 1, longest: 3 });
    expect(streaks(days, "2026-11-09").current).toBe(1);
    expect(streaks(days, "2026-11-10").current).toBe(0);
    expect(streaks(days, "2026-11-06")).toEqual({ current: 3, longest: 3 });
  });

  it("crosses month boundaries", () => {
    expect(streaks(["2026-10-31", "2026-11-01"], "2026-11-01").current).toBe(2);
  });
});

describe("computeProgress", () => {
  it("only counts the best score of each case", () => {
    const progress = computeProgress(
      [attempt("a-1", 60, 1), attempt("a-1", 95, 2), attempt("a-1", 30, 3)],
      catalog,
      new Date(day(3)),
    );
    expect(progress.cases["a-1"]).toEqual({
      best: 95,
      stars: 3,
      xp: 170,
      attempts: 3,
    });
    expect(progress.xp).toBe(170);
    expect(progress.streak).toBe(3);
  });

  it("tracks module progress over curated cases", () => {
    const progress = computeProgress(
      [attempt("a-1", 92, 1), attempt("gen-a-fintech-pm-12", 80, 1)],
      catalog,
      new Date(day(1)),
    );
    expect(progress.modules.a).toEqual({
      moduleId: "a",
      played: 1,
      total: 2,
      stars: 3,
      maxStars: 6,
    });
    expect(progress.modules.b.played).toBe(0);
    expect(progress.badges.generated).toBe(true);
  });

  it("awards badges from the attempts alone", () => {
    const none = computeProgress([], catalog, new Date(day(1)));
    expect(Object.values(none.badges).every((earned) => !earned)).toBe(true);

    const progress = computeProgress(
      [attempt("a-1", 100, 1), attempt("a-2", 90, 2), attempt("b-1", 40, 3)],
      catalog,
      new Date(day(3)),
    );
    expect(progress.badges).toEqual({
      first_case: true,
      perfect: true,
      module_master: true,
      streak_3: true,
      streak_7: false,
      senior_clear: true,
      explorer: true,
      generated: false,
    });
  });
});

describe("rewardFor", () => {
  it("credits only the improvement on a replay", () => {
    const first = attempt("a-1", 60, 1);
    const replay = attempt("a-1", 80, 2);
    const attempts = [first, replay];
    expect(rewardFor(attempts, first.id, catalog)).toMatchObject({
      xpGained: 85,
      stars: 1,
      newBadges: ["first_case"],
    });
    expect(rewardFor(attempts, replay.id, catalog)).toMatchObject({
      xpGained: 130 - 85,
      before: { xp: 85 },
      after: { xp: 130 },
      newBadges: [],
    });
    expect(rewardFor(attempts, "missing", catalog)).toBeNull();
  });

  it("gives nothing for a replay below the best", () => {
    const best = attempt("b-1", 90, 1);
    const worse = attempt("b-1", 50, 2);
    expect(rewardFor([best, worse], worse.id, catalog)?.xpGained).toBe(0);
  });
});

describe("localDayKey", () => {
  it("uses the local calendar day", () => {
    expect(localDayKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});
