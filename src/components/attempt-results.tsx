"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  AIFeedbackPanel,
  type RequestFeedback,
} from "@/components/ai-feedback-panel";
import { ResultScreen } from "@/components/arcade/result-screen";
import type { CaseSummary } from "@/components/case-library";
import { Button } from "@/components/ui/button";
import type { BaseCase } from "@/core/case-engine";
import type { SubmissionOutcome } from "@/core/case-engine/submission";
import { rewardFor, type AttemptReward } from "@/core/progress";
import type { ScoreResult } from "@/core/scoring";
import { getAttemptStore, type Attempt } from "@/core/storage";
import { getMessages } from "@/i18n";
import { toProgressAttempts } from "@/lib/use-progress";
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
      reward: AttemptReward | null;
      nextHref: string;
    };

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

/**
 * The next case to play: the next unplayed case of the same module, then any
 * unplayed case, then the module page.
 */
export function nextCaseHref(
  caseId: string,
  moduleId: string,
  catalog: readonly CaseSummary[],
  attempts: readonly Attempt[],
): string {
  const played = new Set(attempts.map((a) => a.caseId));
  const index = catalog.findIndex((c) => c.id === caseId);
  const after = [...catalog.slice(index + 1), ...catalog.slice(0, index + 1)];
  const next =
    after.find((c) => c.moduleId === moduleId && !played.has(c.id)) ??
    after.find((c) => !played.has(c.id));
  return next ? `/case/${next.id}` : `/modules/${moduleId}`;
}

/**
 * Results of a stored attempt. The attempt (answer) lives in this browser; the
 * score and the solution are recomputed on the server from that answer, which
 * gives the same result every time because scoring is deterministic.
 */
export function AttemptResults({
  attemptId,
  rescore,
  requestFeedback,
  catalog,
}: {
  attemptId: string;
  rescore: Rescore;
  requestFeedback: RequestFeedback;
  /** Every curated case, for XP, badges and the next case. */
  catalog: readonly CaseSummary[];
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
        if (!outcome.ok) {
          setState({ name: "error" });
          return;
        }
        let all: Attempt[];
        try {
          all = await getAttemptStore().listAttempts();
        } catch {
          all = [attempt];
        }
        if (cancelled) return;
        setState({
          name: "ready",
          attempt,
          result: outcome.result,
          revealedCase: outcome.revealedCase,
          reward: rewardFor(toProgressAttempts(all), attempt.id, catalog),
          nextHref: nextCaseHref(
            attempt.caseId,
            outcome.revealedCase.moduleId,
            catalog,
            all,
          ),
        });
      } catch {
        if (!cancelled) setState({ name: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptId, rescore, catalog]);

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

      <ResultScreen
        moduleId={revealedCase.moduleId}
        title={revealedCase.title}
        subtitle={`${revealedCase.company.name} · ${revealedCase.company.industry} · ${messages.difficulty[revealedCase.difficulty]} · ${copy.playedOn(dateFormat.format(new Date(attempt.submittedAt)))}`}
        result={result}
        reward={state.reward}
        nextHref={state.nextHref}
        playAgainHref={`/case/${revealedCase.id}`}
      />

      <AIFeedbackPanel attempt={attempt} requestFeedback={requestFeedback} />

      <ModuleResults
        result={result}
        revealedCase={revealedCase}
        answer={attempt.answer}
      />
    </div>
  );
}
