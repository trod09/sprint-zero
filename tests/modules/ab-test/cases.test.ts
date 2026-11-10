import { describe, expect, it } from "vitest";

import { readExperiment } from "@/modules/ab-test/analysis";
import {
  buildAbTestCase,
  findPatternProblem,
} from "@/modules/ab-test/build-case";
import { abTestRawCases } from "@/modules/ab-test/cases";
import { abTestCaseSpecs } from "@/modules/ab-test/content/cases";
import { toPublicAbTestCase } from "@/modules/ab-test/public";
import {
  abTestCaseSchema,
  ISSUES,
  publicAbTestCaseSchema,
  type AbTestCase,
} from "@/modules/ab-test/schema";
import { sumProportions } from "@/modules/ab-test/stats";

const cases = abTestRawCases.map((raw) => abTestCaseSchema.parse(raw));

describe("pregenerated A/B test cases", () => {
  it("has 8 cases covering every trap, clean results and every difficulty", () => {
    expect(cases).toHaveLength(8);
    const traps = new Set(cases.flatMap((c) => c.hidden.issues));
    expect(traps).toEqual(new Set(ISSUES));
    expect(cases.filter((c) => c.hidden.issues.length === 0)).toHaveLength(2);
    expect(new Set(cases.map((c) => c.difficulty))).toEqual(
      new Set(["apm", "pm", "senior"]),
    );
    expect(new Set(cases.map((c) => c.hidden.decision))).toEqual(
      new Set(["ship", "iterate", "kill"]),
    );
    expect(new Set(cases.map((c) => c.company.industry)).size).toBe(4);
  });

  it("matches what the builder produces from the specifications", () => {
    expect(cases.map((c) => c.id)).toEqual(abTestCaseSpecs.map((s) => s.id));
    for (const spec of abTestCaseSpecs) {
      expect(cases.find((c) => c.id === spec.id)).toEqual(
        buildAbTestCase(spec),
      );
    }
  });

  it("shows exactly the problems each case claims", () => {
    for (const caseData of cases) {
      expect(findPatternProblem(caseData), caseData.id).toBeNull();
    }
  });

  it("keeps daily, segment and total counts consistent", () => {
    for (const caseData of cases) {
      const { results } = caseData;
      for (const arm of ["control", "treatment"] as const) {
        const byDay = sumProportions(results.daily.map((day) => day[arm]));
        const bySegment = sumProportions(results.segments.map((s) => s[arm]));
        expect(bySegment, caseData.id).toEqual(byDay);
      }
      for (const [
        index,
        guardrail,
      ] of caseData.experiment.guardrails.entries()) {
        const counts = results.guardrails[index];
        const totals = readExperiment(caseData).totals;
        const expected =
          guardrail.denominator === "users"
            ? totals.control.users
            : totals.control.conversions;
        expect(counts.control.users).toBe(expected);
      }
    }
  });

  it("quotes in its texts only numbers the data shows, with no placeholders left", () => {
    for (const caseData of cases) {
      const texts = [
        caseData.brief,
        caseData.hidden.summary,
        caseData.hidden.explanation,
        caseData.hidden.recommendation,
        ...Object.values(caseData.hidden.issueNotes),
      ];
      for (const text of texts)
        expect(text, caseData.id).not.toMatch(/\{\w+\}/);
      const readout = readExperiment(caseData);
      const lift = (readout.primary.relativeLift * 100).toFixed(1);
      expect(caseData.brief + caseData.hidden.explanation).toContain(
        lift.replace("-", ""),
      );
    }
  });

  it("never sends the truth or the simulation to the browser", () => {
    for (const caseData of cases) {
      const publicCase = toPublicAbTestCase(caseData);
      expect(publicAbTestCaseSchema.parse(publicCase)).toEqual(publicCase);
      const json = JSON.stringify(publicCase);
      expect(json).not.toContain('"hidden"');
      expect(json).not.toContain('"trueLift"');
      expect(json).not.toContain(caseData.hidden.summary);
    }
  });

  it("is deterministic: the same spec builds the same case", () => {
    const spec = abTestCaseSpecs[0];
    expect(buildAbTestCase(spec)).toEqual(buildAbTestCase(spec));
    const other: AbTestCase = buildAbTestCase({ ...spec, seed: spec.seed + 1 });
    expect(other.results).not.toEqual(buildAbTestCase(spec).results);
  });
});
