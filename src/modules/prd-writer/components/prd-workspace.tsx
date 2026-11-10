"use client";

import { Check } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { z } from "zod";

import { OptionCard } from "@/components/option-card";
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

import {
  BUCKETS,
  bucketSchema,
  HORIZONS,
  horizonSchema,
  MAX_EVIDENCE,
  MAX_RISKS,
  MAX_SHORT_TEXT,
  MAX_TEXT,
  type Bucket,
  type PrdAnswer,
  type PublicPrdCase,
} from "../schema";
import { DocumentsPanel } from "./documents-panel";

const STEPS = [
  "problem",
  "goals",
  "scope",
  "risks",
  "questions",
  "review",
] as const;
type Step = (typeof STEPS)[number];

const draftKey = (caseId: string) =>
  `sprint-zero:prd-writer-draft:v1:${caseId}`;

const text = z.string().max(MAX_TEXT).catch("");
const draftSchema = z.object({
  step: z.enum(STEPS).catch("problem"),
  problem: text,
  evidenceIds: z.array(z.string()).max(MAX_EVIDENCE).catch([]),
  goals: text,
  metricId: z.string().nullable().catch(null),
  baseline: z.string().max(20).catch(""),
  target: z.string().max(20).catch(""),
  horizon: horizonSchema.nullable().catch(null),
  scope: z.record(z.string(), bucketSchema).catch({}),
  risks: z
    .array(
      z.object({
        riskId: z.string(),
        mitigation: z.string().max(MAX_SHORT_TEXT),
      }),
    )
    .max(MAX_RISKS)
    .catch([]),
  openQuestions: text,
});
type Draft = z.infer<typeof draftSchema>;

const emptyDraft = (): Draft => ({
  step: "problem",
  problem: "",
  evidenceIds: [],
  goals: "",
  metricId: null,
  baseline: "",
  target: "",
  horizon: null,
  scope: {},
  risks: [],
  openQuestions: "",
});

/** Drops ids that are not options of this case, e.g. from an older draft. */
function sanitize(draft: Draft, publicCase: PublicPrdCase): Draft {
  const has = (list: readonly { id: string }[], id: string) =>
    list.some((item) => item.id === id);
  return {
    ...draft,
    evidenceIds: draft.evidenceIds.filter((id) => has(publicCase.evidence, id)),
    metricId:
      draft.metricId && has(publicCase.metrics, draft.metricId)
        ? draft.metricId
        : null,
    scope: Object.fromEntries(
      Object.entries(draft.scope).filter(([id]) =>
        has(publicCase.requirements, id),
      ),
    ),
    risks: draft.risks.filter((risk) => has(publicCase.risks, risk.riskId)),
  };
}

/** Reads a typed number: "62", "62%", "3.5" or "1,200". */
export function parseNumber(value: string): number | null {
  const cleaned = value.replace(/[,\s%$]/g, "");
  if (cleaned === "") return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

export function PrdWorkspace(props: {
  publicCase: PublicPrdCase;
  submit: SubmitAttempt;
}) {
  const isClient = useIsClient();
  const initial = useMemo(
    () =>
      isClient
        ? sanitize(
            loadDraft(draftKey(props.publicCase.id), draftSchema, emptyDraft),
            props.publicCase,
          )
        : emptyDraft(),
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
  publicCase: PublicPrdCase;
  submit: SubmitAttempt;
  initialDraft: Draft;
  persist: boolean;
}) {
  const copy = getMessages().prd;
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

  const baseline = parseNumber(draft.baseline);
  const target = parseNumber(draft.target);
  const metric = publicCase.metrics.find((m) => m.id === draft.metricId);
  const placed = publicCase.requirements.filter(
    (r) => draft.scope[r.id],
  ).length;

  const complete: Record<Step, boolean> = {
    problem: draft.problem.trim() !== "" && draft.evidenceIds.length > 0,
    goals:
      draft.metricId !== null &&
      baseline !== null &&
      target !== null &&
      draft.horizon !== null,
    scope: placed === publicCase.requirements.length,
    risks: draft.risks.length > 0,
    questions: draft.openQuestions.trim() !== "",
    review: false,
  };
  const stepIndex = STEPS.indexOf(draft.step);

  if (inlineResult) return <InlineResult result={inlineResult} />;

  const answer = (): PrdAnswer => ({
    problem: draft.problem.trim(),
    evidenceIds: draft.evidenceIds,
    goals: draft.goals.trim(),
    metric: {
      metricId: draft.metricId,
      baseline,
      target,
      horizon: draft.horizon,
    },
    scope: draft.scope,
    risks: draft.risks.map((risk) => ({
      riskId: risk.riskId,
      mitigation: risk.mitigation.trim(),
    })),
    openQuestions: draft.openQuestions.trim(),
  });

  const evidenceText = new Map(publicCase.evidence.map((e) => [e.id, e.text]));
  const riskTitle = new Map(publicCase.risks.map((r) => [r.id, r.title]));

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="min-w-0 space-y-5">
        <nav aria-label={copy.steps.label}>
          <ol className="flex flex-wrap gap-1.5">
            {STEPS.map((step, index) => (
              <li key={step}>
                <Button
                  type="button"
                  size="sm"
                  variant={draft.step === step ? "default" : "outline"}
                  aria-current={draft.step === step ? "step" : undefined}
                  onClick={() => update({ step })}
                >
                  <span className="text-xs opacity-70">{index + 1}</span>
                  {copy.steps[step]}
                  {complete[step] && (
                    <>
                      <Check aria-hidden="true" />
                      <span className="sr-only">({copy.steps.done})</span>
                    </>
                  )}
                </Button>
              </li>
            ))}
          </ol>
        </nav>

        <section
          aria-labelledby="section-title"
          className="pixel-card space-y-4 p-5"
        >
          {draft.step === "problem" && (
            <>
              <SectionHeading title={copy.problem.title} />
              <Field
                id="problem"
                label={copy.problem.statement}
                placeholder={copy.problem.statementPlaceholder}
                value={draft.problem}
                onChange={(problem) => update({ problem })}
                rows={4}
              />
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  {copy.problem.evidence}
                </legend>
                <p className="text-muted-foreground text-xs">
                  {copy.problem.evidenceIntro(MAX_EVIDENCE)}
                </p>
                <div className="grid gap-2">
                  {publicCase.evidence.map((item) => {
                    const checked = draft.evidenceIds.includes(item.id);
                    return (
                      <OptionCard
                        key={item.id}
                        type="checkbox"
                        name="evidence"
                        checked={checked}
                        disabled={draft.evidenceIds.length >= MAX_EVIDENCE}
                        onChange={() =>
                          update({
                            evidenceIds: checked
                              ? draft.evidenceIds.filter((id) => id !== item.id)
                              : [...draft.evidenceIds, item.id],
                          })
                        }
                        title={item.text}
                      />
                    );
                  })}
                </div>
                {draft.evidenceIds.length >= MAX_EVIDENCE && (
                  <p role="status" className="text-muted-foreground text-xs">
                    {copy.problem.max(MAX_EVIDENCE)}
                  </p>
                )}
              </fieldset>
            </>
          )}

          {draft.step === "goals" && (
            <>
              <SectionHeading title={copy.goals.title} />
              <Field
                id="goals"
                label={copy.goals.goals}
                placeholder={copy.goals.goalsPlaceholder}
                value={draft.goals}
                onChange={(goals) => update({ goals })}
              />
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  {copy.goals.metric}
                </legend>
                <div className="grid gap-2">
                  {publicCase.metrics.map((item) => (
                    <OptionCard
                      key={item.id}
                      type="radio"
                      name="metric"
                      checked={draft.metricId === item.id}
                      onChange={() => update({ metricId: item.id })}
                      title={item.name}
                      description={item.definition}
                    />
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-3 sm:grid-cols-3">
                <NumberField
                  id="baseline"
                  label={copy.goals.baseline}
                  unit={metric?.unit}
                  value={draft.baseline}
                  invalid={draft.baseline !== "" && baseline === null}
                  onChange={(value) => update({ baseline: value })}
                />
                <NumberField
                  id="target"
                  label={copy.goals.target}
                  unit={metric?.unit}
                  value={draft.target}
                  invalid={draft.target !== "" && target === null}
                  onChange={(value) => update({ target: value })}
                />
                <div className="space-y-1">
                  <Label htmlFor="horizon">{copy.goals.horizon}</Label>
                  <select
                    id="horizon"
                    className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 w-full min-w-0 rounded-lg border px-2 text-sm outline-none focus-visible:ring-3"
                    value={draft.horizon ?? ""}
                    onChange={(event) => {
                      const parsed = horizonSchema.safeParse(
                        event.target.value,
                      );
                      update({ horizon: parsed.success ? parsed.data : null });
                    }}
                  >
                    <option value="">{copy.goals.pickHorizon}</option>
                    {HORIZONS.map((horizon) => (
                      <option key={horizon} value={horizon}>
                        {copy.horizons[horizon]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {draft.step === "scope" && (
            <>
              <SectionHeading
                title={copy.scope.title}
                intro={copy.scope.intro}
              />
              <p className="text-muted-foreground text-xs" aria-live="polite">
                {copy.scope.assigned(placed, publicCase.requirements.length)}
              </p>
              <ul className="divide-y">
                {publicCase.requirements.map((requirement) => (
                  <li
                    key={requirement.id}
                    className="flex flex-wrap items-center gap-3 py-3"
                  >
                    <div className="min-w-0 flex-1 basis-60">
                      <p className="text-sm font-medium">{requirement.title}</p>
                      <p className="text-muted-foreground text-sm">
                        {requirement.description}
                      </p>
                    </div>
                    <div
                      role="radiogroup"
                      aria-label={requirement.title}
                      className="bg-muted inline-flex rounded-lg p-0.5"
                    >
                      {BUCKETS.map((bucket) => (
                        <BucketOption
                          key={bucket}
                          name={`scope-${requirement.id}`}
                          bucket={bucket}
                          label={copy.buckets[bucket]}
                          ariaLabel={copy.scope.bucketFor(
                            copy.buckets[bucket],
                            requirement.title,
                          )}
                          checked={draft.scope[requirement.id] === bucket}
                          onChange={() =>
                            update({
                              scope: {
                                ...draft.scope,
                                [requirement.id]: bucket,
                              },
                            })
                          }
                        />
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {draft.step === "risks" && (
            <>
              <SectionHeading
                title={copy.risks.title}
                intro={copy.risks.intro(MAX_RISKS)}
              />
              <div className="grid gap-2">
                {publicCase.risks.map((risk) => {
                  const index = draft.risks.findIndex(
                    (r) => r.riskId === risk.id,
                  );
                  const checked = index >= 0;
                  return (
                    <div key={risk.id} className="space-y-2">
                      <OptionCard
                        type="checkbox"
                        name="risks"
                        checked={checked}
                        disabled={draft.risks.length >= MAX_RISKS}
                        onChange={() =>
                          update({
                            risks: checked
                              ? draft.risks.filter((r) => r.riskId !== risk.id)
                              : [
                                  ...draft.risks,
                                  { riskId: risk.id, mitigation: "" },
                                ],
                          })
                        }
                        title={risk.title}
                        description={risk.description}
                      />
                      {checked && (
                        <div className="ml-7 space-y-1">
                          <Label
                            htmlFor={`mitigation-${risk.id}`}
                            className="text-xs"
                          >
                            {copy.risks.mitigation}
                          </Label>
                          <Textarea
                            id={`mitigation-${risk.id}`}
                            rows={2}
                            maxLength={MAX_SHORT_TEXT}
                            placeholder={copy.risks.mitigationPlaceholder}
                            value={draft.risks[index].mitigation}
                            onChange={(event) =>
                              update({
                                risks: draft.risks.map((r, i) =>
                                  i === index
                                    ? { ...r, mitigation: event.target.value }
                                    : r,
                                ),
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {draft.risks.length >= MAX_RISKS && (
                <p role="status" className="text-muted-foreground text-xs">
                  {copy.risks.max(MAX_RISKS)}
                </p>
              )}
            </>
          )}

          {draft.step === "questions" && (
            <>
              <SectionHeading title={copy.questions.title} />
              <Field
                id="questions"
                label={copy.questions.label}
                placeholder={copy.questions.placeholder}
                value={draft.openQuestions}
                onChange={(openQuestions) => update({ openQuestions })}
                rows={5}
              />
            </>
          )}

          {draft.step === "review" && (
            <>
              <SectionHeading
                title={copy.review.title}
                intro={copy.review.intro}
              />
              <article className="bg-background space-y-4 rounded-lg border p-5 text-sm">
                <h3 className="font-heading text-lg font-semibold">
                  {copy.review.onePager(publicCase.feature)}
                </h3>
                <ReviewBlock
                  title={copy.steps.problem}
                  onEdit={() => update({ step: "problem" })}
                >
                  <Written text={draft.problem} />
                  {draft.evidenceIds.length > 0 && (
                    <ul className="text-muted-foreground mt-2 list-disc space-y-0.5 pl-5">
                      {draft.evidenceIds.map((id) => (
                        <li key={id}>{evidenceText.get(id)}</li>
                      ))}
                    </ul>
                  )}
                </ReviewBlock>
                <ReviewBlock
                  title={copy.steps.goals}
                  onEdit={() => update({ step: "goals" })}
                >
                  <Written text={draft.goals} />
                  <p className="mt-2">
                    <span className="font-medium">{copy.review.metric}: </span>
                    {copy.review.metricLine(
                      metric?.name ?? copy.review.unset,
                      draft.baseline || copy.review.unset,
                      draft.target || copy.review.unset,
                      draft.horizon
                        ? copy.horizons[draft.horizon]
                        : copy.review.unset,
                    )}
                  </p>
                </ReviewBlock>
                <ReviewBlock
                  title={copy.steps.scope}
                  onEdit={() => update({ step: "scope" })}
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    {BUCKETS.map((bucket) => {
                      const items = publicCase.requirements.filter(
                        (r) => draft.scope[r.id] === bucket,
                      );
                      return (
                        <div key={bucket}>
                          <p className="text-xs font-medium tracking-wide uppercase">
                            {copy.buckets[bucket]}
                          </p>
                          {items.length === 0 ? (
                            <p className="text-muted-foreground">—</p>
                          ) : (
                            <ul className="list-disc pl-4">
                              {items.map((item) => (
                                <li key={item.id}>{item.title}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ReviewBlock>
                <ReviewBlock
                  title={copy.steps.risks}
                  onEdit={() => update({ step: "risks" })}
                >
                  {draft.risks.length === 0 ? (
                    <Written text="" />
                  ) : (
                    <ul className="space-y-1">
                      {draft.risks.map((risk) => (
                        <li key={risk.riskId}>
                          <span className="font-medium">
                            {riskTitle.get(risk.riskId)}
                          </span>
                          {risk.mitigation && <>: {risk.mitigation}</>}
                        </li>
                      ))}
                    </ul>
                  )}
                </ReviewBlock>
                <ReviewBlock
                  title={copy.steps.questions}
                  onEdit={() => update({ step: "questions" })}
                >
                  <Written text={draft.openQuestions} />
                </ReviewBlock>
              </article>
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  clearError();
                  setConfirming(true);
                }}
              >
                {copy.submit.button}
              </Button>
            </>
          )}
        </section>

        <div className="flex justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={stepIndex === 0}
            onClick={() => update({ step: STEPS[stepIndex - 1] })}
          >
            {copy.steps.back}
          </Button>
          {stepIndex < STEPS.length - 1 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => update({ step: STEPS[stepIndex + 1] })}
            >
              {copy.steps.next}
            </Button>
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-20">
        <DocumentsPanel documents={publicCase.documents} />
      </aside>

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

function SectionHeading({ title, intro }: { title: string; intro?: string }) {
  return (
    <div>
      <h2 id="section-title" className="font-heading text-lg font-semibold">
        {title}
      </h2>
      {intro && <p className="text-muted-foreground text-sm">{intro}</p>}
    </div>
  );
}

function Field({
  id,
  label,
  placeholder,
  value,
  onChange,
  rows = 3,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={rows}
        maxLength={MAX_TEXT}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function NumberField({
  id,
  label,
  unit,
  value,
  invalid,
  onChange,
}: {
  id: string;
  label: string;
  unit?: string;
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  const copy = getMessages().prd.goals;
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="decimal"
        maxLength={20}
        aria-invalid={invalid}
        aria-describedby={`${id}-hint`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="font-mono"
      />
      <p id={`${id}-hint`} className="text-muted-foreground text-xs">
        {invalid ? copy.invalid : unit ? copy.unit(unit) : " "}
      </p>
    </div>
  );
}

function BucketOption({
  name,
  bucket,
  label,
  ariaLabel,
  checked,
  onChange,
}: {
  name: string;
  bucket: Bucket;
  label: string;
  ariaLabel: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        "has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-3",
        checked
          ? bucket === "out"
            ? "bg-background text-destructive shadow-sm"
            : "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <input
        type="radio"
        name={name}
        className="sr-only"
        aria-label={ariaLabel}
        checked={checked}
        onChange={onChange}
      />
      {label}
    </label>
  );
}

function ReviewBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold">{title}</h4>
        <Button type="button" variant="ghost" size="xs" onClick={onEdit}>
          {getMessages().prd.review.edit}
        </Button>
      </div>
      {children}
    </section>
  );
}

function Written({ text: value }: { text: string }) {
  const copy = getMessages().prd.review;
  return value.trim() === "" ? (
    <p className="text-muted-foreground italic">{copy.empty}</p>
  ) : (
    <p className="leading-relaxed whitespace-pre-line">{value}</p>
  );
}
