import { describe, expect, it } from "vitest";

import { DIFFICULTIES, INDUSTRY_KEYS } from "@/core/case-engine";
import { findPatternProblem } from "@/modules/ab-test/build-case";
import { generateAbTestOnDemand } from "@/modules/ab-test/generate";

function generate(seed: number, index = 0) {
  const industry = INDUSTRY_KEYS[index % INDUSTRY_KEYS.length];
  const difficulty = DIFFICULTIES[index % DIFFICULTIES.length];
  return generateAbTestOnDemand({
    seed,
    industry,
    difficulty,
    caseId: `gen-ab-test-${industry}-${difficulty}-${seed}`,
  });
}

describe("generated A/B test cases", () => {
  it("show exactly the trap they claim, for many seeds", () => {
    const traps = new Set<string>();
    for (let index = 0; index < 60; index++) {
      const caseData = generate(index * 1319 + 11, index);
      expect(findPatternProblem(caseData), caseData.id).toBeNull();
      traps.add(caseData.hidden.issues.join("+") || caseData.hidden.effect);
      const texts = JSON.stringify([caseData.brief, caseData.hidden]);
      expect(texts, caseData.id).not.toMatch(/\[\w+\]|\{\w+\}/);
    }
    expect(traps.size).toBeGreaterThanOrEqual(7);
  }, 60_000);

  it("is deterministic and changes with the seed", () => {
    expect(generate(515)).toEqual(generate(515));
    expect(generate(515).results).not.toEqual(generate(516).results);
  });
});
