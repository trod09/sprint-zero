/**
 * Typed AI failures. AI output is always optional garnish on top of the
 * deterministic score, so callers catch `AIError` and degrade gracefully.
 */

export type AIErrorCode =
  | "not_configured"
  | "refusal"
  | "truncated"
  | "invalid_output"
  | "request_failed";

export class AIError extends Error {
  constructor(
    readonly code: AIErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** No API credentials on the server. */
export class AIConfigError extends AIError {
  constructor() {
    super(
      "not_configured",
      "AI features are not configured: set ANTHROPIC_API_KEY in .env.local (see .env.example).",
    );
  }
}

/** The model (and its fallback, if any) declined the request. */
export class AIRefusalError extends AIError {
  constructor(readonly category: string | null) {
    super(
      "refusal",
      `The model declined the request${category ? ` (category: ${category})` : ""}.`,
    );
  }
}

/** The response hit `max_tokens` before the JSON was complete. */
export class AITruncatedError extends AIError {
  constructor() {
    super("truncated", "The model response was cut off before it finished.");
  }
}

/** The output failed schema validation, also after the retry. */
export class AIValidationError extends AIError {
  constructor(
    readonly issues: readonly string[],
    readonly attempts: number,
  ) {
    super(
      "invalid_output",
      `The model output failed validation after ${attempts} attempt(s): ${issues.join("; ")}`,
    );
  }
}

/** The API call itself failed (network, rate limit, auth, server error...). */
export class AIRequestError extends AIError {
  constructor(
    message: string,
    readonly status: number | undefined,
    options?: ErrorOptions,
  ) {
    super("request_failed", message, options);
  }
}
