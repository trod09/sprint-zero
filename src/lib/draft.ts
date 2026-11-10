/**
 * Drafts kept in the browser while a case is in progress, so a reload does
 * not lose the answer. They hold only the learner's own choices, never case
 * data. Every call tolerates storage being full, disabled or tampered with.
 */
import type { z } from "zod";

export function loadDraft<T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: () => T,
): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback();
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fallback();
  } catch {
    return fallback();
  }
}

export function saveDraft(key: string, draft: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Storage full or disabled: the case still works for this visit.
  }
}

export function clearDraft(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to clean up.
  }
}
