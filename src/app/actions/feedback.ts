"use server";

import { getAIClient, isAIConfigured } from "@/core/ai/anthropic";
import {
  feedbackFailure,
  generateFeedback,
  type FeedbackOutcome,
} from "@/core/case-engine/feedback";
import { allowAIRequest } from "@/lib/action-guard.server";
import { caseRepository } from "@/modules/registry.server";

/**
 * Asks the AI coach for qualitative feedback on a submitted answer. The score
 * is recomputed here, so the browser cannot influence what the model is told.
 * Each call costs money, so it is rate limited per client and per day.
 */
export async function requestFeedback(
  input: unknown,
): Promise<FeedbackOutcome> {
  if (isAIConfigured() && !(await allowAIRequest())) {
    return feedbackFailure("rate_limited");
  }
  return generateFeedback(
    {
      repository: caseRepository,
      isConfigured: () => isAIConfigured(),
      getClient: getAIClient,
    },
    input,
  );
}
