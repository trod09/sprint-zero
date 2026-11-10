"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { ScoreBreakdown } from "@/components/score-breakdown";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { getMessages } from "@/i18n";
import { useIsClient } from "@/lib/use-is-client";
import { useSubmitAttempt, type SubmitAttempt } from "@/lib/use-submit-attempt";

import { readExperiment } from "../analysis";
import {
  DECISIONS,
  decisionSchema,
  EFFECT_READS,
  effectReadSchema,
  ISSUES,
  issueSchema,
  VIEWS,
  viewSchema,
  type AbTestAnswer,
  type Issue,
  type PublicAbTestCase,
  type View,
} from "../schema";
import { LiftOverTime } from "./lift-chart";
import { Scorecard } from "./scorecard";
import { SegmentsTable } from "./segments-table";

export type { SubmitAttempt };

// ------------------------------------------------------------------- draft

const draftSchema = z.object({
  view: viewSchema,
  viewed: z.array(viewSchema).max(VIEWS.length),
  issues: z.array(issueSchema).max(ISSUES.length),
  effect: effectReadSchema.optional(),
  decision: decisionSchema.optional(),
  justification: z.string().max(1500).default(""),
});
type Draft = z.infer<typeof draftSchema>;

const draftKey = (caseId: string) => `sprint-zero:ab-test-draft:v1:${caseId}`;

const emptyDraft = (): Draft => ({
  view: "scorecard",
  viewed: ["scorecard"],
  issues: [],
  justification: "",
});

function loadDraft(caseId: string): Draft {
  try {
    const raw = window.localStorage.getItem(draftKey(caseId));
    if (!raw) return emptyDraft();
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : emptyDraft();
  } catch {
    return emptyDraft();
  }
}

function saveDraft(caseId: string, draft: Draft): void {
  try {
    window.localStorage.setItem(draftKey(caseId), JSON.stringify(draft));
  } catch {
    // Storage full or disabled: the case still works for this visit.
  }
}

function clearDraft(caseId: string): void {
  try {
    window.localStorage.removeItem(draftKey(caseId));
  } catch {
    // Nothing to clean up.
  }
}

// -------------------------------------------------------------- component

export function Readout(props: {
  publicCase: PublicAbTestCase;
  submit: SubmitAttempt;
}) {
  const isClient = useIsClient();
  const draft = useMemo(
    () => (isClient ? loadDraft(props.publicCase.id) : emptyDraft()),
    [isClient, props.publicCase.id],
  );
  return (
    <ReadoutWorkspace
      key={isClient ? "client" : "server"}
      {...props}
      initialDraft={draft}
      persist={isClient}
    />
  );
}

function ReadoutWorkspace({
  publicCase,
  submit,
  initialDraft,
  persist,
}: {
  publicCase: PublicAbTestCase;
  submit: SubmitAttempt;
  initialDraft: Draft;
  persist: boolean;
}) {
  const copy = getMessages().abTest;
  const readout = useMemo(() => readExperiment(publicCase), [publicCase]);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [confirming, setConfirming] = useState(false);
  const { submitAnswer, isSubmitting, error, clearError, inlineResult } =
    useSubmitAttempt({
      caseId: publicCase.id,
      moduleId: publicCase.moduleId,
      submit,
      failedMessage: copy.decision.failed,
      onSubmitted: () => clearDraft(publicCase.id),
    });

  useEffect(() => {
    if (persist) saveDraft(publicCase.id, draft);
  }, [persist, publicCase.id, draft]);

  const openView = (view: View) =>
    setDraft((current) => ({
      ...current,
      view,
      viewed: current.viewed.includes(view)
        ? current.viewed
        : [...current.viewed, view],
    }));

  const toggleIssue = (issue: Issue, checked: boolean) =>
    setDraft((current) => ({
      ...current,
      issues: checked
        ? ISSUES.filter((i) => i === issue || current.issues.includes(i))
        : current.issues.filter((i) => i !== issue),
    }));

  const answer: AbTestAnswer | null =
    draft.effect && draft.decision
      ? {
          issues: draft.issues,
          effect: draft.effect,
          decision: draft.decision,
          justification: draft.justification.trim(),
          viewed: draft.viewed,
        }
      : null;

  if (inlineResult) {
    return (
      <section className="pixel-card p-6">
        <p className="font-heading text-5xl font-semibold tabular-nums">
          {inlineResult.total}
          <span className="text-muted-foreground text-lg"> / 100</span>
        </p>
        <div className="mt-6">
          <ScoreBreakdown criteria={inlineResult.criteria} />
        </div>
      </section>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-labelledby="readout-title" className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="readout-title" className="font-heading font-semibold">
            {copy.readout.title}
          </h2>
          <SegmentedControl
            label={copy.readout.tabs}
            value={draft.view}
            onValueChange={openView}
            options={VIEWS.map((view) => ({
              value: view,
              label: copy.views[view],
            }))}
          />
        </div>
        {draft.view === "scorecard" && (
          <Scorecard publicCase={publicCase} readout={readout} />
        )}
        {draft.view === "over_time" && <LiftOverTime readout={readout} />}
        {draft.view === "segments" && (
          <SegmentsTable publicCase={publicCase} readout={readout} />
        )}
      </section>

      <aside className="lg:sticky lg:top-20">
        <section
          aria-labelledby="decision-title"
          className="pixel-card space-y-4 p-4"
        >
          <div>
            <h2 id="decision-title" className="font-heading font-semibold">
              {copy.decision.title}
            </h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {copy.decision.intro}
            </p>
          </div>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">
              {copy.decision.issues}
            </legend>
            <p className="text-muted-foreground text-xs">
              {copy.decision.issuesHint}
            </p>
            {ISSUES.map((issue) => (
              <label key={issue} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.issues.includes(issue)}
                  onChange={(event) => toggleIssue(issue, event.target.checked)}
                  className="accent-brand mt-1"
                  aria-describedby={`issue-hint-${issue}`}
                />
                <span>
                  {copy.issues[issue].label}
                  <span
                    id={`issue-hint-${issue}`}
                    className="text-muted-foreground block text-xs"
                  >
                    {copy.issues[issue].hint}
                  </span>
                </span>
              </label>
            ))}
            {draft.issues.length === 0 && (
              <p className="text-muted-foreground text-xs italic">
                {copy.decision.noIssues}
              </p>
            )}
          </fieldset>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">
              {copy.decision.effect}
            </legend>
            {EFFECT_READS.map((effect) => (
              <label key={effect} className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="effect"
                  checked={draft.effect === effect}
                  onChange={() => setDraft((d) => ({ ...d, effect }))}
                  className="accent-brand mt-1"
                />
                <span>{copy.effects[effect]}</span>
              </label>
            ))}
          </fieldset>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">
              {copy.decision.decision}
            </legend>
            {DECISIONS.map((decision) => (
              <label key={decision} className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="decision"
                  checked={draft.decision === decision}
                  onChange={() => setDraft((d) => ({ ...d, decision }))}
                  className="accent-brand mt-1"
                />
                <span>
                  <span className="font-medium">
                    {copy.decisions[decision].label}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {copy.decisions[decision].hint}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="space-y-1">
            <Label htmlFor="ab-justification">
              {copy.decision.justification}
            </Label>
            <Textarea
              id="ab-justification"
              rows={3}
              maxLength={1500}
              placeholder={copy.decision.justificationPlaceholder}
              value={draft.justification}
              onChange={(event) =>
                setDraft((d) => ({ ...d, justification: event.target.value }))
              }
            />
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={!answer}
            onClick={() => {
              clearError();
              setConfirming(true);
            }}
          >
            {copy.decision.submit}
          </Button>
        </section>
      </aside>

      <Dialog
        open={confirming}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) setConfirming(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.decision.confirmTitle}</DialogTitle>
            <DialogDescription>{copy.decision.confirmBody}</DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setConfirming(false)}
            >
              {copy.decision.cancel}
            </Button>
            <Button
              type="button"
              disabled={isSubmitting || !answer}
              onClick={() => answer && submitAnswer(answer)}
            >
              {isSubmitting ? copy.decision.submitting : copy.decision.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
