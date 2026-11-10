import { describe, expect, it } from "vitest";

import { DIFFICULTIES, INDUSTRY_KEYS } from "@/core/case-engine";
import { assertNoHiddenKeys } from "@/core/case-engine/public-case";
import { buildFeaturedQuickCases } from "@/modules/quick-cases/cases";
import { quickSpecs } from "@/modules/quick-cases/content/specs";
import { generateQuickOnDemand } from "@/modules/quick-cases/generate";
import {
  findQuickProblem,
  generateQuickCase,
} from "@/modules/quick-cases/generator";
import { toPublicQuickCase } from "@/modules/quick-cases/public";
import type { QuickAnswer, QuickCase } from "@/modules/quick-cases/schema";
import { bestForStep, scoreQuickCase } from "@/modules/quick-cases/scoring";

const cases = buildFeaturedQuickCases();

/** The best options of every step. */
function idealAnswer(caseData: QuickCase): QuickAnswer {
  return {
    choices: Object.fromEntries(
      caseData.steps.map((step, index) => [
        step.id,
        [...caseData.hidden.steps[index].options]
          .sort((a, b) => b.rating - a.rating)
          .slice(0, step.pick)
          .map((o) => o.id),
      ]),
    ),
    reasoning: "",
    writing: "",
  };
}

const bestId = (caseData: QuickCase, stepId: string) =>
  idealAnswer(caseData).choices[stepId][0];

describe("quick case specifications", () => {
  it("cover the four kinds, one per industry", () => {
    expect(quickSpecs.map((s) => s.kind).sort()).toEqual([
      "build_buy",
      "go_to_market",
      "incident",
      "pricing",
    ]);
    expect(new Set(quickSpecs.map((s) => s.industry)).size).toBe(4);
  });

  it("build a fair case for every level and many seeds", () => {
    for (const spec of quickSpecs) {
      for (const difficulty of DIFFICULTIES) {
        for (let seed = 1; seed <= 40; seed++) {
          const caseData = generateQuickCase({
            spec,
            id: `quick-cases-${spec.key}-${seed}`,
            seed,
            difficulty,
          });
          expect(findQuickProblem(caseData), `${spec.key} #${seed}`).toBeNull();
          expect(JSON.stringify(caseData)).not.toMatch(/NaN|undefined|\$-/);
          expect(caseData.exhibits.some((e) => e.id === "hint")).toBe(
            difficulty === "apm",
          );
        }
      }
    }
  });

  it("change the right call with the numbers", () => {
    const answers = (key: string, stepId: string) => {
      const spec = quickSpecs.find((s) => s.key === key)!;
      const best = new Set<string>();
      for (let seed = 1; seed <= 60; seed++) {
        const caseData = generateQuickCase({
          spec,
          id: `quick-cases-${key}-${seed}`,
          seed,
          difficulty: "pm",
        });
        best.add(bestId(caseData, stepId));
      }
      return best;
    };
    expect(answers("rosterly-pricing", "price").size).toBeGreaterThanOrEqual(2);
    expect(answers("lumen-kids-launch", "segment")).toEqual(
      new Set(["subscribers", "homeschool"]),
    );
    expect(answers("fixly-background-checks", "decision")).toEqual(
      new Set(["build", "buy", "hybrid"]),
    );
  });

  it("rates the price points by the revenue they keep", () => {
    const caseData = cases.find((c) => c.kind === "pricing")!;
    const survey = caseData.exhibits.find((e) => e.id === "survey")!.rows!;
    const revenue = survey.map(([label, value]) => {
      const price = Number(/\$(\d+)/.exec(label)![1]);
      return { id: `price_${price}`, revenue: price * parseInt(value, 10) };
    });
    const best = revenue.sort((a, b) => b.revenue - a.revenue)[0].id;
    expect(bestId(caseData, "price")).toBe(best);
  });
});

describe("scoring", () => {
  it("scores the best options 100 and no answer 0", () => {
    for (const caseData of cases) {
      expect(scoreQuickCase(caseData, idealAnswer(caseData)).total).toBe(100);
      expect(
        scoreQuickCase(caseData, { choices: {}, reasoning: "", writing: "" })
          .total,
      ).toBe(0);
    }
  });

  it("only counts as many options as the step asks for", () => {
    const caseData = cases[0];
    const step = caseData.steps.find((s) => s.pick === 2)!;
    const everything = scoreQuickCase(caseData, {
      ...idealAnswer(caseData),
      choices: {
        ...idealAnswer(caseData).choices,
        // Weakest first: picking everything must not earn full credit.
        [step.id]: [
          ...caseData.hidden.steps.find((s) => s.id === step.id)!.options,
        ]
          .sort((a, b) => a.rating - b.rating)
          .map((o) => o.id),
      },
    });
    expect(
      everything.criteria.find((c) => c.id === step.id)!.ratio,
    ).toBeLessThan(1);
  });

  it("ignores unknown steps and options, and is deterministic", () => {
    const caseData = cases[1];
    const answer = {
      ...idealAnswer(caseData),
      choices: { ...idealAnswer(caseData).choices, made_up: ["nothing"] },
    };
    expect(scoreQuickCase(caseData, answer).total).toBe(100);
    expect(scoreQuickCase(caseData, answer)).toEqual(
      scoreQuickCase(caseData, answer),
    );
  });

  it("computes the best total of a step", () => {
    expect(bestForStep([3, 0, 2, 3, 1], 2)).toBe(6);
    expect(bestForStep([1, 3, 0], 1)).toBe(3);
  });
});

describe("generated and public cases", () => {
  it("builds a case for every industry and level", () => {
    for (const industry of INDUSTRY_KEYS) {
      for (const difficulty of DIFFICULTIES) {
        const caseData = generateQuickOnDemand({
          seed: 4242,
          industry,
          difficulty,
          caseId: `gen-quick-cases-${industry}-${difficulty}-4242`,
        });
        expect(caseData.company.industry).toBeTruthy();
        expect(scoreQuickCase(caseData, idealAnswer(caseData)).total).toBe(100);
      }
    }
  });

  it("never exposes ratings or reasons", () => {
    for (const caseData of cases) {
      const publicCase = toPublicQuickCase(caseData);
      assertNoHiddenKeys(publicCase);
      const text = JSON.stringify(publicCase);
      expect(text).not.toContain('"rating"');
      expect(text).not.toContain('"why"');
      expect(text).not.toContain('"weight"');
    }
  });
});
