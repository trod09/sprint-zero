/**
 * PRD specifications as plain data, so a model can write them and a person
 * can review them as JSON. The only logic a spec needs (derived numbers,
 * the baseline and the target range) is written as arithmetic over the
 * drawn numbers and evaluated by a small parser here: no `eval`.
 *
 * `compilePrdSpec` turns the data into the `PrdSpec` the generator uses, and
 * `checkPrdSpecData` says everything that is wrong with a draft, so it can be
 * sent back to the model to fix.
 */
import { z } from "zod";

import {
  DIFFICULTIES,
  difficultySchema,
  industryKeySchema,
} from "@/core/case-engine";

import {
  findPrdProblem,
  generatePrdCase,
  type PrdSpec,
  type Values,
} from "./generator";
import { BUCKETS, DOCUMENT_KINDS, HORIZONS } from "./schema";

const text = z.string().min(1);

/**
 * What a drafted spec looks like. Counts mirror the case schema; ids and
 * placeholders are checked by `checkPrdSpecData`, which explains failures in
 * words a model can act on.
 */
export const prdSpecDataSchema = z.object({
  /** Kebab-case, e.g. "fixly-rebook". Becomes part of the case id. */
  key: text,
  industry: industryKeySchema,
  difficulty: difficultySchema,
  feature: text,
  company: z.object({
    name: text,
    industry: text,
    stage: text,
    description: text,
  }),
  title: text,
  brief: text,
  /** Drawn from the seed: {name} in any text shows the value. */
  numbers: z
    .array(
      z.object({
        name: text,
        min: z.number(),
        max: z.number(),
        step: z.number(),
      }),
    )
    .min(2)
    .max(10),
  /** Computed in order from the numbers, e.g. goal = baseline + lift. */
  derived: z.array(z.object({ name: text, expression: text })).max(5),
  documents: z
    .array(
      z.object({
        id: text,
        kind: z.enum(DOCUMENT_KINDS),
        title: text,
        from: text,
        body: text,
      }),
    )
    .min(3)
    .max(6),
  evidence: z
    .array(
      z.object({
        id: text,
        text,
        strength: z.number().int().min(0).max(2),
        why: text,
      }),
    )
    .min(4)
    .max(8),
  metrics: z
    .array(
      z.object({
        id: text,
        name: text,
        definition: text,
        unit: text,
        note: text,
      }),
    )
    .min(3)
    .max(6),
  primaryMetricId: text,
  baseline: text,
  targetMin: text,
  targetMax: text,
  horizon: z.enum(HORIZONS),
  requirements: z
    .array(
      z.object({
        id: text,
        title: text,
        description: text,
        bucket: z.enum(BUCKETS),
        why: text,
      }),
    )
    .min(5)
    .max(10),
  risks: z
    .array(
      z.object({
        id: text,
        title: text,
        description: text,
        relevance: z.number().int().min(0).max(2),
        why: text,
      }),
    )
    .min(4)
    .max(8),
  ideal: z.object({
    problem: text,
    metrics: text,
    scope: text,
    risks: text,
  }),
  principle: text,
});
export type PrdSpecData = z.infer<typeof prdSpecDataSchema>;

// ------------------------------------------------------------ expressions

type Token =
  | { kind: "number"; value: number }
  | { kind: "name"; value: string }
  | { kind: "op"; value: "+" | "-" | "*" | "/" | "(" | ")" };

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /\s*(?:(\d+(?:\.\d+)?)|([a-zA-Z_][a-zA-Z0-9_]*)|([-+*/()]))/y;
  let index = 0;
  while (index < source.length) {
    if (/^\s+$/.test(source.slice(index))) break;
    pattern.lastIndex = index;
    const match = pattern.exec(source);
    if (!match) {
      throw new Error(`unexpected "${source.slice(index).trim()[0]}"`);
    }
    if (match[1]) tokens.push({ kind: "number", value: Number(match[1]) });
    else if (match[2]) tokens.push({ kind: "name", value: match[2] });
    else tokens.push({ kind: "op", value: match[3] as "+" });
    index = pattern.lastIndex;
  }
  return tokens;
}

/** The names an expression reads. Throws on a syntax error. */
export function expressionNames(source: string): string[] {
  const names: string[] = [];
  evaluate(
    source,
    new Proxy({} as Values, {
      get: (_, key) => {
        names.push(String(key));
        return 1;
      },
      has: () => true,
    }),
  );
  return [...new Set(names)];
}

/**
 * Evaluates `+ - * /`, parentheses, numbers and names. A name missing from
 * `values` is an error, as is dividing by zero.
 */
export function evaluate(source: string, values: Values): number {
  const tokens = tokenize(source);
  let position = 0;
  const peek = () => tokens[position];
  const take = () => tokens[position++];

  const primary = (): number => {
    const token = take();
    if (!token) throw new Error("the expression ends too early");
    if (token.kind === "number") return token.value;
    if (token.kind === "name") {
      if (!(token.value in values))
        throw new Error(`unknown name "${token.value}"`);
      return values[token.value];
    }
    if (token.value === "(") {
      const value = sum();
      const close = take();
      if (!close || close.value !== ")") throw new Error('missing ")"');
      return value;
    }
    if (token.value === "-") return -primary();
    throw new Error(`unexpected "${token.value}"`);
  };
  const product = (): number => {
    let value = primary();
    for (
      let next = peek();
      next?.kind === "op" && (next.value === "*" || next.value === "/");
      next = peek()
    ) {
      take();
      const right = primary();
      if (next.value === "/" && right === 0)
        throw new Error("division by zero");
      value = next.value === "*" ? value * right : value / right;
    }
    return value;
  };
  const sum = (): number => {
    let value = product();
    for (
      let next = peek();
      next?.kind === "op" && (next.value === "+" || next.value === "-");
      next = peek()
    ) {
      take();
      const right = product();
      value = next.value === "+" ? value + right : value - right;
    }
    return value;
  };

  const result = sum();
  if (position < tokens.length) {
    throw new Error(`unexpected "${String(tokens[position].value)}"`);
  }
  // Keep documents tidy: 62.000000001 should read 62.
  return Number(result.toFixed(6));
}

// --------------------------------------------------------------- compile

/** The id and seed of a case built from a data spec. */
export interface PrdBuild {
  id: string;
  seed: number;
  difficulty?: (typeof DIFFICULTIES)[number];
  title?: string;
}

export function compilePrdSpec(data: PrdSpecData, build: PrdBuild): PrdSpec {
  return {
    id: build.id,
    seed: build.seed,
    difficulty: build.difficulty ?? data.difficulty,
    industry: data.industry,
    company: data.company,
    title: build.title ?? data.title,
    brief: data.brief,
    feature: data.feature,
    numbers: Object.fromEntries(
      data.numbers.map(({ name, min, max, step }) => [
        name,
        { min, max, step },
      ]),
    ),
    derived:
      data.derived.length === 0
        ? undefined
        : (drawn) => {
            const values = { ...drawn };
            for (const { name, expression } of data.derived) {
              values[name] = evaluate(expression, values);
            }
            return values;
          },
    documents: data.documents,
    evidence: data.evidence,
    metrics: data.metrics,
    primaryMetricId: data.primaryMetricId,
    baseline: (values) => evaluate(data.baseline, values),
    targetRange: (values) => [
      evaluate(data.targetMin, values),
      evaluate(data.targetMax, values),
    ],
    horizon: data.horizon,
    requirements: data.requirements,
    risks: data.risks,
    ideal: data.ideal,
    principle: data.principle,
  };
}

// ----------------------------------------------------------------- check

const ID = /^[a-z][a-z0-9_]*$/;
const NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Seeds a draft must survive: the numbers move, the case must stay fair. */
export const CHECK_SEEDS = [1, 7, 42, 1234, 99_999] as const;

/** Every problem with a draft, in words a model can act on. Empty when valid. */
export function checkPrdSpecData(data: PrdSpecData): string[] {
  const issues: string[] = [];
  const issue = (message: string) => issues.push(message);

  if (!KEY.test(data.key))
    issue(`key "${data.key}" must be kebab-case, e.g. "fixly-rebook"`);

  // Numbers and derived values.
  const names = new Set<string>();
  for (const number of data.numbers) {
    if (!NAME.test(number.name))
      issue(`number name "${number.name}" must be a plain identifier`);
    if (names.has(number.name))
      issue(`number "${number.name}" is defined twice`);
    names.add(number.name);
    if (!(number.step > 0))
      issue(`number "${number.name}" needs a positive step`);
    if (number.max < number.min)
      issue(`number "${number.name}" has max below min`);
    else if (
      number.step > 0 &&
      (number.max - number.min) / number.step > 1000
    ) {
      issue(`number "${number.name}" has too many steps; use a bigger step`);
    }
  }
  for (const derived of data.derived) {
    if (!NAME.test(derived.name))
      issue(`derived name "${derived.name}" must be a plain identifier`);
    if (names.has(derived.name)) issue(`"${derived.name}" is defined twice`);
    try {
      for (const name of expressionNames(derived.expression)) {
        if (!names.has(name))
          issue(
            `derived "${derived.name}" uses "${name}", which is not defined before it`,
          );
      }
    } catch (error) {
      issue(`derived "${derived.name}": ${(error as Error).message}`);
    }
    names.add(derived.name);
  }
  for (const [field, expression] of [
    ["baseline", data.baseline],
    ["targetMin", data.targetMin],
    ["targetMax", data.targetMax],
  ] as const) {
    try {
      for (const name of expressionNames(expression)) {
        if (!names.has(name))
          issue(
            `${field} uses "${name}", which is not a number or derived value`,
          );
      }
    } catch (error) {
      issue(`${field}: ${(error as Error).message}`);
    }
  }

  // Ids and references.
  const lists = {
    documents: data.documents,
    evidence: data.evidence,
    metrics: data.metrics,
    requirements: data.requirements,
    risks: data.risks,
  };
  for (const [list, items] of Object.entries(lists)) {
    const seen = new Set<string>();
    for (const item of items) {
      if (!ID.test(item.id))
        issue(`${list} id "${item.id}" must be snake_case`);
      if (seen.has(item.id)) issue(`${list} id "${item.id}" repeats`);
      seen.add(item.id);
    }
  }
  if (!data.metrics.some((m) => m.id === data.primaryMetricId)) {
    issue(
      `primaryMetricId "${data.primaryMetricId}" is not one of the metrics`,
    );
  }

  // Placeholders must name a number or a derived value.
  const texts: [string, string][] = [
    ["brief", data.brief],
    ...data.documents.map(
      (d) => [`document ${d.id}`, d.body] as [string, string],
    ),
    ...data.evidence.flatMap(
      (e) =>
        [
          [`evidence ${e.id}`, e.text],
          [`evidence ${e.id} why`, e.why],
        ] as [string, string][],
    ),
    ...data.metrics.map(
      (m) => [`metric ${m.id} note`, m.note] as [string, string],
    ),
    ...data.requirements.map(
      (r) => [`requirement ${r.id} why`, r.why] as [string, string],
    ),
    ...data.risks.map((r) => [`risk ${r.id} why`, r.why] as [string, string]),
    ...Object.entries(data.ideal).map(
      ([k, v]) => [`ideal ${k}`, v] as [string, string],
    ),
  ];
  for (const [where, value] of texts) {
    for (const match of value.matchAll(/\{([^}]*)\}/g)) {
      if (!names.has(match[1]))
        issue(
          `${where} uses {${match[1]}}, which is not a number or derived value`,
        );
    }
  }

  // Ratings that make a fair puzzle.
  const top3 = (values: number[]) => {
    const sorted = [...values].sort((a, b) => b - a);
    return sorted.length >= 4 && sorted[2] > sorted[3];
  };
  if (!top3(data.evidence.map((e) => e.strength))) {
    issue(
      "evidence needs exactly three pieces rated 2 that clearly beat the rest (rate the others 0 or 1)",
    );
  }
  if (!top3(data.risks.map((r) => r.relevance))) {
    issue(
      "risks need exactly three rated 2 that clearly beat the rest (rate the others 0 or 1)",
    );
  }
  for (const bucket of BUCKETS) {
    if (!data.requirements.some((r) => r.bucket === bucket)) {
      issue(`no requirement is in the "${bucket}" bucket`);
    }
  }

  if (issues.length > 0) return issues;

  // Build real cases with several seeds: the numbers must keep it fair.
  for (const seed of CHECK_SEEDS) {
    try {
      const caseData = generatePrdCase(
        compilePrdSpec(data, { id: `prd-writer-${data.key}`, seed }),
      );
      const { baseline, targetMin, targetMax } = caseData.hidden.metric;
      if (!(targetMin <= targetMax)) {
        issue(
          `with seed ${seed} the target range is empty (${targetMin} to ${targetMax})`,
        );
      }
      if (baseline >= targetMin && baseline <= targetMax) {
        issue(
          `with seed ${seed} the baseline (${baseline}) is inside the target range: the goal must ask for a change`,
        );
      }
      const problem = findPrdProblem(caseData);
      if (problem) issue(`with seed ${seed}: ${problem}`);
    } catch (error) {
      issue(
        `with seed ${seed} the case does not build: ${(error as Error).message}`,
      );
    }
    if (issues.length > 0) break;
  }
  return issues;
}
