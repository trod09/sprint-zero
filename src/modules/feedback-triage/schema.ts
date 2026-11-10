/**
 * Data model of Feedback Triage.
 *
 * A case is an inbox of app reviews, support tickets and NPS comments. Every
 * item secretly belongs to a theme (or is noise); one theme is a critical
 * problem hiding in a handful of items. The learner sees only the items.
 */
import { z } from "zod";

import { baseCaseSchema, publicBaseCaseSchema } from "@/core/case-engine";

export const FEEDBACK_TRIAGE_MODULE_ID = "feedback-triage";

export const SOURCES = ["app_review", "support", "nps"] as const;
export const sourceSchema = z.enum(SOURCES);
export type Source = z.infer<typeof sourceSchema>;

export const SEVERITIES = ["low", "medium", "high", "critical"] as const;
export const severitySchema = z.enum(SEVERITIES);
export type Severity = z.infer<typeof severitySchema>;

export const itemIdSchema = z.string().regex(/^FB-\d{3}$/);

export const feedbackItemSchema = z.object({
  id: itemIdSchema,
  source: sourceSchema,
  date: z.iso.date(),
  /** App store stars, for app reviews. */
  rating: z.number().int().min(1).max(5).optional(),
  /** 0-10, for NPS comments. */
  npsScore: z.number().int().min(0).max(10).optional(),
  /** Customer plan, for support tickets. */
  plan: z.string().min(1).optional(),
  text: z.string().min(1).max(400),
});
export type FeedbackItem = z.infer<typeof feedbackItemSchema>;

export const themeTruthSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  severity: severitySchema,
  itemIds: z.array(itemIdSchema).min(1),
  summary: z.string().min(1),
  opportunity: z.string().min(1),
});
export type ThemeTruth = z.infer<typeof themeTruthSchema>;

const sharedShape = {
  moduleId: z.literal(FEEDBACK_TRIAGE_MODULE_ID),
  period: z.object({ from: z.iso.date(), to: z.iso.date() }),
  items: z.array(feedbackItemSchema).min(30).max(90),
};

export const feedbackTriageCaseSchema = baseCaseSchema
  .extend({
    ...sharedShape,
    hidden: z.object({
      /** Most important first: the critical theme, then by impact. */
      themes: z.array(themeTruthSchema).min(4).max(10),
      noiseItemIds: z.array(itemIdSchema),
      /** Why the ranking is what it is. */
      explanation: z.string().min(1),
      principle: z.string().min(1),
    }),
  })
  .superRefine((caseData, context) => {
    const ids = caseData.items.map((item) => item.id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: "custom", message: "Item ids repeat" });
    }
    const texts = caseData.items.map((item) => item.text);
    if (new Set(texts).size !== texts.length) {
      context.addIssue({ code: "custom", message: "Item texts repeat" });
    }
    const assigned = [
      ...caseData.hidden.themes.flatMap((theme) => theme.itemIds),
      ...caseData.hidden.noiseItemIds,
    ];
    if (
      assigned.length !== ids.length ||
      new Set(assigned).size !== ids.length ||
      assigned.some((id) => !ids.includes(id))
    ) {
      context.addIssue({
        code: "custom",
        message: "Every item must belong to exactly one theme or to noise",
      });
    }
    const critical = caseData.hidden.themes.filter(
      (theme) => theme.severity === "critical",
    );
    if (critical.length !== 1 || caseData.hidden.themes[0] !== critical[0]) {
      context.addIssue({
        code: "custom",
        message: "There must be one critical theme, ranked first",
      });
    }
  });
export type FeedbackTriageCase = z.infer<typeof feedbackTriageCaseSchema>;

export const publicFeedbackTriageCaseSchema =
  publicBaseCaseSchema.extend(sharedShape);
export type PublicFeedbackTriageCase = z.infer<
  typeof publicFeedbackTriageCaseSchema
>;

export const MAX_CLUSTERS = 12;

export const clusterSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().trim().min(1).max(60),
  itemIds: z.array(itemIdSchema).max(90),
  /** The opportunity the learner wrote; read by the AI coach, never scored. */
  opportunity: z.string().max(600).default(""),
});
export type Cluster = z.infer<typeof clusterSchema>;

export const feedbackTriageAnswerSchema = z
  .object({
    /** In priority order: the first cluster matters most. */
    clusters: z.array(clusterSchema).min(1).max(MAX_CLUSTERS),
    criticalClusterId: z.string().min(1).max(40).nullable(),
    noiseItemIds: z.array(itemIdSchema).max(90).default([]),
  })
  .superRefine((answer, context) => {
    const clusterIds = answer.clusters.map((cluster) => cluster.id);
    if (new Set(clusterIds).size !== clusterIds.length) {
      context.addIssue({ code: "custom", message: "Cluster ids repeat" });
    }
    const placed = [
      ...answer.clusters.flatMap((cluster) => cluster.itemIds),
      ...answer.noiseItemIds,
    ];
    if (new Set(placed).size !== placed.length) {
      context.addIssue({
        code: "custom",
        message: "An item is in more than one place",
      });
    }
    if (
      answer.criticalClusterId !== null &&
      !clusterIds.includes(answer.criticalClusterId)
    ) {
      context.addIssue({
        code: "custom",
        message: "The critical cluster does not exist",
      });
    }
  });
export type FeedbackTriageAnswer = z.infer<typeof feedbackTriageAnswerSchema>;
