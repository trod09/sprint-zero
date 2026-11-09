import { describe, expect, it } from "vitest";

import { createRng } from "@/core/rng";
import {
  deliveredValue,
  evaluateSprint,
  scenarioAfterEvents,
  solveOptimalSprint,
  type SprintScenario,
} from "@/modules/backlog/plan";
import type { BacklogCase, Ticket } from "@/modules/backlog/schema";

import { makeTicket } from "../../fixtures/backlog";

/** Reference solver: tries every subset. Only usable on tiny backlogs. */
function bruteForce(scenario: SprintScenario) {
  const { tickets, capacity } = scenario;
  let best = { criticals: -1, value: -1, effort: 0 };
  for (let mask = 0; mask < 1 << tickets.length; mask++) {
    const subset = tickets.filter((_, index) => mask & (1 << index));
    const effort = subset.reduce((sum, ticket) => sum + ticket.effort, 0);
    if (effort > capacity) continue;
    const criticals = subset.filter((ticket) => ticket.hidden.critical).length;
    const value = deliveredValue(subset);
    const better =
      criticals > best.criticals ||
      (criticals === best.criticals && value > best.value) ||
      (criticals === best.criticals &&
        value === best.value &&
        effort < best.effort);
    if (better) best = { criticals, value, effort };
  }
  return best;
}

function randomScenario(seed: number): SprintScenario {
  const rng = createRng(seed);
  const size = rng.int(4, 12);
  const tickets: Ticket[] = [];
  for (let index = 0; index < size; index++) {
    const original = tickets.length > 0 ? rng.pick(tickets) : undefined;
    const canDuplicate =
      original &&
      !original.hidden.critical &&
      original.hidden.trap !== "duplicate";
    if (canDuplicate && rng.bool(0.2)) {
      tickets.push(
        makeTicket(`T-${index}`, {
          effort: rng.pick([1, 2, 3, 5, 8]),
          value: original.hidden.trueValue,
          duplicateOf: original.id,
        }),
      );
    } else {
      tickets.push(
        makeTicket(`T-${index}`, {
          effort: rng.pick([1, 2, 3, 5, 8, 13]),
          value: rng.int(0, 100),
          critical: rng.bool(0.15),
        }),
      );
    }
  }
  return { tickets, capacity: rng.int(0, 30) };
}

describe("deliveredValue", () => {
  it("adds up real value", () => {
    expect(deliveredValue([])).toBe(0);
    expect(
      deliveredValue([
        makeTicket("A-1", { value: 40 }),
        makeTicket("A-2", { value: 25 }),
      ]),
    ).toBe(65);
  });

  it("counts a duplicated piece of work once", () => {
    const original = makeTicket("A-1", { value: 60 });
    const copy = makeTicket("A-2", { value: 60, duplicateOf: "A-1" });
    expect(deliveredValue([original, copy])).toBe(60);
    expect(deliveredValue([copy])).toBe(60);
    expect(deliveredValue([copy, makeTicket("A-3", { value: 10 })])).toBe(70);
  });
});

describe("solveOptimalSprint", () => {
  it("matches an exhaustive search on 300 random backlogs", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const scenario = randomScenario(seed);
      const expected = bruteForce(scenario);
      const optimal = solveOptimalSprint(scenario);
      const chosen = scenario.tickets.filter((ticket) =>
        optimal.ticketIds.includes(ticket.id),
      );
      const detail = `seed ${seed}`;
      expect(optimal.effort, detail).toBeLessThanOrEqual(scenario.capacity);
      expect(optimal.value, detail).toBe(expected.value);
      expect(optimal.effort, detail).toBe(expected.effort);
      expect(
        chosen.filter((ticket) => ticket.hidden.critical).length,
        detail,
      ).toBe(expected.criticals);
      expect(optimal.value, detail).toBe(deliveredValue(chosen));
    }
  });

  it("picks the best value for the capacity, not the biggest tickets", () => {
    const optimal = solveOptimalSprint({
      capacity: 10,
      tickets: [
        makeTicket("A-1", { effort: 8, value: 70 }),
        makeTicket("A-2", { effort: 5, value: 50 }),
        makeTicket("A-3", { effort: 5, value: 45 }),
        makeTicket("A-4", { effort: 2, value: 10 }),
      ],
    });
    expect(optimal.ticketIds).toEqual(["A-2", "A-3"]);
    expect(optimal.value).toBe(95);
    expect(optimal.effort).toBe(10);
  });

  it("always includes critical tickets, whatever value that costs", () => {
    const optimal = solveOptimalSprint({
      capacity: 8,
      tickets: [
        makeTicket("A-1", { effort: 8, value: 100 }),
        makeTicket("A-2", { effort: 5, value: 5, critical: true }),
        makeTicket("A-3", { effort: 3, value: 20 }),
      ],
    });
    expect(optimal.ticketIds).toEqual(["A-2", "A-3"]);
    expect(optimal.missedCriticalIds).toEqual([]);
  });

  it("reports critical tickets that cannot fit", () => {
    const optimal = solveOptimalSprint({
      capacity: 5,
      tickets: [
        makeTicket("A-1", { effort: 5, value: 90, critical: true }),
        makeTicket("A-2", { effort: 3, value: 80, critical: true }),
      ],
    });
    expect(optimal.ticketIds).toHaveLength(1);
    expect(optimal.missedCriticalIds).toHaveLength(1);
  });

  it("never pays twice for duplicated work and prefers the original", () => {
    const tickets = [
      makeTicket("A-2", { effort: 3, value: 60, duplicateOf: "A-1" }),
      makeTicket("A-1", { effort: 3, value: 60 }),
      makeTicket("A-3", { effort: 3, value: 20 }),
    ];
    const optimal = solveOptimalSprint({ capacity: 6, tickets });
    expect(optimal.ticketIds).toEqual(["A-1", "A-3"]);
    expect(optimal.value).toBe(80);

    // With room for everything, the copy is still left out.
    const roomy = solveOptimalSprint({ capacity: 20, tickets });
    expect(roomy.ticketIds).toEqual(["A-1", "A-3"]);
  });

  it("takes the cheaper of two tickets for the same work", () => {
    const optimal = solveOptimalSprint({
      capacity: 5,
      tickets: [
        makeTicket("A-1", { effort: 5, value: 60 }),
        makeTicket("A-2", { effort: 3, value: 60, duplicateOf: "A-1" }),
        makeTicket("A-3", { effort: 2, value: 30 }),
      ],
    });
    expect(optimal.ticketIds).toEqual(["A-2", "A-3"]);
    expect(optimal.value).toBe(90);
  });

  it("uses as few points as possible for the same value", () => {
    const optimal = solveOptimalSprint({
      capacity: 10,
      tickets: [
        makeTicket("A-1", { effort: 5, value: 40 }),
        makeTicket("A-2", { effort: 3, value: 40 }),
        makeTicket("A-3", { effort: 8, value: 0 }),
      ],
    });
    expect(optimal.ticketIds).toEqual(["A-1", "A-2"]);
    expect(optimal.effort).toBe(8);
  });

  it("handles an empty backlog and zero capacity", () => {
    expect(solveOptimalSprint({ capacity: 10, tickets: [] })).toEqual({
      ticketIds: [],
      value: 0,
      effort: 0,
      missedCriticalIds: [],
    });
    const none = solveOptimalSprint({
      capacity: 0,
      tickets: [makeTicket("A-1", { critical: true })],
    });
    expect(none.ticketIds).toEqual([]);
    expect(none.missedCriticalIds).toEqual(["A-1"]);
  });

  it("is deterministic", () => {
    const scenario = randomScenario(42);
    expect(solveOptimalSprint(scenario)).toEqual(solveOptimalSprint(scenario));
  });
});

describe("evaluateSprint", () => {
  const tickets = [
    makeTicket("A-1", { effort: 5, value: 50 }),
    makeTicket("A-2", { effort: 3, value: 30 }),
    makeTicket("A-3", { effort: 3, value: 40 }),
    makeTicket("A-4", { effort: 1, value: 10 }),
  ];

  it("delivers everything when the plan fits", () => {
    const result = evaluateSprint({ capacity: 8, tickets }, ["A-2", "A-1"]);
    expect(result).toEqual({
      deliveredIds: ["A-2", "A-1"],
      spilledIds: [],
      unknownIds: [],
      plannedEffort: 8,
      deliveredEffort: 8,
      value: 80,
      overCapacityBy: 0,
    });
  });

  it("stops at the first ticket that does not fit: order matters", () => {
    const scenario = { capacity: 8, tickets };
    const result = evaluateSprint(scenario, ["A-1", "A-2", "A-3", "A-4"]);
    expect(result.deliveredIds).toEqual(["A-1", "A-2"]);
    // A-4 would fit on its own, but the team never gets to it.
    expect(result.spilledIds).toEqual(["A-3", "A-4"]);
    expect(result.overCapacityBy).toBe(4);
    expect(result.value).toBe(80);

    const reordered = evaluateSprint(scenario, ["A-3", "A-1", "A-2", "A-4"]);
    expect(reordered.deliveredIds).toEqual(["A-3", "A-1"]);
    expect(reordered.value).toBe(90);
  });

  it("ignores unknown and repeated ids", () => {
    const result = evaluateSprint({ capacity: 8, tickets }, [
      "A-2",
      "NOPE-1",
      "A-2",
      "A-4",
    ]);
    expect(result.deliveredIds).toEqual(["A-2", "A-4"]);
    expect(result.unknownIds).toEqual(["NOPE-1"]);
    expect(result.plannedEffort).toBe(4);
  });

  it("scores an empty plan as nothing delivered", () => {
    const result = evaluateSprint({ capacity: 8, tickets }, []);
    expect(result.value).toBe(0);
    expect(result.deliveredIds).toEqual([]);
  });
});

describe("scenarioAfterEvents", () => {
  it("applies capacity changes and adds urgent tickets", () => {
    const urgent = makeTicket("A-9", { critical: true });
    const caseData = {
      sprintCapacity: 30,
      tickets: [makeTicket("A-1")],
      midSprintEvents: [
        { capacityDelta: -6 },
        { capacityDelta: 0, addedTicket: urgent },
      ],
    } as unknown as BacklogCase;
    const scenario = scenarioAfterEvents(caseData);
    expect(scenario.capacity).toBe(24);
    expect(scenario.tickets.map((ticket) => ticket.id)).toEqual(["A-1", "A-9"]);
    // The case itself is not modified.
    expect(caseData.tickets).toHaveLength(1);
  });
});
