"use client";

import { Sparkles } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { aiFeedbackSchema, type AIFeedback } from "@/core/case-engine";
import type { FeedbackOutcome } from "@/core/case-engine/feedback";
import { getAttemptStore, type Attempt } from "@/core/storage";
import { getMessages } from "@/i18n";

export type RequestFeedback = (input: unknown) => Promise<FeedbackOutcome>;

type Status =
  | { name: "idle" }
  | { name: "ready"; feedback: AIFeedback; model?: string }
  | { name: "not_configured" }
  | { name: "rate_limited" }
  | { name: "failed" };

function initialStatus(attempt: Attempt): Status {
  const stored = aiFeedbackSchema.safeParse(attempt.aiFeedback);
  return stored.success
    ? { name: "ready", feedback: stored.data }
    : { name: "idle" };
}

/**
 * Qualitative feedback from the AI coach, requested on demand. Once written it
 * is kept with the attempt, so reopening the results does not call the model.
 */
export function AIFeedbackPanel({
  attempt,
  requestFeedback,
}: {
  attempt: Attempt;
  requestFeedback: RequestFeedback;
}) {
  const copy = getMessages().results.feedback;
  const [status, setStatus] = useState<Status>(() => initialStatus(attempt));
  const [isPending, startTransition] = useTransition();

  const request = () =>
    startTransition(async () => {
      let outcome: FeedbackOutcome;
      try {
        outcome = await requestFeedback({
          caseId: attempt.caseId,
          answer: attempt.answer,
        });
      } catch {
        setStatus({ name: "failed" });
        return;
      }
      if (!outcome.ok) {
        setStatus(
          outcome.error.code === "not_configured"
            ? { name: "not_configured" }
            : outcome.error.code === "rate_limited"
              ? { name: "rate_limited" }
              : { name: "failed" },
        );
        return;
      }
      setStatus({
        name: "ready",
        feedback: outcome.feedback,
        model: outcome.model,
      });
      try {
        await getAttemptStore().saveAttempt({
          ...attempt,
          aiFeedback: outcome.feedback,
        });
      } catch {
        // Shown now; it will simply be requested again next time.
      }
    });

  return (
    <section aria-labelledby="ai-feedback-title" className="pixel-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="ai-feedback-title"
            className="font-heading flex items-center gap-2 font-semibold"
          >
            <Sparkles className="text-brand size-4" aria-hidden="true" />
            {copy.title}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">{copy.intro}</p>
        </div>
        {(status.name === "idle" ||
          status.name === "failed" ||
          status.name === "rate_limited") && (
          <Button type="button" onClick={request} disabled={isPending}>
            {isPending
              ? copy.requesting
              : status.name !== "idle"
                ? copy.retry
                : copy.request}
          </Button>
        )}
      </div>

      <div aria-live="polite">
        {status.name === "not_configured" && (
          <p className="text-muted-foreground bg-muted/50 mt-4 rounded-lg px-3 py-2 text-sm">
            {copy.notConfigured}
          </p>
        )}
        {status.name === "rate_limited" && !isPending && (
          <p role="alert" className="text-destructive mt-4 text-sm">
            {copy.rateLimited}
          </p>
        )}
        {status.name === "failed" && !isPending && (
          <p role="alert" className="text-destructive mt-4 text-sm">
            {copy.failed}
          </p>
        )}
        {status.name === "ready" && (
          <div className="mt-5 space-y-5 text-sm">
            <div>
              <h3 className="font-pixel text-ink text-xs tracking-wide uppercase">
                {copy.summary}
              </h3>
              <p className="mt-1 leading-relaxed">{status.feedback.summary}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <FeedbackList
                title={copy.strengths}
                items={status.feedback.strengths}
              />
              <FeedbackList
                title={copy.improvements}
                items={status.feedback.improvements}
              />
            </div>
            <p className="border-brand/40 bg-muted/40 rounded-r-lg border-l-2 px-3 py-2">
              <span className="text-muted-foreground block text-xs">
                {copy.principle}
              </span>
              {status.feedback.principle}
            </p>
            {status.model && (
              <p className="text-muted-foreground text-xs">
                {copy.model(status.model)}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function FeedbackList({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <div>
      <h3 className="font-pixel text-ink text-xs tracking-wide uppercase">
        {title}
      </h3>
      <ul className="mt-1.5 list-disc space-y-1 pl-4">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
