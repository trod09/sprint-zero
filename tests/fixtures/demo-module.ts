/**
 * A tiny module used only by tests to exercise the case engine end to end:
 * the learner picks one item, and each item hides its true value.
 * It mirrors the shape of real modules, with ground truth at two nesting levels.
 */
import { z } from "zod";

import {
  baseCaseSchema,
  publicBaseCaseSchema,
  type SimulationModule,
} from "@/core/case-engine";
import { buildScoreResult, safeRatio, type ScoreResult } from "@/core/scoring";

const demoItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  hidden: z.object({ trueValue: z.number().min(0).max(100) }),
});

export const demoCaseSchema = baseCaseSchema.extend({
  moduleId: z.literal("demo"),
  items: z.array(demoItemSchema).min(2),
  hidden: z.object({ bestItemId: z.string().min(1) }),
});
export type DemoCase = z.infer<typeof demoCaseSchema>;

export const demoPublicCaseSchema = publicBaseCaseSchema.extend({
  moduleId: z.literal("demo"),
  items: z.array(demoItemSchema.omit({ hidden: true })).min(2),
});
export type DemoPublicCase = z.infer<typeof demoPublicCaseSchema>;

export const demoAnswerSchema = z.object({ selectedItemId: z.string().min(1) });
export type DemoAnswer = z.infer<typeof demoAnswerSchema>;

export type DemoModule = SimulationModule<
  DemoCase,
  DemoPublicCase,
  DemoAnswer,
  ScoreResult
>;

export const demoModule: DemoModule = {
  meta: {
    id: "demo",
    name: "Demo",
    tagline: "Pick the most valuable item.",
    description: "Test-only module.",
    skills: ["execution"],
    status: "available",
    icon: "demo",
  },
  caseSchema: demoCaseSchema,
  publicCaseSchema: demoPublicCaseSchema,
  answerSchema: demoAnswerSchema,
  toPublicCase(caseData) {
    const { hidden: _caseTruth, items, ...rest } = caseData;
    return {
      ...rest,
      items: items.map(({ hidden: _itemTruth, ...item }) => item),
    };
  },
  score(caseData, answer) {
    const best = Math.max(...caseData.items.map((i) => i.hidden.trueValue));
    const picked = caseData.items.find((i) => i.id === answer.selectedItemId);
    return buildScoreResult([
      {
        id: "best_pick",
        label: "Picked the best item",
        weight: 60,
        ratio: answer.selectedItemId === caseData.hidden.bestItemId ? 1 : 0,
      },
      {
        id: "value",
        label: "Value captured",
        weight: 40,
        ratio: safeRatio(picked?.hidden.trueValue ?? 0, best, 0),
      },
    ]);
  },
  feedbackRubric: "Did the learner pick the most valuable item?",
};

export function makeDemoCase(overrides: Partial<DemoCase> = {}): DemoCase {
  return {
    id: "demo-01",
    moduleId: "demo",
    seed: 1,
    difficulty: "apm",
    company: {
      name: "Acme",
      industry: "SaaS B2B",
      stage: "Series A",
      description: "A test company.",
    },
    title: "Pick one",
    brief: "Choose the item with the highest real value.",
    items: [
      { id: "a", label: "Shiny feature", hidden: { trueValue: 20 } },
      { id: "b", label: "Boring fix", hidden: { trueValue: 80 } },
      { id: "c", label: "CEO request", hidden: { trueValue: 40 } },
    ],
    hidden: { bestItemId: "b" },
    ...overrides,
  };
}
