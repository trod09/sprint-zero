import { describe, expect, it } from "vitest";

import { abTestRawCases } from "@/modules/ab-test/cases";
import {
  abTestAnswerSchema,
  abTestCaseSchema,
  type AbTestAnswer,
  type AbTestCase,
} from "@/modules/ab-test/schema";
import {
  AB_TEST_WEIGHTS,
  abTestResultSchema,
  scoreAbTestAnswer,
} from "@/modules/ab-test/scoring";

const cases = abTestRawCases.map((raw) => abTestCaseSchema.parse(raw));
const byId = (id: string) => cases.find((c) => c.id === id)!;

const ideal = (caseData: AbTestCase): AbTestAnswer => ({
  issues: [...caseData.hidden.issues],
  effect: caseData.hidden.effect,
  decision: caseData.hidden.decision,
  justification: "",
  viewed: ["scorecard"],
});

const points = (result: ReturnType<typeof scoreAbTestAnswer>, id: string) =>
  result.criteria.find((c) => c.id === id)!.points;

describe("A/B test scoring", () => {
  it("weights add up to 100", () => {
    expect(Object.values(AB_TEST_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("gives 100 to the ideal answer of every case", () => {
    for (const caseData of cases) {
      const result = scoreAbTestAnswer(caseData, ideal(caseData));
      expect(result.total, caseData.id).toBe(100);
      expect(abTestResultSchema.parse(result)).toBeTruthy();
    }
  });

  it("is deterministic", () => {
    const caseData = byId("ab-test-savings-streaks");
    const answer = abTestAnswerSchema.parse({
      issues: ["srm"],
      effect: "improves",
      decision: "ship",
    });
    expect(scoreAbTestAnswer(caseData, answer)).toEqual(
      scoreAbTestAnswer(caseData, answer),
    );
  });

  it("gives nothing to shipping a broken experiment on its headline", () => {
    const caseData = byId("ab-test-onboarding-checklist");
    const result = scoreAbTestAnswer(caseData, {
      ...ideal(caseData),
      issues: [],
      effect: "improves",
      decision: "ship",
    });
    expect(result.total).toBe(0);
    expect(result.report.issues.find((i) => i.issue === "srm")?.status).toBe(
      "missed",
    );
  });

  it("gives partial credit for a defensible decision and effect", () => {
    const caseData = byId("ab-test-friends-push");
    const result = scoreAbTestAnswer(caseData, {
      ...ideal(caseData),
      effect: "inconclusive",
      decision: "iterate",
    });
    expect(points(result, "decision")).toBe(AB_TEST_WEIGHTS.decision / 2);
    expect(points(result, "effect")).toBe(AB_TEST_WEIGHTS.effect / 2);
    expect(points(result, "issues")).toBe(AB_TEST_WEIGHTS.issues);
  });

  it("splits detection credit across several problems", () => {
    const caseData = byId("ab-test-friends-push");
    const result = scoreAbTestAnswer(caseData, {
      ...ideal(caseData),
      issues: ["novelty"],
    });
    expect(points(result, "issues")).toBe(AB_TEST_WEIGHTS.issues / 2);
  });

  it("penalizes false alarms, also on a clean readout", () => {
    const caseData = byId("ab-test-one-tap-reorder");
    const one = scoreAbTestAnswer(caseData, {
      ...ideal(caseData),
      issues: ["novelty"],
    });
    expect(points(one, "issues")).toBeCloseTo(AB_TEST_WEIGHTS.issues * 0.66, 1);
    const many = scoreAbTestAnswer(caseData, {
      ...ideal(caseData),
      issues: ["novelty", "simpson", "srm"],
    });
    expect(points(many, "issues")).toBe(0);
    expect(
      many.report.issues.filter((i) => i.status === "false_alarm"),
    ).toHaveLength(3);
  });

  it("does not penalize a fair extra flag", () => {
    const caseData = byId("ab-test-card-activation");
    const result = scoreAbTestAnswer(caseData, {
      ...ideal(caseData),
      issues: ["simpson", "srm"],
    });
    expect(result.total).toBe(100);
    expect(result.report.issues.find((i) => i.issue === "srm")?.status).toBe(
      "acceptable",
    );
  });

  it("rejects repeated flags in an answer", () => {
    expect(
      abTestAnswerSchema.safeParse({
        issues: ["srm", "srm"],
        effect: "improves",
        decision: "ship",
      }).success,
    ).toBe(false);
  });
});
