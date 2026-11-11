"use server";

import {
  scoreSubmission,
  type SubmissionOutcome,
} from "@/core/case-engine/submission";
import { allowAction } from "@/lib/action-guard.server";
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
  if (!(await allowAction())) {
    return {
      ok: false,
      error: {
        code: "rate_limited",
        message: "Too many requests. Wait a minute and try again.",
      },
    };
  }
  return scoreSubmission(caseRepository, input);
}
