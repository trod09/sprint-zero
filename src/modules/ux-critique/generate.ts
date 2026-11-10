/**
 * On-demand UX Critique screens: a product of the chosen industry, a screen
 * template and the flawed regions, all from the seed.
 */
import type { GenerateParams, IndustryKey } from "@/core/case-engine";
import { createRng } from "@/core/rng";

import { uxCaseSpecs } from "./content/cases";
import { generateUxCase } from "./generator";
import { TEMPLATES, type UxCritiqueCase } from "./schema";

const INDUSTRY_LABEL: Record<IndustryKey, string> = {
  fintech: "Fintech",
  marketplace: "Marketplace",
  saas: "SaaS B2B",
  consumer: "Consumer",
};

export function generateUxOnDemand(
  params: GenerateParams & { caseId: string },
): UxCritiqueCase {
  const rng = createRng(params.seed);
  const pool = uxCaseSpecs.filter(
    (spec) => spec.company.industry === INDUSTRY_LABEL[params.industry],
  );
  if (pool.length === 0) {
    throw new Error(`No UX product for industry "${params.industry}"`);
  }
  const product = rng.fork("product").pick(pool);
  const template = rng.fork("template").pick(TEMPLATES);
  return generateUxCase({
    ...product,
    id: params.caseId,
    seed: params.seed,
    difficulty: params.difficulty,
    template,
    title: `${product.company.name}: the ${template} page (case #${params.seed})`,
  });
}
