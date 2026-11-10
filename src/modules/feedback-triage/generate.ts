/**
 * On-demand Feedback Triage inboxes: a product of the chosen industry, six
 * themes drawn from the library and the product's critical problem.
 */
import type { GenerateParams } from "@/core/case-engine";
import { createRng } from "@/core/rng";
import { INDUSTRY_LABEL } from "@/modules/shared/industry";

import { triageCaseSpecs } from "./content/cases";
import { THEME_KEYS } from "./content/themes";
import { generateTriageCase, TRIAGE_PROFILES } from "./generator";
import type { FeedbackTriageCase } from "./schema";

export function generateTriageOnDemand(
  params: GenerateParams & { caseId: string },
): FeedbackTriageCase {
  const rng = createRng(params.seed);
  const pool = triageCaseSpecs.filter(
    (spec) => spec.company.industry === INDUSTRY_LABEL[params.industry],
  );
  if (pool.length === 0) {
    throw new Error(`No triage product for industry "${params.industry}"`);
  }
  const product = rng.fork("product").pick(pool);
  const themeCount = TRIAGE_PROFILES[params.difficulty].themeSizes.length;
  const themes = rng.fork("themes").sample(THEME_KEYS, themeCount);
  const caseData = generateTriageCase({
    ...product,
    id: params.caseId,
    seed: params.seed,
    difficulty: params.difficulty,
    themes,
  });
  return {
    ...caseData,
    title: `${product.company.name}: another month of feedback (case #${params.seed})`,
  };
}
