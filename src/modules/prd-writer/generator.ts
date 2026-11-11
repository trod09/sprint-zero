/**
 * Builds PRD Writer cases from their hand-written specifications.
 *
 * Words come from the spec; every number in the documents (baselines,
 * deadlines, shares, ticket counts) is drawn from the seed here, and the
 * baseline and target range the scoring checks are computed from the same
 * numbers. A case is only accepted when each step has a clear best answer and
 * the documents actually state the baseline.
 */
import type { Company, Difficulty, IndustryKey } from "@/core/case-engine";
import { createRng, type Rng } from "@/core/rng";

import {
  BUCKETS,
  prdCaseSchema,
  type Bucket,
  type DocumentKind,
  type Horizon,
  type PrdCase,
} from "./schema";

export interface NumberRange {
  min: number;
  max: number;
  step: number;
}

export type Values = Record<string, number>;

export interface PrdSpec {
  id: string;
  seed: number;
  difficulty: Difficulty;
  /** Industry for on-demand cases; specs without one are only featured. */
  industry?: IndustryKey;
  company: Company;
  title: string;
  brief: string;
  feature: string;
  /** Drawn once per case and shared by every `{slot}`. */
  numbers: Record<string, NumberRange>;
  /** Values computed from the drawn numbers, usable as slots too. */
  derived?: (values: Values) => Values;
  documents: {
    id: string;
    kind: DocumentKind;
    title: string;
    from: string;
    body: string;
  }[];
  evidence: { id: string; text: string; strength: number; why: string }[];
  metrics: {
    id: string;
    name: string;
    definition: string;
    unit: string;
    note: string;
  }[];
  primaryMetricId: string;
  baseline: (values: Values) => number;
  targetRange: (values: Values) => [number, number];
  horizon: Horizon;
  requirements: {
    id: string;
    title: string;
    description: string;
    bucket: Bucket;
    why: string;
  }[];
  risks: {
    id: string;
    title: string;
    description: string;
    relevance: number;
    why: string;
  }[];
  ideal: {
    problem: string;
    metrics: string;
    scope: string;
    risks: string;
  };
  principle: string;
}

function drawNumber(rng: Rng, range: NumberRange): number {
  const steps = Math.round((range.max - range.min) / range.step);
  return Number((range.min + rng.int(0, steps) * range.step).toFixed(6));
}

/** Formats a number the way the documents show it. */
export const formatNumber = (value: number) => value.toLocaleString("en-US");

function fill(text: string, values: Values): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    if (value === undefined) throw new Error(`Unknown number ${match}`);
    return formatNumber(value);
  });
}

/** Why a case has no clear best answer, or `null`. */
export function findPrdProblem(caseData: PrdCase): string | null {
  const { hidden } = caseData;
  const third = (list: number[]) => {
    const sorted = [...list].sort((a, b) => b - a);
    return sorted[2] > (sorted[3] ?? -1);
  };
  if (!third(hidden.evidence.map((e) => e.strength))) {
    return "no clear three strongest pieces of evidence";
  }
  if (!third(hidden.risks.map((r) => r.relevance))) {
    return "no clear three most relevant risks";
  }
  for (const bucket of BUCKETS) {
    if (!hidden.requirements.some((r) => r.bucket === bucket)) {
      return `no requirement belongs in "${bucket}"`;
    }
  }
  const documents = caseData.documents.map((d) => d.body).join("\n");
  if (!documents.includes(formatNumber(hidden.metric.baseline))) {
    return "the documents do not state the baseline";
  }
  return null;
}

export function generatePrdCase(spec: PrdSpec): PrdCase {
  const rng = createRng(spec.seed).fork("numbers");
  const drawn: Values = {};
  for (const [key, range] of Object.entries(spec.numbers)) {
    drawn[key] = drawNumber(rng, range);
  }
  const values = { ...drawn, ...spec.derived?.(drawn) };
  const order = createRng(spec.seed).fork("order");
  const [targetMin, targetMax] = spec.targetRange(values);

  const caseData = prdCaseSchema.parse({
    id: spec.id,
    moduleId: "prd-writer",
    seed: spec.seed,
    difficulty: spec.difficulty,
    company: spec.company,
    title: spec.title,
    brief: fill(spec.brief, values),
    feature: spec.feature,
    documents: spec.documents.map((doc) => ({
      ...doc,
      body: fill(doc.body, values),
    })),
    evidence: order
      .shuffle(spec.evidence)
      .map(({ id, text }) => ({ id, text: fill(text, values) })),
    metrics: order
      .shuffle(spec.metrics)
      .map(({ id, name, definition, unit }) => ({
        id,
        name,
        definition,
        unit,
      })),
    requirements: order
      .shuffle(spec.requirements)
      .map(({ id, title, description }) => ({ id, title, description })),
    risks: order
      .shuffle(spec.risks)
      .map(({ id, title, description }) => ({ id, title, description })),
    hidden: {
      evidence: spec.evidence.map(({ id, strength, why }) => ({
        id,
        strength,
        why: fill(why, values),
      })),
      metric: {
        primaryId: spec.primaryMetricId,
        baseline: spec.baseline(values),
        targetMin,
        targetMax,
        horizon: spec.horizon,
        notes: Object.fromEntries(
          spec.metrics.map((m) => [m.id, fill(m.note, values)]),
        ),
      },
      requirements: spec.requirements.map(({ id, bucket, why }) => ({
        id,
        bucket,
        why: fill(why, values),
      })),
      risks: spec.risks.map(({ id, relevance, why }) => ({
        id,
        relevance,
        why: fill(why, values),
      })),
      ideal: {
        problem: fill(spec.ideal.problem, values),
        metrics: fill(spec.ideal.metrics, values),
        scope: fill(spec.ideal.scope, values),
        risks: fill(spec.ideal.risks, values),
      },
      principle: spec.principle,
    },
  });
  const problem = findPrdProblem(caseData);
  if (problem) throw new Error(`Case "${spec.id}": ${problem}`);
  return caseData;
}
