/**
 * Drafts kept in the browser while a case is in progress, so a reload does
 * not lose the answer. They hold only the learner's own choices.
 */
import type { z } from "zod";

const draftKey = (caseId: string) =>
  `sprint-zero:product-case-draft:v1:${caseId}`;

export function loadDraft<T>(
  caseId: string,
  schema: z.ZodType<T>,
  fallback: () => T,
): T {
  try {
    const raw = window.localStorage.getItem(draftKey(caseId));
    if (!raw) return fallback();
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fallback();
  } catch {
    return fallback();
  }
}

export function saveDraft(caseId: string, draft: unknown): void {
  try {
    window.localStorage.setItem(draftKey(caseId), JSON.stringify(draft));
  } catch {
    // Storage full or disabled: the case still works for this visit.
  }
}

export function clearDraft(caseId: string): void {
  try {
    window.localStorage.removeItem(draftKey(caseId));
  } catch {
    // Nothing to clean up.
  }
}

/** Seconds since the timer started, for the stored answer. */
export function timingFrom(timerStartedAt: number | null) {
  return timerStartedAt === null
    ? undefined
    : {
        timed: true,
        secondsUsed: Math.max(
          0,
          Math.min(86_400, Math.round((Date.now() - timerStartedAt) / 1000)),
        ),
      };
}

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
