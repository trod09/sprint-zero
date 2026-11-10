"use client";

/**
 * Submits an answer for scoring, stores the attempt and opens its results.
 * Shared by every module's case view.
 */
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import type { SubmissionOutcome } from "@/core/case-engine/submission";
import type { ScoreResult } from "@/core/scoring";
import { ATTEMPT_SCHEMA_VERSION, getAttemptStore } from "@/core/storage";

import { notifyAttemptsChanged } from "./use-attempts";

export type SubmitAttempt = (input: unknown) => Promise<SubmissionOutcome>;

export function useSubmitAttempt({
  caseId,
  moduleId,
  submit,
  failedMessage,
  onSubmitted,
}: {
  caseId: string;
  moduleId: string;
  submit: SubmitAttempt;
  /** Shown when the server cannot be reached. */
  failedMessage: string;
  /** Runs once the answer is scored, e.g. to clear a draft. */
  onSubmitted?: () => void;
}) {
  const router = useRouter();
  const [isSubmitting, startSubmitting] = useTransition();
  const [error, setError] = useState<string | null>(null);
  /** Set when the score came back but the attempt could not be stored. */
  const [inlineResult, setInlineResult] = useState<ScoreResult | null>(null);
  const startedAt = useRef<string | null>(null);

  useEffect(() => {
    startedAt.current ??= new Date().toISOString();
  }, []);

  const submitAnswer = (answer: unknown) => {
    setError(null);
    startSubmitting(async () => {
      let outcome: SubmissionOutcome;
      try {
        outcome = await submit({ caseId, answer });
      } catch {
        setError(failedMessage);
        return;
      }
      if (!outcome.ok) {
        setError(outcome.error.message);
        return;
      }
      const submittedAt = new Date().toISOString();
      const attemptId = crypto.randomUUID();
      onSubmitted?.();
      try {
        await getAttemptStore().saveAttempt({
          schemaVersion: ATTEMPT_SCHEMA_VERSION,
          id: attemptId,
          caseId,
          moduleId,
          startedAt: startedAt.current ?? submittedAt,
          submittedAt,
          answer,
          result: outcome.result,
        });
      } catch {
        setInlineResult(outcome.result);
        return;
      }
      notifyAttemptsChanged();
      router.push(`/results/${attemptId}`);
    });
  };

  return {
    submitAnswer,
    isSubmitting,
    error,
    clearError: () => setError(null),
    inlineResult,
  };
}
