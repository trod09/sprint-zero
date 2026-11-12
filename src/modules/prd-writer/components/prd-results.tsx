"use client";

import type { ReactNode } from "react";

import { RatingDots } from "@/components/rating-dots";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import type { PrdAnswer, PrdCase } from "../schema";
import type { PrdReport } from "../scoring";
import { Panel } from "@/components/arcade/panel";

const OK = "text-success";
const WRONG = "text-destructive";

export function PrdResults({
  caseData,
  report,
  answer,
}: {
  caseData: PrdCase;
  report: PrdReport;
  answer: PrdAnswer | null;
}) {
  const messages = getMessages();
  const copy = messages.prd;
  const { hidden } = caseData;
  const evidenceText = new Map(caseData.evidence.map((e) => [e.id, e.text]));
  const evidenceWhy = new Map(hidden.evidence.map((e) => [e.id, e.why]));
  const metricName = new Map(caseData.metrics.map((m) => [m.id, m.name]));
  const unit =
    caseData.metrics.find((m) => m.id === report.metric.primaryId)?.unit ?? "";
  const requirement = new Map(caseData.requirements.map((r) => [r.id, r]));
  const scopeWhy = new Map(hidden.requirements.map((r) => [r.id, r.why]));
  const risk = new Map(caseData.risks.map((r) => [r.id, r]));
  const riskWhy = new Map(hidden.risks.map((r) => [r.id, r.why]));
  const mitigation = new Map(
    (answer?.risks ?? []).map((r) => [r.riskId, r.mitigation]),
  );
  const withUnit = (value: number | null) =>
    value === null
      ? copy.results.none
      : unit === "%"
        ? `${value}%`
        : `${value} ${unit}`;
  const { metric } = report;

  return (
    <div className="space-y-6">
      <Section
        id="problem"
        title={copy.steps.problem}
        ideal={hidden.ideal.problem}
      >
        <ul className="divide-y">
          {[...report.evidence]
            .sort((a, b) => b.strength - a.strength)
            .map((item) => (
              <Row
                key={item.id}
                title={evidenceText.get(item.id) ?? item.id}
                why={evidenceWhy.get(item.id) ?? ""}
                badge={
                  item.picked && (
                    <Badge variant="outline">{copy.results.cited}</Badge>
                  )
                }
                rating={
                  <>
                    {copy.results.strength}{" "}
                    <RatingDots value={item.strength} max={2} />
                  </>
                }
              />
            ))}
        </ul>
      </Section>

      <Section id="goals" title={copy.steps.goals} ideal={hidden.ideal.metrics}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-left text-xs">
                <th scope="col" className="pb-2 font-medium">
                  <span className="sr-only">
                    {copy.results.metricRows.metric}
                  </span>
                </th>
                <th scope="col" className="pb-2 font-medium">
                  {copy.results.yours}
                </th>
                <th scope="col" className="pb-2 font-medium">
                  {copy.results.answer}
                </th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  [
                    copy.results.metricRows.metric,
                    metric.chosenId
                      ? (metricName.get(metric.chosenId) ?? metric.chosenId)
                      : copy.results.none,
                    metricName.get(metric.primaryId) ?? metric.primaryId,
                    metric.chosenId === metric.primaryId,
                  ],
                  [
                    copy.results.metricRows.baseline,
                    withUnit(metric.learnerBaseline),
                    withUnit(metric.baseline),
                    metric.baselineOk,
                  ],
                  [
                    copy.results.metricRows.target,
                    withUnit(metric.learnerTarget),
                    copy.results.targetRange(
                      withUnit(metric.targetMin),
                      withUnit(metric.targetMax),
                    ),
                    metric.targetOk,
                  ],
                  [
                    copy.results.metricRows.horizon,
                    metric.learnerHorizon
                      ? copy.horizons[metric.learnerHorizon]
                      : copy.results.none,
                    copy.horizons[metric.horizon],
                    metric.horizonOk,
                  ],
                ] as const
              ).map(([label, yours, right, ok]) => (
                <tr key={label} className="border-t">
                  <th scope="row" className="py-2 pr-3 text-left font-medium">
                    {label}
                  </th>
                  <td className={cn("py-2 pr-3", ok ? OK : WRONG)}>{yours}</td>
                  <td className="py-2">{right}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="text-muted-foreground space-y-1 text-sm">
          {caseData.metrics.map((m) => (
            <li key={m.id}>
              <span className="text-foreground font-medium">{m.name}:</span>{" "}
              {hidden.metric.notes[m.id]}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="scope" title={copy.steps.scope} ideal={hidden.ideal.scope}>
        <ul className="divide-y">
          {report.scope.map((item) => (
            <Row
              key={item.id}
              title={requirement.get(item.id)?.title ?? item.id}
              why={scopeWhy.get(item.id) ?? ""}
              badge={
                <Badge
                  variant={item.expected === "out" ? "secondary" : "default"}
                >
                  {copy.results.expected}: {copy.buckets[item.expected]}
                </Badge>
              }
              rating={
                <span
                  className={cn(
                    item.credit === 1 ? OK : item.credit > 0 ? "" : WRONG,
                  )}
                >
                  {copy.results.yours}:{" "}
                  {item.learner
                    ? copy.buckets[item.learner]
                    : copy.results.none}
                </span>
              }
            />
          ))}
        </ul>
      </Section>

      <Section id="risks" title={copy.steps.risks} ideal={hidden.ideal.risks}>
        <ul className="divide-y">
          {[...report.risks]
            .sort((a, b) => b.relevance - a.relevance)
            .map((item) => (
              <Row
                key={item.id}
                title={risk.get(item.id)?.title ?? item.id}
                why={riskWhy.get(item.id) ?? ""}
                badge={
                  item.picked && (
                    <Badge variant="outline">{copy.results.named}</Badge>
                  )
                }
                rating={
                  <>
                    {copy.results.relevance}{" "}
                    <RatingDots value={item.relevance} max={2} />
                  </>
                }
                extra={
                  item.picked && mitigation.get(item.id) ? (
                    <p className="text-sm">
                      <span className="font-medium">
                        {copy.risks.mitigation}:
                      </span>{" "}
                      {mitigation.get(item.id)}
                    </p>
                  ) : null
                }
              />
            ))}
        </ul>
      </Section>

      <p className="text-muted-foreground text-sm">
        <span className="text-foreground font-medium">
          {copy.results.principle}:
        </span>{" "}
        {hidden.principle}
      </p>
    </div>
  );
}

function Section({
  id,
  title,
  ideal,
  children,
}: {
  id: string;
  title: string;
  ideal: string;
  children: ReactNode;
}) {
  const copy = getMessages().prd.results;
  return (
    <Panel
      icon="chart"
      id={`${id}-title`}
      title={title}
      bodyClassName="space-y-4"
    >
      <div className="border-primary/50 bg-primary/5 rounded-md border-2 px-3 py-2">
        <p className="text-xs font-medium tracking-wide uppercase">
          {copy.ideal}
        </p>
        <p className="text-sm leading-relaxed text-pretty">{ideal}</p>
      </div>
      {children}
    </Panel>
  );
}

function Row({
  title,
  why,
  badge,
  rating,
  extra,
}: {
  title: string;
  why: string;
  badge?: ReactNode;
  rating: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <li className="space-y-1 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{title}</span>
        {badge}
        <span className="text-muted-foreground ml-auto flex items-center gap-2 text-xs">
          {rating}
        </span>
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed">{why}</p>
      {extra}
    </li>
  );
}
