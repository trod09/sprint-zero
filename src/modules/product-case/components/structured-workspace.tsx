"use client";

import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { useMission } from "@/components/arcade/mission";
import { Panel } from "@/components/arcade/panel";
import { StepTrack } from "@/components/arcade/step-track";
import { OptionCard } from "@/components/option-card";
import { Badge } from "@/components/ui/badge";
import { InlineResult, SubmitDialog } from "@/components/submit-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getMessages } from "@/i18n";
import { clearDraft, loadDraft, saveDraft } from "@/lib/draft";
import { useIsClient } from "@/lib/use-is-client";
import { useSubmitAttempt, type SubmitAttempt } from "@/lib/use-submit-attempt";
import { cn } from "@/lib/utils";

import { productCaseDraftKey, timingFrom } from "../draft";
import {
  MAX_PROBLEMS,
  MAX_RANKED_SOLUTIONS,
  MAX_REASONING,
  type PublicStructuredCase,
  type StructuredAnswer,
} from "../schema";
import { CaseTimer } from "./case-timer";
import { ResearchPanel } from "./research-panel";

const STEPS = ["users", "problems", "solutions", "metrics", "review"] as const;
type Step = (typeof STEPS)[number];

const text = z.string().max(MAX_REASONING).catch("");
const draftSchema = z.object({
  step: z.enum(STEPS).catch("users"),
  segmentId: z.string().nullable().catch(null),
  usersWhy: text,
  problemIds: z.array(z.string()).max(MAX_PROBLEMS).catch([]),
  problemsWhy: text,
  ideas: text,
  solutionRanking: z.array(z.string()).max(MAX_RANKED_SOLUTIONS).catch([]),
  solutionsWhy: text,
  successMetricId: z.string().nullable().catch(null),
  guardrailMetricId: z.string().nullable().catch(null),
  metricsWhy: text,
  timerStartedAt: z.number().nullable().catch(null),
});
type Draft = z.infer<typeof draftSchema>;

const emptyDraft = (): Draft => ({
  step: "users",
  segmentId: null,
  usersWhy: "",
  problemIds: [],
  problemsWhy: "",
  ideas: "",
  solutionRanking: [],
  solutionsWhy: "",
  successMetricId: null,
  guardrailMetricId: null,
  metricsWhy: "",
  timerStartedAt: null,
});

/** Drops ids that are not options of this case, e.g. from an older draft. */
function sanitize(draft: Draft, publicCase: PublicStructuredCase): Draft {
  const has = (list: readonly { id: string }[], id: string | null) =>
    id !== null && list.some((item) => item.id === id);
  return {
    ...draft,
    segmentId: has(publicCase.segments, draft.segmentId)
      ? draft.segmentId
      : null,
    problemIds: draft.problemIds.filter((id) => has(publicCase.problems, id)),
    solutionRanking: [...new Set(draft.solutionRanking)].filter((id) =>
      has(publicCase.solutions, id),
    ),
    successMetricId: has(publicCase.metrics, draft.successMetricId)
      ? draft.successMetricId
      : null,
    guardrailMetricId: has(publicCase.metrics, draft.guardrailMetricId)
      ? draft.guardrailMetricId
      : null,
  };
}

export function StructuredWorkspace(props: {
  publicCase: PublicStructuredCase;
  submit: SubmitAttempt;
}) {
  const isClient = useIsClient();
  const initial = useMemo(
    () =>
      isClient
        ? sanitize(
            loadDraft(
              productCaseDraftKey(props.publicCase.id),
              draftSchema,
              emptyDraft,
            ),
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

function ReasoningField({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={3}
        maxLength={MAX_REASONING}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function Workspace({
  publicCase,
  submit,
  initialDraft,
  persist,
}: {
  publicCase: PublicStructuredCase;
  submit: SubmitAttempt;
  initialDraft: Draft;
  persist: boolean;
}) {
  const messages = getMessages();
  const copy = messages.productCase;
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

  const nameOf = useMemo(
    () =>
      new Map<string, string>([
        ...publicCase.segments.map((s) => [s.id, s.name] as const),
        ...publicCase.problems.map((p) => [p.id, p.statement] as const),
        ...publicCase.solutions.map((s) => [s.id, s.name] as const),
        ...publicCase.metrics.map((m) => [m.id, m.name] as const),
      ]),
    [publicCase],
  );

  const complete: Record<Step, boolean> = {
    users: draft.segmentId !== null,
    problems: draft.problemIds.length > 0,
    solutions: draft.solutionRanking.length > 0,
    metrics: draft.successMetricId !== null && draft.guardrailMetricId !== null,
    review: false,
  };
  const anythingChosen = Object.values(complete).some(Boolean);
  const stepIndex = STEPS.indexOf(draft.step);

  useMission(
    inlineResult
      ? null
      : {
          objectives: STEPS.filter((step) => step !== "review").map((step) => ({
            id: step,
            label: copy.steps[step],
            done: complete[step],
          })),
          action: {
            label: copy.submit.button,
            disabled: !anythingChosen,
            hint: copy.submit.needsChoice,
            onClick: () => {
              clearError();
              setConfirming(true);
            },
          },
        },
  );

  if (inlineResult) return <InlineResult result={inlineResult} />;

  const moveInPlan = (index: number, offset: -1 | 1) => {
    const ranking = [...draft.solutionRanking];
    const [item] = ranking.splice(index, 1);
    ranking.splice(index + offset, 0, item);
    update({ solutionRanking: ranking });
  };

  const answer = (): StructuredAnswer => ({
    kind: publicCase.kind,
    segmentId: draft.segmentId,
    usersWhy: draft.usersWhy.trim(),
    problemIds: draft.problemIds,
    problemsWhy: draft.problemsWhy.trim(),
    ideas: draft.ideas.trim(),
    solutionRanking: draft.solutionRanking,
    solutionsWhy: draft.solutionsWhy.trim(),
    successMetricId: draft.successMetricId,
    guardrailMetricId: draft.guardrailMetricId,
    metricsWhy: draft.metricsWhy.trim(),
    timing: timingFrom(draft.timerStartedAt),
  });

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-5">
        <CaseTimer
          limitMinutes={publicCase.timeLimitMinutes}
          startedAt={draft.timerStartedAt}
          onStart={() => update({ timerStartedAt: Date.now() })}
          onStop={() => update({ timerStartedAt: null })}
        />

        <StepTrack
          label={copy.steps.label}
          current={draft.step}
          onSelect={(step) => update({ step })}
          steps={STEPS.map((step) => ({
            id: step,
            label: copy.steps[step],
            done: complete[step],
          }))}
        />

        <Panel
          icon="pencil"
          title={`${messages.arcade.steps.stepOf(stepIndex + 1, STEPS.length)} · ${copy.steps[draft.step]}`}
          bodyClassName="space-y-4 p-5"
        >
          {draft.step === "users" && (
            <>
              <StepHeading title={copy.users.title} intro={copy.users.intro} />
              <div className="grid gap-2">
                {publicCase.segments.map((segment) => (
                  <OptionCard
                    key={segment.id}
                    type="radio"
                    name="segment"
                    checked={draft.segmentId === segment.id}
                    onChange={() => update({ segmentId: segment.id })}
                    title={segment.name}
                    description={segment.description}
                  />
                ))}
              </div>
              <ReasoningField
                id="users-why"
                label={copy.users.why}
                placeholder={copy.users.whyPlaceholder}
                value={draft.usersWhy}
                onChange={(usersWhy) => update({ usersWhy })}
              />
            </>
          )}

          {draft.step === "problems" && (
            <>
              <StepHeading
                title={copy.problems.title}
                intro={
                  draft.segmentId
                    ? `${copy.problems.intro(MAX_PROBLEMS)} (${nameOf.get(draft.segmentId)})`
                    : copy.problems.noSegment
                }
              />
              <div className="grid gap-2">
                {publicCase.problems.map((problem) => {
                  const checked = draft.problemIds.includes(problem.id);
                  return (
                    <OptionCard
                      key={problem.id}
                      type="checkbox"
                      name="problems"
                      checked={checked}
                      disabled={draft.problemIds.length >= MAX_PROBLEMS}
                      onChange={() =>
                        update({
                          problemIds: checked
                            ? draft.problemIds.filter((id) => id !== problem.id)
                            : [...draft.problemIds, problem.id],
                        })
                      }
                      title={problem.statement}
                    />
                  );
                })}
              </div>
              {draft.problemIds.length >= MAX_PROBLEMS && (
                <p className="text-muted-foreground text-xs" role="status">
                  {copy.problems.max(MAX_PROBLEMS)}
                </p>
              )}
              <ReasoningField
                id="problems-why"
                label={copy.problems.why}
                placeholder={copy.problems.whyPlaceholder}
                value={draft.problemsWhy}
                onChange={(problemsWhy) => update({ problemsWhy })}
              />
            </>
          )}

          {draft.step === "solutions" && (
            <>
              <StepHeading
                title={copy.solutions.title}
                intro={copy.solutions.intro(MAX_RANKED_SOLUTIONS)}
              />
              <ReasoningField
                id="ideas"
                label={copy.solutions.ideas}
                placeholder={copy.solutions.ideasPlaceholder}
                value={draft.ideas}
                onChange={(ideas) => update({ ideas })}
              />
              <ul className="grid gap-2">
                {publicCase.solutions.map((solution) => {
                  const position = draft.solutionRanking.indexOf(solution.id);
                  const full =
                    draft.solutionRanking.length >= MAX_RANKED_SOLUTIONS;
                  return (
                    <li
                      key={solution.id}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3",
                        position >= 0 && "border-primary bg-primary/5",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{solution.name}</p>
                        <p className="text-muted-foreground mt-0.5 text-sm">
                          {solution.description}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {copy.solutions.effort}:{" "}
                          <span className="text-foreground font-medium">
                            {copy.solutions.efforts[solution.effort]}
                          </span>
                        </p>
                      </div>
                      {position >= 0 ? (
                        <Badge variant="secondary">
                          {copy.solutions.inPlan(position + 1)}
                        </Badge>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={full}
                          onClick={() =>
                            update({
                              solutionRanking: [
                                ...draft.solutionRanking,
                                solution.id,
                              ],
                            })
                          }
                        >
                          {copy.solutions.add}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">{copy.solutions.plan}</h3>
                {draft.solutionRanking.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    {copy.solutions.planEmpty}
                  </p>
                ) : (
                  <ol className="space-y-1.5">
                    {draft.solutionRanking.map((id, index) => {
                      const name = nameOf.get(id) ?? id;
                      return (
                        <li
                          key={id}
                          className="bg-background flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm"
                        >
                          <span className="text-muted-foreground w-5 font-mono text-xs">
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1">{name}</span>
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            aria-label={copy.solutions.up(name)}
                            disabled={index === 0}
                            onClick={() => moveInPlan(index, -1)}
                          >
                            <ArrowUp aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            aria-label={copy.solutions.down(name)}
                            disabled={
                              index === draft.solutionRanking.length - 1
                            }
                            onClick={() => moveInPlan(index, 1)}
                          >
                            <ArrowDown aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            aria-label={copy.solutions.remove(name)}
                            onClick={() =>
                              update({
                                solutionRanking: draft.solutionRanking.filter(
                                  (other) => other !== id,
                                ),
                              })
                            }
                          >
                            <X aria-hidden="true" />
                          </Button>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
              <ReasoningField
                id="solutions-why"
                label={copy.solutions.why}
                placeholder={copy.solutions.whyPlaceholder}
                value={draft.solutionsWhy}
                onChange={(solutionsWhy) => update({ solutionsWhy })}
              />
            </>
          )}

          {draft.step === "metrics" && (
            <>
              <StepHeading
                title={copy.metrics.title}
                intro={copy.metrics.intro}
              />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-left text-xs">
                      <th scope="col" className="pb-2 font-medium">
                        <span className="sr-only">{copy.metrics.metric}</span>
                      </th>
                      <th
                        scope="col"
                        className="w-20 pb-2 text-center font-medium"
                      >
                        {copy.metrics.success}
                      </th>
                      <th
                        scope="col"
                        className="w-20 pb-2 text-center font-medium"
                      >
                        {copy.metrics.guardrail}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {publicCase.metrics.map((metric) => (
                      <tr key={metric.id} className="border-t">
                        <th
                          scope="row"
                          className="py-2 pr-3 text-left font-normal"
                        >
                          <span className="font-medium">{metric.name}</span>
                          <span className="text-muted-foreground block text-xs">
                            {metric.definition}
                          </span>
                        </th>
                        <td className="text-center">
                          <input
                            type="radio"
                            name="success-metric"
                            className="accent-primary size-4"
                            aria-label={copy.metrics.successFor(metric.name)}
                            checked={draft.successMetricId === metric.id}
                            onChange={() =>
                              update({ successMetricId: metric.id })
                            }
                          />
                        </td>
                        <td className="text-center">
                          <input
                            type="radio"
                            name="guardrail-metric"
                            className="accent-primary size-4"
                            aria-label={copy.metrics.guardrailFor(metric.name)}
                            checked={draft.guardrailMetricId === metric.id}
                            onChange={() =>
                              update({ guardrailMetricId: metric.id })
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ReasoningField
                id="metrics-why"
                label={copy.metrics.why}
                placeholder={copy.metrics.whyPlaceholder}
                value={draft.metricsWhy}
                onChange={(metricsWhy) => update({ metricsWhy })}
              />
            </>
          )}

          {draft.step === "review" && (
            <>
              <StepHeading
                title={copy.review.title}
                intro={copy.review.intro}
              />
              <dl className="divide-y text-sm">
                {(
                  [
                    ["users", draft.segmentId ? [draft.segmentId] : []],
                    ["problems", draft.problemIds],
                    ["solutions", draft.solutionRanking],
                    [
                      "metrics",
                      [draft.successMetricId, draft.guardrailMetricId].filter(
                        (id): id is string => id !== null,
                      ),
                    ],
                  ] as const
                ).map(([step, chosen]) => (
                  <div key={step} className="flex gap-3 py-2.5">
                    <dt className="w-24 shrink-0 font-medium">
                      {copy.steps[step]}
                    </dt>
                    <dd className="min-w-0 flex-1">
                      {chosen.length === 0 ? (
                        <span className="text-muted-foreground">
                          {copy.review.missing}
                        </span>
                      ) : (
                        <ol
                          className={cn(
                            "space-y-0.5",
                            chosen.length > 1 && "list-decimal pl-4",
                          )}
                        >
                          {chosen.map((id, index) => (
                            <li key={`${id}-${index}`}>
                              {step === "metrics" && (
                                <span className="text-muted-foreground">
                                  {index === 0 && draft.successMetricId
                                    ? copy.metrics.success
                                    : copy.metrics.guardrail}
                                  :{" "}
                                </span>
                              )}
                              {nameOf.get(id)}
                            </li>
                          ))}
                        </ol>
                      )}
                    </dd>
                    <dd>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => update({ step })}
                      >
                        {copy.review.edit}
                      </Button>
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </Panel>

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

      <aside className="space-y-4 lg:sticky lg:top-20">
        <ResearchPanel notes={publicCase.research} />
      </aside>

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

function StepHeading({ title, intro }: { title: string; intro: string }) {
  return (
    <div>
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm">{intro}</p>
    </div>
  );
}
