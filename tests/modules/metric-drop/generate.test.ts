import { describe, expect, it } from "vitest";

import { DIFFICULTIES, INDUSTRY_KEYS } from "@/core/case-engine";
import { buildDataset } from "@/modules/metric-drop/dataset";
import { generateMetricDropOnDemand } from "@/modules/metric-drop/generate";
import { windowChange } from "@/modules/metric-drop/query";
import { dimensionValues } from "@/modules/metric-drop/schema";

const SEEDS = Array.from({ length: 40 }, (_, index) => index * 977 + 3);

function generate(seed: number, index = 0) {
  const industry = INDUSTRY_KEYS[index % INDUSTRY_KEYS.length];
  const difficulty = DIFFICULTIES[index % DIFFICULTIES.length];
  return generateMetricDropOnDemand({
    seed,
    industry,
    difficulty,
    caseId: `gen-metric-drop-${industry}-${difficulty}-${seed}`,
  });
}

describe("generated Metric Drop cases", () => {
  it("always show a real drop caused by the root cause segment", () => {
    const categories = new Set<string>();
    SEEDS.forEach((seed, index) => {
      const caseData = generate(seed, index);
      const { rootCause, falseLeads } = caseData.hidden;
      categories.add(rootCause.category);

      const full = windowChange(
        buildDataset(caseData),
        caseData.headlineMetric,
      );
      expect(full.changePercent, caseData.id).toBeLessThan(-5);

      // Without the root cause the headline metric barely moves.
      const without = windowChange(
        buildDataset({
          ...caseData,
          hidden: {
            ...caseData.hidden,
            rootCause: { ...rootCause, anomalies: [] },
          },
        }),
        caseData.headlineMetric,
      );
      expect(Math.abs(without.changePercent), caseData.id).toBeLessThan(
        Math.abs(full.changePercent) / 2,
      );

      const values = dimensionValues(caseData.release);
      for (const segment of [
        rootCause.segment,
        ...falseLeads.map((lead) => lead.segment),
      ]) {
        expect(values[segment.dimension], caseData.id).toContain(segment.value);
      }
      expect(falseLeads).toHaveLength(caseData.difficulty === "apm" ? 1 : 2);
      expect(caseData.brief).toMatch(/fell \d+%/);
    });
    expect(categories.size).toBe(5);
  });

  it("is deterministic and changes with the seed", () => {
    expect(generate(4242)).toEqual(generate(4242));
    expect(generate(4242)).not.toEqual(generate(4243));
  });
});
