import { describe, expect, it, vi } from "vitest";

import {
  assertNoHiddenKeys,
  findHiddenKey,
  HiddenDataLeakError,
} from "@/core/case-engine";
import { createCaseRepository } from "@/core/case-engine/case-repository";
import {
  CaseValidationError,
  createModuleRegistry,
  registerModule,
  type RegisteredModule,
} from "@/core/case-engine/registry";
import { scoreSubmission } from "@/core/case-engine/submission";

import {
  demoModule,
  makeDemoCase,
  type DemoModule,
} from "../fixtures/demo-module";

function setup(rawCases: readonly unknown[] = [makeDemoCase()]) {
  const registered = registerModule({
    module: demoModule,
    loadRawCases: () => rawCases,
  });
  const registry = createModuleRegistry([registered]);
  return { registered, registry, repository: createCaseRepository(registry) };
}

describe("findHiddenKey", () => {
  it("finds ground truth at any depth", () => {
    expect(findHiddenKey({ a: 1, b: [{ c: "x" }] })).toBeNull();
    expect(findHiddenKey({ hidden: 1 })).toBe("$.hidden");
    expect(findHiddenKey({ items: [{ id: 1 }, { hidden: {} }] })).toBe(
      "$.items[1].hidden",
    );
    expect(findHiddenKey({ a: { b: { hidden: undefined } } })).toBe(
      "$.a.b.hidden",
    );
    expect(findHiddenKey(null)).toBeNull();
    expect(findHiddenKey("hidden")).toBeNull();
  });

  it("assertNoHiddenKeys throws a descriptive error", () => {
    expect(() => assertNoHiddenKeys({ ok: true })).not.toThrow();
    expect(() => assertNoHiddenKeys({ tickets: [{ hidden: 1 }] })).toThrow(
      HiddenDataLeakError,
    );
  });
});

describe("module registry", () => {
  it("lists and finds modules, and rejects duplicates", () => {
    const { registered, registry } = setup();
    expect(registry.list()).toEqual([registered]);
    expect(registry.get("demo")?.meta.name).toBe("Demo");
    expect(registry.get("unknown")).toBeUndefined();
    expect(() => createModuleRegistry([registered, registered])).toThrow(
      /registered twice/,
    );
  });

  it("loads cases once and memoizes them", async () => {
    const loadRawCases = vi.fn(() => [makeDemoCase()]);
    const registered = registerModule({ module: demoModule, loadRawCases });
    const [first, second] = await Promise.all([
      registered.loadCases(),
      registered.loadCases(),
    ]);
    expect(first).toBe(second);
    expect(loadRawCases).toHaveBeenCalledTimes(1);
  });

  it("supports async case loaders", async () => {
    const registered = registerModule({
      module: demoModule,
      loadRawCases: async () => [makeDemoCase()],
    });
    expect(await registered.loadCases()).toHaveLength(1);
  });

  it("rejects cases that fail the module schema", async () => {
    const { registered } = setup([{ ...makeDemoCase(), items: [] }]);
    await expect(registered.loadCases()).rejects.toBeInstanceOf(
      CaseValidationError,
    );
  });

  it("rejects cases that belong to another module or repeat an id", async () => {
    const otherModule: DemoModule = {
      ...demoModule,
      meta: { ...demoModule.meta, id: "other" },
    };
    await expect(
      registerModule({
        module: otherModule,
        loadRawCases: () => [makeDemoCase()],
      }).loadCases(),
    ).rejects.toThrow(/declares moduleId "demo"/);

    await expect(
      setup([makeDemoCase(), makeDemoCase()]).registered.loadCases(),
    ).rejects.toThrow(/duplicate case id/);
  });
});

describe("ground truth never reaches the public view", () => {
  it("strips hidden data at every level", async () => {
    const { repository } = setup();
    const publicCase = await repository.getPublicCase("demo-01");

    expect(publicCase).not.toBeNull();
    expect(findHiddenKey(publicCase)).toBeNull();
    const serialized = JSON.stringify(publicCase);
    expect(serialized).not.toContain("hidden");
    expect(serialized).not.toContain("trueValue");
    expect(serialized).not.toContain("bestItemId");
    // What the learner needs is still there.
    expect(publicCase).toMatchObject({
      id: "demo-01",
      title: "Pick one",
      items: [
        { id: "a", label: "Shiny feature" },
        { id: "b", label: "Boring fix" },
        { id: "c", label: "CEO request" },
      ],
    });
  });

  it("holds for every case a module lists", async () => {
    const { repository } = setup([
      makeDemoCase(),
      makeDemoCase({ id: "demo-02", difficulty: "senior" }),
    ]);
    const cases = await repository.listPublicCases("demo");
    expect(cases.map((c) => c.id)).toEqual(["demo-01", "demo-02"]);
    for (const publicCase of cases)
      expect(findHiddenKey(publicCase)).toBeNull();
  });

  it("fails loudly if a module forgets to strip nested ground truth", async () => {
    const leakyModule: DemoModule = {
      ...demoModule,
      toPublicCase(caseData) {
        const { hidden: _caseTruth, ...rest } = caseData;
        return rest; // items still carry their `hidden` values
      },
    };
    const registered = registerModule({
      module: leakyModule,
      loadRawCases: () => [makeDemoCase()],
    });
    await expect(registered.loadCases()).rejects.toBeInstanceOf(
      HiddenDataLeakError,
    );
  });

  it("drops fields the public schema does not allow", async () => {
    const chattyModule: DemoModule = {
      ...demoModule,
      toPublicCase(caseData) {
        return {
          ...demoModule.toPublicCase(caseData),
          answerKey: caseData.hidden.bestItemId,
        };
      },
    };
    const registered = registerModule({
      module: chattyModule,
      loadRawCases: () => [makeDemoCase()],
    });
    const [record] = await registered.loadCases();
    expect(record.publicCase).not.toHaveProperty("answerKey");
  });
});

describe("case repository", () => {
  it("returns null or empty for unknown ids", async () => {
    const { repository } = setup();
    expect(await repository.getPublicCase("nope")).toBeNull();
    expect(await repository.getCaseRecord("nope")).toBeNull();
    expect(await repository.listPublicCases("nope")).toEqual([]);
  });

  it("rejects the same case id in two modules", async () => {
    const withCase = (moduleId: string): RegisteredModule => ({
      meta: { ...demoModule.meta, id: moduleId },
      feedbackRubric: "",
      loadCases: async () => [
        {
          id: "shared-id",
          moduleId,
          publicCase: demoModule.toPublicCase(
            makeDemoCase({ id: "shared-id" }),
          ),
          score: () => ({ ok: false, issues: [] }),
          reveal: () => makeDemoCase({ id: "shared-id" }),
        },
      ],
    });
    const repository = createCaseRepository(
      createModuleRegistry([withCase("one"), withCase("two")]),
    );
    await expect(repository.getPublicCase("shared-id")).rejects.toThrow(
      /used by both "one" and "two"/,
    );
  });
});

describe("scoreSubmission", () => {
  it("scores on the server and reveals the ground truth", async () => {
    const { repository } = setup();
    const outcome = await scoreSubmission(repository, {
      caseId: "demo-01",
      answer: { selectedItemId: "b" },
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.moduleId).toBe("demo");
    expect(outcome.result.total).toBe(100);
    expect(outcome.revealedCase).toEqual(makeDemoCase());
  });

  it("gives partial credit deterministically", async () => {
    const { repository } = setup();
    const submit = () =>
      scoreSubmission(repository, {
        caseId: "demo-01",
        answer: { selectedItemId: "c" },
      });
    const first = await submit();
    const second = await submit();

    expect(first).toEqual(second);
    expect(first.ok && first.result.total).toBe(20); // 0 + 40 * (40 / 80)
    expect(first.ok && first.result.criteria.map((c) => c.points)).toEqual([
      0, 20,
    ]);
  });

  it("rejects malformed requests without touching any case", async () => {
    const { repository } = setup();
    for (const input of [null, "demo-01", {}, { caseId: 7 }, { caseId: "" }]) {
      const outcome = await scoreSubmission(repository, input);
      expect(outcome).toMatchObject({
        ok: false,
        error: { code: "invalid_request" },
      });
    }
  });

  it("reports unknown cases", async () => {
    const { repository } = setup();
    expect(
      await scoreSubmission(repository, { caseId: "nope", answer: {} }),
    ).toMatchObject({ ok: false, error: { code: "case_not_found" } });
  });

  it("rejects answers that do not match the module schema, revealing nothing", async () => {
    const { repository } = setup();
    const outcome = await scoreSubmission(repository, {
      caseId: "demo-01",
      answer: { selectedItemId: 42 },
    });

    expect(outcome).toMatchObject({
      ok: false,
      error: { code: "invalid_answer" },
    });
    expect(outcome.ok === false && outcome.error.issues?.[0]).toContain(
      "selectedItemId",
    );
    expect(JSON.stringify(outcome)).not.toContain("trueValue");
    expect(JSON.stringify(outcome)).not.toContain("bestItemId");
  });
});
