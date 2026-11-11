"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { EmptyState } from "@/components/arcade/empty-state";
import { useMission } from "@/components/arcade/mission";
import { Panel } from "@/components/arcade/panel";
import { InlineResult, SubmitDialog } from "@/components/submit-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getMessages } from "@/i18n";
import { clearDraft, loadDraft, saveDraft } from "@/lib/draft";
import { useIsClient } from "@/lib/use-is-client";
import { useSubmitAttempt, type SubmitAttempt } from "@/lib/use-submit-attempt";
import { cn } from "@/lib/utils";

import { productCaseDraftKey, timingFrom } from "../draft";
import { factFactor, formatAmount, formatFact, parseAmount } from "../format";
import {
  MAX_REASONING,
  type EstimationAnswer,
  type PublicEstimationCase,
} from "../schema";
import { CaseTimer } from "./case-timer";

const MAX_MULTIPLIERS = 4;

const text = z.string().max(MAX_REASONING).catch("");
const draftSchema = z.object({
  factIds: z.array(z.string()).max(10).catch([]),
  multipliers: z
    .array(z.object({ label: z.string().max(60), value: z.string().max(20) }))
    .max(MAX_MULTIPLIERS)
    .catch([]),
  estimate: z.string().max(30).catch(""),
  approach: text,
  sanityCheck: text,
  timerStartedAt: z.number().nullable().catch(null),
});
type Draft = z.infer<typeof draftSchema>;

const emptyDraft = (): Draft => ({
  factIds: [],
  multipliers: [],
  estimate: "",
  approach: "",
  sanityCheck: "",
  timerStartedAt: null,
});

export function EstimationWorkspace(props: {
  publicCase: PublicEstimationCase;
  submit: SubmitAttempt;
}) {
  const isClient = useIsClient();
  const initial = useMemo(() => {
    if (!isClient) return emptyDraft();
    const draft = loadDraft(
      productCaseDraftKey(props.publicCase.id),
      draftSchema,
      emptyDraft,
    );
    const ids = new Set(props.publicCase.facts.map((fact) => fact.id));
    return { ...draft, factIds: draft.factIds.filter((id) => ids.has(id)) };
  }, [isClient, props.publicCase]);
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
  publicCase: PublicEstimationCase;
  submit: SubmitAttempt;
  initialDraft: Draft;
  persist: boolean;
}) {
  const copy = getMessages().productCase;
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [confirming, setConfirming] = useState(false);
  const { submitAnswer, isSubmitting, error, clearError, inlineResult } =
    useSubmitAttempt({
      caseId: publicCase.id,
      moduleId: publicCase.moduleId,
      submit,
      failedMessage: copy.submit.failed,
      onSubmitted: () => clearDraft(productCaseDraftKey(publicCase.id)),
    });

  useEffect(() => {
    if (persist) saveDraft(productCaseDraftKey(publicCase.id), draft);
  }, [persist, publicCase.id, draft]);

  const update = (patch: Partial<Draft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  // Facts in sheet order, so the chain reads the same way every time.
  const chosen = publicCase.facts.filter((fact) =>
    draft.factIds.includes(fact.id),
  );
  const multipliers = draft.multipliers
    .map((multiplier) => ({
      label: multiplier.label.trim(),
      value: parseAmount(multiplier.value),
    }))
    .filter(
      (multiplier): multiplier is { label: string; value: number } =>
        multiplier.value !== null,
    );
  const product =
    chosen.length === 0 && multipliers.length === 0
      ? null
      : chosen.reduce((total, fact) => total * factFactor(fact), 1) *
        multipliers.reduce((total, m) => total * m.value, 1);
  const estimate = parseAmount(draft.estimate);

  useMission(
    inlineResult
      ? null
      : {
          objectives: [
            {
              id: "facts",
              label: copy.estimation.mission.facts,
              done: draft.factIds.length > 0,
            },
            {
              id: "factors",
              label: copy.estimation.mission.calculate,
              done: product !== null,
            },
            {
              id: "estimate",
              label: copy.estimation.mission.estimate,
              done: estimate !== null,
            },
            {
              id: "approach",
              label: copy.estimation.mission.approach,
              done: draft.approach.trim() !== "",
            },
          ],
          action: {
            label: copy.submit.button,
            disabled: draft.factIds.length === 0 && estimate === null,
            hint: copy.submit.needsChoice,
            onClick: () => {
              clearError();
              setConfirming(true);
            },
          },
        },
  );

  if (inlineResult) return <InlineResult result={inlineResult} />;

  const answer = (): EstimationAnswer => ({
    kind: "estimation",
    factIds: draft.factIds,
    multipliers: multipliers
      .filter((m) => m.value <= 1e6)
      .map((m) => ({ label: m.label.slice(0, 60), value: m.value })),
    estimate: estimate !== null && estimate <= 1e15 ? estimate : null,
    approach: draft.approach.trim(),
    sanityCheck: draft.sanityCheck.trim(),
    timing: timingFrom(draft.timerStartedAt),
  });

  return (
    <div className="space-y-5">
      <CaseTimer
        limitMinutes={publicCase.timeLimitMinutes}
        startedAt={draft.timerStartedAt}
        onStart={() => update({ timerStartedAt: Date.now() })}
        onStop={() => update({ timerStartedAt: null })}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Panel
          id="facts-title"
          icon="doc"
          title={copy.estimation.facts}
          subtitle={copy.estimation.factsIntro}
          className="min-w-0"
          aside={`${draft.factIds.length}/${publicCase.facts.length}`}
        >
          <ul className="space-y-2">
            {publicCase.facts.map((fact) => {
              const checked = draft.factIds.includes(fact.id);
              return (
                <li key={fact.id}>
                  <label
                    className={cn(
                      "has-[:focus-visible]:ring-ring/50 flex cursor-pointer items-start gap-3 rounded-md border-2 px-3 py-2.5 transition-colors has-[:focus-visible]:ring-3",
                      checked
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background/60 hover:border-frame",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="accent-primary mt-1 size-4 shrink-0"
                      checked={checked}
                      aria-label={copy.estimation.use(fact.label)}
                      onChange={() =>
                        update({
                          factIds: checked
                            ? draft.factIds.filter((id) => id !== fact.id)
                            : [...draft.factIds, fact.id],
                        })
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm">{fact.label}</span>
                      <span className="text-muted-foreground block text-xs">
                        {copy.estimation.source}: {fact.source}
                      </span>
                    </span>
                    <span className="font-mono text-sm whitespace-nowrap tabular-nums">
                      {formatFact(fact)}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="space-y-4 lg:sticky lg:top-20">
          <Panel
            id="multipliers-title"
            icon="pencil"
            title={copy.estimation.multipliers}
            subtitle={copy.estimation.multipliersIntro}
            bodyClassName="space-y-3"
          >
            {draft.multipliers.map((multiplier, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <Label
                    htmlFor={`multiplier-label-${index}`}
                    className="text-xs"
                  >
                    {copy.estimation.multiplierLabel}
                  </Label>
                  <Input
                    id={`multiplier-label-${index}`}
                    maxLength={60}
                    value={multiplier.label}
                    onChange={(event) =>
                      update({
                        multipliers: draft.multipliers.map((m, i) =>
                          i === index ? { ...m, label: event.target.value } : m,
                        ),
                      })
                    }
                  />
                </div>
                <div className="w-24 space-y-1">
                  <Label
                    htmlFor={`multiplier-value-${index}`}
                    className="text-xs"
                  >
                    {copy.estimation.multiplierValue}
                  </Label>
                  <Input
                    id={`multiplier-value-${index}`}
                    inputMode="decimal"
                    maxLength={20}
                    aria-invalid={
                      multiplier.value !== "" &&
                      parseAmount(multiplier.value) === null
                    }
                    value={multiplier.value}
                    onChange={(event) =>
                      update({
                        multipliers: draft.multipliers.map((m, i) =>
                          i === index ? { ...m, value: event.target.value } : m,
                        ),
                      })
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={copy.estimation.removeMultiplier(
                    multiplier.label || String(index + 1),
                  )}
                  onClick={() =>
                    update({
                      multipliers: draft.multipliers.filter(
                        (_, i) => i !== index,
                      ),
                    })
                  }
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            ))}
            {draft.multipliers.length < MAX_MULTIPLIERS && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  update({
                    multipliers: [
                      ...draft.multipliers,
                      { label: "", value: "" },
                    ],
                  })
                }
              >
                <Plus aria-hidden="true" />
                {copy.estimation.addMultiplier}
              </Button>
            )}
          </Panel>

          <Panel
            id="calculator-title"
            icon="chart"
            title={copy.estimation.calculator}
            bodyClassName="space-y-3"
          >
            {product === null ? (
              <EmptyState
                size="sm"
                title={copy.estimation.calculatorEmptyTitle}
              >
                {copy.estimation.calculatorEmpty}
              </EmptyState>
            ) : (
              <>
                <p className="text-muted-foreground font-mono text-xs leading-relaxed">
                  {[
                    ...chosen.map((fact) => formatFact(fact)),
                    ...multipliers.map(
                      (m) =>
                        `${formatAmount(m.value)}${m.label ? ` (${m.label})` : ""}`,
                    ),
                  ].join(" × ")}
                </p>
                <p
                  className="font-pixel text-ink text-3xl tabular-nums"
                  aria-live="polite"
                >
                  {formatAmount(product)}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => update({ estimate: formatAmount(product) })}
                >
                  {copy.estimation.useResult}
                </Button>
              </>
            )}
          </Panel>

          <Panel
            icon="target"
            title={copy.estimation.answerTitle}
            bodyClassName="space-y-3"
          >
            <div className="space-y-1">
              <Label htmlFor="estimate">{copy.estimation.estimate}</Label>
              <Input
                id="estimate"
                inputMode="decimal"
                maxLength={30}
                aria-describedby="estimate-hint"
                aria-invalid={draft.estimate !== "" && estimate === null}
                value={draft.estimate}
                onChange={(event) => update({ estimate: event.target.value })}
                className="font-mono"
              />
              <p id="estimate-hint" className="text-muted-foreground text-xs">
                {copy.estimation.estimateHint(publicCase.answerUnit)}
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="approach">{copy.estimation.approach}</Label>
              <Textarea
                id="approach"
                rows={3}
                maxLength={MAX_REASONING}
                placeholder={copy.estimation.approachPlaceholder}
                value={draft.approach}
                onChange={(event) => update({ approach: event.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sanity">{copy.estimation.sanity}</Label>
              <Textarea
                id="sanity"
                rows={2}
                maxLength={MAX_REASONING}
                placeholder={copy.estimation.sanityPlaceholder}
                value={draft.sanityCheck}
                onChange={(event) =>
                  update({ sanityCheck: event.target.value })
                }
              />
            </div>
          </Panel>
        </div>
      </div>

      <SubmitDialog
        open={confirming}
        onOpenChange={setConfirming}
        copy={copy.submit}
        error={error}
        isSubmitting={isSubmitting}
        onConfirm={() => submitAnswer(answer())}
      />
    </div>
  );
}
