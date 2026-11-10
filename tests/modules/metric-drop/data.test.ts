import { describe, expect, it } from "vitest";

import { buildMetricDropCase } from "@/modules/metric-drop/build-case";
import { metricDropRawCases } from "@/modules/metric-drop/cases";
import { metricDropCaseSpecs } from "@/modules/metric-drop/content/cases";
import {
  anomalyFactor,
  buildDataset,
  dateOf,
  type Dataset,
} from "@/modules/metric-drop/dataset";
import {
  runQuery,
  windowChange,
  type Filters,
} from "@/modules/metric-drop/query";
import {
  dimensionValues,
  metricDropCaseSchema,
  ROOT_CAUSE_CATEGORIES,
  type Dimension,
  type MetricDropCase,
} from "@/modules/metric-drop/schema";

const cases = metricDropRawCases.map((raw) => metricDropCaseSchema.parse(raw));
const datasets = new Map<string, Dataset>(
  cases.map((caseData) => [caseData.id, buildDataset(caseData)]),
);
const data = (caseData: MetricDropCase) => datasets.get(caseData.id)!;

/** Every value of a dimension except one. */
function excluding(
  caseData: MetricDropCase,
  dimension: Dimension,
  value: string,
): Filters {
  const values = dimensionValues(caseData.release)[dimension].filter(
    (v) => v !== value,
  );
  return { [dimension]: [...values] };
}

describe("pregenerated metric drop cases", () => {
  it("has 5 cases, each with a different kind of root cause", () => {
    expect(cases).toHaveLength(5);
    expect(new Set(cases.map((c) => c.hidden.rootCause.category))).toEqual(
      new Set(ROOT_CAUSE_CATEGORIES),
    );
    expect(new Set(cases.map((c) => c.difficulty))).toEqual(
      new Set(["apm", "pm", "senior"]),
    );
    for (const caseData of cases) {
      expect(caseData.days).toBeGreaterThanOrEqual(60);
      expect(caseData.days).toBeLessThanOrEqual(90);
      const leads = caseData.hidden.falseLeads.length;
      expect(leads).toBeGreaterThanOrEqual(1);
      expect(leads).toBeLessThanOrEqual(2);
    }
  });

  it("matches what the builder produces from the specifications", () => {
    expect(cases.map((c) => c.id)).toEqual(
      metricDropCaseSpecs.map((s) => s.id),
    );
    for (const spec of metricDropCaseSpecs) {
      expect(cases.find((c) => c.id === spec.id)).toEqual(
        buildMetricDropCase(spec),
      );
    }
  });

  it("states in the brief the drop the data shows", () => {
    for (const caseData of cases) {
      const change = windowChange(data(caseData), caseData.headlineMetric);
      expect(caseData.brief, caseData.id).toContain(
        `${Math.round(Math.abs(change.changePercent))}%`,
      );
    }
  });

  it("uses dimension values that exist in the case", () => {
    for (const caseData of cases) {
      const values = dimensionValues(caseData.release);
      const segments = [
        caseData.hidden.rootCause.segment,
        ...caseData.hidden.falseLeads.map((lead) => lead.segment),
      ];
      for (const { dimension, value } of segments) {
        expect(values[dimension], `${caseData.id}: ${dimension}`).toContain(
          value,
        );
      }
    }
  });
});

describe("the anomaly is where the ground truth says", () => {
  it("shows a clear drop in the headline metric", () => {
    for (const caseData of cases) {
      const change = windowChange(data(caseData), caseData.headlineMetric);
      expect(change.changePercent, caseData.id).toBeLessThanOrEqual(-8);
    }
  });

  it("makes the drop disappear when the root cause segment is left out", () => {
    for (const caseData of cases) {
      const { dimension, value } = caseData.hidden.rootCause.segment;
      const rest = windowChange(
        data(caseData),
        caseData.headlineMetric,
        excluding(caseData, dimension, value),
      );
      expect(Math.abs(rest.changePercent), caseData.id).toBeLessThan(4);
    }
  });

  it("leaves most of the drop in place when a false lead is left out", () => {
    for (const caseData of cases) {
      const total = windowChange(data(caseData), caseData.headlineMetric);
      for (const lead of caseData.hidden.falseLeads) {
        const { dimension, value } = lead.segment;
        const rest = windowChange(
          data(caseData),
          caseData.headlineMetric,
          excluding(caseData, dimension, value),
        );
        expect(rest.changePercent, `${caseData.id}: ${value}`).toBeLessThan(
          total.changePercent * 0.6,
        );
      }
    }
  });

  it("keeps the root cause segment far below its normal level", () => {
    for (const caseData of cases) {
      const { dimension, value } = caseData.hidden.rootCause.segment;
      const metric = caseData.headlineMetric;
      const dataset = data(caseData);
      const lastWeek = (filters: Filters) => {
        const { total } = runQuery(dataset, { metric, filters });
        const recent = total.slice(-7);
        return recent.reduce((sum, v) => sum + v, 0) / recent.length;
      };
      const segment = lastWeek({ [dimension]: [value] });
      const others = lastWeek(excluding(caseData, dimension, value));
      if (metric === "activation" || metric === "conversion") {
        // Rates: the segment converts or activates far worse than the rest.
        expect(segment, caseData.id).toBeLessThan(others * 0.7);
      } else {
        // Counts: the segment fell much more than the rest week over week.
        const segmentChange = windowChange(dataset, metric, {
          [dimension]: [value],
        });
        expect(segmentChange.changePercent, caseData.id).toBeLessThan(-25);
      }
    }
  });

  it("is stable before the root cause starts", () => {
    for (const caseData of cases) {
      const start = Math.min(
        ...caseData.hidden.rootCause.anomalies.map((a) => a.startDay),
      );
      const quiet = { ...data(caseData) };
      const days = start - 1;
      const truncated: Dataset = {
        days,
        dates: quiet.dates.slice(0, days),
        cells: quiet.cells.map((cell) => ({
          ...cell,
          active: cell.active.slice(0, days),
          signups: cell.signups.slice(0, days),
          activated: cell.activated.slice(0, days),
          sessions: cell.sessions.slice(0, days),
          purchases: cell.purchases.slice(0, days),
        })),
      };
      const change = windowChange(truncated, caseData.headlineMetric);
      expect(Math.abs(change.changePercent), caseData.id).toBeLessThan(3);
    }
  });
});

describe("dataset generator", () => {
  const caseData = cases[0];

  it("is deterministic", () => {
    const again = buildDataset(caseData);
    const first = data(caseData);
    expect(again.dates).toEqual(first.dates);
    expect(again.cells.map((c) => [...c.active])).toEqual(
      first.cells.map((c) => [...c.active]),
    );
  });

  it("changes with the seed", () => {
    const other = buildDataset({ ...caseData, seed: caseData.seed + 1 });
    expect(other.cells[0].active).not.toEqual(data(caseData).cells[0].active);
  });

  it("covers every combination of dimensions once", () => {
    const dataset = data(caseData);
    // 5 platform versions x 5 countries x 4 channels x 2 user types.
    expect(dataset.cells).toHaveLength(200);
    const keys = dataset.cells.map((c) => Object.values(c.dims).join("|"));
    expect(new Set(keys).size).toBe(200);
    expect(dataset.dates[0]).toBe(caseData.startDate);
    expect(dataset.dates).toHaveLength(caseData.days);
  });

  it("only gives the new app version users after its release", () => {
    const { total } = runQuery(data(caseData), {
      metric: "dau",
      filters: { appVersion: [`android-${caseData.release.next}`] },
    });
    expect(total.slice(0, caseData.release.day).every((v) => v === 0)).toBe(
      true,
    );
    expect(total.at(-1)!).toBeGreaterThan(0);
  });

  it("keeps counts consistent", () => {
    for (const cell of data(caseData).cells) {
      for (let day = 0; day < caseData.days; day++) {
        expect(cell.activated[day]).toBeLessThanOrEqual(cell.signups[day]);
        if (cell.dims.userType === "returning")
          expect(cell.signups[day]).toBe(0);
      }
    }
  });

  it("ramps anomalies in and out", () => {
    const anomaly = {
      segment: { country: "US" as const },
      target: "returning" as const,
      multiplier: 0.5,
      startDay: 10,
      rampDays: 2,
      endDay: 12,
    };
    const dims = {
      platform: "ios",
      appVersion: "web",
      country: "US",
      channel: "organic",
      userType: "returning",
    };
    expect(anomalyFactor([anomaly], dims, "returning", 9)).toBe(1);
    expect(anomalyFactor([anomaly], dims, "returning", 10)).toBe(0.75);
    expect(anomalyFactor([anomaly], dims, "returning", 11)).toBe(0.5);
    expect(anomalyFactor([anomaly], dims, "returning", 13)).toBe(1);
    expect(
      anomalyFactor([anomaly], { ...dims, country: "DE" }, "returning", 11),
    ).toBe(1);
    expect(anomalyFactor([anomaly], dims, "signups", 11)).toBe(1);
  });

  it("computes dates across month boundaries", () => {
    expect(dateOf("2026-04-24", 71)).toBe("2026-07-04");
  });
});

describe("queries", () => {
  const caseData = cases[1];
  const dataset = data(caseData);

  it("breaks a metric down by dimension, adding up to the total for counts", () => {
    const result = runQuery(dataset, {
      metric: "signups",
      filters: {},
      breakdown: "channel",
    });
    expect(result.breakdown?.map((b) => b.value).sort()).toEqual([
      "organic",
      "paid_search",
      "paid_social",
      "referral",
    ]);
    for (let day = 0; day < dataset.days; day += 10) {
      const sum = result.breakdown!.reduce(
        (total, b) => total + b.values[day],
        0,
      );
      expect(sum).toBe(result.total[day]);
    }
  });

  it("filters by several values and keeps rates as percentages", () => {
    const filtered = runQuery(dataset, {
      metric: "activation",
      filters: { platform: ["ios", "android"], country: ["US"] },
    });
    for (const value of filtered.total) {
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThan(100);
    }
    const none = runQuery(dataset, {
      metric: "dau",
      filters: { country: ["XX"] },
    });
    expect(none.total.every((v) => v === 0)).toBe(true);
  });
});
