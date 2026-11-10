"use client";

import { useEffect, useState } from "react";

import { getAttemptStore, type Attempt } from "@/core/storage";

/**
 * Attempts saved in this browser, newest first. `null` until loaded, so the
 * server render and hydration never depend on localStorage.
 */
export function useAttempts(): {
  attempts: Attempt[] | null;
  reload: () => void;
} {
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let loaded: Attempt[];
      try {
        loaded = await getAttemptStore().listAttempts();
      } catch {
        loaded = [];
      }
      if (!cancelled) setAttempts(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, [version]);

  return { attempts, reload: () => setVersion((v) => v + 1) };
}

/** Best official score per case. */
export function bestScores(attempts: readonly Attempt[]): Map<string, number> {
  const best = new Map<string, number>();
  for (const attempt of attempts) {
    const current = best.get(attempt.caseId);
    if (current === undefined || attempt.result.total > current) {
      best.set(attempt.caseId, attempt.result.total);
    }
  }
  return best;
}
