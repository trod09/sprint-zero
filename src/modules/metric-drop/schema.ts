/**
 * Data model of Metric Drop.
 *
 * A case does not store its dataset. It stores a specification (scale, rates,
 * release, anomalies) from which the seeded generator rebuilds the same daily
 * series every time, on the server. The learner only receives the series they
 * query, so the anomalies, which are the ground truth, never reach the browser.
 */
import { z } from "zod";

import { baseCaseSchema, publicBaseCaseSchema } from "@/core/case-engine";

export const METRIC_DROP_MODULE_ID = "metric-drop";

export const DIMENSIONS = [
  "platform",
  "appVersion",
  "country",
  "channel",
  "userType",
] as const;
export const dimensionSchema = z.enum(DIMENSIONS);
export type Dimension = z.infer<typeof dimensionSchema>;

export const PLATFORMS = ["ios", "android", "web"] as const;
export const COUNTRIES = ["US", "GB", "DE", "BR", "IN"] as const;
export const CHANNELS = [
  "organic",
  "paid_search",
  "paid_social",
  "referral",
] as const;
export const USER_TYPES = ["new", "returning"] as const;

export type Platform = (typeof PLATFORMS)[number];

export const METRICS = [
  "dau",
  "signups",
  "activation",
  "sessions",
  "conversion",
] as const;
export const metricSchema = z.enum(METRICS);
export type MetricKey = z.infer<typeof metricSchema>;

/** Rate metrics are percentages; the rest are daily counts. */
export const RATE_METRICS: readonly MetricKey[] = ["activation", "conversion"];

const versionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, "Versions look like 4.2.0");

/** Which cells of the data an anomaly hits: every listed dimension must match. */
export const segmentSchema = z
  .object({
    platform: z.enum(PLATFORMS).optional(),
    /** "ios-4.2.0", "android-4.1.3" or "web". */
    appVersion: z.string().min(1).optional(),
    country: z.enum(COUNTRIES).optional(),
    channel: z.enum(CHANNELS).optional(),
    userType: z.enum(USER_TYPES).optional(),
  })
  .strict();
export type Segment = z.infer<typeof segmentSchema>;

/** What an anomaly multiplies. */
export const ANOMALY_TARGETS = [
  "signups",
  "activation",
  "returning",
  "sessions",
  "conversion",
] as const;

export const anomalySchema = z.object({
  segment: segmentSchema,
  target: z.enum(ANOMALY_TARGETS),
  /** 0.4 means the target falls to 40% of normal once fully ramped. */
  multiplier: z.number().min(0).max(3),
  startDay: z.number().int().min(0),
  /** Days until the full effect. 1 means immediate. */
  rampDays: z.number().int().min(1).max(14),
  /** Last day of the effect, for temporary causes such as a holiday. */
  endDay: z.number().int().min(0).optional(),
});
export type Anomaly = z.infer<typeof anomalySchema>;

export const ANNOTATION_KINDS = [
  "release",
  "campaign",
  "holiday",
  "incident",
  "experiment",
] as const;

/** Public context markers on the timeline, like the ones in Amplitude. */
export const annotationSchema = z.object({
  day: z.number().int().min(0),
  kind: z.enum(ANNOTATION_KINDS),
  label: z.string().min(1),
});
export type Annotation = z.infer<typeof annotationSchema>;

export const ROOT_CAUSE_CATEGORIES = [
  "bug",
  "marketing",
  "seasonality",
  "product",
  "external",
] as const;
export const rootCauseCategorySchema = z.enum(ROOT_CAUSE_CATEGORIES);
export type RootCauseCategory = z.infer<typeof rootCauseCategorySchema>;

/** The answer to the case: one dimension and one value. */
export const segmentAnswerSchema = z.object({
  dimension: dimensionSchema,
  value: z.string().min(1),
});
export type SegmentAnswer = z.infer<typeof segmentAnswerSchema>;

const sharedShape = {
  moduleId: z.literal(METRIC_DROP_MODULE_ID),
  /** ISO date of day 0. */
  startDate: z.iso.date(),
  days: z.number().int().min(60).max(90),
  /** The metric whose drop the learner is asked to explain. */
  headlineMetric: metricSchema,
  release: z.object({
    previous: versionSchema,
    next: versionSchema,
    /** Day the new mobile version ships on both stores. */
    day: z.number().int().min(1),
  }),
  annotations: z.array(annotationSchema).max(12),
  /** Next steps the learner chooses from when recommending an action. */
  actionOptions: z
    .array(z.object({ id: z.string().min(1), label: z.string().min(1) }))
    .min(3)
    .max(5),
};

export const metricDropCaseSchema = baseCaseSchema
  .extend({
    ...sharedShape,
    scale: z.object({
      /** New signups per day across the whole product. */
      signups: z.number().int().positive(),
      /** Returning daily active users across the whole product. */
      returning: z.number().int().positive(),
    }),
    rates: z.object({
      /** Share of new users who reach the activation milestone on day 1. */
      activation: z.number().min(0.05).max(0.95),
      sessionsPerUser: z.number().min(1).max(10),
      /** Share of daily active users who purchase. */
      conversion: z.number().min(0.001).max(0.3),
    }),
    hidden: z.object({
      rootCause: z.object({
        category: rootCauseCategorySchema,
        segment: segmentAnswerSchema,
        anomalies: z.array(anomalySchema).min(1).max(3),
        /** One-line statement of the real cause. */
        summary: z.string().min(1),
        explanation: z.string().min(1),
        /** What a good analyst recommends next. */
        idealAction: z.string().min(1),
        /** The action option that matches `idealAction`. */
        idealActionId: z.string().min(1),
        /** Reasonable but incomplete options, worth half the credit. */
        partialActionIds: z.array(z.string().min(1)).max(2).default([]),
        /** The investigation steps that find the cause fastest. */
        idealPath: z.array(z.string().min(1)).min(2).max(6),
      }),
      falseLeads: z
        .array(
          z.object({
            segment: segmentAnswerSchema,
            category: rootCauseCategorySchema,
            anomalies: z.array(anomalySchema).max(2),
            explanation: z.string().min(1),
          }),
        )
        .min(1)
        .max(2),
    }),
  })
  .superRefine((caseData, context) => {
    const lastDay = caseData.days - 1;
    const anomalies = [
      ...caseData.hidden.rootCause.anomalies,
      ...caseData.hidden.falseLeads.flatMap((lead) => lead.anomalies),
    ];
    for (const anomaly of anomalies) {
      if (anomaly.startDay > lastDay) {
        context.addIssue({
          code: "custom",
          message: "An anomaly starts after the last day",
        });
      }
      if (anomaly.endDay !== undefined && anomaly.endDay < anomaly.startDay) {
        context.addIssue({
          code: "custom",
          message: "An anomaly ends before it starts",
        });
      }
    }
    if (caseData.release.day > lastDay) {
      context.addIssue({
        code: "custom",
        message: "The release happens after the last day",
      });
    }
    const optionIds = new Set(
      caseData.actionOptions.map((option) => option.id),
    );
    if (optionIds.size !== caseData.actionOptions.length) {
      context.addIssue({ code: "custom", message: "Action option ids repeat" });
    }
    const { idealActionId, partialActionIds } = caseData.hidden.rootCause;
    for (const id of [idealActionId, ...partialActionIds]) {
      if (!optionIds.has(id)) {
        context.addIssue({
          code: "custom",
          message: `Unknown action option "${id}"`,
        });
      }
    }
    if (partialActionIds.includes(idealActionId)) {
      context.addIssue({
        code: "custom",
        message: "The ideal action cannot be partial",
      });
    }
    for (const annotation of caseData.annotations) {
      if (annotation.day > lastDay) {
        context.addIssue({
          code: "custom",
          message: "An annotation is after the last day",
        });
      }
    }
  });
export type MetricDropCase = z.infer<typeof metricDropCaseSchema>;

export const publicMetricDropCaseSchema =
  publicBaseCaseSchema.extend(sharedShape);
export type PublicMetricDropCase = z.infer<typeof publicMetricDropCaseSchema>;

/** Values each dimension takes in a case. App versions depend on the release. */
export function dimensionValues(
  release: MetricDropCase["release"],
): Record<Dimension, readonly string[]> {
  return {
    platform: PLATFORMS,
    appVersion: [
      `ios-${release.previous}`,
      `ios-${release.next}`,
      `android-${release.previous}`,
      `android-${release.next}`,
      "web",
    ],
    country: COUNTRIES,
    channel: CHANNELS,
    userType: USER_TYPES,
  };
}

/** One view the learner opened in the dashboard. */
export const explorationSchema = z.object({
  metric: metricSchema,
  breakdown: dimensionSchema.optional(),
  filters: z
    .partialRecord(
      dimensionSchema,
      z.array(z.string().min(1).max(40)).min(1).max(10),
    )
    .default({}),
});
export type Exploration = z.infer<typeof explorationSchema>;

export const metricDropAnswerSchema = z.object({
  segment: segmentAnswerSchema,
  category: rootCauseCategorySchema,
  actionId: z.string().min(1).max(60),
  /** Why the learner believes this; read by the AI coach, never scored. */
  justification: z.string().max(1000).default(""),
  /** Every view opened, in order. Used to score how directly the cause was found. */
  explorations: z.array(explorationSchema).max(300).default([]),
});
export type MetricDropAnswer = z.infer<typeof metricDropAnswerSchema>;
