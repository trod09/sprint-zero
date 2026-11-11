/**
 * Fixed-window rate limits for Server Actions. Every action is a public POST
 * endpoint, so the expensive ones (the AI coach costs money per call) are
 * limited per client and, for AI, also in total per day.
 *
 * The counters live in this server's memory: enough for one instance and for
 * stopping a script hammering an endpoint. With several instances (Vercel
 * scales out), each keeps its own count; move the counters to a shared store
 * (e.g. Upstash Redis or Supabase) when accounts arrive in Phase 2.
 */
import { createLruCache } from "./lru";

export interface RateLimitResult {
  ok: boolean;
  /** Milliseconds until the window resets; 0 when allowed. */
  retryAfterMs: number;
}

export interface RateLimiter {
  /** Counts one request for `key` and says whether it is allowed. */
  take(key: string): RateLimitResult;
}

export interface RateLimiterOptions {
  /** Requests allowed per key and window. */
  limit: number;
  windowMs: number;
  /** Keys remembered at once; the least recently seen are forgotten. */
  maxKeys?: number;
  now?: () => number;
}

export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 10_000,
  now = Date.now,
}: RateLimiterOptions): RateLimiter {
  const windows = createLruCache<string, { start: number; count: number }>(
    maxKeys,
  );
  return {
    take(key) {
      const time = now();
      let window = windows.get(key);
      if (!window || time - window.start >= windowMs) {
        window = { start: time, count: 0 };
      }
      if (window.count >= limit) {
        windows.set(key, window);
        return { ok: false, retryAfterMs: window.start + windowMs - time };
      }
      window.count += 1;
      windows.set(key, window);
      return { ok: true, retryAfterMs: 0 };
    },
  };
}

/**
 * Who is calling, from the request headers. On Vercel `x-real-ip` and
 * `x-forwarded-for` are set by the platform and cannot be spoofed; behind a
 * self-hosted proxy, make sure it overwrites them rather than appending.
 */
export function clientKey(headers: {
  get(name: string): string | null;
}): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

/** Reads a positive integer from the environment, or the fallback. */
export function positiveIntFromEnv(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
