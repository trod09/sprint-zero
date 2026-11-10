import { describe, expect, it } from "vitest";

import { parseGeneratedCaseId } from "@/core/case-engine";
import { dailyCaseFor, dailyStreak, shiftDay, utcDay } from "@/lib/daily";
import { caseRepository, moduleRegistry } from "@/modules/registry.server";

const MODULES = moduleRegistry
  .list()
  .filter((m) => m.canGenerate)
  .map((m) => m.meta.id);

describe("daily case", () => {
  it("is the same for everyone on the same day and changes the next day", () => {
    const today = dailyCaseFor("2026-11-10", MODULES)!;
    expect(dailyCaseFor("2026-11-10", MODULES)).toEqual(today);
    const tomorrow = dailyCaseFor("2026-11-11", MODULES)!;
    expect(tomorrow.caseId).not.toBe(today.caseId);
    expect(tomorrow.number).toBe(today.number + 1);
    expect(tomorrow.moduleId).not.toBe(today.moduleId);
  });

  it("carries its parameters in a valid generated case id", () => {
    const daily = dailyCaseFor("2026-11-13", MODULES)!;
    expect(parseGeneratedCaseId(daily.caseId)).toMatchObject({
      moduleId: daily.moduleId,
      industry: daily.industry,
      difficulty: "senior", // a Friday
    });
  });

  it("rotates through every generating module", () => {
    const seen = new Set<string>();
    for (let offset = 0; offset < MODULES.length; offset++) {
      seen.add(dailyCaseFor(shiftDay("2026-03-01", offset), MODULES)!.moduleId);
    }
    expect(seen.size).toBe(MODULES.length);
  });

  it("always points at a case the server can build", async () => {
    for (let offset = 0; offset < 45; offset++) {
      const daily = dailyCaseFor(shiftDay("2026-11-01", offset), MODULES)!;
      const record = await caseRepository.getCaseRecord(daily.caseId);
      expect(record, daily.caseId).not.toBeNull();
    }
  }, 60_000);

  it("handles bad input and month boundaries", () => {
    expect(dailyCaseFor("not-a-date", MODULES)).toBeNull();
    expect(dailyCaseFor("2026-11-10", [])).toBeNull();
    expect(shiftDay("2026-03-01", -1)).toBe("2026-02-28");
    expect(utcDay(new Date("2026-12-31T23:59:59Z"))).toBe("2026-12-31");
  });

  it("counts a streak that ends today or yesterday", () => {
    const idOf = (date: string) => dailyCaseFor(date, MODULES)!.caseId;
    const played = new Set([
      idOf("2026-11-08"),
      idOf("2026-11-09"),
      idOf("2026-11-10"),
    ]);
    expect(dailyStreak("2026-11-10", MODULES, played)).toBe(3);
    expect(dailyStreak("2026-11-11", MODULES, played)).toBe(3);
    expect(dailyStreak("2026-11-12", MODULES, played)).toBe(0);
    expect(dailyStreak("2026-11-10", MODULES, new Set())).toBe(0);
  });
});
