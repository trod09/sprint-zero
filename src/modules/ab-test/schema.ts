/**
 * Data model of the A/B Test Interpreter.
 *
 * A case is an experiment that already ran: its design (public), its counts
 * (public, generated in code from a seed) and the truth about it (hidden):
 * which statistical traps it hides, the real effect and the right call.
 */
import { z } from "zod";

import { baseCaseSchema, publicBaseCaseSchema } from "@/core/case-engine";

export const AB_TEST_MODULE_ID = "ab-test";

/** Problems an experiment readout can hide. */
export const ISSUES = [
  "srm",
  "novelty",
  "simpson",
  "guardrail",
  "underpowered",
] as const;
export const issueSchema = z.enum(ISSUES);
export type Issue = z.infer<typeof issueSchema>;

export const DECISIONS = ["ship", "iterate", "kill"] as const;
export const decisionSchema = z.enum(DECISIONS);
export type Decision = z.infer<typeof decisionSchema>;

/** What the learner believes the change really does to the primary metric. */
export const EFFECT_READS = [
  "improves",
  "no_effect",
  "harms",
  "inconclusive",
] as const;
export const effectReadSchema = z.enum(EFFECT_READS);
export type EffectRead = z.infer<typeof effectReadSchema>;

/** Dashboard tabs; which ones the learner opened is context for the AI coach. */
export const VIEWS = ["scorecard", "over_time", "segments"] as const;
export const viewSchema = z.enum(VIEWS);
export type View = z.infer<typeof viewSchema>;

const metricKeySchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]*$/, "Metric keys are snake_case");

export const proportionSchema = z.object({
  users: z.number().int().nonnegative(),
  conversions: z.number().int().nonnegative(),
});
export type ProportionCounts = z.infer<typeof proportionSchema>;

const armsSchema = z.object({
  control: proportionSchema,
  treatment: proportionSchema,
});
export type Arms = z.infer<typeof armsSchema>;

export const guardrailSchema = z.object({
  key: metricKeySchema,
  label: z.string().min(1),
  description: z.string().min(1),
  /** Which way is good for the business. */
  goodDirection: z.enum(["up", "down"]),
  /** Largest relative worsening the team accepts, in percent. */
  tolerance: z.number().positive().max(100),
  /** What the rate is measured over: every visitor or only converters. */
  denominator: z.enum(["users", "primary"]),
});
export type Guardrail = z.infer<typeof guardrailSchema>;

const unique = <T>(items: readonly T[]) => new Set(items).size === items.length;

const sharedShape = {
  moduleId: z.literal(AB_TEST_MODULE_ID),
  experiment: z.object({
    name: z.string().min(1),
    /** What the treatment changes. */
    change: z.string().min(1),
    hypothesis: z.string().min(1),
    primaryMetric: z.object({
      key: metricKeySchema,
      label: z.string().min(1),
      description: z.string().min(1),
    }),
    guardrails: z.array(guardrailSchema).min(1).max(2),
    /** The dimension results are broken down by, e.g. "Platform". */
    segmentDimension: z.string().min(1),
    plan: z.object({
      /** Share of traffic meant for treatment. */
      treatmentShare: z.number().min(0.1).max(0.9),
      days: z.number().int().min(7).max(56),
      /** Users per arm for 80% power at the minimum detectable effect. */
      samplePerArm: z.number().int().positive(),
      /** Minimum detectable effect, relative (0.05 = 5%). */
      mde: z.number().positive().max(1),
      /** Expected control rate of the primary metric. */
      baselineRate: z.number().positive().max(1),
    }),
  }),
  results: z.object({
    daysRun: z.number().int().min(1),
    /** Primary metric per day. */
    daily: z.array(armsSchema).min(1),
    /** Primary metric per segment, whole run. */
    segments: z
      .array(armsSchema.extend({ value: z.string().min(1) }))
      .min(2)
      .max(4),
    guardrails: z.array(armsSchema.extend({ key: metricKeySchema })),
  }),
};

export const simulationSchema = z.object({
  /** Retries the builder needed until the data showed the intended pattern. */
  attempt: z.number().int().nonnegative(),
  visitorsPerDay: z.number().int().positive(),
  /** Real share of traffic in treatment (differs from the plan with an SRM). */
  treatmentShare: z.number().min(0.1).max(0.9),
  baselineRate: z.number().positive().max(1),
  /** Lasting relative effect on the primary metric. */
  trueLift: z.number().min(-0.9).max(2),
  /** Extra lift on day 0 that fades exponentially. */
  novelty: z
    .object({
      initialLift: z.number().positive().max(2),
      decayDays: z.number().positive().max(30),
    })
    .optional(),
  /** Treatment users who never get logged, and how they convert vs. the rest. */
  missing: z
    .object({
      share: z.number().positive().max(0.5),
      relativeRate: z.number().min(0).max(1),
    })
    .optional(),
  segments: z
    .array(
      z.object({
        value: z.string().min(1),
        share: z.number().positive().max(1),
        rateMultiplier: z.number().positive().max(5),
        /** Overrides the treatment share for this segment (broken assignment). */
        treatmentShare: z.number().min(0.05).max(0.95).optional(),
        /** Overrides the true lift for this segment. */
        trueLift: z.number().min(-0.9).max(2).optional(),
      }),
    )
    .min(2)
    .max(4),
  guardrails: z.array(
    z.object({
      key: metricKeySchema,
      baselineRate: z.number().positive().max(1),
      trueLift: z.number().min(-0.9).max(3),
    }),
  ),
  /** Day the team stopped the test, when they stopped early. */
  stoppedAfterDays: z.number().int().min(1).optional(),
});
export type Simulation = z.infer<typeof simulationSchema>;

export const abTestCaseSchema = baseCaseSchema
  .extend({
    ...sharedShape,
    hidden: z.object({
      /** Problems the learner must flag. Empty when the readout is clean. */
      issues: z.array(issueSchema).max(3).refine(unique, "Issues repeat"),
      /** Defensible flags that are neither required nor penalized. */
      acceptableIssues: z.array(issueSchema).max(2).default([]),
      effect: effectReadSchema,
      partialEffects: z.array(effectReadSchema).max(2).default([]),
      decision: decisionSchema,
      partialDecisions: z.array(decisionSchema).max(1).default([]),
      /** One line: what is really going on. */
      summary: z.string().min(1),
      explanation: z.string().min(1),
      /** Where each issue shows in the data. */
      issueNotes: z.partialRecord(issueSchema, z.string().min(1)),
      /** What a good analyst would recommend. */
      recommendation: z.string().min(1),
      simulation: simulationSchema,
    }),
  })
  .superRefine((caseData, context) => {
    const { hidden, experiment, results } = caseData;
    for (const issue of hidden.issues) {
      if (!hidden.issueNotes[issue]) {
        context.addIssue({
          code: "custom",
          message: `Issue "${issue}" has no note`,
        });
      }
      if (hidden.acceptableIssues.includes(issue)) {
        context.addIssue({
          code: "custom",
          message: `Issue "${issue}" is both required and acceptable`,
        });
      }
    }
    if (hidden.partialEffects.includes(hidden.effect)) {
      context.addIssue({
        code: "custom",
        message: "The right effect cannot be partial",
      });
    }
    if (hidden.partialDecisions.includes(hidden.decision)) {
      context.addIssue({
        code: "custom",
        message: "The right decision cannot be partial",
      });
    }
    if (results.daily.length !== results.daysRun) {
      context.addIssue({
        code: "custom",
        message: "There must be one daily row per day run",
      });
    }
    const guardrailKeys = experiment.guardrails.map((g) => g.key);
    const resultKeys = results.guardrails.map((g) => g.key);
    if (guardrailKeys.join() !== resultKeys.join()) {
      context.addIssue({
        code: "custom",
        message: "Guardrail results must match the guardrails, in order",
      });
    }
    if (guardrailKeys.includes(experiment.primaryMetric.key)) {
      context.addIssue({
        code: "custom",
        message: "A guardrail repeats the primary metric",
      });
    }
  });
export type AbTestCase = z.infer<typeof abTestCaseSchema>;

export const publicAbTestCaseSchema = publicBaseCaseSchema.extend(sharedShape);
export type PublicAbTestCase = z.infer<typeof publicAbTestCaseSchema>;

export const abTestAnswerSchema = z.object({
  /** Problems the learner flagged. Empty means "the readout is trustworthy". */
  issues: z.array(issueSchema).max(ISSUES.length).refine(unique, {
    message: "Issues repeat",
  }),
  effect: effectReadSchema,
  decision: decisionSchema,
  /** Read by the AI coach, never scored. */
  justification: z.string().max(1500).default(""),
  /** Tabs opened, in order of first visit. */
  viewed: z.array(viewSchema).max(VIEWS.length).default([]),
});
export type AbTestAnswer = z.infer<typeof abTestAnswerSchema>;
