"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  AIFeedbackPanel,
  type RequestFeedback,
} from "@/components/ai-feedback-panel";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { Button } from "@/components/ui/button";
import type { BaseCase } from "@/core/case-engine";
import type { SubmissionOutcome } from "@/core/case-engine/submission";
import type { ScoreResult } from "@/core/scoring";
import { getAttemptStore, type Attempt } from "@/core/storage";
import { getMessages } from "@/i18n";
import { getModuleMeta } from "@/modules/catalog";
import { ModuleResults } from "@/modules/results-view";

export type Rescore = (input: unknown) => Promise<SubmissionOutcome>;

type State =
  | { name: "loading" }
  | { name: "missing" }
  | { name: "error" }
  | {
      name: "ready";
      attempt: Attempt;
      result: ScoreResult;
      revealedCase: BaseCase;
    };

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

/**
 * Results of a stored attempt. The attempt (answer) lives in this browser; the
 * score and the solution are recomputed on the server from that answer, which
 * gives the same result every time because scoring is deterministic.
 */
export function AttemptResults({
  attemptId,
  rescore,
  requestFeedback,
}: {
  attemptId: string;
  rescore: Rescore;
  requestFeedback: RequestFeedback;
}) {
  const messages = getMessages();
  const copy = messages.results;
  const [state, setState] = useState<State>({ name: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let attempt: Attempt | null;
      try {
        attempt = await getAttemptStore().getAttempt(attemptId);
      } catch {
        attempt = null;
      }
      if (!attempt) {
        if (!cancelled) setState({ name: "missing" });
        return;
      }
      try {
        const outcome = await rescore({
          caseId: attempt.caseId,
          answer: attempt.answer,
        });
        if (cancelled) return;
        setState(
          outcome.ok
            ? {
                name: "ready",
                attempt,
                result: outcome.result,
                revealedCase: outcome.revealedCase,
              }
            : { name: "error" },
        );
      } catch {
        if (!cancelled) setState({ name: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptId, rescore]);

  if (state.name === "loading") {
    return (
      <p
        role="status"
        className="text-muted-foreground py-24 text-center text-sm"
      >
        {copy.loading}
      </p>
    );
  }

  if (state.name !== "ready") {
    const missing = state.name === "missing";
    return (
      <div className="py-24">
        <h1 className="font-heading text-xl font-semibold">
          {missing ? copy.missingTitle : copy.errorTitle}
        </h1>
        <p className="text-muted-foreground mt-2">
          {missing ? copy.missingBody : copy.errorBody}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/#modules">{messages.notFound.cta}</Link>
        </Button>
      </div>
    );
  }

  const { attempt, result, revealedCase } = state;
  const meta = getModuleMeta(revealedCase.moduleId);

  return (
    <div className="space-y-6">
      {meta && (
        <Link
          href={`/modules/${meta.id}`}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex items-center gap-1.5 rounded-md text-sm transition-colors focus-visible:ring-3 focus-visible:outline-none"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {copy.backToModule(meta.name)}
        </Link>
      )}

      <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="bg-card animate-in fade-in-0 slide-in-from-bottom-2 rounded-xl border p-6 duration-500">
          <p className="text-muted-foreground text-sm">
            {revealedCase.company.name} · {revealedCase.company.industry} ·{" "}
            {messages.difficulty[revealedCase.difficulty]}
          </p>
          <h1 className="font-heading mt-1 text-xl font-semibold tracking-tight text-balance">
            {revealedCase.title}
          </h1>
          <p className="mt-4 flex items-baseline gap-1">
            <span className="sr-only">{copy.score}: </span>
            <span className="font-heading text-6xl font-semibold tabular-nums">
              {result.total}
            </span>
            <span className="text-muted-foreground text-xl">{copy.outOf}</span>
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            {copy.playedOn(dateFormat.format(new Date(attempt.submittedAt)))}
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link href={`/case/${revealedCase.id}`}>
              <RotateCcw aria-hidden="true" />
              {copy.retry}
            </Link>
          </Button>
        </div>
        <section
          aria-labelledby="breakdown-title"
          className="bg-card rounded-xl border p-6"
        >
          <h2 id="breakdown-title" className="font-heading font-semibold">
            {copy.breakdown}
          </h2>
          <div className="mt-4">
            <ScoreBreakdown criteria={result.criteria} />
          </div>
        </section>
      </header>

      <AIFeedbackPanel attempt={attempt} requestFeedback={requestFeedback} />

      <ModuleResults
        result={result}
        revealedCase={revealedCase}
        answer={attempt.answer}
      />
    </div>
  );
}
