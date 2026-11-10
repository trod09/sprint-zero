"use client";

import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";
import { formatClock } from "@/modules/product-case/draft";

import type { QuickCase } from "../schema";
import type { QuickReport } from "../scoring";
import { Exhibits } from "./exhibits";

const RATING_STYLE = [
  "text-destructive",
  "text-warning",
  "text-foreground",
  "text-success",
];

export function QuickResults({
  caseData,
  report,
}: {
  caseData: QuickCase;
  report: QuickReport;
}) {
  const copy = getMessages().quick;
  const { hidden } = caseData;

  return (
    <div className="space-y-6">
      <section className="pixel-card p-4">
        <h2 className="font-pixel text-ink text-xs tracking-wide uppercase">
          {copy.results.ideal}
        </h2>
        <p className="mt-2 leading-relaxed">{hidden.ideal}</p>
        <p className="text-muted-foreground mt-3 text-xs">
          {report.timing?.timed
            ? copy.results.timed(
                formatClock(report.timing.secondsUsed),
                caseData.timeLimitMinutes,
              )
            : copy.results.untimed}
        </p>
      </section>

      {caseData.steps.map((step, index) => {
        const truth = hidden.steps[index];
        const why = new Map(truth.options.map((o) => [o.id, o.why]));
        const text = new Map(step.options.map((o) => [o.id, o.text]));
        const options = [...(report.steps[index]?.options ?? [])].sort(
          (a, b) => b.rating - a.rating,
        );
        return (
          <section
            key={step.id}
            aria-labelledby={`result-${step.id}`}
            className="pixel-card p-4"
          >
            <h2
              id={`result-${step.id}`}
              className="font-pixel text-ink text-xs tracking-wide uppercase"
            >
              {copy.steps.decision(index + 1, caseData.steps.length)} ·{" "}
              {step.title}
            </h2>
            <p className="mt-1 font-medium">{step.question}</p>
            <ul className="mt-2 divide-y">
              {options.map((option) => (
                <li key={option.id} className="py-2.5 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 font-medium">
                      {text.get(option.id)}
                    </p>
                    <span className="flex shrink-0 items-center gap-2">
                      {option.picked && (
                        <Badge variant="outline">{copy.results.chosen}</Badge>
                      )}
                      <span
                        className={cn(
                          "font-pixel text-xs uppercase",
                          RATING_STYLE[option.rating],
                        )}
                      >
                        {copy.results.ratings[option.rating]}
                      </span>
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {why.get(option.id)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <details className="group pixel-card">
        <summary className="hover:bg-muted/50 focus-visible:ring-ring/50 font-pixel cursor-pointer list-none rounded-md px-4 py-3 text-sm focus-visible:ring-3 focus-visible:outline-none">
          {copy.brief.exhibits}
        </summary>
        <div className="border-t p-4 [&_h2]:sr-only">
          <Exhibits exhibits={caseData.exhibits} />
        </div>
      </details>

      <section className="pixel-card p-4">
        <h2 className="font-pixel text-ink text-xs tracking-wide uppercase">
          {copy.results.principle}
        </h2>
        <p className="mt-2 leading-relaxed">{hidden.principle}</p>
      </section>
    </div>
  );
}
