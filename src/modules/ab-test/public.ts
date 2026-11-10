import type { AbTestCase, PublicAbTestCase } from "./schema";

/** The case without its ground truth and simulation parameters. */
export function toPublicAbTestCase(caseData: AbTestCase): PublicAbTestCase {
  const { hidden: _truth, ...rest } = caseData;
  return rest;
}
