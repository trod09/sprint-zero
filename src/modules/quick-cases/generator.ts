/**
 * Builds a quick case from a specification. The seed draws every number in
 * the exhibits, and option ratings can depend on those numbers, so the same
 * scenario has a different right call from one case to the next.
 */
import type { Company, Difficulty, IndustryKey } from "@/core/case-engine";
import { createRng } from "@/core/rng";

import {
  MAX_RATING,
  quickCaseSchema,
  type QuickCase,
  type QuickKind,
} from "./schema";

export interface NumberRange {
  min: number;
  max: number;
  step: number;
}
export type Values = Record<string, number>;
type Text = string | ((values: Values) => string);
type Rating = number | ((values: Values) => number);

export interface QuickSpec {
  key: string;
  kind: QuickKind;
  industry: IndustryKey;
  company: Company;
  title: string;
  brief: string;
  numbers: Record<string, NumberRange>;
  /** Values computed from the drawn numbers, usable everywhere a number is. */
  derived?: (values: Values) => Values;
  /** Why these numbers make no clear case, or `null`. Others are redrawn. */
  reject?: (values: Values) => boolean;
  exhibits: {
    id: string;
    title: string;
    source: string;
    body?: Text;
    rows?: [string, Text][];
  }[];
  /** An extra exhibit that spells out the method, shown at the easiest level. */
  hint: { title: string; body: Text };
  steps: {
    id: string;
    title: string;
    question: Text;
    pick: number;
    weight: number;
    options: { id: string; text: Text; rating: Rating; why: Text }[];
  }[];
  writing: { label: string; placeholder: string };
  ideal: Text;
  principle: string;
}

const TIME_LIMIT: Record<Difficulty, number> = { apm: 15, pm: 12, senior: 9 };
const ATTEMPTS = 40;

export const money = (value: number) =>
  `$${Math.round(value).toLocaleString("en-US")}`;
export const count = (value: number) => value.toLocaleString("en-US");

function draw(spec: QuickSpec, seed: number, attempt: number): Values {
  const rng = createRng(seed).fork(`numbers-${attempt}`);
  const values: Values = {};
  for (const [key, range] of Object.entries(spec.numbers)) {
    const steps = Math.round((range.max - range.min) / range.step);
    values[key] = Number(
      (range.min + rng.int(0, steps) * range.step).toFixed(6),
    );
  }
  return { ...values, ...spec.derived?.(values) };
}

/** Why a case has no clear best answer, or `null`. */
export function findQuickProblem(caseData: QuickCase): string | null {
  for (const [index, step] of caseData.steps.entries()) {
    const ratings = caseData.hidden.steps[index].options
      .map((o) => o.rating)
      .sort((a, b) => b - a);
    if (ratings[0] !== MAX_RATING) {
      return `step "${step.id}" has no option rated ${MAX_RATING}`;
    }
    // The options that make the best answer must stand apart from the rest.
    if (ratings[step.pick - 1] <= ratings[step.pick]) {
      return `step "${step.id}" has no single best answer`;
    }
    if (ratings.at(-1)! > 1) return `step "${step.id}" has no weak option`;
  }
  return null;
}

export interface QuickCaseOptions {
  spec: QuickSpec;
  id: string;
  seed: number;
  difficulty: Difficulty;
  title?: string;
}

function build(options: QuickCaseOptions, values: Values): QuickCase {
  const { spec, seed, difficulty } = options;
  const say = (text: Text) =>
    typeof text === "function" ? text(values) : text;
  const order = createRng(seed).fork("order");
  const exhibits = spec.exhibits.map((exhibit) => ({
    id: exhibit.id,
    title: exhibit.title,
    source: exhibit.source,
    ...(exhibit.body ? { body: say(exhibit.body) } : {}),
    ...(exhibit.rows
      ? { rows: exhibit.rows.map(([label, value]) => [label, say(value)]) }
      : {}),
  }));
  if (difficulty === "apm") {
    exhibits.push({
      id: "hint",
      title: spec.hint.title,
      source: "Your manager",
      body: say(spec.hint.body),
    });
  }
  const steps = spec.steps.map((step) => ({
    ...step,
    options: order.fork(step.id).shuffle(step.options),
  }));

  return quickCaseSchema.parse({
    id: options.id,
    moduleId: "quick-cases",
    seed,
    difficulty,
    company: spec.company,
    title: options.title ?? spec.title,
    brief: spec.brief,
    kind: spec.kind,
    timeLimitMinutes: TIME_LIMIT[difficulty],
    exhibits,
    steps: steps.map((step) => ({
      id: step.id,
      title: step.title,
      question: say(step.question),
      pick: step.pick,
      options: step.options.map((o) => ({ id: o.id, text: say(o.text) })),
    })),
    writing: spec.writing,
    hidden: {
      steps: steps.map((step) => ({
        id: step.id,
        weight: step.weight,
        options: step.options.map((o) => ({
          id: o.id,
          rating: typeof o.rating === "function" ? o.rating(values) : o.rating,
          why: say(o.why),
        })),
      })),
      ideal: say(spec.ideal),
      principle: spec.principle,
    },
  });
}

export function generateQuickCase(options: QuickCaseOptions): QuickCase {
  let problem = "no numbers passed the specification's own check";
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const values = draw(options.spec, options.seed, attempt);
    if (options.spec.reject?.(values)) continue;
    const caseData = build(options, values);
    const found = findQuickProblem(caseData);
    if (found === null) return caseData;
    problem = found;
  }
  throw new Error(`Case "${options.id}": ${problem}`);
}
