/**
 * The rules of the timeline, shared by the board and the scoring. Nothing
 * here knows the ground truth: a team works on one initiative at a time, the
 * quarter has six sprints, and an initiative cannot start before everything
 * it depends on is finished.
 */
import { SPRINTS, type Initiative, type Placement } from "./schema";

export type PlacementStatus = "ok" | "overflow" | "overlap" | "blocked";

export interface PlannedItem {
  initiativeId: string;
  teamId: string;
  startSprint: number;
  /** Last sprint it occupies. */
  endSprint: number;
  status: PlacementStatus;
  /** Dependencies that are missing, late or not delivered themselves. */
  blockedBy: string[];
}

export interface PlanEvaluation {
  items: PlannedItem[];
  /** Initiatives that really ship this quarter. */
  deliveredIds: string[];
  /** Sprints each team has booked, overlaps included. */
  sprintsUsed: Record<string, number>;
}

export function evaluatePlan(
  initiatives: readonly Initiative[],
  schedule: readonly Placement[],
): PlanEvaluation {
  const byId = new Map(initiatives.map((i) => [i.id, i]));
  const items: PlannedItem[] = [];
  for (const placement of schedule) {
    const initiative = byId.get(placement.initiativeId);
    if (!initiative) continue;
    items.push({
      initiativeId: initiative.id,
      teamId: initiative.teamId,
      startSprint: placement.startSprint,
      endSprint: placement.startSprint + initiative.effort - 1,
      status: "ok",
      blockedBy: [],
    });
  }

  for (const item of items) {
    if (item.endSprint > SPRINTS) item.status = "overflow";
  }
  // Within a team the initiative that starts first keeps its slot.
  const ordered = [...items].sort(
    (a, b) =>
      a.startSprint - b.startSprint || items.indexOf(a) - items.indexOf(b),
  );
  const busyUntil = new Map<string, number>();
  for (const item of ordered) {
    const busy = busyUntil.get(item.teamId) ?? 0;
    if (item.startSprint <= busy) {
      if (item.status === "ok") item.status = "overlap";
      continue;
    }
    busyUntil.set(item.teamId, Math.min(item.endSprint, SPRINTS));
  }

  // A dependency counts only if it ships, and ships before this one starts.
  const planned = new Map(items.map((item) => [item.initiativeId, item]));
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of items) {
      const blockedBy = byId
        .get(item.initiativeId)!
        .dependsOn.filter((dependencyId) => {
          const dependency = planned.get(dependencyId);
          return (
            !dependency ||
            dependency.status !== "ok" ||
            dependency.endSprint >= item.startSprint
          );
        });
      if (blockedBy.join() !== item.blockedBy.join()) {
        item.blockedBy = blockedBy;
        changed = true;
      }
      if (blockedBy.length > 0 && item.status === "ok") {
        item.status = "blocked";
        changed = true;
      }
    }
  }

  const sprintsUsed: Record<string, number> = {};
  for (const item of items) {
    sprintsUsed[item.teamId] =
      (sprintsUsed[item.teamId] ?? 0) +
      (Math.min(item.endSprint, SPRINTS) - item.startSprint + 1);
  }
  return {
    items,
    deliveredIds: items
      .filter((item) => item.status === "ok")
      .map((item) => item.initiativeId),
    sprintsUsed,
  };
}

/** The first sprint where the initiative fits after its team's other work. */
export function nextFreeSprint(
  initiatives: readonly Initiative[],
  schedule: readonly Placement[],
  initiativeId: string,
): number {
  const initiative = initiatives.find((i) => i.id === initiativeId);
  if (!initiative) return 1;
  const others = evaluatePlan(
    initiatives,
    schedule.filter((p) => p.initiativeId !== initiativeId),
  ).items;
  const teamEnd = Math.max(
    0,
    ...others
      .filter((item) => item.teamId === initiative.teamId)
      .map((item) => item.endSprint),
  );
  const dependencyEnd = Math.max(
    0,
    ...others
      .filter((item) => initiative.dependsOn.includes(item.initiativeId))
      .map((item) => item.endSprint),
  );
  return Math.min(SPRINTS, Math.max(teamEnd, dependencyEnd) + 1);
}
