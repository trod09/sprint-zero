"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { useMission } from "@/components/arcade/mission";
import { Panel } from "@/components/arcade/panel";
import { OptionCard } from "@/components/option-card";
import { InlineResult, SubmitDialog } from "@/components/submit-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getMessages } from "@/i18n";
import { clearDraft, loadDraft, saveDraft } from "@/lib/draft";
import { useIsClient } from "@/lib/use-is-client";
import { useSubmitAttempt, type SubmitAttempt } from "@/lib/use-submit-attempt";
import { CaseTimer } from "@/modules/product-case/components/case-timer";
import { timingFrom } from "@/modules/product-case/draft";

import { MAX_TEXT, type PublicQuickCase, type QuickAnswer } from "../schema";
import { Exhibits } from "./exhibits";

const draftKey = (caseId: string) =>
  `sprint-zero:quick-cases-draft:v1:${caseId}`;

const text = z.string().max(MAX_TEXT).catch("");
const draftSchema = z.object({
  choices: z.record(z.string(), z.array(z.string()).max(6)).catch({}),
  reasoning: text,
  writing: text,
  timerStartedAt: z.number().nullable().catch(null),
});
type Draft = z.infer<typeof draftSchema>;

const emptyDraft = (): Draft => ({
  choices: {},
  reasoning: "",
  writing: "",
  timerStartedAt: null,
});

/** Drops steps and options that are not part of this case. */
function sanitize(draft: Draft, publicCase: PublicQuickCase): Draft {
  return {
    ...draft,
    choices: Object.fromEntries(
      publicCase.steps.map((step) => [
        step.id,
        (draft.choices[step.id] ?? [])
          .filter((id) => step.options.some((o) => o.id === id))
          .slice(0, step.pick),
      ]),
    ),
  };
}

export function QuickWorkspace(props: {
  publicCase: PublicQuickCase;
  submit: SubmitAttempt;
}) {
  const isClient = useIsClient();
  const initial = useMemo(
    () =>
      sanitize(
        isClient
          ? loadDraft(draftKey(props.publicCase.id), draftSchema, emptyDraft)
          : emptyDraft(),
        props.publicCase,
      ),
    [isClient, props.publicCase],
  );
  return (
    <Workspace
      key={isClient ? "client" : "server"}
      {...props}
      initialDraft={initial}
      persist={isClient}
    />
  );
}

function Workspace({
  publicCase,
  submit,
  initialDraft,
  persist,
}: {
  publicCase: PublicQuickCase;
  submit: SubmitAttempt;
  initialDraft: Draft;
  persist: boolean;
}) {
  const copy = getMessages().quick;
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [confirming, setConfirming] = useState(false);
  const { submitAnswer, isSubmitting, error, clearError, inlineResult } =
    useSubmitAttempt({
      caseId: publicCase.id,
      moduleId: publicCase.moduleId,
      submit,
      failedMessage: copy.submit.failed,
      onSubmitted: () => clearDraft(draftKey(publicCase.id)),
    });

  useEffect(() => {
    if (persist) saveDraft(draftKey(publicCase.id), draft);
  }, [persist, publicCase.id, draft]);

  const update = (patch: Partial<Draft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const { steps } = publicCase;
  const chosen = (stepId: string) => draft.choices[stepId] ?? [];
  const decided = (step: (typeof steps)[number]) =>
    chosen(step.id).length >= step.pick;
  const undecided = steps.filter((step) => !decided(step)).length;

  useMission(
    inlineResult
      ? null
      : {
          objectives: [
            ...steps.map((step) => ({
              id: step.id,
              label: step.title,
              done: decided(step),
            })),
            {
              id: "writing",
              label: copy.notes.objective,
              done: draft.writing.trim() !== "",
            },
          ],
          action: {
            label: copy.submit.button,
            disabled: undecided > 0,
            hint: copy.submit.incomplete(undecided),
            onClick: () => {
              clearError();
              setConfirming(true);
            },
          },
        },
  );

  if (inlineResult) return <InlineResult result={inlineResult} />;

  const choose = (stepId: string, optionId: string, pick: number) => {
    const current = chosen(stepId);
    const next =
      pick === 1
        ? [optionId]
        : current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
    update({ choices: { ...draft.choices, [stepId]: next } });
  };
  const answer = (): QuickAnswer => ({
    choices: draft.choices,
    reasoning: draft.reasoning.trim(),
    writing: draft.writing.trim(),
    timing: timingFrom(draft.timerStartedAt),
  });

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-20">
        <Exhibits exhibits={publicCase.exhibits} scroll />
      </div>

      <div className="min-w-0 space-y-5">
        <CaseTimer
          limitMinutes={publicCase.timeLimitMinutes}
          startedAt={draft.timerStartedAt}
          onStart={() => update({ timerStartedAt: Date.now() })}
          onStop={() => update({ timerStartedAt: null })}
        />

        {steps.map((step, index) => {
          const picks = chosen(step.id);
          const full = picks.length >= step.pick;
          return (
            <Panel
              key={step.id}
              icon="target"
              title={`${copy.steps.decision(index + 1, steps.length)} · ${step.title}`}
              aside={
                <Badge variant={full ? "default" : "outline"}>
                  {step.pick === 1
                    ? copy.steps.pickOne
                    : copy.steps.picked(picks.length, step.pick)}
                </Badge>
              }
            >
              <fieldset>
                <legend className="text-base font-semibold text-pretty">
                  {step.question}
                </legend>
                <div className="mt-3 space-y-2">
                  {step.options.map((option) => (
                    <OptionCard
                      key={option.id}
                      type={step.pick === 1 ? "radio" : "checkbox"}
                      name={`quick-${step.id}`}
                      checked={picks.includes(option.id)}
                      disabled={step.pick > 1 && full}
                      onChange={() => choose(step.id, option.id, step.pick)}
                      title={<span className="font-normal">{option.text}</span>}
                    />
                  ))}
                </div>
              </fieldset>
            </Panel>
          );
        })}

        <Panel icon="pencil" title={copy.notes.title} bodyClassName="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="quick-writing">{publicCase.writing.label}</Label>
            <Textarea
              id="quick-writing"
              rows={4}
              maxLength={MAX_TEXT}
              value={draft.writing}
              placeholder={publicCase.writing.placeholder}
              onChange={(event) => update({ writing: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quick-reasoning">{copy.notes.reasoning}</Label>
            <Textarea
              id="quick-reasoning"
              rows={3}
              maxLength={MAX_TEXT}
              value={draft.reasoning}
              placeholder={copy.notes.reasoningPlaceholder}
              onChange={(event) => update({ reasoning: event.target.value })}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            {copy.notes.coachNote}
          </p>
        </Panel>
      </div>

      <SubmitDialog
        copy={copy.submit}
        open={confirming}
        onOpenChange={setConfirming}
        error={error}
        isSubmitting={isSubmitting}
        onConfirm={() => submitAnswer(answer())}
      />
    </div>
  );
}
