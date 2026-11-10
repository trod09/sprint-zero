/**
 * On-demand Quick Cases: each industry has its scenario, and the seed draws
 * the numbers that decide the right call.
 */
import type { GenerateParams } from "@/core/case-engine";

import { quickSpecs } from "./content/specs";
import { generateQuickCase } from "./generator";
import type { QuickCase } from "./schema";

export function generateQuickOnDemand(
  params: GenerateParams & { caseId: string },
): QuickCase {
  const spec = quickSpecs.find((s) => s.industry === params.industry);
  if (!spec) throw new Error(`No quick case for "${params.industry}"`);
  return generateQuickCase({
    spec,
    id: params.caseId,
    seed: params.seed,
    difficulty: params.difficulty,
    title: `${spec.title} (case #${params.seed})`,
  });
}
