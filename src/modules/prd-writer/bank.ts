/**
 * Every PRD specification the game can build cases from: the hand-written
 * ones in `content/cases.ts` and the data specs in `content/specs/` (drafted
 * with `npm run draft:prd-writer` and reviewed). Featured cases are built
 * from all of them; on-demand cases from those with an industry.
 */
import type { GenerateParams } from "@/core/case-engine";
import { createRng, hashString } from "@/core/rng";

import { prdSpecs } from "./content/cases";
import { prdSpecData } from "./content/specs";
import { generatePrdCase, type PrdSpec } from "./generator";
import type { PrdCase } from "./schema";
import { compilePrdSpec, type PrdBuild, type PrdSpecData } from "./spec-data";

/** The seed a data spec's featured case uses: stable for its key. */
export const featuredSeed = (key: string) => 61_000 + (hashString(key) % 900);

export const featuredPrdSpecs: readonly PrdSpec[] = [
  ...prdSpecs,
  ...prdSpecData.map((data) =>
    compilePrdSpec(data, {
      id: `prd-writer-${data.key}`,
      seed: featuredSeed(data.key),
    }),
  ),
];

/** A spec that can be rebuilt with any id, seed and level. */
type Rebuildable = { industry: string; build: (build: PrdBuild) => PrdSpec };

const rebuildable: readonly Rebuildable[] = [
  ...prdSpecs
    .filter((spec): spec is PrdSpec & { industry: string } => !!spec.industry)
    .map((spec) => ({
      industry: spec.industry,
      build: (build: PrdBuild): PrdSpec => ({
        ...spec,
        id: build.id,
        seed: build.seed,
        difficulty: build.difficulty ?? spec.difficulty,
        title: build.title ?? spec.title,
      }),
    })),
  ...prdSpecData.map((data: PrdSpecData) => ({
    industry: data.industry,
    build: (build: PrdBuild) => compilePrdSpec(data, build),
  })),
];

/** Industries that have at least one spec for on-demand cases. */
export const prdIndustries = [...new Set(rebuildable.map((r) => r.industry))];

export function generatePrdOnDemand(
  params: GenerateParams & { caseId: string },
): PrdCase {
  const pool = rebuildable.filter((r) => r.industry === params.industry);
  if (pool.length === 0) {
    throw new Error(`No PRD spec for industry "${params.industry}"`);
  }
  const picked = createRng(params.seed).fork("spec").pick(pool);
  const base = picked.build({ id: params.caseId, seed: params.seed });
  return generatePrdCase(
    picked.build({
      id: params.caseId,
      seed: params.seed,
      difficulty: params.difficulty,
      title: `${base.title} (case #${params.seed})`,
    }),
  );
}
