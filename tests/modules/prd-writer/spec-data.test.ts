import { describe, expect, it } from "vitest";

import { prdSpecData } from "@/modules/prd-writer/content/specs";
import {
  checkPrdSpecData,
  compilePrdSpec,
  evaluate,
  expressionNames,
  type PrdSpecData,
} from "@/modules/prd-writer/spec-data";
import { generatePrdCase } from "@/modules/prd-writer/generator";

const fixly = prdSpecData.find((s) => s.key === "fixly-rebook")!;

describe("expressions", () => {
  it("evaluates arithmetic with names and precedence", () => {
    expect(evaluate("goal - 2", { goal: 30 })).toBe(28);
    expect(evaluate("(a + b) * 2 / 4", { a: 3, b: 5 })).toBe(4);
    expect(evaluate("-a + 10", { a: 3 })).toBe(7);
    expect(evaluate("0.1 + 0.2", {})).toBe(0.3);
  });

  it("rejects unknown names, bad syntax and division by zero", () => {
    expect(() => evaluate("x + 1", {})).toThrow(/unknown name/);
    expect(() => evaluate("1 +", {})).toThrow();
    expect(() => evaluate("(1 + 2", {})).toThrow(/missing/);
    expect(() => evaluate("1 / 0", {})).toThrow(/division/);
    expect(() => evaluate("process.exit()", {})).toThrow();
  });

  it("lists the names an expression reads", () => {
    expect(expressionNames("goal - lift * 2").sort()).toEqual(["goal", "lift"]);
  });
});

describe("data specs", () => {
  it("pass every check, including fairness across seeds", () => {
    for (const spec of prdSpecData) {
      expect(checkPrdSpecData(spec), spec.key).toEqual([]);
    }
  });

  it("compile to a case whose target asks for a change", () => {
    const caseData = generatePrdCase(
      compilePrdSpec(fixly, { id: "prd-writer-fixly-rebook", seed: 3 }),
    );
    const { baseline, targetMin, targetMax } = caseData.hidden.metric;
    expect(targetMin).toBeGreaterThan(baseline);
    expect(targetMax - targetMin).toBe(4);
    expect(caseData.documents.map((d) => d.body).join(" ")).not.toMatch(/\{/);
  });

  it("explain what is wrong with a broken draft", () => {
    const broken: PrdSpecData = {
      ...fixly,
      key: "Fixly Rebook",
      primaryMetricId: "missing",
      targetMin: "goal - unknown",
      evidence: fixly.evidence.map((e) => ({ ...e, strength: 2 })),
      requirements: fixly.requirements.filter((r) => r.bucket !== "out"),
      brief: "Uses {nothing} here.",
    };
    const issues = checkPrdSpecData(broken).join("\n");
    expect(issues).toMatch(/kebab-case/);
    expect(issues).toMatch(/primaryMetricId/);
    expect(issues).toMatch(/targetMin uses "unknown"/);
    expect(issues).toMatch(/evidence needs exactly three/);
    expect(issues).toMatch(/"out" bucket/);
    expect(issues).toMatch(/\{nothing\}/);
  });

  it("refuses a goal that the baseline already meets", () => {
    const issues = checkPrdSpecData({
      ...fixly,
      targetMin: "repeatShare - 1",
      targetMax: "repeatShare + 1",
    });
    expect(issues.join("\n")).toMatch(/inside the target range/);
  });
});
