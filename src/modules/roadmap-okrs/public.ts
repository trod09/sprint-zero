import type { PublicRoadmapCase, RoadmapCase } from "./schema";

/** The case without ratings, values or the objective each initiative serves. */
export function toPublicRoadmapCase(caseData: RoadmapCase): PublicRoadmapCase {
  const { hidden: _truth, ...rest } = caseData;
  return rest;
}
