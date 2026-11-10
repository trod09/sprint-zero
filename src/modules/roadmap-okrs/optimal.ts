/**
 * The best roadmap for a case: the schedule that ships the most value this
 * quarter. Teams are small (four initiatives at most), so every order of
 * every subset is tried, each packed as early as its dependencies allow.
 */
import { SPRINTS, type Placement, type RoadmapCase } from "./schema";

export interface OptimalPlan {
  schedule: Placement[];
  value: number;
}

/** Every ordered selection of the items: [], [a], [b], [a,b], [b,a]... */
function orderedSubsets<T>(items: readonly T[]): T[][] {
  const result: T[][] = [[]];
  const extend = (prefix: T[], rest: readonly T[]) => {
    rest.forEach((item, index) => {
      const next = [...prefix, item];
      result.push(next);
      extend(next, [...rest.slice(0, index), ...rest.slice(index + 1)]);
    });
  };
  extend([], items);
  return result;
}

const cache = new WeakMap<RoadmapCase, OptimalPlan>();

export function optimalPlan(caseData: RoadmapCase): OptimalPlan {
  const cached = cache.get(caseData);
  if (cached) return cached;

  const value = new Map(
    caseData.hidden.initiatives.map((i) => [i.id, i.value]),
  );
  const byId = new Map(caseData.initiatives.map((i) => [i.id, i]));
  const queuesPerTeam = caseData.teams.map((team) =>
    orderedSubsets(
      caseData.initiatives.filter((i) => i.teamId === team.id).map((i) => i.id),
    ),
  );

  let best: OptimalPlan = { schedule: [], value: 0 };
  let bestSprints = 0;
  const queues: string[][] = [];

  const evaluate = () => {
    const end = new Map<string, number>();
    const schedule: Placement[] = [];
    const next = queues.map(() => 0);
    const free = queues.map(() => 1);
    let remaining = queues.reduce((total, queue) => total + queue.length, 0);
    let total = 0;
    let sprints = 0;
    while (remaining > 0) {
      let progressed = false;
      for (let team = 0; team < queues.length; team++) {
        const id = queues[team][next[team]];
        if (id === undefined) continue;
        const initiative = byId.get(id)!;
        let start = free[team];
        let ready = true;
        for (const dependency of initiative.dependsOn) {
          const dependencyEnd = end.get(dependency);
          if (dependencyEnd === undefined) {
            ready = false;
            break;
          }
          start = Math.max(start, dependencyEnd + 1);
        }
        if (!ready) continue;
        const finish = start + initiative.effort - 1;
        if (finish > SPRINTS) return;
        end.set(id, finish);
        free[team] = finish + 1;
        next[team]++;
        remaining--;
        progressed = true;
        total += value.get(id) ?? 0;
        sprints += initiative.effort;
        schedule.push({ initiativeId: id, startSprint: start });
      }
      // A dependency that is not in the plan, or a cycle.
      if (!progressed) return;
    }
    // Same value: prefer the plan that keeps more of the quarter free.
    if (total > best.value || (total === best.value && sprints < bestSprints)) {
      best = { schedule, value: total };
      bestSprints = sprints;
    }
  };

  const choose = (team: number) => {
    if (team === queuesPerTeam.length) return evaluate();
    for (const queue of queuesPerTeam[team]) {
      queues[team] = queue;
      choose(team + 1);
    }
  };
  choose(0);

  cache.set(caseData, best);
  return best;
}
