import { describe, expect, it } from "vitest";

import { assertNoHiddenKeys } from "@/core/case-engine";
import { scoreSubmission } from "@/core/case-engine/submission";
import { backlogCaseSpecs } from "@/modules/backlog/case-specs";
import { backlogRawCases } from "@/modules/backlog/cases";
import { generateBacklogCase } from "@/modules/backlog/generator";
import { revealMidSprintEvents } from "@/modules/backlog/events.server";
import {
  initialScenario,
  scenarioAfterEvents,
  solveOptimalSprint,
} from "@/modules/backlog/plan";
import {
  backlogCaseSchema,
  publicBacklogCaseSchema,
  publicMidSprintEventSchema,
  type BacklogCase,
  type Ticket,
} from "@/modules/backlog/schema";
import { caseRepository, moduleRegistry } from "@/modules/registry.server";

const cases = backlogRawCases.map((raw) => backlogCaseSchema.parse(raw));
const first = cases[0];

/** Ticket wording may be polished by Claude; everything else is generated. */
function withoutWording(caseData: BacklogCase): BacklogCase {
  const strip = (ticket: Ticket): Ticket => ({
    ...ticket,
    title: "",
    description: "",
  });
  return {
    ...caseData,
    tickets: caseData.tickets.map(strip),
    midSprintEvents: caseData.midSprintEvents.map((event) =>
      event.addedTicket
        ? { ...event, addedTicket: strip(event.addedTicket) }
        : event,
    ),
  };
}

describe("pregenerated backlog cases", () => {
  it("has 10 cases spread over industries and difficulties", () => {
    expect(cases).toHaveLength(10);
    const industries = new Set(cases.map((c) => c.company.industry));
    expect(industries).toEqual(
      new Set(["Fintech", "Marketplace", "SaaS B2B", "Consumer"]),
    );
    const count = (difficulty: string) =>
      cases.filter((c) => c.difficulty === difficulty).length;
    expect(count("apm")).toBeGreaterThanOrEqual(3);
    expect(count("pm")).toBeGreaterThanOrEqual(3);
    expect(count("senior")).toBeGreaterThanOrEqual(3);
    expect(new Set(cases.map((c) => c.company.name)).size).toBe(10);
  });

  it("matches what the generator produces for its seed", () => {
    expect(cases.map((c) => c.id)).toEqual(
      backlogCaseSpecs.map((spec) => spec.caseId),
    );
    for (const spec of backlogCaseSpecs) {
      const committed = cases.find((c) => c.id === spec.caseId)!;
      expect(withoutWording(committed), spec.caseId).toEqual(
        withoutWording(generateBacklogCase(spec)),
      );
    }
  });

  it("uses every kind of mid-sprint event at least once", () => {
    const types = new Set(
      cases.flatMap((c) => c.midSprintEvents.map((event) => event.type)),
    );
    expect(types).toEqual(
      new Set([
        "production_outage",
        "dev_unavailable",
        "compliance_deadline",
        "sales_promise",
        "ceo_escalation",
      ]),
    );
  });

  it("is served by the registry without any ground truth", async () => {
    const registered = moduleRegistry.get("backlog");
    expect(registered?.meta.name).toBe("Backlog Simulator");

    const publicCases = await caseRepository.listPublicCases("backlog");
    expect(publicCases).toHaveLength(10);
    for (const publicCase of publicCases) {
      assertNoHiddenKeys(publicCase);
      expect(publicBacklogCaseSchema.safeParse(publicCase).success).toBe(true);
      expect(publicCase).not.toHaveProperty("midSprintEvents");
    }
    expect((await caseRepository.getPublicCase(first.id))?.title).toBe(
      first.title,
    );
  });
});

describe("submitting a backlog answer", () => {
  it("scores on the server and reveals the full case", async () => {
    const initial = solveOptimalSprint(initialScenario(first));
    const final = solveOptimalSprint(scenarioAfterEvents(first));
    const outcome = await scoreSubmission(caseRepository, {
      caseId: first.id,
      answer: {
        sprintTicketIds: initial.ticketIds,
        replanTicketIds: final.ticketIds,
      },
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.total).toBeGreaterThanOrEqual(90);
    expect(outcome.result).toHaveProperty("report");
    expect(outcome.moduleId).toBe("backlog");
    const revealed = backlogCaseSchema.parse(outcome.revealedCase);
    expect(revealed.tickets[0].hidden.explanation).not.toBe("");
    expect(revealed.midSprintEvents.length).toBeGreaterThan(0);
  });

  it("rejects a malformed answer without scoring it", async () => {
    const outcome = await scoreSubmission(caseRepository, {
      caseId: first.id,
      answer: { sprintTicketIds: ["not an id"] },
    });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.error.code).toBe("invalid_answer");
  });
});

describe("revealing mid-sprint events", () => {
  it("returns the public events once a sprint is committed", async () => {
    const outcome = await revealMidSprintEvents(caseRepository, {
      caseId: first.id,
      sprintTicketIds: [first.tickets[0].id],
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.events).toHaveLength(first.midSprintEvents.length);
    for (const event of outcome.events) {
      assertNoHiddenKeys(event);
      expect(publicMidSprintEventSchema.safeParse(event).success).toBe(true);
    }
    expect(JSON.stringify(outcome.events)).not.toContain('"guidance"');
    expect(JSON.stringify(outcome.events)).not.toContain('"trueValue"');
  });

  it("refuses before a sprint is committed, and for unknown cases", async () => {
    const empty = await revealMidSprintEvents(caseRepository, {
      caseId: first.id,
      sprintTicketIds: [],
    });
    expect(empty).toEqual({ ok: false, error: { code: "invalid_request" } });

    const unknown = await revealMidSprintEvents(caseRepository, {
      caseId: "backlog-nope-99",
      sprintTicketIds: ["LED-1"],
    });
    expect(unknown).toEqual({ ok: false, error: { code: "case_not_found" } });

    const garbage = await revealMidSprintEvents(caseRepository, "nope");
    expect(garbage.ok).toBe(false);
  });
});
