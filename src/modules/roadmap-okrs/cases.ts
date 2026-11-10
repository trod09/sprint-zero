/**
 * The featured Roadmap & OKRs cases. They are built from the specifications
 * when the module loads: the generator is pure, so the same seed always
 * gives the same case and there is no JSON to keep in sync.
 */
import type { Difficulty } from "@/core/case-engine";

import { roadmapSpecs } from "./content/specs";
import { generateRoadmapCase } from "./generator";
import type { RoadmapCase } from "./schema";

export const FEATURED_ROADMAP_CASES: readonly {
  id: string;
  spec: string;
  seed: number;
  difficulty: Difficulty;
}[] = [
  {
    id: "roadmap-okrs-coinpath-q3",
    spec: "coinpath",
    seed: 71_101,
    difficulty: "apm",
  },
  {
    id: "roadmap-okrs-fixly-launch",
    spec: "fixly",
    seed: 71_202,
    difficulty: "pm",
  },
  {
    id: "roadmap-okrs-potluck-autumn",
    spec: "potluck",
    seed: 71_303,
    difficulty: "pm",
  },
  {
    id: "roadmap-okrs-docketly-reliability",
    spec: "docketly",
    seed: 71_404,
    difficulty: "senior",
  },
];

export function buildFeaturedRoadmapCases(): RoadmapCase[] {
  return FEATURED_ROADMAP_CASES.map(({ id, spec, seed, difficulty }) =>
    generateRoadmapCase({
      spec: roadmapSpecs.find((s) => s.key === spec)!,
      id,
      seed,
      difficulty,
    }),
  );
}
