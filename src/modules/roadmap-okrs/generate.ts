/**
 * On-demand Roadmap & OKRs cases: the company of the chosen industry, the
 * initiatives of the level, and efforts and values nudged by the seed.
 */
import type { GenerateParams } from "@/core/case-engine";

import { roadmapSpecs } from "./content/specs";
import { generateRoadmapCase } from "./generator";
import type { RoadmapCase } from "./schema";

export function generateRoadmapOnDemand(
  params: GenerateParams & { caseId: string },
): RoadmapCase {
  const spec = roadmapSpecs.find((s) => s.industry === params.industry);
  if (!spec) throw new Error(`No roadmap company for "${params.industry}"`);
  return generateRoadmapCase({
    spec,
    id: params.caseId,
    seed: params.seed,
    difficulty: params.difficulty,
    title: `${spec.title} (case #${params.seed})`,
  });
}
