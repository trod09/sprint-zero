/**
 * Builds Product Case cases from their hand-written specifications.
 *
 * Words come from the spec; every number comes from the seed. Research notes
 * get their counts and shares here, estimation facts get their values here,
 * and the true estimate is computed from them. Options are shuffled so the
 * best one is never simply first. A case is only accepted when it has a
 * single best answer at every step.
 */
import { createRng, type Rng } from "@/core/rng";
import type { Company, Difficulty } from "@/core/case-engine";

import { rankSolutions, segmentSeverities, topProblems } from "./analysis";
import {
  estimationCaseSchema,
  structuredCaseSchema,
  type EstimationCase,
  type Effort,
  type ResearchSource,
  type StructuredCase,
  type StructuredKind,
} from "./schema";

/** A number drawn from a range and rounded to a step. */
export interface NumberRange {
  min: number;
  max: number;
  step: number;
}

interface CommonSpec {
  id: string;
  seed: number;
  difficulty: Difficulty;
  company: Company;
  title: string;
  brief: string;
  prompt: string;
  timeLimitMinutes: number;
}

export interface StructuredSpec extends CommonSpec {
  kind: StructuredKind;
  /** Notes with `{name}` slots filled from `numbers`. */
  research: {
    id: string;
    source: ResearchSource;
    text: string;
    numbers?: Record<string, NumberRange>;
  }[];
  segments: {
    id: string;
    name: string;
    description: string;
    fit: number;
    why: string;
  }[];
  problems: {
    id: string;
    statement: string;
    severity: Record<string, number>;
    why: string;
  }[];
  solutions: {
    id: string;
    name: string;
    description: string;
    effort: Effort;
    relief: Record<string, number>;
    why: string;
  }[];
  metrics: {
    id: string;
    name: string;
    definition: string;
    success: number;
    guardrail: number;
    why: string;
  }[];
  ideal: {
    users: string;
    problems: string;
    solutions: string;
    metrics: string;
  };
  principle: string;
}

export type FactValues = Record<string, number>;

export interface EstimationSpec extends CommonSpec {
  kind: "estimation";
  answerUnit: string;
  facts: {
    id: string;
    label: string;
    unit: string;
    source: string;
    range: NumberRange;
    note: string;
  }[];
  requiredFactIds: string[];
  constants: { value: number; label: string }[];
  /** Factor a fact contributes: shares in % count as fractions. */
  compute: (values: FactValues) => number;
  /** The estimate someone gets when they fall for the main trap. */
  trap: (values: FactValues) => number;
  formula: (values: FactValues) => string;
  ideal: (values: FactValues) => string;
  principle: string;
}

export type ProductCaseSpec = StructuredSpec | EstimationSpec;

export function drawNumber(rng: Rng, range: NumberRange): number {
  const steps = Math.round((range.max - range.min) / range.step);
  const value = range.min + rng.int(0, steps) * range.step;
  // Avoid float noise such as 0.30000000000000004.
  return Number(value.toFixed(6));
}

export function fillNumbers(text: string, values: Record<string, number>) {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    if (value === undefined) throw new Error(`Unknown number ${match}`);
    return value.toLocaleString("en-US");
  });
}

/** Why a structured case has no single best answer, or `null`. */
export function findStructuredProblem(caseData: StructuredCase): string | null {
  const { hidden } = caseData;
  const fits = hidden.segments.map((segment) => segment.fit);
  const bestFit = Math.max(...fits);
  if (bestFit !== 3 || fits.filter((fit) => fit === bestFit).length !== 1) {
    return "the best segment must be unique with fit 3";
  }
  const best = hidden.segments.find((segment) => segment.fit === bestFit)!;
  const severities = segmentSeverities(caseData, best.id)
    .map((entry) => entry.severity)
    .sort((a, b) => b - a);
  if (severities[1] <= severities[2]) {
    return "the best segment has no clear top two problems";
  }
  const ranked = rankSolutions(caseData, topProblems(caseData, best.id));
  if (ranked[0].priority <= ranked[1].priority) {
    return "no single best solution to build first";
  }
  if (ranked[2].priority <= ranked[3].priority) {
    return "no clear top three solutions";
  }
  const success = hidden.metrics.filter((metric) => metric.success === 2);
  if (success.length !== 1) return "there must be one best success metric";
  if (!hidden.metrics.some((metric) => metric.guardrail === 2)) {
    return "there must be a good guardrail";
  }
  if (success[0].guardrail === 2) {
    return "the success metric cannot also be the best guardrail";
  }
  return null;
}

export function generateStructuredCase(spec: StructuredSpec): StructuredCase {
  const rng = createRng(spec.seed);
  const numbersRng = rng.fork("numbers");
  const research = spec.research.map((note) => {
    const values = Object.fromEntries(
      Object.entries(note.numbers ?? {}).map(([key, range]) => [
        key,
        drawNumber(numbersRng, range),
      ]),
    );
    return {
      id: note.id,
      source: note.source,
      text: fillNumbers(note.text, values),
    };
  });
  const orderRng = rng.fork("order");
  const caseData = structuredCaseSchema.parse({
    id: spec.id,
    moduleId: "product-case",
    seed: spec.seed,
    difficulty: spec.difficulty,
    company: spec.company,
    title: spec.title,
    brief: spec.brief,
    kind: spec.kind,
    prompt: spec.prompt,
    timeLimitMinutes: spec.timeLimitMinutes,
    research,
    segments: orderRng
      .shuffle(spec.segments)
      .map(({ id, name, description }) => ({ id, name, description })),
    problems: orderRng
      .shuffle(spec.problems)
      .map(({ id, statement }) => ({ id, statement })),
    solutions: orderRng
      .shuffle(spec.solutions)
      .map(({ id, name, description, effort }) => ({
        id,
        name,
        description,
        effort,
      })),
    metrics: orderRng
      .shuffle(spec.metrics)
      .map(({ id, name, definition }) => ({ id, name, definition })),
    hidden: {
      segments: spec.segments.map(({ id, fit, why }) => ({ id, fit, why })),
      problems: spec.problems.map(({ id, severity, why }) => ({
        id,
        severity,
        why,
      })),
      solutions: spec.solutions.map(({ id, relief, why }) => ({
        id,
        relief,
        why,
      })),
      metrics: spec.metrics.map(({ id, success, guardrail, why }) => ({
        id,
        success,
        guardrail,
        why,
      })),
      ideal: spec.ideal,
      principle: spec.principle,
    },
  });
  const problem = findStructuredProblem(caseData);
  if (problem) throw new Error(`Case "${spec.id}": ${problem}`);
  return caseData;
}

/** Below this ratio between trap and truth, the trap would not matter. */
const MIN_TRAP_GAP = 1.5;

export function generateEstimationCase(spec: EstimationSpec): EstimationCase {
  const rng = createRng(spec.seed).fork("facts");
  const values: FactValues = {};
  for (const fact of spec.facts) values[fact.id] = drawNumber(rng, fact.range);
  const truth = Math.round(spec.compute(values));
  const trapEstimate = Math.round(spec.trap(values));
  const gap = Math.max(truth, trapEstimate) / Math.min(truth, trapEstimate);
  if (gap < MIN_TRAP_GAP) {
    throw new Error(
      `Case "${spec.id}": the trap changes the estimate too little`,
    );
  }
  const orderRng = createRng(spec.seed).fork("order");
  return estimationCaseSchema.parse({
    id: spec.id,
    moduleId: "product-case",
    seed: spec.seed,
    difficulty: spec.difficulty,
    company: spec.company,
    title: spec.title,
    brief: spec.brief,
    kind: "estimation",
    prompt: spec.prompt,
    answerUnit: spec.answerUnit,
    timeLimitMinutes: spec.timeLimitMinutes,
    facts: orderRng.shuffle(spec.facts).map((fact) => ({
      id: fact.id,
      label: fact.label,
      value: values[fact.id],
      unit: fact.unit,
      source: fact.source,
    })),
    hidden: {
      requiredFactIds: spec.requiredFactIds,
      factNotes: Object.fromEntries(
        spec.facts.map((fact) => [fact.id, fact.note]),
      ),
      constants: spec.constants,
      truth,
      formula: spec.formula(values),
      trapEstimate,
      ideal: spec.ideal(values),
      principle: spec.principle,
    },
  });
}

export function generateProductCase(spec: ProductCaseSpec) {
  return spec.kind === "estimation"
    ? generateEstimationCase(spec)
    : generateStructuredCase(spec);
}
