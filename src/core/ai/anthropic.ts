/**
 * Wires the AI client to the real Anthropic SDK using server environment
 * variables. Calls to Claude always happen on the server; the key never
 * reaches the browser.
 */
import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { createAIClient, type AIClient } from "./client";
import { AIConfigError } from "./errors";

type Env = Record<string, string | undefined>;

export function isAIConfigured(env: Env = process.env): boolean {
  return Boolean(
    env.ANTHROPIC_API_KEY?.trim() || env.ANTHROPIC_AUTH_TOKEN?.trim(),
  );
}

let defaultClient: AIClient | undefined;

/**
 * The app-wide AI client. Throws `AIConfigError` when no credentials are set,
 * so the app still runs without a key and only AI features are unavailable.
 */
export function getAIClient(): AIClient {
  if (!isAIConfigured()) throw new AIConfigError();
  if (!defaultClient) {
    // Reads ANTHROPIC_API_KEY (or ANTHROPIC_AUTH_TOKEN) from the environment.
    const anthropic = new Anthropic();
    defaultClient = createAIClient({
      transport: {
        create: (params, options) =>
          anthropic.beta.messages.create(params, options),
      },
      model: process.env.ANTHROPIC_MODEL,
    });
  }
  return defaultClient;
}
