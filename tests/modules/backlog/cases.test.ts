import { describe, expect, it } from "vitest";

import { assertNoHiddenKeys } from "@/core/case-engine";
import { scoreSubmission } from "@/core/case-engine/submission";
import { scoreResultSchema } from "@/core/scoring";
import { backlogCaseSpecs } from "@/modules/backlog/case-specs";
import { backlogRawCases } from "@/modules/backlog/cases";
import { generateBacklogCase } from "@/modules/backlog/generator";
import { initialScenario, solveOptimalSprint } from "@/modules/backlog/plan";
import {
  backlogCaseSchema,
  publicBacklogCaseSchema,
  type BacklogAnswer,
  type BacklogCase,
  type Ticket,
} from "@/modules/backlog/schema";
import { scoreBacklogAnswer } from "@/modules/backlog/scoring";
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

/** A complete answer for a list of sprint tickets. */
function answerOf(sprintTicketIds: string[]): BacklogAnswer {
  return { method: "drag", sprintTicketIds, marks: {} };
}

function criterion(result: ReturnType<typeof scoreBacklogAnswer>, id: string) {
  const found = result.criteria.find((entry) => entry.id === id);
  if (!found) throw new Error(`No criterion "${id}"`);
  return found;
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

describe("backlog scoring (provisional)", () => {
  it("gives 100 to the optimal sprint of every case", () => {
    for (const caseData of cases) {
      const optimal = solveOptimalSprint(initialScenario(caseData));
      const result = scoreBacklogAnswer(caseData, answerOf(optimal.ticketIds));
      expect(result.total, caseData.id).toBe(100);
      expect(scoreResultSchema.safeParse(result).success).toBe(true);
    }
  });

  it("is deterministic", () => {
    const answer = answerOf(first.tickets.slice(0, 6).map((t) => t.id));
    expect(scoreBacklogAnswer(first, answer)).toEqual(
      scoreBacklogAnswer(first, answer),
    );
  });

  it("scores an empty sprint with capacity points only", () => {
    const result = scoreBacklogAnswer(first, answerOf([]));
    expect(criterion(result, "value").ratio).toBe(0);
    expect(criterion(result, "critical").ratio).toBe(0);
    expect(criterion(result, "capacity").ratio).toBe(1);
    expect(result.total).toBe(20);
  });

  it("rewards critical tickets and penalises missing them", () => {
    const criticalIds = first.tickets
      .filter((ticket) => ticket.hidden.critical)
      .map((ticket) => ticket.id);
    const onlyCritical = scoreBacklogAnswer(first, answerOf(criticalIds));
    expect(criterion(onlyCritical, "critical").ratio).toBe(1);

    const optimal = solveOptimalSprint(initialScenario(first));
    const withoutCritical = scoreBacklogAnswer(
      first,
      answerOf(optimal.ticketIds.filter((id) => !criticalIds.includes(id))),
    );
    expect(criterion(withoutCritical, "critical").ratio).toBe(0);
    expect(withoutCritical.total).toBeLessThan(70);
  });

  it("penalises an overbooked sprint and does not count what spills", () => {
    const everything = scoreBacklogAnswer(
      first,
      answerOf(first.tickets.map((ticket) => ticket.id)),
    );
    expect(criterion(everything, "capacity").ratio).toBe(0);
    expect(criterion(everything, "value").ratio).toBeLessThan(1);
    expect(everything.total).toBeLessThan(80);
  });

  it("does not let a duplicate add value", () => {
    const duplicate = first.tickets.find(
      (ticket) => ticket.hidden.trap === "duplicate",
    )!;
    const originalId = duplicate.hidden.duplicateOf!;
    const one = scoreBacklogAnswer(first, answerOf([originalId]));
    const both = scoreBacklogAnswer(
      first,
      answerOf([originalId, duplicate.id]),
    );
    expect(criterion(both, "value").ratio).toBe(criterion(one, "value").ratio);
  });

  it("ignores ids that are not tickets of the case", () => {
    const result = scoreBacklogAnswer(first, answerOf(["ZZZ-1"]));
    expect(result.total).toBe(20);
  });
});

describe("submitting a backlog answer", () => {
  it("scores on the server and reveals the full case", async () => {
    const optimal = solveOptimalSprint(initialScenario(first));
    const outcome = await scoreSubmission(caseRepository, {
      caseId: first.id,
      answer: { sprintTicketIds: optimal.ticketIds },
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.total).toBe(100);
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
