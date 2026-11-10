/**
 * Data model of Product Case, an interview-style case answered step by step.
 *
 * Design, improvement and strategy cases share one structure: pick a user
 * segment, the problems that matter to it, the solution to build first and
 * the metrics that prove it worked. Every option is public; how good each one
 * is lives in `hidden`. Estimation cases instead hand the learner a fact sheet
 * with traps (double counting, the wrong base) and ask for a number.
 *
 * The official score only reads the structured choices. The written
 * reasoning is for the AI coach.
 */
import { z } from "zod";

import { baseCaseSchema, publicBaseCaseSchema } from "@/core/case-engine";

export const PRODUCT_CASE_MODULE_ID = "product-case";

export const CASE_KINDS = [
  "design",
  "improvement",
  "strategy",
  "estimation",
] as const;
export const caseKindSchema = z.enum(CASE_KINDS);
export type CaseKind = z.infer<typeof caseKindSchema>;
export type StructuredKind = Exclude<CaseKind, "estimation">;

export const RESEARCH_SOURCES = [
  "interviews",
  "analytics",
  "support",
  "survey",
  "market",
] as const;
export const researchSourceSchema = z.enum(RESEARCH_SOURCES);
export type ResearchSource = z.infer<typeof researchSourceSchema>;

export const EFFORTS = ["S", "M", "L"] as const;
export const effortSchema = z.enum(EFFORTS);
export type Effort = z.infer<typeof effortSchema>;
export const EFFORT_POINTS: Record<Effort, number> = { S: 1, M: 2, L: 3 };

const optionIdSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const researchNoteSchema = z.object({
  id: optionIdSchema,
  source: researchSourceSchema,
  text: z.string().min(1),
});
export type ResearchNote = z.infer<typeof researchNoteSchema>;

export const segmentSchema = z.object({
  id: optionIdSchema,
  name: z.string().min(1),
  description: z.string().min(1),
});
export const problemSchema = z.object({
  id: optionIdSchema,
  statement: z.string().min(1),
});
export const solutionSchema = z.object({
  id: optionIdSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  /** Engineering's rough size, public like in a real planning meeting. */
  effort: effortSchema,
});
export const metricSchema = z.object({
  id: optionIdSchema,
  name: z.string().min(1),
  definition: z.string().min(1),
});
export type Segment = z.infer<typeof segmentSchema>;
export type Problem = z.infer<typeof problemSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Metric = z.infer<typeof metricSchema>;

export const factSchema = z.object({
  id: optionIdSchema,
  label: z.string().min(1),
  value: z.number().positive(),
  unit: z.string().min(1),
  source: z.string().min(1),
});
export type Fact = z.infer<typeof factSchema>;

/** Severity 0-3 of a problem for each segment, keyed by segment id. */
const severityMapSchema = z.record(z.string(), z.number().int().min(0).max(3));

const structuredShape = {
  kind: z.enum(["design", "improvement", "strategy"]),
  /** The interview question, as the interviewer asks it. */
  prompt: z.string().min(1),
  research: z.array(researchNoteSchema).min(3).max(10),
  segments: z.array(segmentSchema).min(3).max(5),
  problems: z.array(problemSchema).min(4).max(8),
  solutions: z.array(solutionSchema).min(4).max(7),
  metrics: z.array(metricSchema).min(4).max(8),
  timeLimitMinutes: z.number().int().positive(),
};

const estimationShape = {
  kind: z.literal("estimation"),
  prompt: z.string().min(1),
  /** What the final number measures, e.g. "US dollars per year". */
  answerUnit: z.string().min(1),
  facts: z.array(factSchema).min(4).max(10),
  timeLimitMinutes: z.number().int().positive(),
};

export const structuredHiddenSchema = z.object({
  segments: z.array(
    z.object({
      id: optionIdSchema,
      fit: z.number().int().min(0).max(3),
      why: z.string().min(1),
    }),
  ),
  problems: z.array(
    z.object({
      id: optionIdSchema,
      severity: severityMapSchema,
      why: z.string().min(1),
    }),
  ),
  solutions: z.array(
    z.object({
      id: optionIdSchema,
      /** How much the solution relieves each problem, 0-3, keyed by problem id. */
      relief: severityMapSchema,
      why: z.string().min(1),
    }),
  ),
  metrics: z.array(
    z.object({
      id: optionIdSchema,
      /** 0-2: how well it measures success / guards against harm. */
      success: z.number().int().min(0).max(2),
      guardrail: z.number().int().min(0).max(2),
      why: z.string().min(1),
    }),
  ),
  /** The annotated ideal answer, step by step. */
  ideal: z.object({
    users: z.string().min(1),
    problems: z.string().min(1),
    solutions: z.string().min(1),
    metrics: z.string().min(1),
  }),
  principle: z.string().min(1),
});
export type StructuredHidden = z.infer<typeof structuredHiddenSchema>;

export const estimationHiddenSchema = z.object({
  /** Facts the estimate needs. */
  requiredFactIds: z.array(optionIdSchema).min(2),
  /** Why each fact belongs or not, keyed by fact id. */
  factNotes: z.record(z.string(), z.string().min(1)),
  /** Constant factors such as 12 months, with what they mean. */
  constants: z.array(z.object({ value: z.number(), label: z.string() })),
  truth: z.number().positive(),
  formula: z.string().min(1),
  /** How far off a learner gets when they fall for the main trap. */
  trapEstimate: z.number().positive(),
  ideal: z.string().min(1),
  principle: z.string().min(1),
});
export type EstimationHidden = z.infer<typeof estimationHiddenSchema>;

const ids = (list: readonly { id: string }[]) => list.map((item) => item.id);

function sameIds(
  context: z.RefinementCtx,
  label: string,
  publicIds: string[],
  hiddenIds: string[],
) {
  const left = [...publicIds].sort().join(",");
  const right = [...hiddenIds].sort().join(",");
  if (left !== right || new Set(publicIds).size !== publicIds.length) {
    context.addIssue({
      code: "custom",
      message: `${label}: public and hidden options differ`,
    });
  }
}

export const structuredCaseSchema = baseCaseSchema
  .extend({
    moduleId: z.literal(PRODUCT_CASE_MODULE_ID),
    ...structuredShape,
    hidden: structuredHiddenSchema,
  })
  .superRefine((caseData, context) => {
    const { hidden } = caseData;
    sameIds(context, "segments", ids(caseData.segments), ids(hidden.segments));
    sameIds(context, "problems", ids(caseData.problems), ids(hidden.problems));
    sameIds(
      context,
      "solutions",
      ids(caseData.solutions),
      ids(hidden.solutions),
    );
    sameIds(context, "metrics", ids(caseData.metrics), ids(hidden.metrics));
    const segmentIds = ids(caseData.segments).sort().join(",");
    for (const problem of hidden.problems) {
      if (Object.keys(problem.severity).sort().join(",") !== segmentIds) {
        context.addIssue({
          code: "custom",
          message: `Problem "${problem.id}" needs a severity per segment`,
        });
      }
    }
    const problemIds = ids(caseData.problems).sort().join(",");
    for (const solution of hidden.solutions) {
      if (Object.keys(solution.relief).sort().join(",") !== problemIds) {
        context.addIssue({
          code: "custom",
          message: `Solution "${solution.id}" needs a relief per problem`,
        });
      }
    }
  });
export type StructuredCase = z.infer<typeof structuredCaseSchema>;

export const estimationCaseSchema = baseCaseSchema
  .extend({
    moduleId: z.literal(PRODUCT_CASE_MODULE_ID),
    ...estimationShape,
    hidden: estimationHiddenSchema,
  })
  .superRefine((caseData, context) => {
    const factIds = ids(caseData.facts);
    for (const id of caseData.hidden.requiredFactIds) {
      if (!factIds.includes(id)) {
        context.addIssue({ code: "custom", message: `Unknown fact "${id}"` });
      }
    }
    for (const id of factIds) {
      if (!caseData.hidden.factNotes[id]) {
        context.addIssue({
          code: "custom",
          message: `Fact "${id}" needs a note`,
        });
      }
    }
  });
export type EstimationCase = z.infer<typeof estimationCaseSchema>;

export const productCaseSchema = z.union([
  structuredCaseSchema,
  estimationCaseSchema,
]);
export type ProductCase = z.infer<typeof productCaseSchema>;

export const publicStructuredCaseSchema = publicBaseCaseSchema.extend({
  moduleId: z.literal(PRODUCT_CASE_MODULE_ID),
  ...structuredShape,
});
export type PublicStructuredCase = z.infer<typeof publicStructuredCaseSchema>;

export const publicEstimationCaseSchema = publicBaseCaseSchema.extend({
  moduleId: z.literal(PRODUCT_CASE_MODULE_ID),
  ...estimationShape,
});
export type PublicEstimationCase = z.infer<typeof publicEstimationCaseSchema>;

export const publicProductCaseSchema = z.union([
  publicStructuredCaseSchema,
  publicEstimationCaseSchema,
]);
export type PublicProductCase = z.infer<typeof publicProductCaseSchema>;

export const MAX_PROBLEMS = 2;
export const MAX_RANKED_SOLUTIONS = 3;
export const MAX_REASONING = 1500;

const reasoning = z.string().max(MAX_REASONING).default("");

/** How the learner played the clock. Shown on the results page, never scored. */
export const timingSchema = z
  .object({
    timed: z.boolean(),
    secondsUsed: z.number().int().nonnegative().max(86_400),
  })
  .optional();

export const structuredAnswerSchema = z
  .object({
    kind: z.enum(["design", "improvement", "strategy"]),
    segmentId: optionIdSchema.nullable(),
    usersWhy: reasoning,
    problemIds: z.array(optionIdSchema).max(MAX_PROBLEMS),
    problemsWhy: reasoning,
    /** Own ideas, in the learner's words. */
    ideas: reasoning,
    /** Solutions in build order; the first one ships first. */
    solutionRanking: z.array(optionIdSchema).max(MAX_RANKED_SOLUTIONS),
    solutionsWhy: reasoning,
    successMetricId: optionIdSchema.nullable(),
    guardrailMetricId: optionIdSchema.nullable(),
    metricsWhy: reasoning,
    timing: timingSchema,
  })
  .superRefine((answer, context) => {
    if (new Set(answer.problemIds).size !== answer.problemIds.length) {
      context.addIssue({ code: "custom", message: "A problem repeats" });
    }
    if (
      new Set(answer.solutionRanking).size !== answer.solutionRanking.length
    ) {
      context.addIssue({ code: "custom", message: "A solution repeats" });
    }
  });
export type StructuredAnswer = z.infer<typeof structuredAnswerSchema>;

export const estimationAnswerSchema = z.object({
  kind: z.literal("estimation"),
  factIds: z.array(optionIdSchema).max(10),
  /** Extra factors the learner multiplies in, such as 12 months. */
  multipliers: z
    .array(
      z.object({
        label: z.string().max(60).default(""),
        value: z.number().positive().max(1e6),
      }),
    )
    .max(4),
  estimate: z.number().positive().max(1e15).nullable(),
  approach: reasoning,
  sanityCheck: reasoning,
  timing: timingSchema,
});
export type EstimationAnswer = z.infer<typeof estimationAnswerSchema>;

export const productCaseAnswerSchema = z.union([
  structuredAnswerSchema,
  estimationAnswerSchema,
]);
export type ProductCaseAnswer = z.infer<typeof productCaseAnswerSchema>;
