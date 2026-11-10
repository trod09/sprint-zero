import type { PrdCase, PublicPrdCase } from "./schema";

/** The case without ratings, the right buckets or the ideal one-pager. */
export function toPublicPrdCase(caseData: PrdCase): PublicPrdCase {
  const { hidden: _truth, ...rest } = caseData;
  return rest;
}
