/**
 * Builds a Roadmap & OKRs case from a specification: the level decides which
 * initiatives and key results are on the table, and the seed nudges efforts
 * and values so that no two cases have the same best roadmap.
 */
import type { Difficulty } from "@/core/case-engine";
import { DIFFICULTIES } from "@/core/case-engine";
import { createRng } from "@/core/rng";

import type { RoadmapSpec } from "./content/specs";
import { optimalPlan } from "./optimal";
import { evaluatePlan } from "./planning";
import { roadmapCaseSchema, type RoadmapCase } from "./schema";

const MAX_TEAM_EFFORT = 4;
/** How many initiatives get a different effort than the specification. */
const EFFORT_CHANGES: Record<Difficulty, number> = { apm: 1, pm: 2, senior: 3 };
const ATTEMPTS = 24;

const levelIndex = (level: Difficulty) => DIFFICULTIES.indexOf(level);

/** Why the case is not a fair puzzle, or `null`. */
export function findRoadmapProblem(caseData: RoadmapCase): string | null {
  const { hidden } = caseData;
  for (const objective of caseData.objectives) {
    const ratings = caseData.keyResults
      .filter((k) => k.objectiveId === objective.id)
      .map((k) => hidden.keyResults.find((h) => h.id === k.id)!.rating);
    if (ratings.filter((rating) => rating === 2).length < 2) {
      return `objective "${objective.id}" has fewer than two good key results`;
    }
    if (!ratings.includes(0)) {
      return `objective "${objective.id}" has no bad key result to avoid`;
    }
  }

  const optimal = optimalPlan(caseData);
  if (optimal.value <= 0) return "nothing valuable fits in the quarter";
  const delivered = new Set(
    evaluatePlan(caseData.initiatives, optimal.schedule).deliveredIds,
  );
  if (delivered.size !== optimal.schedule.length) {
    return "the optimal plan breaks the planning rules";
  }
  for (const objective of caseData.objectives) {
    const served = hidden.initiatives.some(
      (i) =>
        i.objectiveId === objective.id && i.value > 0 && delivered.has(i.id),
    );
    if (!served) return `the best plan ignores objective "${objective.id}"`;
  }
  const valuable = hidden.initiatives.filter((i) => i.value > 0);
  if (
    caseData.difficulty !== "apm" &&
    valuable.every((i) => delivered.has(i.id))
  ) {
    return "everything valuable fits: there is no trade-off";
  }
  if (!hidden.initiatives.some((i) => i.objectiveId === null)) {
    return "there is no work to say no to";
  }
  const dependents = caseData.initiatives.filter(
    (i) => i.dependsOn.length > 0 && delivered.has(i.id),
  );
  if (dependents.length === 0) return "no dependency matters in the best plan";
  return null;
}

export interface RoadmapCaseOptions {
  spec: RoadmapSpec;
  id: string;
  seed: number;
  difficulty: Difficulty;
  title?: string;
}

/** `attempt` picks the seeded changes; `null` builds the specification as written. */
export function buildRoadmapCase(
  options: RoadmapCaseOptions,
  attempt: number | null,
): RoadmapCase {
  const { spec, seed, difficulty } = options;
  const rng = createRng(seed);
  const order = rng.fork("order");
  const included = spec.initiatives.filter(
    (i) => levelIndex(i.level) <= levelIndex(difficulty),
  );

  const effort = new Map(included.map((i) => [i.id, i.effort]));
  const value = new Map(included.map((i) => [i.id, i.value]));
  if (attempt !== null) {
    const jitter = rng.fork(`jitter-${attempt}`);
    for (const initiative of jitter.sample(
      included,
      Math.min(EFFORT_CHANGES[difficulty], included.length),
    )) {
      const next = initiative.effort + (jitter.bool() ? 1 : -1);
      effort.set(initiative.id, Math.min(MAX_TEAM_EFFORT, Math.max(1, next)));
    }
    for (const initiative of included) {
      if (initiative.value === 0) continue;
      value.set(
        initiative.id,
        Math.min(100, Math.max(5, initiative.value + jitter.int(-8, 8))),
      );
    }
  }

  // The easiest level shows one fewer bad key result per objective.
  const keyResults = spec.objectives.flatMap((objective) => {
    const candidates = spec.keyResults.filter(
      (k) => k.objectiveId === objective.id,
    );
    const hiddenAway =
      difficulty === "apm"
        ? order
            .fork(objective.id)
            .pick(candidates.filter((k) => k.rating === 0))
        : null;
    return order
      .fork(`kr-${objective.id}`)
      .shuffle(candidates.filter((k) => k !== hiddenAway));
  });
  const initiatives = order.fork("initiatives").shuffle(included);

  return roadmapCaseSchema.parse({
    id: options.id,
    moduleId: "roadmap-okrs",
    seed,
    difficulty,
    company: spec.company,
    title: options.title ?? spec.title,
    brief: spec.brief,
    quarter: "Next quarter",
    objectives: spec.objectives,
    keyResults: keyResults.map(({ id, objectiveId, text }) => ({
      id,
      objectiveId,
      text,
    })),
    teams: spec.teams,
    initiatives: initiatives.map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      teamId: i.teamId,
      effort: effort.get(i.id)!,
      dependsOn: i.dependsOn,
      requester: i.requester,
    })),
    hidden: {
      keyResults: keyResults.map(({ id, rating, why }) => ({
        id,
        rating,
        why,
      })),
      initiatives: initiatives.map((i) => ({
        id: i.id,
        objectiveId: i.objectiveId,
        value: value.get(i.id)!,
        why: i.why,
      })),
      principle: spec.principle,
    },
  });
}

export function generateRoadmapCase(options: RoadmapCaseOptions): RoadmapCase {
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const caseData = buildRoadmapCase(options, attempt);
    if (findRoadmapProblem(caseData) === null) return caseData;
  }
  // The specification as written is always a fair case (a test checks it).
  const caseData = buildRoadmapCase(options, null);
  const problem = findRoadmapProblem(caseData);
  if (problem) throw new Error(`Case "${options.id}": ${problem}`);
  return caseData;
}
