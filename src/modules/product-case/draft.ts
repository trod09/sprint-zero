/** Draft key and timer helpers for Product Case. */
export const productCaseDraftKey = (caseId: string) =>
  `sprint-zero:product-case-draft:v1:${caseId}`;

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
