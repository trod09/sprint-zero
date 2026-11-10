/**
 * The featured Quick Cases, built from the specifications when the module
 * loads: the generator is pure, so the same seed always gives the same case.
 */
import type { Difficulty } from "@/core/case-engine";

import { quickSpecs } from "./content/specs";
import { generateQuickCase } from "./generator";
import type { QuickCase } from "./schema";

export const FEATURED_QUICK_CASES: readonly {
  id: string;
  spec: string;
  seed: number;
  difficulty: Difficulty;
}[] = [
  {
    id: "quick-cases-rosterly-pricing",
    spec: "rosterly-pricing",
    seed: 81_101,
    difficulty: "apm",
  },
  {
    id: "quick-cases-lumen-kids-launch",
    spec: "lumen-kids-launch",
    seed: 81_202,
    difficulty: "pm",
  },
  {
    id: "quick-cases-sendwell-double-charge",
    spec: "sendwell-double-charge",
    seed: 81_303,
    difficulty: "pm",
  },
  {
    id: "quick-cases-fixly-background-checks",
    spec: "fixly-background-checks",
    seed: 81_404,
    difficulty: "senior",
  },
];

export function buildFeaturedQuickCases(): QuickCase[] {
  return FEATURED_QUICK_CASES.map(({ id, spec, seed, difficulty }) =>
    generateQuickCase({
      spec: quickSpecs.find((s) => s.key === spec)!,
      id,
      seed,
      difficulty,
    }),
  );
}
