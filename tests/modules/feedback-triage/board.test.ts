import { describe, expect, it } from "vitest";

import {
  boardReducer,
  boardToAnswer,
  emptyBoard,
  NOISE,
  placements,
  sanitizeBoard,
  UNSORTED,
  type Board,
  type BoardAction,
} from "@/modules/feedback-triage/board";

const run = (actions: BoardAction[], start: Board = emptyBoard()) =>
  actions.reduce(boardReducer, start);

describe("triage board", () => {
  it("creates clusters with ids and moves items between places", () => {
    const board = run([
      { type: "create", name: " Login " },
      { type: "create", name: "Speed", itemIds: ["FB-001", "FB-002"] },
      { type: "move_items", itemIds: ["FB-001", "FB-003"], target: "c1" },
      { type: "move_items", itemIds: ["FB-004"], target: NOISE },
    ]);
    expect(board.clusters.map((c) => [c.id, c.name, c.itemIds])).toEqual([
      ["c1", "Login", ["FB-001", "FB-003"]],
      ["c2", "Speed", ["FB-002"]],
    ]);
    const where = placements(board);
    expect(where.get("FB-004")).toBe(NOISE);
    const back = run(
      [{ type: "move_items", itemIds: ["FB-004"], target: UNSORTED }],
      board,
    );
    expect(placements(back).has("FB-004")).toBe(false);
  });

  it("ignores empty names and unknown targets", () => {
    const board = run([{ type: "create", name: "   " }]);
    expect(board.clusters).toHaveLength(0);
    const same = run([
      { type: "move_items", itemIds: ["FB-001"], target: "c9" },
    ]);
    expect(same).toEqual(emptyBoard());
  });

  it("reorders clusters and keeps a single critical flag", () => {
    let board = run([
      { type: "create", name: "A" },
      { type: "create", name: "B" },
      { type: "toggle_critical", clusterId: "c1" },
      { type: "toggle_critical", clusterId: "c2" },
      { type: "move_cluster", clusterId: "c2", delta: -1 },
    ]);
    expect(board.clusters.map((c) => c.id)).toEqual(["c2", "c1"]);
    expect(board.criticalClusterId).toBe("c2");
    board = run([{ type: "move_cluster", clusterId: "c2", delta: -1 }], board);
    expect(board.clusters.map((c) => c.id)).toEqual(["c2", "c1"]);
    board = run([{ type: "remove", clusterId: "c2" }], board);
    expect(board.criticalClusterId).toBeNull();
  });

  it("builds the answer from non-empty clusters only", () => {
    const board = run([
      { type: "create", name: "A", itemIds: ["FB-001"] },
      { type: "create", name: "Empty" },
      { type: "toggle_critical", clusterId: "c2" },
      { type: "set_opportunity", clusterId: "c1", text: "  How might we?  " },
    ]);
    const answer = boardToAnswer(board)!;
    expect(answer.clusters.map((c) => c.id)).toEqual(["c1"]);
    expect(answer.clusters[0].opportunity).toBe("How might we?");
    expect(answer.criticalClusterId).toBeNull();
    expect(boardToAnswer(emptyBoard())).toBeNull();
  });

  it("drops unknown and duplicated items from a stored draft", () => {
    const board: Board = {
      clusters: [
        { id: "c1", name: "A", itemIds: ["FB-001", "FB-999"], opportunity: "" },
      ],
      noiseItemIds: ["FB-001", "FB-002"],
      criticalClusterId: "c7",
      nextId: 2,
    };
    const clean = sanitizeBoard(board, ["FB-001", "FB-002"]);
    expect(clean.clusters[0].itemIds).toEqual(["FB-001"]);
    expect(clean.noiseItemIds).toEqual(["FB-002"]);
    expect(clean.criticalClusterId).toBeNull();
  });
});
