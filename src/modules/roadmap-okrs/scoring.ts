/**
 * Deterministic score of a quarterly plan.
 *
 * - Key results: quality of the two chosen per objective.
 * - Value: what the roadmap really ships against the best possible roadmap.
 * - Coverage: every company objective gets something shipped.
 * - Dependencies: scheduled work whose dependencies ship first.
 * - Focus: share of the booked sprints that ship work an objective needs.
 */
import { z } from "zod";

import { buildScoreResult, safeRatio, scoreResultSchema } from "@/core/scoring";

import { optimalPlan } from "./optimal";
import { evaluatePlan } from "./planning";
import {
  MAX_KEY_RESULTS_PER_OBJECTIVE,
  placementSchema,
  type RoadmapAnswer,
  type RoadmapCase,
} from "./schema";

export const ROADMAP_WEIGHTS = {
  keyResults: 25,
  value: 35,
  coverage: 10,
  dependencies: 15,
  focus: 15,
} as const;

const MAX_RATING = 2;

export const roadmapReportSchema = z.object({
  keyResults: z.array(
    z.object({
      id: z.string(),
      objectiveId: z.string(),
      rating: z.number(),
      picked: z.boolean(),
    }),
  ),
  initiatives: z.array(
    z.object({
      id: z.string(),
      objectiveId: z.string().nullable(),
      value: z.number(),
      startSprint: z.number().nullable(),
      status: z.enum(["ok", "overflow", "overlap", "blocked", "unscheduled"]),
      optimalStart: z.number().nullable(),
    }),
  ),
  deliveredValue: z.number(),
  optimalValue: z.number(),
  coveredObjectiveIds: z.array(z.string()),
  optimalSchedule: z.array(placementSchema),
});
export type RoadmapReport = z.infer<typeof roadmapReportSchema>;

export const roadmapResultSchema = scoreResultSchema.extend({
  report: roadmapReportSchema,
});
export type RoadmapResult = ReturnType<typeof scoreRoadmap>;

export function scoreRoadmap(caseData: RoadmapCase, answer: RoadmapAnswer) {
  const { hidden } = caseData;
  const truth = new Map(hidden.initiatives.map((i) => [i.id, i]));
  const rating = new Map(hidden.keyResults.map((k) => [k.id, k.rating]));

  // Key results: the first two picked per objective count.
  const pickedIds = new Set<string>();
  let keyResultPoints = 0;
  for (const objective of caseData.objectives) {
    const picks = caseData.keyResults
      .filter(
        (k) =>
          k.objectiveId === objective.id && answer.keyResultIds.includes(k.id),
      )
      .sort(
        (a, b) =>
          answer.keyResultIds.indexOf(a.id) - answer.keyResultIds.indexOf(b.id),
      )
      .slice(0, MAX_KEY_RESULTS_PER_OBJECTIVE);
    for (const pick of picks) {
      pickedIds.add(pick.id);
      keyResultPoints += rating.get(pick.id) ?? 0;
    }
  }
  const keyResultMax =
    caseData.objectives.length * MAX_KEY_RESULTS_PER_OBJECTIVE * MAX_RATING;

  // The roadmap.
  const known = answer.schedule.filter((p) => truth.has(p.initiativeId));
  const plan = evaluatePlan(caseData.initiatives, known);
  const delivered = new Set(plan.deliveredIds);
  const optimal = optimalPlan(caseData);
  const deliveredValue = plan.deliveredIds.reduce(
    (total, id) => total + truth.get(id)!.value,
    0,
  );
  const coveredObjectiveIds = caseData.objectives
    .filter((objective) =>
      hidden.initiatives.some(
        (i) =>
          i.objectiveId === objective.id && i.value > 0 && delivered.has(i.id),
      ),
    )
    .map((objective) => objective.id);

  const withDependencies = plan.items.filter(
    (item) =>
      caseData.initiatives.find((i) => i.id === item.initiativeId)!.dependsOn
        .length > 0,
  );
  const dependenciesMet = withDependencies.filter(
    (item) => item.blockedBy.length === 0,
  ).length;

  const sprintsOf = (id: string) =>
    caseData.initiatives.find((i) => i.id === id)!.effort;
  const bookedSprints = plan.items.reduce(
    (total, item) => total + sprintsOf(item.initiativeId),
    0,
  );
  const usefulSprints = plan.items
    .filter(
      (item) =>
        item.status === "ok" &&
        truth.get(item.initiativeId)!.objectiveId !== null,
    )
    .reduce((total, item) => total + sprintsOf(item.initiativeId), 0);

  const startOf = new Map(known.map((p) => [p.initiativeId, p.startSprint]));
  const optimalStart = new Map(
    optimal.schedule.map((p) => [p.initiativeId, p.startSprint]),
  );
  const statusOf = new Map(plan.items.map((i) => [i.initiativeId, i.status]));
  const report: RoadmapReport = {
    keyResults: caseData.keyResults.map((k) => ({
      id: k.id,
      objectiveId: k.objectiveId,
      rating: rating.get(k.id) ?? 0,
      picked: pickedIds.has(k.id),
    })),
    initiatives: caseData.initiatives.map((i) => ({
      id: i.id,
      objectiveId: truth.get(i.id)!.objectiveId,
      value: truth.get(i.id)!.value,
      startSprint: startOf.get(i.id) ?? null,
      status: statusOf.get(i.id) ?? "unscheduled",
      optimalStart: optimalStart.get(i.id) ?? null,
    })),
    deliveredValue,
    optimalValue: optimal.value,
    coveredObjectiveIds,
    optimalSchedule: optimal.schedule,
  };

  const empty = plan.items.length === 0;
  const score = buildScoreResult([
    {
      id: "keyResults",
      label: "Key results",
      weight: ROADMAP_WEIGHTS.keyResults,
      ratio: safeRatio(keyResultPoints, keyResultMax, 0),
      detail: `${keyResultPoints} of ${keyResultMax} points: measurable outcomes score 2, activity 1, outputs and vague goals 0`,
    },
    {
      id: "value",
      label: "Value shipped",
      weight: ROADMAP_WEIGHTS.value,
      ratio: safeRatio(deliveredValue, optimal.value, 0),
      detail: `Your roadmap ships ${deliveredValue} points of value; the best roadmap ships ${optimal.value}`,
    },
    {
      id: "coverage",
      label: "Objectives covered",
      weight: ROADMAP_WEIGHTS.coverage,
      ratio: safeRatio(
        coveredObjectiveIds.length,
        caseData.objectives.length,
        0,
      ),
      detail: `${coveredObjectiveIds.length} of ${caseData.objectives.length} objectives get work that ships`,
    },
    {
      id: "dependencies",
      label: "Dependencies respected",
      weight: ROADMAP_WEIGHTS.dependencies,
      ratio: empty ? 0 : safeRatio(dependenciesMet, withDependencies.length, 1),
      detail: empty
        ? "Nothing was scheduled"
        : `${dependenciesMet} of ${withDependencies.length} dependent initiatives start after what they need`,
    },
    {
      id: "focus",
      label: "Focus and capacity",
      weight: ROADMAP_WEIGHTS.focus,
      ratio: safeRatio(usefulSprints, bookedSprints, 0),
      detail: `${usefulSprints} of ${bookedSprints} booked sprints ship work an objective needs`,
    },
  ]);
  return { ...score, report };
}
