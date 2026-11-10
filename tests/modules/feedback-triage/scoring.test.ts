import { describe, expect, it } from "vitest";

import { feedbackTriageRawCases } from "@/modules/feedback-triage/cases";
import {
  feedbackTriageAnswerSchema,
  feedbackTriageCaseSchema,
  type FeedbackTriageAnswer,
  type FeedbackTriageCase,
} from "@/modules/feedback-triage/schema";
import {
  overlapF1,
  scoreTriageAnswer,
  themeOfCluster,
  TRIAGE_WEIGHTS,
  triageResultSchema,
} from "@/modules/feedback-triage/scoring";

const cases = feedbackTriageRawCases.map((raw) =>
  feedbackTriageCaseSchema.parse(raw),
);
const coinpath = cases.find((c) => c.id === "feedback-triage-coinpath")!;

function ideal(caseData: FeedbackTriageCase): FeedbackTriageAnswer {
  return {
    clusters: caseData.hidden.themes.map((theme) => ({
      id: theme.key,
      name: theme.label,
      itemIds: [...theme.itemIds],
      opportunity: theme.opportunity,
    })),
    criticalClusterId: caseData.hidden.themes[0].key,
    noiseItemIds: [...caseData.hidden.noiseItemIds],
  };
}

const points = (result: ReturnType<typeof scoreTriageAnswer>, id: string) =>
  result.criteria.find((c) => c.id === id)!.points;

describe("overlapF1 and themeOfCluster", () => {
  it("measures overlap between a cluster and a theme", () => {
    expect(overlapF1(["a", "b"], ["a", "b"])).toBe(1);
    expect(overlapF1(["a", "b"], ["a", "c"])).toBe(0.5);
    expect(overlapF1([], ["a"])).toBe(0);
  });

  it("names the majority theme of a cluster, or none", () => {
    const themes = coinpath.hidden.themes;
    const [a, b] = themes;
    expect(themeOfCluster({ itemIds: a.itemIds }, themes)?.key).toBe(a.key);
    const mixed = [...a.itemIds.slice(0, 2), ...b.itemIds.slice(0, 3)];
    expect(themeOfCluster({ itemIds: mixed }, themes)?.key).toBe(b.key);
    const even = [a.itemIds[0], b.itemIds[0], coinpath.hidden.noiseItemIds[0]];
    expect(themeOfCluster({ itemIds: even }, themes)).toBeNull();
  });
});

describe("feedback triage scoring", () => {
  it("weights add up to 100", () => {
    expect(Object.values(TRIAGE_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("gives 100 to the ideal triage of every case", () => {
    for (const caseData of cases) {
      const answer = feedbackTriageAnswerSchema.parse(ideal(caseData));
      const result = scoreTriageAnswer(caseData, answer);
      expect(result.total, caseData.id).toBe(100);
      expect(triageResultSchema.parse(result)).toBeTruthy();
    }
  });

  it("is deterministic", () => {
    const answer = ideal(coinpath);
    expect(scoreTriageAnswer(coinpath, answer)).toEqual(
      scoreTriageAnswer(coinpath, answer),
    );
  });

  it("ranks by the themes behind the top three clusters", () => {
    const answer = ideal(coinpath);
    // Ranking the loudest themes first instead of the most important ones.
    answer.clusters.reverse();
    const result = scoreTriageAnswer(coinpath, answer);
    expect(points(result, "ranking")).toBe(0);
    expect(points(result, "themes")).toBe(TRIAGE_WEIGHTS.themes);
  });

  it("only credits the critical flag on the right cluster", () => {
    const wrong = { ...ideal(coinpath), criticalClusterId: "pricing" };
    expect(points(scoreTriageAnswer(coinpath, wrong), "critical")).toBe(0);
    const none = { ...ideal(coinpath), criticalClusterId: null };
    expect(points(scoreTriageAnswer(coinpath, none), "critical")).toBe(0);
  });

  it("gives partial credit when the critical items are mixed with others", () => {
    const answer = ideal(coinpath);
    const critical = answer.clusters[0];
    const second = answer.clusters[1];
    critical.itemIds.push(...second.itemIds.splice(0, 3));
    const ratio = scoreTriageAnswer(coinpath, answer).criteria.find(
      (c) => c.id === "critical",
    )!.ratio;
    expect(ratio).toBeGreaterThan(0.5);
    expect(ratio).toBeLessThan(1);
  });

  it("counts unsorted items and lumped themes against coverage", () => {
    const one = scoreTriageAnswer(coinpath, {
      clusters: [
        {
          id: "all",
          name: "Everything",
          itemIds: coinpath.items.map((i) => i.id),
          opportunity: "",
        },
      ],
      criticalClusterId: "all",
      noiseItemIds: [],
    });
    expect(points(one, "themes")).toBeLessThan(TRIAGE_WEIGHTS.themes / 3);
    expect(points(one, "noise")).toBe(0);

    const partial = ideal(coinpath);
    partial.clusters = partial.clusters.slice(0, 3);
    const result = scoreTriageAnswer(coinpath, partial);
    expect(result.report.unsorted).toBeGreaterThan(0);
    expect(points(result, "themes")).toBeLessThan(TRIAGE_WEIGHTS.themes);
  });

  it("penalizes setting real feedback aside as noise", () => {
    const answer = ideal(coinpath);
    const moved = answer.clusters[3].itemIds.splice(0, 4);
    answer.noiseItemIds.push(...moved);
    const result = scoreTriageAnswer(coinpath, answer);
    expect(result.report.noise.wronglySetAside).toBe(4);
    expect(points(result, "noise")).toBeLessThan(TRIAGE_WEIGHTS.noise);
  });

  it("rejects answers that place an item twice", () => {
    const answer = ideal(coinpath);
    answer.noiseItemIds.push(answer.clusters[0].itemIds[0]);
    expect(feedbackTriageAnswerSchema.safeParse(answer).success).toBe(false);
  });
});
