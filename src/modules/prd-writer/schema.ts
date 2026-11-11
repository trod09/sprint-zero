/**
 * Data model of PRD Writer.
 *
 * A case is a brief plus the documents a PM would gather (a memo, data, an
 * email from leadership, notes from legal or engineering). The learner writes
 * a one-pager in sections. Each section has a part code can check against
 * the documents (which evidence, which metric with what baseline and target,
 * what is in scope, which risks) and a part in their own words for the AI
 * coach.
 */
import { z } from "zod";

import { baseCaseSchema, publicBaseCaseSchema } from "@/core/case-engine";

export const PRD_WRITER_MODULE_ID = "prd-writer";

export const DOCUMENT_KINDS = ["memo", "data", "email", "notes"] as const;
export const documentKindSchema = z.enum(DOCUMENT_KINDS);
export type DocumentKind = z.infer<typeof documentKindSchema>;

export const HORIZONS = ["six_weeks", "quarter", "half_year", "year"] as const;
export const horizonSchema = z.enum(HORIZONS);
export type Horizon = z.infer<typeof horizonSchema>;

export const BUCKETS = ["v1", "later", "out"] as const;
export const bucketSchema = z.enum(BUCKETS);
export type Bucket = z.infer<typeof bucketSchema>;

const optionIdSchema = z
  .string()
  .max(60)
  .regex(/^[a-z][a-z0-9_]*$/);

const sharedShape = {
  moduleId: z.literal(PRD_WRITER_MODULE_ID),
  /** What the PRD is for, in one line. */
  feature: z.string().min(1),
  documents: z
    .array(
      z.object({
        id: optionIdSchema,
        kind: documentKindSchema,
        title: z.string().min(1),
        from: z.string().min(1),
        body: z.string().min(1),
      }),
    )
    .min(3)
    .max(6),
  evidence: z
    .array(z.object({ id: optionIdSchema, text: z.string().min(1) }))
    .min(4)
    .max(8),
  metrics: z
    .array(
      z.object({
        id: optionIdSchema,
        name: z.string().min(1),
        definition: z.string().min(1),
        /** Unit of the baseline and target, e.g. "%" or "hours". */
        unit: z.string().min(1),
      }),
    )
    .min(3)
    .max(6),
  requirements: z
    .array(
      z.object({
        id: optionIdSchema,
        title: z.string().min(1),
        description: z.string().min(1),
      }),
    )
    .min(5)
    .max(10),
  risks: z
    .array(
      z.object({
        id: optionIdSchema,
        title: z.string().min(1),
        description: z.string().min(1),
      }),
    )
    .min(4)
    .max(8),
};

export const prdHiddenSchema = z.object({
  evidence: z.array(
    z.object({
      id: optionIdSchema,
      strength: z.number().int().min(0).max(2),
      why: z.string().min(1),
    }),
  ),
  metric: z.object({
    primaryId: optionIdSchema,
    /** The baseline as the documents state it. */
    baseline: z.number(),
    /** Targets the documents support, inclusive. */
    targetMin: z.number(),
    targetMax: z.number(),
    horizon: horizonSchema,
    /** Why each metric is or is not the right one, keyed by id. */
    notes: z.record(z.string(), z.string().min(1)),
  }),
  requirements: z.array(
    z.object({
      id: optionIdSchema,
      bucket: bucketSchema,
      why: z.string().min(1),
    }),
  ),
  risks: z.array(
    z.object({
      id: optionIdSchema,
      relevance: z.number().int().min(0).max(2),
      why: z.string().min(1),
    }),
  ),
  ideal: z.object({
    problem: z.string().min(1),
    metrics: z.string().min(1),
    scope: z.string().min(1),
    risks: z.string().min(1),
  }),
  principle: z.string().min(1),
});
export type PrdHidden = z.infer<typeof prdHiddenSchema>;

const ids = (list: readonly { id: string }[]) =>
  list
    .map((item) => item.id)
    .sort()
    .join(",");

export const prdCaseSchema = baseCaseSchema
  .extend({ ...sharedShape, hidden: prdHiddenSchema })
  .superRefine((caseData, context) => {
    const { hidden } = caseData;
    const pairs: [string, string, string][] = [
      ["evidence", ids(caseData.evidence), ids(hidden.evidence)],
      ["requirements", ids(caseData.requirements), ids(hidden.requirements)],
      ["risks", ids(caseData.risks), ids(hidden.risks)],
      [
        "metric notes",
        ids(caseData.metrics),
        Object.keys(hidden.metric.notes).sort().join(","),
      ],
    ];
    for (const [label, left, right] of pairs) {
      if (left !== right) {
        context.addIssue({
          code: "custom",
          message: `${label}: public and hidden options differ`,
        });
      }
    }
    if (!caseData.metrics.some((m) => m.id === hidden.metric.primaryId)) {
      context.addIssue({ code: "custom", message: "Unknown primary metric" });
    }
    if (hidden.metric.targetMin > hidden.metric.targetMax) {
      context.addIssue({ code: "custom", message: "Empty target range" });
    }
  });
export type PrdCase = z.infer<typeof prdCaseSchema>;

export const publicPrdCaseSchema = publicBaseCaseSchema.extend(sharedShape);
export type PublicPrdCase = z.infer<typeof publicPrdCaseSchema>;

export const MAX_EVIDENCE = 3;
export const MAX_RISKS = 3;
export const MAX_TEXT = 2000;
export const MAX_SHORT_TEXT = 400;

const text = z.string().max(MAX_TEXT).default("");

export const prdAnswerSchema = z
  .object({
    problem: text,
    evidenceIds: z.array(optionIdSchema).max(MAX_EVIDENCE),
    goals: text,
    metric: z.object({
      metricId: optionIdSchema.nullable(),
      baseline: z.number().finite().nullable(),
      target: z.number().finite().nullable(),
      horizon: horizonSchema.nullable(),
    }),
    /** Bucket per requirement id; unassigned ones are left out. */
    scope: z
      .record(optionIdSchema, bucketSchema)
      .refine((scope) => Object.keys(scope).length <= 10, {
        message: "Too many requirements",
      }),
    risks: z
      .array(
        z.object({
          riskId: optionIdSchema,
          mitigation: z.string().max(MAX_SHORT_TEXT).default(""),
        }),
      )
      .max(MAX_RISKS),
    openQuestions: text,
  })
  .superRefine((answer, context) => {
    if (new Set(answer.evidenceIds).size !== answer.evidenceIds.length) {
      context.addIssue({ code: "custom", message: "Evidence repeats" });
    }
    const riskIds = answer.risks.map((risk) => risk.riskId);
    if (new Set(riskIds).size !== riskIds.length) {
      context.addIssue({ code: "custom", message: "A risk repeats" });
    }
  });
export type PrdAnswer = z.infer<typeof prdAnswerSchema>;
