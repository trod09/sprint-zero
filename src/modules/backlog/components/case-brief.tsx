import { CalendarDays, Gauge, TriangleAlert, Users } from "lucide-react";

import { CaseHeader } from "@/components/arcade/case-header";
import { Panel } from "@/components/arcade/panel";
import { getMessages } from "@/i18n";
import { formatCompact, formatUsdCompact } from "@/lib/format";

import type { PublicBacklogCase } from "../schema";

/** Everything the learner reads before planning. Server-rendered. */
export function CaseBrief({ publicCase }: { publicCase: PublicBacklogCase }) {
  const messages = getMessages();
  const copy = messages.backlog.brief;
  const { baselineMetrics: metrics } = publicCase;

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
      <CaseHeader publicCase={publicCase} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <Panel icon="flag" title={copy.label}>
          <p className="leading-relaxed text-pretty">{publicCase.brief}</p>
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
          <p className="border-warning bg-warning/10 mt-4 flex items-start gap-2 rounded-sm border-2 px-3 py-2 text-sm">
            <TriangleAlert
              className="text-warning mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            {copy.events(publicCase.eventCount)}
          </p>
        </Panel>

        <Panel icon="chart" title={copy.baseline}>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-2">
            {baseline.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-muted-foreground text-xs">{label}</dt>
                <dd className="font-mono text-base font-medium tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <details className="group pixel-card">
        <summary className="hover:bg-muted/50 focus-visible:ring-ring/50 font-pixel flex cursor-pointer list-none items-center justify-between rounded-md px-4 py-3 text-sm focus-visible:ring-3 focus-visible:outline-none">
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
