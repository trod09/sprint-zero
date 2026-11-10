/**
 * The learner's triage board: clusters in priority order, the noise pile and
 * everything still unsorted. Pure and client-safe; the UI only dispatches
 * these actions.
 */
import { z } from "zod";

import {
  clusterSchema,
  itemIdSchema,
  MAX_CLUSTERS,
  type FeedbackTriageAnswer,
} from "./schema";

export const NOISE = "noise";
export const UNSORTED = "unsorted";
/** Where an item can be: a cluster id, the noise pile or unsorted. */
export type Target = string;

export const boardSchema = z.object({
  clusters: z.array(clusterSchema).max(MAX_CLUSTERS),
  noiseItemIds: z.array(itemIdSchema),
  criticalClusterId: z.string().nullable(),
  /** Next number for a new cluster id. */
  nextId: z.number().int().positive(),
});
export type Board = z.infer<typeof boardSchema>;

export const emptyBoard = (): Board => ({
  clusters: [],
  noiseItemIds: [],
  criticalClusterId: null,
  nextId: 1,
});

export type BoardAction =
  | { type: "create"; name: string; itemIds?: readonly string[] }
  | { type: "rename"; clusterId: string; name: string }
  | { type: "remove"; clusterId: string }
  | { type: "move_items"; itemIds: readonly string[]; target: Target }
  | { type: "move_cluster"; clusterId: string; delta: -1 | 1 }
  | { type: "toggle_critical"; clusterId: string }
  | { type: "set_opportunity"; clusterId: string; text: string }
  | { type: "reset" };

const without = (ids: readonly string[], removed: ReadonlySet<string>) =>
  ids.filter((id) => !removed.has(id));

function moveItems(
  board: Board,
  itemIds: readonly string[],
  target: Target,
): Board {
  const moving = new Set(itemIds);
  const clusters = board.clusters.map((cluster) => ({
    ...cluster,
    itemIds: without(cluster.itemIds, moving),
  }));
  let noiseItemIds = without(board.noiseItemIds, moving);
  if (target === NOISE) {
    noiseItemIds = [...noiseItemIds, ...itemIds];
  } else if (target !== UNSORTED) {
    const cluster = clusters.find((c) => c.id === target);
    if (!cluster) return board;
    cluster.itemIds = [...cluster.itemIds, ...itemIds];
  }
  return { ...board, clusters, noiseItemIds };
}

export function boardReducer(board: Board, action: BoardAction): Board {
  switch (action.type) {
    case "create": {
      const name = action.name.trim().slice(0, 60);
      if (!name || board.clusters.length >= MAX_CLUSTERS) return board;
      const id = `c${board.nextId}`;
      const created: Board = {
        ...board,
        nextId: board.nextId + 1,
        clusters: [
          ...board.clusters,
          { id, name, itemIds: [], opportunity: "" },
        ],
      };
      return action.itemIds && action.itemIds.length > 0
        ? moveItems(created, action.itemIds, id)
        : created;
    }
    case "rename": {
      const name = action.name.slice(0, 60);
      return {
        ...board,
        clusters: board.clusters.map((cluster) =>
          cluster.id === action.clusterId ? { ...cluster, name } : cluster,
        ),
      };
    }
    case "remove":
      return {
        ...board,
        clusters: board.clusters.filter((c) => c.id !== action.clusterId),
        criticalClusterId:
          board.criticalClusterId === action.clusterId
            ? null
            : board.criticalClusterId,
      };
    case "move_items":
      return moveItems(board, action.itemIds, action.target);
    case "move_cluster": {
      const index = board.clusters.findIndex((c) => c.id === action.clusterId);
      const next = index + action.delta;
      if (index === -1 || next < 0 || next >= board.clusters.length) {
        return board;
      }
      const clusters = [...board.clusters];
      [clusters[index], clusters[next]] = [clusters[next], clusters[index]];
      return { ...board, clusters };
    }
    case "toggle_critical":
      if (!board.clusters.some((c) => c.id === action.clusterId)) return board;
      return {
        ...board,
        criticalClusterId:
          board.criticalClusterId === action.clusterId
            ? null
            : action.clusterId,
      };
    case "set_opportunity":
      return {
        ...board,
        clusters: board.clusters.map((cluster) =>
          cluster.id === action.clusterId
            ? { ...cluster, opportunity: action.text.slice(0, 600) }
            : cluster,
        ),
      };
    case "reset":
      return emptyBoard();
  }
}

/** Where each item currently is. Items not listed are unsorted. */
export function placements(board: Board): Map<string, Target> {
  const where = new Map<string, Target>();
  for (const cluster of board.clusters) {
    for (const id of cluster.itemIds) where.set(id, cluster.id);
  }
  for (const id of board.noiseItemIds) where.set(id, NOISE);
  return where;
}

/**
 * Drops items the case does not have and any item placed twice, so a draft
 * from an older version of a case stays usable.
 */
export function sanitizeBoard(board: Board, itemIds: readonly string[]): Board {
  const known = new Set(itemIds);
  const seen = new Set<string>();
  const keep = (ids: readonly string[]) =>
    ids.filter((id) => {
      if (!known.has(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  const clusters = board.clusters.map((cluster) => ({
    ...cluster,
    itemIds: keep(cluster.itemIds),
  }));
  return {
    ...board,
    clusters,
    noiseItemIds: keep(board.noiseItemIds),
    criticalClusterId: clusters.some((c) => c.id === board.criticalClusterId)
      ? board.criticalClusterId
      : null,
  };
}

/** The answer to submit: named, non-empty clusters in their order. */
export function boardToAnswer(board: Board): FeedbackTriageAnswer | null {
  const clusters = board.clusters
    .filter((cluster) => cluster.itemIds.length > 0)
    .map((cluster) => ({
      ...cluster,
      name: cluster.name.trim() || "Untitled",
      opportunity: cluster.opportunity.trim(),
    }));
  if (clusters.length === 0) return null;
  return {
    clusters,
    criticalClusterId: clusters.some((c) => c.id === board.criticalClusterId)
      ? board.criticalClusterId
      : null,
    noiseItemIds: board.noiseItemIds,
  };
}
