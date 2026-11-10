import { describe, expect, it } from "vitest";

import { DIFFICULTIES } from "@/core/case-engine";
import { estimationTemplates } from "@/modules/product-case/content/estimations";
import { factFactor } from "@/modules/product-case/format";
import {
  estimationSpecFrom,
  generateProductCaseOnDemand,
} from "@/modules/product-case/generate";
import { generateEstimationCase } from "@/modules/product-case/generator";
import { scoreProductCase } from "@/modules/product-case/scoring";

describe("generated estimation cases", () => {
  it("covers two templates per industry", () => {
    const perIndustry = new Map<string, number>();
    for (const template of estimationTemplates) {
      perIndustry.set(
        template.industry,
        (perIndustry.get(template.industry) ?? 0) + 1,
      );
    }
    expect([...perIndustry.values()]).toEqual([2, 2, 2, 2]);
  });

  it("gives every template a truth its required facts reproduce", () => {
    for (const template of estimationTemplates) {
      for (const difficulty of DIFFICULTIES) {
        for (const seed of [3, 4812, 777_001]) {
          const caseData = generateEstimationCase(
            estimationSpecFrom(template, {
              id: `gen-product-case-${template.industry}-${difficulty}-${seed}`,
              seed,
              difficulty,
            }),
          );
          const { hidden, facts } = caseData;
          const fromFacts =
            facts
              .filter((fact) => hidden.requiredFactIds.includes(fact.id))
              .reduce((total, fact) => total * factFactor(fact), 1) *
            hidden.constants.reduce((total, c) => total * c.value, 1);
          expect(Math.round(fromFacts), template.key).toBe(hidden.truth);
          expect(hidden.trapEstimate / hidden.truth).toBeGreaterThan(1.5);
          expect(facts.length - hidden.requiredFactIds.length).toBe(
            1 + DIFFICULTIES.indexOf(difficulty) + 1,
          );
          expect(hidden.ideal).not.toMatch(/undefined|NaN/);

          const perfect = scoreProductCase(caseData, {
            kind: "estimation",
            factIds: hidden.requiredFactIds,
            multipliers: hidden.constants,
            estimate: hidden.truth,
            approach: "",
            sanityCheck: "",
            timing: { timed: false, secondsUsed: 0 },
          });
          expect(perfect.total, template.key).toBe(100);
        }
      }
    }
  });

  it("draws different numbers for different seeds", () => {
    const build = (seed: number) =>
      generateProductCaseOnDemand({
        seed,
        industry: "saas",
        difficulty: "pm",
        caseId: `gen-product-case-saas-pm-${seed}`,
      });
    expect(build(10)).toEqual(build(10));
    expect(build(10).hidden.truth).not.toBe(build(11).hidden.truth);
  });
});
