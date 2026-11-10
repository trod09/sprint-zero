"use client";

import { History, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { SubmissionOutcome } from "@/core/case-engine/submission";
import type { ScoreResult } from "@/core/scoring";
import { getAttemptStore } from "@/core/storage";
import { getMessages } from "@/i18n";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

import type { DashboardOutcome, DashboardView } from "../dashboard";
import {
  dimensionLabel,
  formatChange,
  formatMetric,
  metricLabel,
  valueLabel,
} from "../labels";
import {
  DIMENSIONS,
  dimensionSchema,
  dimensionValues,
  explorationSchema,
  METRICS,
  metricSchema,
  ROOT_CAUSE_CATEGORIES,
  rootCauseCategorySchema,
  type Dimension,
  type Exploration,
  type MetricDropAnswer,
  type PublicMetricDropCase,
  type RootCauseCategory,
} from "../schema";
import { BreakdownTable } from "./breakdown-table";
import { TrendChart, type ChartSeries } from "./trend-chart";

export type SubmitAttempt = (input: unknown) => Promise<SubmissionOutcome>;
export type QueryDashboard = (input: unknown) => Promise<DashboardOutcome>;

const selectClassName =
  "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full min-w-0 rounded-lg border px-2 text-sm outline-none focus-visible:ring-3 dark:bg-input/30";

const MAX_LOGGED_VIEWS = 300;
const MAX_CHART_SERIES = 6;
const RANGES = ["30", "60", "all"] as const;
type Range = (typeof RANGES)[number];

// ------------------------------------------------------------------- draft

const viewQuerySchema = z.object({
  metric: metricSchema,
  breakdown: dimensionSchema.optional(),
  /** The dashboard filters one value per dimension. */
  filters: z.partialRecord(dimensionSchema, z.string().min(1)).default({}),
});
type ViewQuery = z.infer<typeof viewQuerySchema>;

const draftSchema = z.object({
  query: viewQuerySchema,
  explorations: z.array(explorationSchema).max(MAX_LOGGED_VIEWS),
  diagnosis: z.object({
    dimension: dimensionSchema.optional(),
    value: z.string().optional(),
    category: rootCauseCategorySchema.optional(),
    actionId: z.string().optional(),
    justification: z.string().max(1000).default(""),
  }),
});
type Draft = z.infer<typeof draftSchema>;

const draftKey = (caseId: string) =>
  `sprint-zero:metric-drop-draft:v1:${caseId}`;

function initialDraft(publicCase: PublicMetricDropCase): Draft {
  return {
    query: { metric: publicCase.headlineMetric, filters: {} },
    explorations: [],
    diagnosis: { justification: "" },
  };
}

function loadDraft(publicCase: PublicMetricDropCase): Draft {
  try {
    const raw = window.localStorage.getItem(draftKey(publicCase.id));
    if (!raw) return initialDraft(publicCase);
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : initialDraft(publicCase);
  } catch {
    return initialDraft(publicCase);
  }
}

function saveDraft(caseId: string, draft: Draft): void {
  try {
    window.localStorage.setItem(draftKey(caseId), JSON.stringify(draft));
  } catch {
    // Storage full or disabled: the investigation still works for this visit.
  }
}

function clearDraft(caseId: string): void {
  try {
    window.localStorage.removeItem(draftKey(caseId));
  } catch {
    // Nothing to clean up.
  }
}

// ------------------------------------------------------------------ helpers

function toExploration(query: ViewQuery): Exploration {
  const filters: Exploration["filters"] = {};
  for (const [dimension, value] of Object.entries(query.filters) as [
    Dimension,
    string | undefined,
  ][]) {
    if (value) filters[dimension] = [value];
  }
  return {
    metric: query.metric,
    ...(query.breakdown ? { breakdown: query.breakdown } : {}),
    filters,
  };
}

const sameExploration = (a: Exploration, b: Exploration) =>
  JSON.stringify(a) === JSON.stringify(b);

function describeExploration(view: Exploration): string {
  const copy = getMessages().metricDrop.log;
  const parts = [metricLabel(view.metric)];
  if (view.breakdown) parts.push(copy.by(dimensionLabel(view.breakdown)));
  const filters = Object.entries(view.filters) as [Dimension, string[]][];
  if (filters.length > 0) {
    parts.push(
      `${copy.where} ${filters
        .map(
          ([dimension, values]) =>
            `${dimensionLabel(dimension)} = ${values.map(valueLabel).join(", ")}`,
        )
        .join(", ")}`,
    );
  }
  return parts.join(" ");
}

// -------------------------------------------------------------- component

export function Investigation(props: {
  publicCase: PublicMetricDropCase;
  query: QueryDashboard;
  submit: SubmitAttempt;
}) {
  const isClient = useIsClient();
  const draft = useMemo(
    () =>
      isClient ? loadDraft(props.publicCase) : initialDraft(props.publicCase),
    [isClient, props.publicCase],
  );
  return (
    <Dashboard
      key={isClient ? "client" : "server"}
      {...props}
      initialDraft={draft}
      persist={isClient}
    />
  );
}

function Dashboard({
  publicCase,
  query: queryDashboard,
  submit,
  initialDraft: draft,
  persist,
}: {
  publicCase: PublicMetricDropCase;
  query: QueryDashboard;
  submit: SubmitAttempt;
  initialDraft: Draft;
  persist: boolean;
}) {
  const messages = getMessages();
  const copy = messages.metricDrop;
  const router = useRouter();

  const [query, setQuery] = useState<ViewQuery>(draft.query);
  const [explorations, setExplorations] = useState<Exploration[]>(
    draft.explorations,
  );
  const [diagnosis, setDiagnosis] = useState(draft.diagnosis);
  const [view, setView] = useState<DashboardView | null>(null);
  const [failed, setFailed] = useState(false);
  const [range, setRange] = useState<Range>("60");
  const [confirming, setConfirming] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [inlineResult, setInlineResult] = useState<ScoreResult | null>(null);
  const [isSubmitting, startSubmitting] = useTransition();
  const [isLoading, startLoading] = useTransition();
  const requestId = useRef(0);
  const startedAt = useRef<string | null>(null);

  const values = dimensionValues(publicCase.release);

  /** Loads a view; only the latest request wins, and every view is logged. */
  const load = (next: ViewQuery) => {
    const id = ++requestId.current;
    startLoading(async () => {
      let outcome: DashboardOutcome;
      try {
        outcome = await queryDashboard({
          caseId: publicCase.id,
          query: toExploration(next),
        });
      } catch {
        if (id === requestId.current) setFailed(true);
        return;
      }
      if (id !== requestId.current) return;
      if (!outcome.ok) {
        setFailed(true);
        return;
      }
      setFailed(false);
      setView(outcome.view);
      const exploration = toExploration(next);
      setExplorations((log) =>
        log.length > 0 && sameExploration(log[log.length - 1], exploration)
          ? log
          : log.length >= MAX_LOGGED_VIEWS
            ? log
            : [...log, exploration],
      );
    });
  };

  const changeQuery = (next: ViewQuery) => {
    setQuery(next);
    load(next);
  };

  useEffect(() => {
    startedAt.current ??= new Date().toISOString();
    if (persist) load(draft.query);
    // Load the first view once, when the browser state is known.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persist]);

  useEffect(() => {
    if (persist) saveDraft(publicCase.id, { query, explorations, diagnosis });
  }, [persist, publicCase.id, query, explorations, diagnosis]);

  // ------------------------------------------------------------- chart

  const visibleFrom =
    view && range !== "all"
      ? Math.max(0, view.dates.length - Number(range))
      : 0;
  const dates = view ? view.dates.slice(visibleFrom) : [];
  const series: ChartSeries[] = view
    ? view.breakdown && query.breakdown
      ? view.breakdown.slice(0, MAX_CHART_SERIES).map((entry) => ({
          key: entry.value,
          label: valueLabel(entry.value),
          values: entry.values.slice(visibleFrom),
        }))
      : [
          {
            key: "total",
            label: metricLabel(query.metric),
            values: view.total.slice(visibleFrom),
          },
        ]
    : [];
  const annotations = view
    ? publicCase.annotations.map((annotation) => ({
        ...annotation,
        date: view.dates[annotation.day],
      }))
    : [];

  // ------------------------------------------------------------ submit

  const answer: MetricDropAnswer | null =
    diagnosis.dimension &&
    diagnosis.value &&
    diagnosis.category &&
    diagnosis.actionId
      ? {
          segment: { dimension: diagnosis.dimension, value: diagnosis.value },
          category: diagnosis.category,
          actionId: diagnosis.actionId,
          justification: diagnosis.justification.trim(),
          explorations,
        }
      : null;

  const submitDiagnosis = () => {
    if (!answer) return;
    startSubmitting(async () => {
      let outcome: SubmissionOutcome;
      try {
        outcome = await submit({ caseId: publicCase.id, answer });
      } catch {
        setSubmitError(copy.diagnosis.failed);
        return;
      }
      if (!outcome.ok) {
        setSubmitError(outcome.error.message);
        return;
      }
      const submittedAt = new Date().toISOString();
      const attemptId = crypto.randomUUID();
      try {
        await getAttemptStore().saveAttempt({
          schemaVersion: 1,
          id: attemptId,
          caseId: publicCase.id,
          moduleId: publicCase.moduleId,
          startedAt: startedAt.current ?? submittedAt,
          submittedAt,
          answer,
          result: outcome.result,
        });
      } catch {
        clearDraft(publicCase.id);
        setConfirming(false);
        setInlineResult(outcome.result);
        return;
      }
      clearDraft(publicCase.id);
      router.push(`/results/${attemptId}`);
    });
  };

  if (inlineResult) {
    return (
      <section className="bg-card rounded-xl border p-6">
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

  const activeFilters = (
    Object.entries(query.filters) as [Dimension, string | undefined][]
  ).filter(([, value]) => value);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-labelledby="dashboard-title" className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="dashboard-title" className="font-heading font-semibold">
            {copy.dashboard.title}
          </h2>
          <Tabs
            value={range}
            onValueChange={(value) => setRange(value as Range)}
          >
            <TabsList aria-label={copy.dashboard.range}>
              {RANGES.map((value) => (
                <TabsTrigger key={value} value={value}>
                  {copy.dashboard.ranges[value]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="bg-card space-y-3 rounded-xl border p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="metric">{copy.dashboard.metric}</Label>
              <select
                id="metric"
                className={selectClassName}
                value={query.metric}
                onChange={(event) => {
                  const metric = METRICS.find((m) => m === event.target.value);
                  if (metric) changeQuery({ ...query, metric });
                }}
              >
                {METRICS.map((metric) => (
                  <option key={metric} value={metric}>
                    {metricLabel(metric)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="breakdown">{copy.dashboard.breakdown}</Label>
              <select
                id="breakdown"
                className={selectClassName}
                value={query.breakdown ?? ""}
                onChange={(event) => {
                  const breakdown = DIMENSIONS.find(
                    (d) => d === event.target.value,
                  );
                  changeQuery({ ...query, breakdown });
                }}
              >
                <option value="">{copy.dashboard.noBreakdown}</option>
                {DIMENSIONS.map((dimension) => (
                  <option key={dimension} value={dimension}>
                    {dimensionLabel(dimension)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <fieldset>
            <legend className="text-sm font-medium">
              {copy.dashboard.filters}
            </legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {DIMENSIONS.map((dimension) => (
                <select
                  key={dimension}
                  aria-label={dimensionLabel(dimension)}
                  className={cn(
                    selectClassName,
                    query.filters[dimension] && "border-brand",
                  )}
                  value={query.filters[dimension] ?? ""}
                  onChange={(event) => {
                    const filters = { ...query.filters };
                    if (event.target.value)
                      filters[dimension] = event.target.value;
                    else delete filters[dimension];
                    changeQuery({ ...query, filters });
                  }}
                >
                  <option value="">{copy.dashboard.any[dimension]}</option>
                  {values[dimension].map((value) => (
                    <option key={value} value={value}>
                      {valueLabel(value)}
                    </option>
                  ))}
                </select>
              ))}
            </div>
            {activeFilters.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => changeQuery({ ...query, filters: {} })}
              >
                <X aria-hidden="true" />
                {copy.dashboard.clearFilters}
              </Button>
            )}
          </fieldset>
        </div>

        <div className="bg-card rounded-xl border p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-medium">{metricLabel(query.metric)}</h3>
            <p aria-live="polite" className="text-muted-foreground text-xs">
              {isLoading
                ? copy.dashboard.loading
                : view
                  ? copy.dashboard.weekOverWeek(
                      formatMetric(query.metric, view.change.before),
                      formatMetric(query.metric, view.change.after),
                      formatChange(view.change.changePercent),
                    )
                  : ""}
            </p>
          </div>
          {failed && (
            <p role="alert" className="text-destructive mt-3 text-sm">
              {copy.dashboard.failed}
            </p>
          )}
          <div
            className={cn("mt-2 transition-opacity", isLoading && "opacity-60")}
          >
            {view ? (
              <TrendChart
                metric={query.metric}
                dates={dates}
                series={series}
                annotations={annotations}
                label={copy.dashboard.chartLabel(metricLabel(query.metric))}
              />
            ) : (
              <div className="bg-muted/40 h-80 animate-pulse rounded-lg" />
            )}
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            {copy.dashboard.annotationsShown}
          </p>
          {view && (
            <div className="mt-4">
              <BreakdownTable
                metric={query.metric}
                view={view}
                dimensionName={
                  query.breakdown
                    ? dimensionLabel(query.breakdown)
                    : copy.dashboard.segment
                }
              />
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-20">
        <section
          aria-labelledby="log-title"
          className="bg-card rounded-xl border p-4"
        >
          <div className="flex items-baseline justify-between">
            <h2
              id="log-title"
              className="font-heading flex items-center gap-2 text-sm font-semibold"
            >
              <History className="size-4" aria-hidden="true" />
              {copy.log.title}
            </h2>
            <span className="text-muted-foreground text-xs">
              {copy.log.count(explorations.length)}
            </span>
          </div>
          {explorations.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-xs">
              {copy.log.empty}
            </p>
          ) : (
            <ol className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs">
              {explorations.map((exploration, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-muted-foreground w-5 shrink-0 text-right tabular-nums">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    className="hover:text-foreground text-muted-foreground focus-visible:ring-ring/50 rounded-sm text-left focus-visible:ring-2 focus-visible:outline-none"
                    aria-label={`${copy.log.restore(index + 1)}: ${describeExploration(exploration)}`}
                    onClick={() =>
                      changeQuery({
                        metric: exploration.metric,
                        breakdown: exploration.breakdown,
                        filters: Object.fromEntries(
                          Object.entries(exploration.filters).map(([d, v]) => [
                            d,
                            v[0],
                          ]),
                        ),
                      })
                    }
                  >
                    {describeExploration(exploration)}
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section
          aria-labelledby="diagnosis-title"
          className="bg-card space-y-3 rounded-xl border p-4"
        >
          <div>
            <h2 id="diagnosis-title" className="font-heading font-semibold">
              {copy.diagnosis.title}
            </h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {copy.diagnosis.intro}
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="diagnosis-dimension">
              {copy.diagnosis.dimension}
            </Label>
            <select
              id="diagnosis-dimension"
              className={selectClassName}
              value={diagnosis.dimension ?? ""}
              onChange={(event) => {
                const dimension = DIMENSIONS.find(
                  (d) => d === event.target.value,
                );
                setDiagnosis({ ...diagnosis, dimension, value: undefined });
              }}
            >
              <option value="">{copy.diagnosis.pickDimension}</option>
              {DIMENSIONS.map((dimension) => (
                <option key={dimension} value={dimension}>
                  {dimensionLabel(dimension)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="diagnosis-value">{copy.diagnosis.value}</Label>
            <select
              id="diagnosis-value"
              className={selectClassName}
              disabled={!diagnosis.dimension}
              value={diagnosis.value ?? ""}
              onChange={(event) =>
                setDiagnosis({
                  ...diagnosis,
                  value: event.target.value || undefined,
                })
              }
            >
              <option value="">{copy.diagnosis.pickValue}</option>
              {diagnosis.dimension &&
                values[diagnosis.dimension].map((value) => (
                  <option key={value} value={value}>
                    {valueLabel(value)}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="diagnosis-category">
              {copy.diagnosis.category}
            </Label>
            <select
              id="diagnosis-category"
              className={selectClassName}
              value={diagnosis.category ?? ""}
              onChange={(event) => {
                const category = ROOT_CAUSE_CATEGORIES.find(
                  (c) => c === event.target.value,
                );
                setDiagnosis({
                  ...diagnosis,
                  category: category as RootCauseCategory | undefined,
                });
              }}
            >
              <option value="">{copy.diagnosis.pickCategory}</option>
              {ROOT_CAUSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {copy.categories[category]}
                </option>
              ))}
            </select>
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">
              {copy.diagnosis.action}
            </legend>
            {publicCase.actionOptions.map((option) => (
              <label key={option.id} className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="action"
                  value={option.id}
                  checked={diagnosis.actionId === option.id}
                  onChange={() =>
                    setDiagnosis({ ...diagnosis, actionId: option.id })
                  }
                  className="accent-brand mt-1"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
          <div className="space-y-1">
            <Label htmlFor="diagnosis-justification">
              {copy.diagnosis.justification}
            </Label>
            <Textarea
              id="diagnosis-justification"
              rows={3}
              maxLength={1000}
              placeholder={copy.diagnosis.justificationPlaceholder}
              value={diagnosis.justification}
              onChange={(event) =>
                setDiagnosis({
                  ...diagnosis,
                  justification: event.target.value,
                })
              }
            />
          </div>
          <Button
            type="button"
            className="w-full"
            disabled={!answer}
            onClick={() => {
              setSubmitError(null);
              setConfirming(true);
            }}
          >
            {copy.diagnosis.submit}
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
            <DialogTitle>{copy.diagnosis.confirmTitle}</DialogTitle>
            <DialogDescription>{copy.diagnosis.confirmBody}</DialogDescription>
          </DialogHeader>
          {submitError && (
            <p role="alert" className="text-destructive text-sm">
              {submitError}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setConfirming(false)}
            >
              {copy.diagnosis.cancel}
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={submitDiagnosis}
            >
              {isSubmitting
                ? copy.diagnosis.submitting
                : copy.diagnosis.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
