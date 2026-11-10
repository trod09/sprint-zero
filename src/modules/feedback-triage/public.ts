import type { FeedbackTriageCase, PublicFeedbackTriageCase } from "./schema";

/** The inbox without the themes behind it. */
export function toPublicTriageCase(
  caseData: FeedbackTriageCase,
): PublicFeedbackTriageCase {
  const { hidden: _truth, ...rest } = caseData;
  return rest;
}
