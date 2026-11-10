import type { InterviewCase, PublicInterviewCase } from "./schema";

/** The case without the persona's replies or which findings are true. */
export function toPublicInterviewCase(
  caseData: InterviewCase,
): PublicInterviewCase {
  const { hidden: _truth, ...rest } = caseData;
  return rest;
}
