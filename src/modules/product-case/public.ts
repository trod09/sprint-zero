import type { ProductCase, PublicProductCase } from "./schema";

/** The case without its ratings, ideal answer or true estimate. */
export function toPublicProductCase(caseData: ProductCase): PublicProductCase {
  const { hidden: _truth, ...rest } = caseData;
  return rest;
}
