/**
 * Qualitative AI feedback on a submitted answer.
 *
 * The official score is computed first, by code, and handed to the model as a
 * fact to explain. The model only writes text, constrained to a schema. If AI
 * is not configured or fails, the caller gets a typed error and the rest of
 * the results screen works as usual.
 */
import "server-only";

import type { AIClient } from "@/core/ai/client";
import { AIError } from "@/core/ai/errors";
import { dataBlock, FEEDBACK_SYSTEM_PROMPT } from "@/core/ai/prompts";

import type { CaseRepository } from "./case-repository";
import { aiFeedbackSchema, type AIFeedback } from "./feedback-schema";
import { submissionSchema } from "./submission";

export { aiFeedbackSchema, type AIFeedback };

export type FeedbackErrorCode =
  | "not_configured"
  | "invalid_request"
  | "case_not_found"
  | "invalid_answer"
  | "rate_limited"
  | "ai_failed";

export type FeedbackOutcome =
  | { ok: true; feedback: AIFeedback; model: string }
  | { ok: false; error: { code: FeedbackErrorCode; message: string } };

export interface FeedbackDependencies {
  repository: CaseRepository;
  isConfigured: () => boolean;
  getClient: () => AIClient;
}

const FAILURE_MESSAGES: Record<FeedbackErrorCode, string> = {
  not_configured: "AI feedback is not available on this server.",
  invalid_request: "The request is malformed.",
  case_not_found: "This case does not exist.",
  invalid_answer: "The answer does not match what this case expects.",
  rate_limited: "Too many feedback requests. Try again later.",
  ai_failed:
    "The AI coach could not write feedback this time. Try again later.",
};

export const feedbackFailure = (code: FeedbackErrorCode): FeedbackOutcome => ({
  ok: false,
  error: { code, message: FAILURE_MESSAGES[code] },
});

export function buildFeedbackPrompt(input: {
  rubric: string;
  score: { total: number; criteria: readonly unknown[] };
  analysis: unknown;
  learnerAnswer: unknown;
}): { system: string; prompt: string } {
  return {
    system: `${FEEDBACK_SYSTEM_PROMPT}\n\nFollow this rubric for this simulation:\n${input.rubric}`,
    prompt: [
      dataBlock("official_score", input.score),
      dataBlock("case_analysis", input.analysis),
      dataBlock("learner_answer", input.learnerAnswer),
      "Write feedback for the learner: a short summary, up to three things they did well, up to three things to improve, and one principle to remember. Refer to tickets by id and title.",
    ].join("\n\n"),
  };
}

export async function generateFeedback(
  deps: FeedbackDependencies,
  input: unknown,
): Promise<FeedbackOutcome> {
  if (!deps.isConfigured()) return feedbackFailure("not_configured");

  const submission = submissionSchema.safeParse(input);
  if (!submission.success) return feedbackFailure("invalid_request");

  const record = await deps.repository.getCaseRecord(submission.data.caseId);
  if (!record) return feedbackFailure("case_not_found");

  const prepared = record.feedbackInput(submission.data.answer);
  if (!prepared.ok) return feedbackFailure("invalid_answer");

  const { system, prompt } = buildFeedbackPrompt({
    rubric: prepared.rubric,
    // Only the official breakdown: module extras (reports) go in the analysis.
    score: { total: prepared.result.total, criteria: prepared.result.criteria },
    analysis: prepared.context.analysis,
    learnerAnswer: prepared.context.learnerAnswer,
  });

  try {
    const { data, model } = await deps.getClient().generateStructured({
      label: `${record.moduleId}.feedback`,
      schema: aiFeedbackSchema,
      system,
      prompt,
      effort: "medium",
      maxTokens: 4_000,
    });
    return { ok: true, feedback: data, model };
  } catch (error) {
    if (error instanceof AIError) {
      return feedbackFailure(
        error.code === "not_configured" ? "not_configured" : "ai_failed",
      );
    }
    throw error;
  }
}
