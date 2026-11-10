/**
 * Data model of UX Critique.
 *
 * A case is a screen built from a template: every region is drawn from
 * plain visual props, some of them deliberately flawed. Which regions are
 * flawed, and how, is the hidden ground truth.
 */
import { z } from "zod";

import { baseCaseSchema, publicBaseCaseSchema } from "@/core/case-engine";

export const UX_CRITIQUE_MODULE_ID = "ux-critique";

export const ISSUE_TYPES = [
  "contrast",
  "hierarchy",
  "cta",
  "long_form",
  "feedback",
  "labels",
  "destructive",
  "copy",
] as const;
export const issueTypeSchema = z.enum(ISSUE_TYPES);
export type IssueType = z.infer<typeof issueTypeSchema>;

export const TEMPLATES = ["signup", "checkout", "settings"] as const;
export const templateSchema = z.enum(TEMPLATES);
export type TemplateKey = z.infer<typeof templateSchema>;

export const regionIdSchema = z.string().regex(/^[a-z][a-z_]*$/);

/** Visual props of a region. Each template's renderer reads its own keys. */
export const regionPropsSchema = z.record(z.string(), z.unknown());
export type RegionProps = z.infer<typeof regionPropsSchema>;

const sharedShape = {
  moduleId: z.literal(UX_CRITIQUE_MODULE_ID),
  screen: z.object({
    template: templateSchema,
    product: z.object({
      name: z.string().min(1),
      /** Brand color for primary actions, as #rrggbb. */
      accent: z.string().regex(/^#[0-9a-f]{6}$/),
    }),
    /** Regions in reading order. */
    regions: z
      .array(
        z.object({
          id: regionIdSchema,
          /** What the learner calls this part of the screen. */
          label: z.string().min(1),
          props: regionPropsSchema,
        }),
      )
      .min(4)
      .max(12),
  }),
  /** What the screen is for, so the learner can judge it. */
  userGoal: z.string().min(1),
};

export const plantedIssueSchema = z.object({
  regionId: regionIdSchema,
  type: issueTypeSchema,
  explanation: z.string().min(1),
  fix: z.string().min(1),
});
export type PlantedIssue = z.infer<typeof plantedIssueSchema>;

export const uxCritiqueCaseSchema = baseCaseSchema
  .extend({
    ...sharedShape,
    hidden: z.object({
      issues: z.array(plantedIssueSchema).min(2).max(6),
      principle: z.string().min(1),
    }),
  })
  .superRefine((caseData, context) => {
    const regionIds = caseData.screen.regions.map((region) => region.id);
    if (new Set(regionIds).size !== regionIds.length) {
      context.addIssue({ code: "custom", message: "Region ids repeat" });
    }
    const flawed = caseData.hidden.issues.map((issue) => issue.regionId);
    if (new Set(flawed).size !== flawed.length) {
      context.addIssue({
        code: "custom",
        message: "A region has more than one planted issue",
      });
    }
    for (const id of flawed) {
      if (!regionIds.includes(id)) {
        context.addIssue({
          code: "custom",
          message: `Unknown region "${id}"`,
        });
      }
    }
  });
export type UxCritiqueCase = z.infer<typeof uxCritiqueCaseSchema>;

export const publicUxCritiqueCaseSchema =
  publicBaseCaseSchema.extend(sharedShape);
export type PublicUxCritiqueCase = z.infer<typeof publicUxCritiqueCaseSchema>;

export const MAX_FINDINGS = 20;

export const findingSchema = z.object({
  regionId: regionIdSchema,
  type: issueTypeSchema,
  /** What the learner saw; read by the AI coach, never scored. */
  note: z.string().max(400).default(""),
});
export type Finding = z.infer<typeof findingSchema>;

export const uxCritiqueAnswerSchema = z.object({
  findings: z.array(findingSchema).max(MAX_FINDINGS),
});
export type UxCritiqueAnswer = z.infer<typeof uxCritiqueAnswerSchema>;
