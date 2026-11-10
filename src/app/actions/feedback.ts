"use server";

import { getAIClient, isAIConfigured } from "@/core/ai/anthropic";
import {
  generateFeedback,
  type FeedbackOutcome,
} from "@/core/case-engine/feedback";
import { caseRepository } from "@/modules/registry.server";

/**
 * Asks the AI coach for qualitative feedback on a submitted answer. The score
 * is recomputed here, so the browser cannot influence what the model is told.
 */
export async function requestFeedback(
  input: unknown,
): Promise<FeedbackOutcome> {
  return generateFeedback(
    {
      repository: caseRepository,
      isConfigured: () => isAIConfigured(),
      getClient: getAIClient,
    },
    input,
  );
}
