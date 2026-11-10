import { describe, expect, it } from "vitest";

import { uxCritiqueRawCases } from "@/modules/ux-critique/cases";
import { uxCaseSpecs } from "@/modules/ux-critique/content/cases";
import { SCREEN_TEMPLATES } from "@/modules/ux-critique/content/templates";
import {
  generateUxCase,
  ISSUES_BY_DIFFICULTY,
} from "@/modules/ux-critique/generator";
import { toPublicUxCase } from "@/modules/ux-critique/public";
import {
  ISSUE_TYPES,
  publicUxCritiqueCaseSchema,
  uxCritiqueAnswerSchema,
  uxCritiqueCaseSchema,
  type UxCritiqueCase,
} from "@/modules/ux-critique/schema";
import {
  scoreUxAnswer,
  UX_WEIGHTS,
  uxResultSchema,
} from "@/modules/ux-critique/scoring";

const cases = uxCritiqueRawCases.map((raw) => uxCritiqueCaseSchema.parse(raw));
const byId = (id: string) => cases.find((c) => c.id === id)!;

const ideal = (caseData: UxCritiqueCase) => ({
  findings: caseData.hidden.issues.map((issue) => ({
    regionId: issue.regionId,
    type: issue.type,
    note: "",
  })),
});

const points = (result: ReturnType<typeof scoreUxAnswer>, id: string) =>
  result.criteria.find((c) => c.id === id)!.points;

describe("UX critique templates", () => {
  it("cover every kind of problem and leave room for clean regions", () => {
    const types = new Set(
      Object.values(SCREEN_TEMPLATES).flatMap((template) =>
        template.regions.flatMap((region) => Object.keys(region.flaws)),
      ),
    );
    expect(types).toEqual(new Set(ISSUE_TYPES));
    for (const template of Object.values(SCREEN_TEMPLATES)) {
      expect(template.regions.length).toBeGreaterThan(
        ISSUES_BY_DIFFICULTY.senior,
      );
    }
  });
});

describe("pregenerated UX critique cases", () => {
  it("has 5 screens across templates and difficulties", () => {
    expect(cases).toHaveLength(5);
    expect(new Set(cases.map((c) => c.screen.template)).size).toBe(3);
    for (const caseData of cases) {
      expect(caseData.hidden.issues).toHaveLength(
        ISSUES_BY_DIFFICULTY[caseData.difficulty],
      );
      expect(caseData.screen.regions.length).toBeGreaterThan(
        caseData.hidden.issues.length,
      );
    }
  });

  it("matches what the generator produces from the specifications", () => {
    expect(cases.map((c) => c.id)).toEqual(uxCaseSpecs.map((s) => s.id));
    for (const spec of uxCaseSpecs) {
      expect(cases.find((c) => c.id === spec.id)).toEqual(generateUxCase(spec));
    }
  });

  it("renders flawed regions with their flawed props", () => {
    for (const caseData of cases) {
      const template = SCREEN_TEMPLATES[caseData.screen.template];
      for (const issue of caseData.hidden.issues) {
        const region = caseData.screen.regions.find(
          (r) => r.id === issue.regionId,
        )!;
        const flaw = template.regions.find((r) => r.id === issue.regionId)!
          .flaws[issue.type]!;
        expect(Object.keys(region.props)).toEqual(Object.keys(flaw.props));
      }
      expect(JSON.stringify(caseData)).not.toContain("{product}");
    }
  });

  it("never sends the planted problems to the browser", () => {
    for (const caseData of cases) {
      const publicCase = toPublicUxCase(caseData);
      expect(publicUxCritiqueCaseSchema.parse(publicCase)).toEqual(publicCase);
      const json = JSON.stringify(publicCase);
      expect(json).not.toContain('"hidden"');
      for (const issue of caseData.hidden.issues) {
        expect(json).not.toContain(issue.explanation);
      }
    }
  });
});

describe("UX critique scoring", () => {
  it("weights add up to 100", () => {
    expect(UX_WEIGHTS.found + UX_WEIGHTS.precision).toBe(100);
  });

  it("gives 100 to the ideal critique of every case", () => {
    for (const caseData of cases) {
      const result = scoreUxAnswer(
        caseData,
        uxCritiqueAnswerSchema.parse(ideal(caseData)),
      );
      expect(result.total, caseData.id).toBe(100);
      expect(uxResultSchema.parse(result)).toBeTruthy();
    }
  });

  it("gives half credit for the right region with the wrong kind", () => {
    const caseData = byId("ux-critique-nimbus-signup");
    const answer = ideal(caseData);
    const first = answer.findings[0];
    first.type = ISSUE_TYPES.find((t) => t !== first.type)!;
    const result = scoreUxAnswer(caseData, answer);
    const count = caseData.hidden.issues.length;
    expect(points(result, "found")).toBeCloseTo(
      (UX_WEIGHTS.found * (count - 0.5)) / count,
      1,
    );
    expect(result.report.issues[0].outcome).toBe("wrong_type");
    expect(points(result, "precision")).toBe(UX_WEIGHTS.precision);
  });

  it("counts findings on clean regions as false alarms, once each", () => {
    const caseData = byId("ux-critique-nimbus-signup");
    const answer = ideal(caseData);
    answer.findings.push(
      { regionId: "header", type: "hierarchy", note: "" },
      { regionId: "header", type: "hierarchy", note: "again" },
      { regionId: "header", type: "copy", note: "" },
    );
    const result = scoreUxAnswer(caseData, answer);
    expect(result.report.falseAlarms).toHaveLength(2);
    expect(points(result, "precision")).toBe(UX_WEIGHTS.precision / 2);
  });

  it("gives nothing for an empty critique and is deterministic", () => {
    const caseData = byId("ux-critique-harvest-checkout");
    expect(scoreUxAnswer(caseData, { findings: [] }).total).toBe(0);
    const answer = ideal(caseData);
    expect(scoreUxAnswer(caseData, answer)).toEqual(
      scoreUxAnswer(caseData, answer),
    );
  });
});
