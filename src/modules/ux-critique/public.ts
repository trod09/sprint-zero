import type { PublicUxCritiqueCase, UxCritiqueCase } from "./schema";

/** The screen without the list of planted problems. */
export function toPublicUxCase(caseData: UxCritiqueCase): PublicUxCritiqueCase {
  const { hidden: _truth, ...rest } = caseData;
  return rest;
}
