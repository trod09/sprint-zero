import { describe, expect, it } from "vitest";

import type { CaseSummary } from "@/components/case-library";
import { parseGeneratedCaseId } from "@/core/case-engine";
import type { Attempt } from "@/core/storage";
import { freshCaseId, industryOf } from "@/lib/practice";
import { recommendFromAttempts } from "@/lib/recommend";

const summary = (
  id: string,
  moduleId: string,
  difficulty: CaseSummary["difficulty"] = "apm",
): CaseSummary => ({
  id,
  moduleId,
  moduleName: moduleId,
  title: id,
  company: "Acme",
  industry: "Fintech",
  difficulty,
});

const attempt = (caseId: string, moduleId: string, total: number): Attempt =>
  ({
    schemaVersion: 1,
    id: `a-${caseId}`,
    caseId,
    moduleId,
    startedAt: "2026-11-01T10:00:00.000Z",
    submittedAt: "2026-11-01T10:10:00.000Z",
    answer: {},
    result: { total, criteria: [] },
  }) as unknown as Attempt;

describe("fresh practice cases", () => {
  it("keep the module and level, and map the industry", () => {
    const id = freshCaseId(
      {
        caseId: "backlog-fintech-01",
        moduleId: "backlog",
        difficulty: "senior",
        industry: "Fintech",
      },
      4242,
    );
    expect(parseGeneratedCaseId(id)).toEqual({
      moduleId: "backlog",
      industry: "fintech",
      difficulty: "senior",
      seed: 4242,
    });
  });

  it("reads the industry of generated cases from their id", () => {
    expect(industryOf("gen-ab-test-consumer-pm-12", "whatever")).toBe(
      "consumer",
    );
    expect(industryOf("ab-test-x", "SaaS B2B")).toBe("saas");
  });

  it("falls back to a known industry for other labels", () => {
    expect(["fintech", "marketplace", "saas", "consumer"]).toContain(
      industryOf("product-case-pawpal", "Pet services marketplace"),
    );
  });
});

describe("recommendations from attempts", () => {
  const cases = [
    summary("backlog-1", "backlog"),
    summary("backlog-2", "backlog"),
    summary("metric-1", "metric-drop"),
    summary("ab-1", "ab-test"),
  ];

  it("never recommends a case already played", () => {
    const picks = recommendFromAttempts(
      [attempt("backlog-1", "backlog", 30)],
      cases,
      3,
    );
    expect(picks.map((p) => p.caseId)).not.toContain("backlog-1");
    expect(picks.length).toBeGreaterThan(0);
  });

  it("points to a skill that was never practised first", () => {
    const [first] = recommendFromAttempts(
      [attempt("backlog-1", "backlog", 95)],
      cases,
      1,
    );
    expect(first.reason).toBe("not_practiced");
  });
});
