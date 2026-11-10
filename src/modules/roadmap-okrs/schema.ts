/**
 * Roadmap & OKRs: company objectives for a quarter, teams with one track of
 * six sprints each, and more initiatives than fit. The learner picks key
 * results and lays the initiatives on a timeline.
 *
 * Ground truth is how good each key result is, which objective each
 * initiative really serves and how much it is worth.
 */
import { z } from "zod";

import { baseCaseSchema, publicBaseCaseSchema } from "@/core/case-engine";

export const ROADMAP_MODULE_ID = "roadmap-okrs";

/** A quarter of two-week sprints. */
export const SPRINTS = 6;
export const MAX_KEY_RESULTS_PER_OBJECTIVE = 2;
export const MAX_TEXT = 1200;

const idSchema = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9_]+$/);

const objectiveSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  /** The company goal as leadership stated it, with its number. */
  description: z.string().min(1),
});

const keyResultSchema = z.object({
  id: idSchema,
  objectiveId: idSchema,
  text: z.string().min(1),
});

const teamSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  focus: z.string().min(1),
});

const initiativeSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  teamId: idSchema,
  /** Sprints of the team's single track. */
  effort: z.number().int().min(1).max(SPRINTS),
  /** Initiatives that must be finished before this one starts. */
  dependsOn: z.array(idSchema).max(3),
  requester: z.string().min(1),
});
export type Initiative = z.infer<typeof initiativeSchema>;

const sharedShape = {
  moduleId: z.literal(ROADMAP_MODULE_ID),
  quarter: z.string().min(1),
  objectives: z.array(objectiveSchema).min(2).max(4),
  keyResults: z.array(keyResultSchema).min(6).max(24),
  teams: z.array(teamSchema).min(2).max(3),
  initiatives: z.array(initiativeSchema).min(6).max(12),
};

const unique = (ids: string[]) => new Set(ids).size === ids.length;

export const roadmapCaseSchema = baseCaseSchema
  .extend({
    ...sharedShape,
    hidden: z.object({
      keyResults: z.array(
        z.object({
          id: idSchema,
          /** 2 measurable outcome, 1 weak, 0 output, vanity or vague. */
          rating: z.number().int().min(0).max(2),
          why: z.string().min(1),
        }),
      ),
      initiatives: z.array(
        z.object({
          id: idSchema,
          /** The objective it moves, or `null` for work no objective needs. */
          objectiveId: idSchema.nullable(),
          value: z.number().int().min(0).max(100),
          why: z.string().min(1),
        }),
      ),
      principle: z.string().min(1),
    }),
  })
  .superRefine((caseData, context) => {
    const issue = (message: string) =>
      context.addIssue({ code: "custom", message });
    const objectiveIds = caseData.objectives.map((o) => o.id);
    const teamIds = caseData.teams.map((t) => t.id);
    const initiativeIds = caseData.initiatives.map((i) => i.id);
    const keyResultIds = caseData.keyResults.map((k) => k.id);
    if (![objectiveIds, teamIds, initiativeIds, keyResultIds].every(unique)) {
      issue("Ids repeat");
    }
    for (const keyResult of caseData.keyResults) {
      if (!objectiveIds.includes(keyResult.objectiveId)) {
        issue(`Key result "${keyResult.id}" has an unknown objective`);
      }
    }
    for (const initiative of caseData.initiatives) {
      if (!teamIds.includes(initiative.teamId)) {
        issue(`Initiative "${initiative.id}" has an unknown team`);
      }
      for (const dependency of initiative.dependsOn) {
        if (
          !initiativeIds.includes(dependency) ||
          dependency === initiative.id
        ) {
          issue(`Initiative "${initiative.id}" has a bad dependency`);
        }
      }
    }
    for (const teamId of teamIds) {
      const count = caseData.initiatives.filter(
        (i) => i.teamId === teamId,
      ).length;
      // The optimal plan is found by exhaustive search; keep it small.
      if (count > 4) issue(`Team "${teamId}" has more than 4 initiatives`);
    }
    const same = (a: string[], b: string[]) =>
      [...a].sort().join() === [...b].sort().join();
    if (
      !same(
        keyResultIds,
        caseData.hidden.keyResults.map((k) => k.id),
      )
    ) {
      issue("Hidden key results do not match the public ones");
    }
    if (
      !same(
        initiativeIds,
        caseData.hidden.initiatives.map((i) => i.id),
      )
    ) {
      issue("Hidden initiatives do not match the public ones");
    }
    for (const initiative of caseData.hidden.initiatives) {
      if (
        initiative.objectiveId !== null &&
        !objectiveIds.includes(initiative.objectiveId)
      ) {
        issue(`Initiative "${initiative.id}" serves an unknown objective`);
      }
    }
  });
export type RoadmapCase = z.infer<typeof roadmapCaseSchema>;

export const publicRoadmapCaseSchema = publicBaseCaseSchema.extend(sharedShape);
export type PublicRoadmapCase = z.infer<typeof publicRoadmapCaseSchema>;

export const placementSchema = z.object({
  initiativeId: idSchema,
  /** First sprint, from 1. */
  startSprint: z.number().int().min(1).max(SPRINTS),
});
export type Placement = z.infer<typeof placementSchema>;

export const roadmapAnswerSchema = z.object({
  keyResultIds: z.array(idSchema).max(24),
  schedule: z
    .array(placementSchema)
    .max(12)
    .refine(
      (schedule) => unique(schedule.map((p) => p.initiativeId)),
      "An initiative is scheduled twice",
    ),
  /** Why this plan: read by the AI coach, never scored. */
  rationale: z.string().max(MAX_TEXT).default(""),
  /** What the learner tells stakeholders whose work was left out. */
  tradeoffs: z.string().max(MAX_TEXT).default(""),
});
export type RoadmapAnswer = z.infer<typeof roadmapAnswerSchema>;
