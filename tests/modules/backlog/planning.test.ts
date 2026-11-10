import { describe, expect, it } from "vitest";

import {
  addedTickets,
  capacityAfterEvents,
  fillSprint,
  initialPlanningState,
  orderByMoscow,
  planningReducer,
  planningStateSchema,
  rankByRice,
  riceScore,
  planningDraftSchema,
  sanitizePlanningDraft,
  sanitizePlanningState,
  splitByCapacity,
  type PlanningAction,
  type PlanningState,
} from "@/modules/backlog/planning";

const tickets = [
  { id: "AB-1", effort: 5 },
  { id: "AB-2", effort: 3 },
  { id: "AB-3", effort: 3 },
  { id: "AB-4", effort: 1 },
];

function run(...actions: PlanningAction[]): PlanningState {
  return actions.reduce(planningReducer, initialPlanningState);
}

describe("splitByCapacity", () => {
  it("delivers everything that fits", () => {
    expect(splitByCapacity(tickets.slice(0, 2), 8)).toEqual({
      deliveredIds: ["AB-1", "AB-2"],
      spilledIds: [],
      plannedEffort: 8,
      deliveredEffort: 8,
      overCapacityBy: 0,
    });
  });

  it("stops at the first ticket that does not fit", () => {
    const split = splitByCapacity(tickets, 8);
    expect(split.deliveredIds).toEqual(["AB-1", "AB-2"]);
    expect(split.spilledIds).toEqual(["AB-3", "AB-4"]);
    expect(split.overCapacityBy).toBe(4);
  });

  it("handles an empty plan and zero capacity", () => {
    expect(splitByCapacity([], 10).plannedEffort).toBe(0);
    expect(splitByCapacity(tickets, 0).deliveredIds).toEqual([]);
  });
});

describe("fillSprint", () => {
  it("keeps each ranked ticket that still fits and skips the rest", () => {
    expect(fillSprint(tickets, 9)).toEqual(["AB-1", "AB-2", "AB-4"]);
    expect(fillSprint(tickets, 4)).toEqual(["AB-2", "AB-4"]);
    expect(fillSprint(tickets, 0)).toEqual([]);
  });
});

describe("RICE", () => {
  it("needs reach, impact and confidence before it gives a score", () => {
    expect(riceScore(undefined, 3, 10_000)).toBeNull();
    expect(riceScore({ reach: 2, impact: 2 }, 3, 10_000)).toBeNull();
  });

  it("computes reach x impact x confidence / effort", () => {
    // 20% of 10,000 users x impact 2 x confidence 0.8 / 4 points.
    expect(riceScore({ reach: 2, impact: 3, confidence: 1 }, 4, 10_000)).toBe(
      800,
    );
    // Half the effort doubles the score.
    expect(riceScore({ reach: 2, impact: 3, confidence: 1 }, 2, 10_000)).toBe(
      1600,
    );
  });

  it("ranks scored tickets and leaves unscored ones out", () => {
    const ranked = rankByRice(
      tickets,
      {
        "AB-1": { reach: 4, impact: 4, confidence: 2 },
        "AB-2": { reach: 0, impact: 0, confidence: 0 },
        "AB-4": { reach: 4, impact: 4, confidence: 2 },
        "AB-3": { reach: 1 },
      },
      10_000,
    );
    expect(ranked.map((entry) => entry.ticket.id)).toEqual([
      "AB-4",
      "AB-1",
      "AB-2",
    ]);
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });
});

describe("MoSCoW", () => {
  it("orders must, should, could and drops won't and unsorted", () => {
    const ordered = orderByMoscow(tickets, {
      "AB-1": "could",
      "AB-2": "wont",
      "AB-3": "must",
      "AB-4": "should",
    });
    expect(ordered.map((ticket) => ticket.id)).toEqual([
      "AB-3",
      "AB-4",
      "AB-1",
    ]);
    expect(orderByMoscow(tickets, {})).toEqual([]);
  });
});

describe("planningReducer", () => {
  it("adds tickets at the end or at a position, without repeats", () => {
    const state = run(
      { type: "add_to_sprint", id: "AB-1" },
      { type: "add_to_sprint", id: "AB-2" },
      { type: "add_to_sprint", id: "AB-3", index: 0 },
      { type: "add_to_sprint", id: "AB-1" },
    );
    expect(state.sprint).toEqual(["AB-3", "AB-2", "AB-1"]);
  });

  it("moves and removes tickets", () => {
    const base = run({ type: "set_sprint", ids: ["AB-1", "AB-2", "AB-3"] });
    expect(
      planningReducer(base, { type: "move_in_sprint", id: "AB-3", toIndex: 0 })
        .sprint,
    ).toEqual(["AB-3", "AB-1", "AB-2"]);
    expect(
      planningReducer(base, { type: "move_in_sprint", id: "AB-1", toIndex: 99 })
        .sprint,
    ).toEqual(["AB-2", "AB-3", "AB-1"]);
    expect(
      planningReducer(base, { type: "remove_from_sprint", id: "AB-2" }).sprint,
    ).toEqual(["AB-1", "AB-3"]);
    expect(
      planningReducer(base, { type: "move_in_sprint", id: "AB-9", toIndex: 0 }),
    ).toBe(base);
    expect(planningReducer(base, { type: "clear_sprint" }).sprint).toEqual([]);
  });

  it("takes a marked ticket out of the sprint and keeps it out", () => {
    const state = run(
      { type: "set_sprint", ids: ["AB-1", "AB-2"] },
      {
        type: "mark",
        id: "AB-2",
        mark: { kind: "duplicate", duplicateOfId: "AB-1" },
      },
      { type: "add_to_sprint", id: "AB-2" },
    );
    expect(state.sprint).toEqual(["AB-1"]);
    expect(state.marks["AB-2"]).toEqual({
      kind: "duplicate",
      duplicateOfId: "AB-1",
    });

    const restored = planningReducer(state, { type: "unmark", id: "AB-2" });
    expect(restored.marks).toEqual({});
    expect(
      planningReducer(restored, { type: "add_to_sprint", id: "AB-2" }).sprint,
    ).toEqual(["AB-1", "AB-2"]);
  });

  it("does not let a ticket duplicate itself", () => {
    const state = run({
      type: "mark",
      id: "AB-1",
      mark: { kind: "duplicate", duplicateOfId: "AB-1" },
    });
    expect(state).toBe(initialPlanningState);
  });

  it("skips marked and repeated tickets when a sprint is set in bulk", () => {
    const state = run(
      {
        type: "mark",
        id: "AB-3",
        mark: { kind: "discard", reason: "no_evidence" },
      },
      { type: "set_sprint", ids: ["AB-1", "AB-3", "AB-1", "AB-2"] },
    );
    expect(state.sprint).toEqual(["AB-1", "AB-2"]);
  });

  it("stores and clears RICE and MoSCoW inputs", () => {
    const state = run(
      { type: "set_rice", id: "AB-1", input: { reach: 2 } },
      { type: "set_moscow", id: "AB-1", bucket: "must" },
      { type: "set_method", method: "rice" },
    );
    expect(state.rice).toEqual({ "AB-1": { reach: 2 } });
    expect(state.moscow).toEqual({ "AB-1": "must" });
    expect(state.method).toBe("rice");

    const cleared = [
      { type: "set_rice", id: "AB-1", input: {} },
      { type: "set_moscow", id: "AB-1", bucket: null },
    ].reduce(
      (current, action) => planningReducer(current, action as PlanningAction),
      state,
    );
    expect(cleared.rice).toEqual({});
    expect(cleared.moscow).toEqual({});
  });

  it("never mutates the previous state", () => {
    const before = run({ type: "set_sprint", ids: ["AB-1", "AB-2"] });
    const snapshot = structuredClone(before);
    planningReducer(before, { type: "move_in_sprint", id: "AB-2", toIndex: 0 });
    planningReducer(before, {
      type: "mark",
      id: "AB-1",
      mark: { kind: "discard", reason: "not_now" },
    });
    expect(before).toEqual(snapshot);
  });
});

describe("sanitizePlanningState", () => {
  it("drops everything that refers to tickets the case does not have", () => {
    const saved = planningStateSchema.parse({
      method: "moscow",
      sprint: ["AB-1", "ZZ-9", "AB-1", "AB-3"],
      marks: {
        "AB-3": { kind: "discard", reason: "not_now" },
        "AB-2": { kind: "duplicate", duplicateOfId: "ZZ-9" },
        "ZZ-8": { kind: "discard", reason: "not_now" },
      },
      rice: { "AB-1": { reach: 1 }, "ZZ-9": { reach: 1 } },
      moscow: { "AB-2": "must", "ZZ-9": "wont" },
    });
    const clean = sanitizePlanningState(
      saved,
      new Set(["AB-1", "AB-2", "AB-3"]),
    );
    expect(clean).toEqual({
      method: "moscow",
      sprint: ["AB-1"],
      marks: { "AB-3": { kind: "discard", reason: "not_now" } },
      rice: { "AB-1": { reach: 1 } },
      moscow: { "AB-2": "must" },
    });
  });

  it("rejects a draft that is not a planning state", () => {
    expect(planningStateSchema.safeParse({ sprint: "AB-1" }).success).toBe(
      false,
    );
  });
});

describe("planning draft", () => {
  const event = {
    id: "event-1",
    type: "production_outage" as const,
    title: "Outage",
    description: "Something broke.",
    capacityDelta: -4,
    addedTicket: {
      id: "AB-9",
      title: "Hotfix",
      description: "Fix it.",
      type: "bug" as const,
      requester: "Eng – Test",
      stakeholderId: "engineering",
      effort: 3,
      visible: {},
    },
  };
  const backlog = new Set(["AB-1", "AB-2", "AB-3"]);

  it("knows the tickets and capacity events bring", () => {
    expect(addedTickets([event]).map((t) => t.id)).toEqual(["AB-9"]);
    expect(
      capacityAfterEvents(20, [event, { ...event, capacityDelta: -6 }]),
    ).toBe(10);
    expect(capacityAfterEvents(3, [event])).toBe(0);
  });

  it("keeps added tickets once the sprint is committed", () => {
    const draft = planningDraftSchema.parse({
      planning: {
        ...initialPlanningState,
        sprint: ["AB-1", "AB-9", "ZZ-1"],
      },
      committed: { sprint: ["AB-1", "ZZ-1"], events: [event] },
    });
    const clean = sanitizePlanningDraft(draft, backlog);
    expect(clean.planning.sprint).toEqual(["AB-1", "AB-9"]);
    expect(clean.committed?.sprint).toEqual(["AB-1"]);
  });

  it("drops added tickets and a broken commit when the sprint has not started", () => {
    const notCommitted = sanitizePlanningDraft(
      planningDraftSchema.parse({
        planning: { ...initialPlanningState, sprint: ["AB-1", "AB-9"] },
      }),
      backlog,
    );
    expect(notCommitted.planning.sprint).toEqual(["AB-1"]);

    const broken = sanitizePlanningDraft(
      planningDraftSchema.parse({
        planning: { ...initialPlanningState, sprint: ["AB-9"] },
        committed: { sprint: ["ZZ-1"], events: [event] },
      }),
      backlog,
    );
    expect(broken.committed).toBeUndefined();
    expect(broken.planning.sprint).toEqual([]);
  });

  it("resets to an empty plan", () => {
    const state = run(
      { type: "add_to_sprint", id: "AB-1" },
      { type: "set_method", method: "rice" },
      { type: "reset" },
    );
    expect(state).toEqual(initialPlanningState);
  });
});
