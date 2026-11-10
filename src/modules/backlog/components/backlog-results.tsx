"use client";

import { ArrowDown, ArrowUp, Check, Minus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

import { addedTickets } from "../planning";
import type { BacklogReport, TrapOutcome } from "../report";
import type { BacklogCase, PublicTicket } from "../schema";
import { EffortPill, TicketTypeIcon } from "./ticket-meta";

const OUTCOME_STYLES: Record<TrapOutcome, string> = {
  identified: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  avoided: "bg-sky-500/15 text-sky-800 dark:text-sky-300",
  fell_for: "bg-destructive/10 text-destructive",
};

function Section({
  id,
  title,
  children,
  className,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn("bg-card rounded-xl border p-5", className)}
    >
      <h2 id={id} className="font-heading font-semibold">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TicketLine({
  ticket,
  children,
  muted,
}: {
  ticket: PublicTicket;
  children?: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div
      className={cn("flex items-center gap-2 text-sm", muted && "opacity-60")}
    >
      <TicketTypeIcon type={ticket.type} className="size-3.5" />
      <span className="text-muted-foreground shrink-0 font-mono text-xs">
        {ticket.id}
      </span>
      <span className="min-w-0 flex-1 truncate" title={ticket.title}>
        {ticket.title}
      </span>
      {children}
      <EffortPill effort={ticket.effort} />
    </div>
  );
}

function formatMetric(key: string, value: number): string {
  if (key === "revenue") return formatUsd(value);
  if (key === "techDebt") return `${value}/100`;
  if (key === "nps") return value.toFixed(1).replace(/\.0$/, "");
  return `${value.toFixed(1).replace(/\.0$/, "")}%`;
}

export function BacklogResults({
  caseData,
  report,
}: {
  caseData: BacklogCase;
  report: BacklogReport;
}) {
  const copy = getMessages().backlog.results;
  const tickets = [
    ...caseData.tickets,
    ...addedTickets(caseData.midSprintEvents),
  ];
  const byId = new Map(tickets.map((ticket) => [ticket.id, ticket]));
  const ticket = (id: string) => byId.get(id);

  const yours = new Set(report.delivered.ticketIds);
  const best = new Set(report.optimal.ticketIds);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
          <h2 className="text-xs font-medium tracking-wide text-amber-800 uppercase dark:text-amber-300">
            {copy.insight}
          </h2>
          <p className="mt-2 text-sm leading-relaxed">{report.keyInsight}</p>
        </div>
        <div className="border-brand/30 bg-brand/5 rounded-xl border p-5">
          <h2 className="text-brand text-xs font-medium tracking-wide uppercase">
            {copy.principle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed font-medium">
            {report.principle}
          </p>
        </div>
      </section>

      <Section id="comparison-title" title={copy.sprintComparison}>
        <div className="grid gap-6 lg:grid-cols-2">
          {[
            {
              key: "yours",
              title: copy.yourSprint,
              summary: report.delivered,
              ids: report.delivered.ticketIds,
              other: best,
            },
            {
              key: "best",
              title: copy.bestSprint,
              summary: report.optimal,
              ids: report.optimal.ticketIds,
              other: yours,
            },
          ].map((column) => (
            <div key={column.key}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-medium">{column.title}</h3>
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                  {copy.valueOf(
                    column.summary.value,
                    column.summary.effort,
                    column.summary.capacity,
                  )}
                </span>
              </div>
              <ul className="mt-2 space-y-1.5">
                {column.ids.map((id) => {
                  const entry = ticket(id);
                  if (!entry) return null;
                  const shared = column.other.has(id);
                  return (
                    <li key={id}>
                      <TicketLine ticket={entry}>
                        <span
                          className={cn(
                            "shrink-0 text-xs",
                            shared
                              ? "text-muted-foreground"
                              : column.key === "yours"
                                ? "text-destructive"
                                : "text-amber-700 dark:text-amber-400",
                          )}
                        >
                          {shared
                            ? copy.inBoth
                            : column.key === "yours"
                              ? copy.onlyYours
                              : copy.missed}
                        </span>
                      </TicketLine>
                    </li>
                  );
                })}
                {column.key === "yours" &&
                  report.delivered.spilledIds.map((id) => {
                    const entry = ticket(id);
                    return entry ? (
                      <li key={id}>
                        <TicketLine ticket={entry} muted>
                          <span className="text-destructive shrink-0 text-xs">
                            {copy.notFinished}
                          </span>
                        </TicketLine>
                      </li>
                    ) : null;
                  })}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section id="metrics-title" title={copy.metrics}>
          <dl className="divide-y text-sm">
            {report.metrics.map((metric) => {
              const delta = metric.after - metric.before;
              // Lower is better for tech debt.
              const good = metric.key === "techDebt" ? delta < 0 : delta > 0;
              const Icon =
                delta === 0 ? Minus : delta > 0 ? ArrowUp : ArrowDown;
              return (
                <div
                  key={metric.key}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <dt className="text-muted-foreground">
                    {copy.metricNames[metric.key]}
                  </dt>
                  <dd className="flex items-center gap-2 font-mono tabular-nums">
                    <span className="text-muted-foreground">
                      {formatMetric(metric.key, metric.before)}
                    </span>
                    <span aria-hidden="true">→</span>
                    <span className="font-medium">
                      {formatMetric(metric.key, metric.after)}
                    </span>
                    <Icon
                      className={cn(
                        "size-3.5",
                        delta === 0
                          ? "text-muted-foreground"
                          : good
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-destructive",
                      )}
                      aria-hidden="true"
                    />
                  </dd>
                </div>
              );
            })}
          </dl>
        </Section>

        <Section id="stakeholders-title" title={copy.stakeholders}>
          <ul className="space-y-3 text-sm">
            {report.stakeholders.map((entry) => (
              <li key={entry.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">
                    {entry.name}
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      · {entry.role}
                    </span>
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {entry.satisfaction === null
                      ? copy.noRequests
                      : copy.requestsDelivered(
                          entry.delivered,
                          entry.requested,
                        )}
                  </span>
                </div>
                {entry.satisfaction !== null && (
                  <div
                    role="meter"
                    aria-label={`${entry.name}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={entry.satisfaction}
                    className="bg-muted mt-1.5 h-1.5 overflow-hidden rounded-full"
                  >
                    <div
                      className={cn(
                        "h-full rounded-full",
                        entry.satisfaction >= 60
                          ? "bg-emerald-500"
                          : entry.satisfaction >= 30
                            ? "bg-amber-500"
                            : "bg-destructive",
                      )}
                      style={{ width: `${entry.satisfaction}%` }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section id="traps-title" title={copy.traps}>
        <ul className="divide-y">
          {report.traps.map((entry) => {
            const trapTicket = ticket(entry.ticketId);
            if (!trapTicket) return null;
            return (
              <li
                key={entry.ticketId}
                className="space-y-1.5 py-3 first:pt-0 last:pb-0"
              >
                <TicketLine ticket={trapTicket}>
                  <Badge variant="outline" className="shrink-0">
                    {copy.trapNames[entry.trap]}
                  </Badge>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium",
                      OUTCOME_STYLES[entry.outcome],
                    )}
                  >
                    {copy.trapOutcomes[entry.outcome]}
                  </span>
                </TicketLine>
                <p className="text-muted-foreground pl-6 text-sm">
                  {entry.explanation}
                </p>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section id="criticals-title" title={copy.criticals}>
        <ul className="divide-y">
          {report.criticals.map((entry) => {
            const criticalTicket = ticket(entry.ticketId);
            if (!criticalTicket) return null;
            return (
              <li
                key={entry.ticketId}
                className="space-y-1.5 py-3 first:pt-0 last:pb-0"
              >
                <TicketLine ticket={criticalTicket}>
                  {entry.disguised && (
                    <Badge variant="outline" className="shrink-0">
                      {copy.disguised}
                    </Badge>
                  )}
                  <span
                    className={cn(
                      "flex shrink-0 items-center gap-1 text-xs font-medium",
                      entry.delivered
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-destructive",
                    )}
                  >
                    {entry.delivered ? (
                      <Check className="size-3.5" aria-hidden="true" />
                    ) : (
                      <X className="size-3.5" aria-hidden="true" />
                    )}
                    {entry.delivered ? copy.delivered : copy.notDelivered}
                  </span>
                </TicketLine>
                <p className="text-muted-foreground pl-6 text-sm">
                  {entry.explanation}
                </p>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section id="events-title" title={copy.events}>
        <ul className="space-y-4">
          {report.events.map((entry) => (
            <li key={entry.id} className="text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium">{entry.title}</span>
                <span
                  className={cn(
                    "font-mono text-xs tabular-nums",
                    entry.handling >= 0.999
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-amber-700 dark:text-amber-400",
                  )}
                >
                  {copy.handling(Math.round(entry.handling * 100))}
                </span>
              </div>
              <p className="text-muted-foreground mt-1">{entry.guidance}</p>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
