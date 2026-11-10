"use client";

import { useMemo } from "react";

import {
  computeProgress,
  type CaseInfo,
  type Progress,
  type ProgressAttempt,
} from "@/core/progress";
import type { Attempt } from "@/core/storage";

import { useAttempts } from "./use-attempts";

export const toProgressAttempts = (
  attempts: readonly Attempt[],
): ProgressAttempt[] =>
  attempts.map((attempt) => ({
    id: attempt.id,
    caseId: attempt.caseId,
    moduleId: attempt.moduleId,
    submittedAt: attempt.submittedAt,
    score: attempt.result.total,
  }));

/** The player's progress from the attempts in this browser; `null` while loading. */
const NO_CASES: readonly CaseInfo[] = [];

export function useProgress(catalog: readonly CaseInfo[] = NO_CASES): {
  progress: Progress | null;
  attempts: Attempt[] | null;
} {
  const { attempts } = useAttempts();
  const progress = useMemo(
    () =>
      attempts ? computeProgress(toProgressAttempts(attempts), catalog) : null,
    [attempts, catalog],
  );
  return { progress, attempts };
}
