import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";

import { queryMetricDrop } from "../actions";
import { dateOf } from "../dataset";
import { formatDay } from "../labels";
import type { PublicMetricDropCase } from "../schema";
import { Investigation, type SubmitAttempt } from "./investigation";

/** A full Metric Drop case: the question and timeline, then the dashboard. */
export function MetricDropCaseView({
  publicCase,
  submit,
}: {
  publicCase: PublicMetricDropCase;
  submit: SubmitAttempt;
}) {
  const messages = getMessages();
  const copy = messages.metricDrop;
  const { company } = publicCase;
  const timeline = [...publicCase.annotations].sort((a, b) => a.day - b.day);

  return (
    <div className="space-y-8">
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
              {copy.brief.label}
            </h2>
            <p className="mt-2 leading-relaxed text-pretty">
              {publicCase.brief}
            </p>
          </div>
          <div className="bg-card rounded-xl border p-4">
            <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {copy.brief.timeline}
            </h2>
            <ol className="mt-2 space-y-2 text-sm">
              {timeline.map((annotation) => (
                <li
                  key={`${annotation.day}-${annotation.label}`}
                  className="flex gap-3"
                >
                  <span className="text-muted-foreground w-14 shrink-0 font-mono text-xs leading-5 tabular-nums">
                    {formatDay(dateOf(publicCase.startDate, annotation.day))}
                  </span>
                  <span>
                    <span className="text-muted-foreground text-xs">
                      {copy.annotationKinds[annotation.kind]} ·{" "}
                    </span>
                    {annotation.label}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
      <Investigation
        publicCase={publicCase}
        query={queryMetricDrop}
        submit={submit}
      />
    </div>
  );
}
