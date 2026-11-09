"use server";

import {
  scoreSubmission,
  type SubmissionOutcome,
} from "@/core/case-engine/submission";
import { caseRepository } from "@/modules/registry.server";

/**
 * Scores an answer on the server and returns the official result together
 * with the revealed case. Ground truth only leaves the server through here.
 *
 * `input` comes from the browser, so it is validated as untrusted data.
 */
export async function submitAttempt(
  input: unknown,
): Promise<SubmissionOutcome> {
  return scoreSubmission(caseRepository, input);
}
