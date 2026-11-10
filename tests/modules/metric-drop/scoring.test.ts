import { describe, expect, it } from "vitest";

import { assertNoHiddenKeys } from "@/core/case-engine";
import { scoreSubmission } from "@/core/case-engine/submission";
import { metricDropRawCases } from "@/modules/metric-drop/cases";
import { queryDashboard } from "@/modules/metric-drop/data.server";
import { toPublicMetricDropCase } from "@/modules/metric-drop/public";
import {
  metricDropCaseSchema,
  type MetricDropAnswer,
  type MetricDropCase,
} from "@/modules/metric-drop/schema";
import {
  IDEAL_STEPS,
  METRIC_DROP_WEIGHTS,
  metricDropResultSchema,
  scoreMetricDropAnswer,
  segmentMatch,
} from "@/modules/metric-drop/scoring";
import { caseRepository } from "@/modules/registry.server";

const cases = metricDropRawCases.map((raw) => metricDropCaseSchema.parse(raw));
const byId = (id: string) => cases.find((c) => c.id === id)!;
const android = byId("metric-drop-android-onboarding");
const holiday = byId("metric-drop-us-holiday");

function ideal(caseData: MetricDropCase): MetricDropAnswer {
  const { rootCause } = caseData.hidden;
  return {
    segment: rootCause.segment,
    category: rootCause.category,
    actionId: rootCause.idealActionId,
    justification: "",
    explorations: [
      { metric: caseData.headlineMetric, filters: {} },
      {
        metric: caseData.headlineMetric,
        filters: {},
        breakdown: rootCause.segment.dimension,
      },
    ],
  };
}

const ratio = (result: ReturnType<typeof scoreMetricDropAnswer>, id: string) =>
  result.criteria.find((c) => c.id === id)!.ratio;

describe("metric drop score", () => {
  it("uses the weights from the master prompt and scores the ideal answer 100", () => {
    for (const caseData of cases) {
      const result = scoreMetricDropAnswer(caseData, ideal(caseData));
      expect(result.total, caseData.id).toBe(100);
      expect(metricDropResultSchema.safeParse(result).success).toBe(true);
    }
    const weights = Object.fromEntries(
      scoreMetricDropAnswer(android, ideal(android)).criteria.map((c) => [
        c.id,
        c.weight,
      ]),
    );
    expect(Object.values(weights)).toEqual(Object.values(METRIC_DROP_WEIGHTS));
  });

  it("gives partial credit for a segment that is too wide", () => {
    const truth = android.hidden.rootCause.segment;
    expect(
      segmentMatch(android, { dimension: "platform", value: "android" }, truth),
    ).toBe(0.5);
    expect(segmentMatch(android, truth, truth)).toBe(1);
    expect(
      segmentMatch(android, { dimension: "country", value: "US" }, truth),
    ).toBeCloseTo(0.04, 2);
    expect(
      segmentMatch(android, { dimension: "platform", value: "ios" }, truth),
    ).toBe(0);
  });

  it("treats web as a platform and as an app version as the same segment", () => {
    const web = byId("metric-drop-web-checkout");
    expect(
      segmentMatch(
        web,
        { dimension: "appVersion", value: "web" },
        web.hidden.rootCause.segment,
      ),
    ).toBe(1);
  });

  it("penalises blaming a false lead", () => {
    const release = holiday.hidden.falseLeads[0].segment;
    const blamed = scoreMetricDropAnswer(holiday, {
      ...ideal(holiday),
      segment: release,
      category: "bug",
      actionId: "rollback-release",
    });
    expect(ratio(blamed, "false_leads")).toBe(0);
    expect(ratio(blamed, "segment")).toBeLessThan(0.1);
    expect(ratio(blamed, "category")).toBe(0);
    expect(ratio(blamed, "action")).toBe(0);
    expect(blamed.total).toBeLessThan(20);
  });

  it("rewards finding the right dimension early", () => {
    const base = ideal(android);
    const wander = Array.from({ length: 12 }, () => ({
      metric: "dau" as const,
      filters: { country: ["US"] },
    }));
    const late = scoreMetricDropAnswer(android, {
      ...base,
      explorations: [...wander, ...base.explorations],
    });
    const never = scoreMetricDropAnswer(android, {
      ...base,
      explorations: wander,
    });
    expect(ratio(scoreMetricDropAnswer(android, base), "efficiency")).toBe(1);
    expect(ratio(late, "efficiency")).toBeLessThan(1);
    expect(ratio(late, "efficiency")).toBeGreaterThan(0);
    expect(ratio(never, "efficiency")).toBe(0);
    expect(late.report.stepsToCause).toBe(14);
    expect(IDEAL_STEPS).toBe(4);
  });

  it("counts a filter on the right value as looking at the right dimension", () => {
    const truth = android.hidden.rootCause.segment;
    const result = scoreMetricDropAnswer(android, {
      ...ideal(android),
      explorations: [
        { metric: "activation", filters: { [truth.dimension]: [truth.value] } },
      ],
    });
    expect(result.report.stepsToCause).toBe(1);
  });

  it("gives half credit for a reasonable but incomplete action", () => {
    const campaign = byId("metric-drop-campaign-ended");
    const result = scoreMetricDropAnswer(campaign, {
      ...ideal(campaign),
      actionId: "reset-target",
    });
    expect(ratio(result, "action")).toBe(0.5);
  });

  it("is deterministic", () => {
    expect(scoreMetricDropAnswer(holiday, ideal(holiday))).toEqual(
      scoreMetricDropAnswer(holiday, ideal(holiday)),
    );
  });
});

describe("serving metric drop cases", () => {
  it("never exposes the root cause or the data specification", async () => {
    const publicCases = await caseRepository.listPublicCases("metric-drop");
    expect(publicCases).toHaveLength(5);
    for (const publicCase of publicCases) {
      assertNoHiddenKeys(publicCase);
      expect(publicCase).not.toHaveProperty("scale");
      expect(publicCase).not.toHaveProperty("rates");
      expect(JSON.stringify(publicCase)).not.toContain("multiplier");
    }
    expect(toPublicMetricDropCase(android)).not.toHaveProperty("hidden");
  });

  it("answers dashboard queries with series and week-over-week changes", async () => {
    const outcome = await queryDashboard(caseRepository, {
      caseId: android.id,
      query: { metric: "activation", breakdown: "platform" },
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    const { view } = outcome;
    expect(view.total).toHaveLength(android.days);
    expect(view.change.changePercent).toBeLessThan(-8);
    expect(view.breakdownChanges?.map((b) => b.value).sort()).toEqual([
      "android",
      "ios",
      "web",
    ]);
    const androidChange = view.breakdownChanges!.find(
      (b) => b.value === "android",
    )!;
    expect(androidChange.change.changePercent).toBeLessThan(-15);
    expect(JSON.stringify(view)).not.toContain("multiplier");
  });

  it("rejects bad dashboard requests", async () => {
    expect(
      await queryDashboard(caseRepository, {
        caseId: android.id,
        query: { metric: "revenue" },
      }),
    ).toEqual({
      ok: false,
      error: { code: "invalid_request" },
    });
    expect(
      await queryDashboard(caseRepository, {
        caseId: "backlog-fintech-01",
        query: { metric: "dau" },
      }),
    ).toEqual({ ok: false, error: { code: "case_not_found" } });
  });

  it("scores a submission end to end", async () => {
    const outcome = await scoreSubmission(caseRepository, {
      caseId: android.id,
      answer: ideal(android),
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.total).toBe(100);
  });
});
