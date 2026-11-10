/**
 * On-demand Product Cases are market-sizing estimations: the template sets
 * the chain of factors, the seed draws every number, and the difficulty
 * decides how many distracting facts sit on the fact sheet.
 *
 * Design, improvement and strategy cases are written by hand (or by Claude,
 * once the text pipeline has a key) and are not generated here.
 */
import type { Difficulty, GenerateParams } from "@/core/case-engine";
import { createRng } from "@/core/rng";

import {
  estimationTemplates,
  type EstimationTemplate,
  type TemplateFact,
} from "./content/estimations";
import { formatFact } from "./format";
import {
  generateEstimationCase,
  type EstimationSpec,
  type FactValues,
} from "./generator";
import type { EstimationCase } from "./schema";

/** Distracting facts on the sheet, besides the trap. */
const NOISE_FACTS: Record<Difficulty, number> = { apm: 1, pm: 2, senior: 3 };
const TIME_LIMIT: Record<Difficulty, number> = { apm: 20, pm: 15, senior: 12 };

const factor = (fact: TemplateFact, values: FactValues) =>
  fact.unit === "%" ? values[fact.id] / 100 : values[fact.id];

/** Turns a template into the spec the estimation generator understands. */
export function estimationSpecFrom(
  template: EstimationTemplate,
  options: { id: string; seed: number; difficulty: Difficulty },
): EstimationSpec {
  const noise = createRng(options.seed)
    .fork("noise")
    .sample(
      template.facts.filter((fact) => fact.role === "noise"),
      NOISE_FACTS[options.difficulty],
    );
  const facts = template.facts.filter(
    (fact) => fact.role !== "noise" || noise.includes(fact),
  );
  const base = facts.find((fact) => fact.role === "base");
  const trap = facts.find((fact) => fact.role === "trap");
  if (!base || !trap) {
    throw new Error(`Template "${template.key}" needs a base and a trap`);
  }
  const chain = facts.filter((fact) => fact.role === "factor");
  const constant = template.constants.reduce((total, c) => total * c.value, 1);
  const product = (start: TemplateFact, values: FactValues) =>
    chain.reduce((total, fact) => total * factor(fact, values), 1) *
    factor(start, values) *
    constant;
  const formula = (values: FactValues) =>
    [
      `${formatFact({ value: values[base.id], unit: "" }).trim()} ${base.short}`,
      ...chain.map(
        (fact) =>
          `${formatFact({ value: values[fact.id], unit: fact.unit === "%" || fact.unit === "USD" ? fact.unit : "" }).trim()} ${fact.short}`,
      ),
      ...template.constants.map((c) => `${c.value} ${c.label}`),
    ].join(" x ");

  return {
    id: options.id,
    seed: options.seed,
    difficulty: options.difficulty,
    kind: "estimation",
    timeLimitMinutes: TIME_LIMIT[options.difficulty],
    answerUnit: template.answerUnit,
    company: template.company,
    title: `${template.title} (case #${options.seed})`,
    prompt: template.prompt,
    brief:
      "Leadership wants a quick estimate before spending on a launch. Analysts left you a fact sheet with more facts than you need, and some of them would lead you astray. Choose the facts the estimate needs, add any constant factors, and give your number.",
    facts: facts.map(({ id, label, unit, source, range, note }) => ({
      id,
      label,
      unit,
      source,
      range,
      note,
    })),
    requiredFactIds: [base.id, ...chain.map((fact) => fact.id)],
    constants: template.constants,
    compute: (values) => product(base, values),
    trap: (values) => product(trap, values),
    formula,
    ideal: (values) =>
      `${template.reasoning} The chain is: ${formula(values)}. Leave out: ${facts
        .filter((fact) => fact.role === "trap" || fact.role === "noise")
        .map((fact) => fact.label.toLowerCase())
        .join("; ")}.`,
    principle: template.principle,
  };
}

export function generateProductCaseOnDemand(
  params: GenerateParams & { caseId: string },
): EstimationCase {
  const pool = estimationTemplates.filter(
    (template) => template.industry === params.industry,
  );
  if (pool.length === 0) {
    throw new Error(`No estimation template for "${params.industry}"`);
  }
  const template = createRng(params.seed).fork("template").pick(pool);
  return generateEstimationCase(
    estimationSpecFrom(template, {
      id: params.caseId,
      seed: params.seed,
      difficulty: params.difficulty,
    }),
  );
}
