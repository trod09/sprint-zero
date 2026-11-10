/**
 * Quick Cases: a short scenario with a few exhibits and three decisions.
 * Each decision is a choice among options; ground truth is how good each
 * option is given the numbers of this case, and why.
 */
import { z } from "zod";

import { baseCaseSchema, publicBaseCaseSchema } from "@/core/case-engine";

export const QUICK_CASES_MODULE_ID = "quick-cases";

export const QUICK_KINDS = [
  "pricing",
  "go_to_market",
  "incident",
  "build_buy",
] as const;
export const quickKindSchema = z.enum(QUICK_KINDS);
export type QuickKind = z.infer<typeof quickKindSchema>;

export const MAX_RATING = 3;
export const MAX_TEXT = 1200;

const idSchema = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9_]+$/);

const exhibitSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  source: z.string().min(1),
  body: z.string().min(1).optional(),
  /** Label and value pairs, shown as a small table. */
  rows: z.array(z.tuple([z.string().min(1), z.string().min(1)])).optional(),
});

const stepSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  question: z.string().min(1),
  /** How many options to choose: 1 is a single choice. */
  pick: z.number().int().min(1).max(3),
  options: z
    .array(z.object({ id: idSchema, text: z.string().min(1) }))
    .min(3)
    .max(6),
});

const sharedShape = {
  moduleId: z.literal(QUICK_CASES_MODULE_ID),
  kind: quickKindSchema,
  timeLimitMinutes: z.number().int().min(5).max(30),
  exhibits: z.array(exhibitSchema).min(1).max(5),
  steps: z.array(stepSchema).min(2).max(4),
  /** A short piece of writing for the AI coach. Never scored. */
  writing: z.object({
    label: z.string().min(1),
    placeholder: z.string().min(1),
  }),
};

export const quickCaseSchema = baseCaseSchema
  .extend({
    ...sharedShape,
    hidden: z.object({
      steps: z.array(
        z.object({
          id: idSchema,
          /** Points out of 100. */
          weight: z.number().int().min(5).max(80),
          options: z.array(
            z.object({
              id: idSchema,
              rating: z.number().int().min(0).max(MAX_RATING),
              why: z.string().min(1),
            }),
          ),
        }),
      ),
      ideal: z.string().min(1),
      principle: z.string().min(1),
    }),
  })
  .superRefine((caseData, context) => {
    const issue = (message: string) =>
      context.addIssue({ code: "custom", message });
    const { steps, hidden } = caseData;
    if (
      steps.map((s) => s.id).join() !== hidden.steps.map((s) => s.id).join()
    ) {
      issue("Hidden steps do not match the public ones");
      return;
    }
    if (hidden.steps.reduce((total, step) => total + step.weight, 0) !== 100) {
      issue("Step weights must add up to 100");
    }
    steps.forEach((step, index) => {
      const publicIds = step.options
        .map((o) => o.id)
        .sort()
        .join();
      const hiddenIds = hidden.steps[index].options
        .map((o) => o.id)
        .sort()
        .join();
      if (publicIds !== hiddenIds) {
        issue(`Step "${step.id}": hidden options do not match`);
      }
      if (new Set(step.options.map((o) => o.id)).size !== step.options.length) {
        issue(`Step "${step.id}": option ids repeat`);
      }
    });
  });
export type QuickCase = z.infer<typeof quickCaseSchema>;

export const publicQuickCaseSchema = publicBaseCaseSchema.extend(sharedShape);
export type PublicQuickCase = z.infer<typeof publicQuickCaseSchema>;

export const quickAnswerSchema = z.object({
  /** Options chosen per step id, in the order picked. */
  choices: z.record(idSchema, z.array(idSchema).max(6)),
  /** Why: read by the AI coach, never scored. */
  reasoning: z.string().max(MAX_TEXT).default(""),
  writing: z.string().max(MAX_TEXT).default(""),
  timing: z
    .object({
      timed: z.boolean(),
      secondsUsed: z.number().int().nonnegative().max(86_400),
    })
    .optional(),
});
export type QuickAnswer = z.infer<typeof quickAnswerSchema>;
