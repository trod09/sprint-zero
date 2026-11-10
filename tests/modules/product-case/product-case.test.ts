import { describe, expect, it } from "vitest";

import { rankSolutions, topProblems } from "@/modules/product-case/analysis";
import { productCaseRawCases } from "@/modules/product-case/cases";
import { productCaseSpecs } from "@/modules/product-case/content/cases";
import {
  findStructuredProblem,
  generateProductCase,
} from "@/modules/product-case/generator";
import { toPublicProductCase } from "@/modules/product-case/public";
import {
  CASE_KINDS,
  estimationAnswerSchema,
  productCaseSchema,
  publicProductCaseSchema,
  structuredAnswerSchema,
  type EstimationCase,
  type StructuredCase,
} from "@/modules/product-case/schema";
import {
  ESTIMATION_WEIGHTS,
  estimateAccuracy,
  productCaseResultSchema,
  scoreProductCase,
  STRUCTURED_WEIGHTS,
} from "@/modules/product-case/scoring";

const cases = productCaseRawCases.map((raw) => productCaseSchema.parse(raw));
const structured = cases.filter(
  (c): c is StructuredCase => c.kind !== "estimation",
);
const estimations = cases.filter(
  (c): c is EstimationCase => c.kind === "estimation",
);

function idealStructured(caseData: StructuredCase) {
  const best = caseData.hidden.segments.find((s) => s.fit === 3)!.id;
  const problems = topProblems(caseData, best);
  return structuredAnswerSchema.parse({
    kind: caseData.kind,
    segmentId: best,
    problemIds: problems.map((p) => p.id),
    solutionRanking: rankSolutions(caseData, problems)
      .slice(0, 3)
      .map((s) => s.id),
    successMetricId: caseData.hidden.metrics.find((m) => m.success === 2)!.id,
    guardrailMetricId: caseData.hidden.metrics.find((m) => m.guardrail === 2)!
      .id,
  });
}

function idealEstimation(caseData: EstimationCase) {
  return estimationAnswerSchema.parse({
    kind: "estimation",
    factIds: caseData.hidden.requiredFactIds,
    multipliers: caseData.hidden.constants,
    estimate: caseData.hidden.truth,
  });
}

const points = (
  result: ReturnType<typeof scoreProductCase>,
  id: string,
): number => result.criteria.find((c) => c.id === id)!.points;

describe("pregenerated Product Case cases", () => {
  it("covers every kind of case", () => {
    expect(new Set(cases.map((c) => c.kind))).toEqual(new Set(CASE_KINDS));
  });

  it("matches what the generator produces from the specifications", () => {
    expect(cases.map((c) => c.id)).toEqual(productCaseSpecs.map((s) => s.id));
    for (const spec of productCaseSpecs) {
      expect(cases.find((c) => c.id === spec.id)).toEqual(
        generateProductCase(spec),
      );
    }
  });

  it("has a single best answer at every step", () => {
    for (const caseData of structured) {
      expect(findStructuredProblem(caseData), caseData.id).toBeNull();
    }
  });

  it("fills every number slot and makes the estimation trap matter", () => {
    for (const caseData of cases) {
      expect(JSON.stringify(caseData)).not.toMatch(/\{\w+\}/);
    }
    for (const caseData of estimations) {
      const { truth, trapEstimate } = caseData.hidden;
      expect(
        Math.max(truth, trapEstimate) / Math.min(truth, trapEstimate),
      ).toBeGreaterThanOrEqual(1.5);
    }
  });

  it("never sends ratings, ideal answers or the true estimate", () => {
    for (const caseData of cases) {
      const publicCase = toPublicProductCase(caseData);
      expect(publicProductCaseSchema.parse(publicCase)).toEqual(publicCase);
      const json = JSON.stringify(publicCase);
      expect(json).not.toContain('"hidden"');
      expect(json).not.toContain('"fit"');
      expect(json).not.toContain('"relief"');
      if (caseData.kind === "estimation") {
        expect(json).not.toContain(caseData.hidden.formula);
        expect(json).not.toContain(`${caseData.hidden.truth}`);
      } else {
        expect(json).not.toContain(caseData.hidden.ideal.users);
      }
    }
  });
});

describe("Product Case scoring", () => {
  it("weights add up to 100", () => {
    const sum = (weights: Record<string, number>) =>
      Object.values(weights).reduce((a, b) => a + b, 0);
    expect(sum(STRUCTURED_WEIGHTS)).toBe(100);
    expect(sum(ESTIMATION_WEIGHTS)).toBe(100);
  });

  it("gives 100 to the ideal answer of every case", () => {
    for (const caseData of structured) {
      const result = scoreProductCase(caseData, idealStructured(caseData));
      expect(result.total, caseData.id).toBe(100);
      expect(productCaseResultSchema.parse(result)).toBeTruthy();
    }
    for (const caseData of estimations) {
      const result = scoreProductCase(caseData, idealEstimation(caseData));
      expect(result.total, caseData.id).toBe(100);
      expect(productCaseResultSchema.parse(result)).toBeTruthy();
    }
  });

  it("judges later steps against the learner's own segment", () => {
    const caseData = structured.find((c) => c.kind === "improvement")!;
    const weak = caseData.hidden.segments.find((s) => s.fit === 2)!.id;
    const problems = topProblems(caseData, weak);
    const answer = {
      ...idealStructured(caseData),
      segmentId: weak,
      problemIds: problems.map((p) => p.id),
      solutionRanking: rankSolutions(caseData, problems)
        .slice(0, 3)
        .map((s) => s.id),
    };
    const result = scoreProductCase(caseData, answer);
    expect(points(result, "users")).toBeCloseTo(
      (STRUCTURED_WEIGHTS.users * 2) / 3,
      1,
    );
    expect(points(result, "problems")).toBe(STRUCTURED_WEIGHTS.problems);
    expect(points(result, "priorities")).toBe(STRUCTURED_WEIGHTS.priorities);
  });

  it("gives no guardrail credit when it repeats the success metric", () => {
    const caseData = structured[0];
    const ideal = idealStructured(caseData);
    const result = scoreProductCase(caseData, {
      ...ideal,
      guardrailMetricId: ideal.successMetricId,
    });
    expect(points(result, "metrics")).toBeCloseTo(
      STRUCTURED_WEIGHTS.metrics * 0.6,
      1,
    );
  });

  it("gives nothing to an empty answer and is deterministic", () => {
    for (const caseData of structured) {
      const empty = structuredAnswerSchema.parse({
        kind: caseData.kind,
        segmentId: null,
        problemIds: [],
        solutionRanking: [],
        successMetricId: null,
        guardrailMetricId: null,
      });
      expect(scoreProductCase(caseData, empty).total).toBe(0);
      const ideal = idealStructured(caseData);
      expect(scoreProductCase(caseData, ideal)).toEqual(
        scoreProductCase(caseData, ideal),
      );
    }
    const estimation = estimations[0];
    expect(
      scoreProductCase(
        estimation,
        estimationAnswerSchema.parse({
          kind: "estimation",
          factIds: [],
          multipliers: [],
          estimate: null,
        }),
      ).total,
    ).toBe(0);
  });

  it("scores a structured answer on an estimation case as empty", () => {
    const estimation = estimations[0];
    const result = scoreProductCase(estimation, idealStructured(structured[0]));
    expect(result.total).toBe(0);
  });

  it("grades estimates on a log scale", () => {
    expect(estimateAccuracy(1)).toBe(1);
    expect(estimateAccuracy(1.2)).toBe(1);
    expect(estimateAccuracy(1 / 1.2)).toBe(1);
    expect(estimateAccuracy(4)).toBe(0);
    expect(estimateAccuracy(0.2)).toBe(0);
    expect(estimateAccuracy(2)).toBeCloseTo(estimateAccuracy(0.5), 10);
    expect(estimateAccuracy(2)).toBeGreaterThan(0.3);
    expect(estimateAccuracy(2)).toBeLessThan(0.7);
  });

  it("costs points for falling into the estimation trap", () => {
    const caseData = estimations[0];
    const trapFacts = caseData.hidden.requiredFactIds
      .filter((id) => id !== "households")
      .concat("population");
    const result = scoreProductCase(caseData, {
      ...idealEstimation(caseData),
      factIds: trapFacts,
      estimate: caseData.hidden.trapEstimate,
    });
    expect(result.total).toBeLessThan(55);
    expect(result.report.kind === "estimation" && result.report.ratio).toBe(
      Math.round(
        (caseData.hidden.trapEstimate / caseData.hidden.truth) * 1000,
      ) / 1000,
    );
  });
});
