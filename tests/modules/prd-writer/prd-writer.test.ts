import { describe, expect, it } from "vitest";

import { prdRawCases } from "@/modules/prd-writer/cases";
import { prdSpecs } from "@/modules/prd-writer/content/cases";
import {
  findPrdProblem,
  generatePrdCase,
} from "@/modules/prd-writer/generator";
import { toPublicPrdCase } from "@/modules/prd-writer/public";
import {
  prdAnswerSchema,
  prdCaseSchema,
  publicPrdCaseSchema,
  type PrdAnswer,
  type PrdCase,
} from "@/modules/prd-writer/schema";
import {
  bucketCredit,
  METRIC_PARTS,
  PRD_WEIGHTS,
  prdResultSchema,
  scorePrd,
} from "@/modules/prd-writer/scoring";

const cases = prdRawCases.map((raw) => prdCaseSchema.parse(raw));

const topIds = (list: { id: string; value: number }[]) =>
  [...list]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((item) => item.id);

function ideal(caseData: PrdCase): PrdAnswer {
  const { hidden } = caseData;
  return prdAnswerSchema.parse({
    evidenceIds: topIds(
      hidden.evidence.map((e) => ({ id: e.id, value: e.strength })),
    ),
    metric: {
      metricId: hidden.metric.primaryId,
      baseline: hidden.metric.baseline,
      target: (hidden.metric.targetMin + hidden.metric.targetMax) / 2,
      horizon: hidden.metric.horizon,
    },
    scope: Object.fromEntries(hidden.requirements.map((r) => [r.id, r.bucket])),
    risks: topIds(
      hidden.risks.map((r) => ({ id: r.id, value: r.relevance })),
    ).map((riskId) => ({ riskId })),
  });
}

const points = (result: ReturnType<typeof scorePrd>, id: string) =>
  result.criteria.find((c) => c.id === id)!.points;

describe("pregenerated PRD Writer cases", () => {
  it("has one case per level", () => {
    expect(cases.map((c) => c.difficulty).sort()).toEqual([
      "apm",
      "pm",
      "senior",
    ]);
  });

  it("matches what the generator produces from the specifications", () => {
    expect(cases.map((c) => c.id)).toEqual(prdSpecs.map((s) => s.id));
    for (const spec of prdSpecs) {
      expect(cases.find((c) => c.id === spec.id)).toEqual(
        generatePrdCase(spec),
      );
    }
  });

  it("has a clear best answer and states the baseline in the documents", () => {
    for (const caseData of cases) {
      expect(findPrdProblem(caseData), caseData.id).toBeNull();
      expect(JSON.stringify(caseData)).not.toMatch(/\{\w+\}/);
    }
  });

  it("never sends ratings, buckets or the ideal one-pager", () => {
    for (const caseData of cases) {
      const publicCase = toPublicPrdCase(caseData);
      expect(publicPrdCaseSchema.parse(publicCase)).toEqual(publicCase);
      const json = JSON.stringify(publicCase);
      expect(json).not.toContain('"hidden"');
      expect(json).not.toContain('"bucket"');
      expect(json).not.toContain('"strength"');
      expect(json).not.toContain(caseData.hidden.ideal.scope);
    }
  });
});

describe("PRD Writer scoring", () => {
  it("weights add up to 100", () => {
    expect(Object.values(PRD_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
    expect(Object.values(METRIC_PARTS).reduce((a, b) => a + b, 0)).toBeCloseTo(
      1,
      10,
    );
  });

  it("gives 100 to the ideal one-pager of every case", () => {
    for (const caseData of cases) {
      const result = scorePrd(caseData, ideal(caseData));
      expect(result.total, caseData.id).toBe(100);
      expect(prdResultSchema.parse(result)).toBeTruthy();
    }
  });

  it("gives half credit one bucket off and none for v1 versus out", () => {
    expect(bucketCredit("v1", "v1")).toBe(1);
    expect(bucketCredit("v1", "later")).toBe(0.5);
    expect(bucketCredit("out", "later")).toBe(0.5);
    expect(bucketCredit("v1", "out")).toBe(0);
    expect(bucketCredit("out", null)).toBe(0);
  });

  it("only credits baseline and target with the right metric", () => {
    const caseData = cases[0];
    const answer = ideal(caseData);
    const wrong = caseData.metrics.find(
      (m) => m.id !== caseData.hidden.metric.primaryId,
    )!.id;
    const result = scorePrd(caseData, {
      ...answer,
      metric: { ...answer.metric, metricId: wrong },
    });
    expect(points(result, "metric")).toBeCloseTo(
      PRD_WEIGHTS.metric * METRIC_PARTS.horizon,
      1,
    );
  });

  it("checks the baseline and target against the documents", () => {
    const caseData = cases[1];
    const answer = ideal(caseData);
    const { metric } = caseData.hidden;
    const result = scorePrd(caseData, {
      ...answer,
      metric: {
        ...answer.metric,
        baseline: metric.baseline + 5,
        target: metric.targetMax + 10,
      },
    });
    expect(result.report.metric.baselineOk).toBe(false);
    expect(result.report.metric.targetOk).toBe(false);
    expect(points(result, "metric")).toBeCloseTo(
      PRD_WEIGHTS.metric * (METRIC_PARTS.metric + METRIC_PARTS.horizon),
      1,
    );
  });

  it("gives nothing to an empty PRD and is deterministic", () => {
    for (const caseData of cases) {
      const empty = prdAnswerSchema.parse({
        evidenceIds: [],
        metric: { metricId: null, baseline: null, target: null, horizon: null },
        scope: {},
        risks: [],
      });
      expect(scorePrd(caseData, empty).total).toBe(0);
      const answer = ideal(caseData);
      expect(scorePrd(caseData, answer)).toEqual(scorePrd(caseData, answer));
    }
  });

  it("costs points for putting a non-goal in version 1", () => {
    const caseData = cases[2];
    const answer = ideal(caseData);
    const outId = caseData.hidden.requirements.find(
      (r) => r.bucket === "out",
    )!.id;
    const result = scorePrd(caseData, {
      ...answer,
      scope: { ...answer.scope, [outId]: "v1" },
    });
    expect(points(result, "scope")).toBeCloseTo(
      PRD_WEIGHTS.scope * (1 - 1 / caseData.requirements.length),
      1,
    );
  });
});
