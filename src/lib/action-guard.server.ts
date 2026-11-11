/**
 * Rate limits shared by every Server Action. Call `allowAction()` at the top
 * of an action, and `allowAIRequest()` before anything that calls Claude.
 * Limits can be tuned with environment variables (see `.env.example`).
 */
import "server-only";

import { headers } from "next/headers";

import { clientKey, createRateLimiter, positiveIntFromEnv } from "./rate-limit";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Plenty for playing (a Metric Drop investigation is a few dozen views). */
const actions = createRateLimiter({
  limit: positiveIntFromEnv(process.env.ACTION_LIMIT_PER_MINUTE, 600),
  windowMs: MINUTE,
});

/** AI feedback per client. Each call costs money. */
const aiPerClient = createRateLimiter({
  limit: positiveIntFromEnv(process.env.AI_FEEDBACK_PER_HOUR, 20),
  windowMs: HOUR,
});

/** AI feedback for everyone together: a ceiling on the daily bill. */
const aiTotal = createRateLimiter({
  limit: positiveIntFromEnv(process.env.AI_FEEDBACK_PER_DAY, 500),
  windowMs: DAY,
});

async function currentClient(): Promise<string> {
  return clientKey(await headers());
}

export async function allowAction(): Promise<boolean> {
  return actions.take(await currentClient()).ok;
}

export async function allowAIRequest(): Promise<boolean> {
  const client = await currentClient();
  if (!actions.take(client).ok) return false;
  if (!aiPerClient.take(client).ok) return false;
  return aiTotal.take("all").ok;
}
