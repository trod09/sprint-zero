import { describe, expect, it } from "vitest";

import {
  DIFFICULTIES,
  generatedCaseId,
  INDUSTRY_KEYS,
  parseGeneratedCaseId,
} from "@/core/case-engine";
import { caseRepository, moduleRegistry } from "@/modules/registry.server";

const GENERATING = [
  "backlog",
  "feedback-triage",
  "ux-critique",
  "metric-drop",
  "ab-test",
  "product-case",
];

describe("generated case ids", () => {
  it("round-trip their parameters", () => {
    const params = {
      seed: 48213,
      difficulty: "pm" as const,
      industry: "saas" as const,
    };
    const id = generatedCaseId("feedback-triage", params);
    expect(id).toBe("gen-feedback-triage-saas-pm-48213");
    expect(parseGeneratedCaseId(id)).toEqual({
      moduleId: "feedback-triage",
      ...params,
    });
  });

  it("rejects malformed ids", () => {
    for (const id of [
      "backlog-fintech-01",
      "gen-backlog-fintech-pm-0",
      "gen-backlog-fintech-pm-1234567",
      "gen-backlog-space-pm-12",
      "gen-backlog-fintech-cto-12",
    ]) {
      expect(parseGeneratedCaseId(id), id).toBeNull();
    }
  });
});

describe("on-demand generation", () => {
  it("is offered by the modules with a generator", () => {
    const generating = moduleRegistry
      .list()
      .filter((m) => m.canGenerate)
      .map((m) => m.meta.id);
    expect(generating.sort()).toEqual([...GENERATING].sort());
  });

  it("builds a valid case for every industry and difficulty", async () => {
    for (const moduleId of GENERATING) {
      for (const industry of INDUSTRY_KEYS) {
        for (const difficulty of DIFFICULTIES) {
          for (const seed of [7, 90210]) {
            const id = generatedCaseId(moduleId, {
              seed,
              difficulty,
              industry,
            });
            const record = await caseRepository.getCaseRecord(id);
            expect(record, id).not.toBeNull();
            expect(record!.publicCase.id).toBe(id);
            expect(record!.publicCase.difficulty).toBe(difficulty);
            expect(JSON.stringify(record!.publicCase)).not.toContain(
              '"hidden"',
            );
          }
        }
      }
    }
  }, 60_000);

  it("rebuilds the same case from the same id", async () => {
    const id = "gen-backlog-consumer-senior-31337";
    const first = (await caseRepository.getCaseRecord(id))!.reveal();
    const backlog = moduleRegistry.get("backlog")!;
    const again = backlog.generateCase({
      seed: 31337,
      difficulty: "senior",
      industry: "consumer",
    })!;
    expect(again.reveal()).toEqual(first);
  });

  it("returns null for modules without a generator", async () => {
    expect(
      await caseRepository.getPublicCase("gen-prd-writer-fintech-pm-12"),
    ).toBeNull();
  });
});
