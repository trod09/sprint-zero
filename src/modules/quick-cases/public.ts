import type { PublicQuickCase, QuickCase } from "./schema";

/** The case without option ratings, reasons or the model answer. */
export function toPublicQuickCase(caseData: QuickCase): PublicQuickCase {
  const { hidden: _truth, ...rest } = caseData;
  return rest;
}
