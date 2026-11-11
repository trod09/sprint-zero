/**
 * Scores a submitted answer on the server and reveals the ground truth.
 *
 * Scoring is deterministic, so calling this again with a stored answer returns
 * the exact same result. Results pages can rely on that to re-fetch the
 * solution instead of persisting it in the browser.
 */
import "server-only";

import { z } from "zod";

import type { ScoreResult } from "@/core/scoring";

import type { CaseRepository } from "./case-repository";
import { formatIssues } from "./registry";
import type { BaseCase } from "./types";

export const submissionSchema = z.object({
  caseId: z.string().min(1).max(120),
  answer: z.unknown(),
});
export type Submission = z.infer<typeof submissionSchema>;

export type SubmissionErrorCode =
  "invalid_request" | "case_not_found" | "invalid_answer" | "rate_limited";

export type SubmissionOutcome =
  | {
      ok: true;
      caseId: string;
      moduleId: string;
      /** Official deterministic score. */
      result: ScoreResult;
      /** Full case including ground truth, revealed because the user submitted. */
      revealedCase: BaseCase;
    }
  | {
      ok: false;
      error: { code: SubmissionErrorCode; message: string; issues?: string[] };
    };

export async function scoreSubmission(
  repository: CaseRepository,
  input: unknown,
): Promise<SubmissionOutcome> {
  const submission = submissionSchema.safeParse(input);
  if (!submission.success) {
    return {
      ok: false,
      error: {
        code: "invalid_request",
        message: "The submission is malformed.",
        issues: formatIssues(submission.error),
      },
    };
  }

  const record = await repository.getCaseRecord(submission.data.caseId);
  if (!record) {
    return {
      ok: false,
      error: { code: "case_not_found", message: "This case does not exist." },
    };
  }

  const outcome = record.score(submission.data.answer);
  if (!outcome.ok) {
    return {
      ok: false,
      error: {
        code: "invalid_answer",
        message: "The answer does not match what this case expects.",
        issues: outcome.issues,
      },
    };
  }

  return {
    ok: true,
    caseId: record.id,
    moduleId: record.moduleId,
    result: outcome.result,
    revealedCase: record.reveal(),
  };
}
