/**
 * The one place sign-in goes through. Accounts arrive with Supabase
 * (MASTER_PROMPT, Hito 2.1); until then every call answers
 * "not_configured" and progress stays in this browser. Wiring Supabase means
 * implementing these two functions and flipping `AUTH_ENABLED`.
 *
 * No passwords: email sign-in sends a one-time magic link.
 */
export const AUTH_ENABLED = false;

export type AuthResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "invalid_email" | "failed" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL.test(email.trim());
}

export async function requestMagicLink(email: string): Promise<AuthResult> {
  if (!isValidEmail(email)) return { ok: false, reason: "invalid_email" };
  if (!AUTH_ENABLED) return { ok: false, reason: "not_configured" };
  return { ok: false, reason: "failed" };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  if (!AUTH_ENABLED) return { ok: false, reason: "not_configured" };
  return { ok: false, reason: "failed" };
}
