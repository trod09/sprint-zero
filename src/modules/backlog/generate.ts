/**
 * On-demand Backlog Simulator cases: a seed, a difficulty and an industry
 * pick a company from the content bank; the seeded generator does the rest.
 */
import type { GenerateParams } from "@/core/case-engine";
import { createRng } from "@/core/rng";

import { companies } from "./content/companies";
import { generateBacklogCase } from "./generator";
import type { BacklogCase } from "./schema";

export function generateBacklogOnDemand(
  params: GenerateParams & { caseId: string },
): BacklogCase {
  const pool = companies.filter((c) => c.industry === params.industry);
  if (pool.length === 0) {
    throw new Error(`No backlog company for industry "${params.industry}"`);
  }
  const company = createRng(params.seed).fork("company").pick(pool);
  const caseData = generateBacklogCase({
    caseId: params.caseId,
    seed: params.seed,
    difficulty: params.difficulty,
    companyKey: company.key,
  });
  return { ...caseData, title: `${caseData.title} (case #${params.seed})` };
}
