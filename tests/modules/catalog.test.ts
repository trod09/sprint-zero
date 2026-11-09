import { describe, expect, it } from "vitest";

import { caseIdSchema, SKILLS } from "@/core/case-engine";
import { getMessages } from "@/i18n";
import { getModuleMeta, moduleCatalog } from "@/modules/catalog";
import { caseRepository, moduleRegistry } from "@/modules/registry.server";

describe("module catalog", () => {
  it("lists the 11 modules of the product catalog with unique kebab-case ids", () => {
    const ids = moduleCatalog.map((meta) => meta.id);
    expect(ids).toHaveLength(11);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(caseIdSchema.safeParse(id).success).toBe(true);
  });

  it("gives every module copy, valid skills and a status label", () => {
    const messages = getMessages();
    for (const meta of moduleCatalog) {
      expect(meta.name).not.toBe("");
      expect(meta.tagline).not.toBe("");
      expect(meta.description).not.toBe("");
      expect(meta.skills.length).toBeGreaterThan(0);
      for (const skill of meta.skills) expect(SKILLS).toContain(skill);
      expect(messages.status[meta.status]).toBeTruthy();
    }
  });

  it("finds modules by id", () => {
    expect(getModuleMeta("backlog")?.name).toBe("Backlog Simulator");
    expect(getModuleMeta("metric-drop")?.name).toBe("Metric Drop");
    expect(getModuleMeta("nope")).toBeUndefined();
  });

  it("only marks a module as available once it is registered on the server", () => {
    // A registered module may still be in development while its UI is built.
    const registered = new Set(moduleRegistry.list().map((m) => m.meta.id));
    for (const meta of moduleCatalog) {
      if (meta.status === "available") expect(registered).toContain(meta.id);
      if (registered.has(meta.id)) expect(meta.status).not.toBe("coming_soon");
    }
  });

  it("every registered case passes validation and hides its ground truth", async () => {
    // Loading validates each case and throws on any `hidden` leak.
    for (const registered of moduleRegistry.list()) {
      const cases = await caseRepository.listPublicCases(registered.meta.id);
      expect(cases.length).toBeGreaterThan(0);
    }
  });
});
