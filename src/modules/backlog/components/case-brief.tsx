import { CalendarDays, Gauge, TriangleAlert, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { formatCompact, formatUsdCompact } from "@/lib/format";

import type { PublicBacklogCase } from "../schema";

/** Everything the learner reads before planning. Server-rendered. */
export function CaseBrief({ publicCase }: { publicCase: PublicBacklogCase }) {
  const messages = getMessages();
  const copy = messages.backlog.brief;
  const { company, baselineMetrics: metrics } = publicCase;

  const facts = [
    {
      icon: Gauge,
      label: copy.capacity,
      value: copy.points(publicCase.sprintCapacity),
    },
    {
      icon: CalendarDays,
      label: copy.length,
      value: copy.weeks(publicCase.sprintLengthWeeks),
    },
    {
      icon: Users,
      label: copy.team,
      value: copy.engineers(publicCase.teamSize),
    },
  ];
  const baseline = [
    { label: copy.activeUsers, value: formatCompact(publicCase.activeUsers) },
    { label: copy.mrr, value: formatUsdCompact(metrics.revenue) },
    { label: copy.activation, value: `${metrics.activation}%` },
    { label: copy.retention, value: `${metrics.retention}%` },
    { label: copy.nps, value: String(metrics.nps) },
    { label: copy.techDebt, value: `${metrics.techDebt}/100` },
  ];

  return (
    <section aria-labelledby="case-title" className="space-y-5">
      <div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
          <span className="text-foreground font-medium">{company.name}</span>
          <span aria-hidden="true">·</span>
          <span>{company.industry}</span>
          <span aria-hidden="true">·</span>
          <span>{company.stage}</span>
          <Badge variant="outline" className="ml-1">
            {messages.difficulty[publicCase.difficulty]}
          </Badge>
        </div>
        <h1
          id="case-title"
          className="font-heading mt-2 text-2xl font-semibold tracking-tight text-balance"
        >
          {publicCase.title}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {company.description}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="bg-card rounded-xl border p-4">
          <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {copy.label}
          </h2>
          <p className="mt-2 leading-relaxed text-pretty">{publicCase.brief}</p>
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon
                  className="text-muted-foreground size-4"
                  aria-hidden="true"
                />
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            {copy.events(publicCase.eventCount)}
          </p>
        </div>

        <div className="bg-card rounded-xl border p-4">
          <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {copy.baseline}
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-2">
            {baseline.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-muted-foreground text-xs">{label}</dt>
                <dd className="font-mono text-base font-medium tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <details className="group bg-card rounded-xl border">
        <summary className="hover:bg-muted/50 focus-visible:ring-ring/50 flex cursor-pointer list-none items-center justify-between rounded-xl px-4 py-3 text-sm font-medium focus-visible:ring-3 focus-visible:outline-none">
          {copy.stakeholders}
          <span className="text-muted-foreground text-xs">
            {publicCase.stakeholders.length}
          </span>
        </summary>
        <ul className="grid gap-3 border-t p-4 sm:grid-cols-2 lg:grid-cols-3">
          {publicCase.stakeholders.map((stakeholder) => (
            <li key={stakeholder.id} className="text-sm">
              <p className="font-medium">
                {stakeholder.name}
                <span className="text-muted-foreground font-normal">
                  {" "}
                  · {stakeholder.role}
                </span>
              </p>
              <ul className="text-muted-foreground mt-1 list-disc space-y-0.5 pl-4">
                {stakeholder.priorities.map((priority) => (
                  <li key={priority}>{priority}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
