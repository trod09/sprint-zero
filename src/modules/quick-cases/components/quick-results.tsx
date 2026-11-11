"use client";

import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";
import { formatClock } from "@/modules/product-case/draft";

import type { QuickCase } from "../schema";
import type { QuickReport } from "../scoring";
import { Exhibits } from "./exhibits";
import { Panel } from "@/components/arcade/panel";

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
      <Panel icon="bulb" title={copy.results.ideal}>
        <p className="leading-relaxed">{hidden.ideal}</p>
        <p className="text-muted-foreground mt-3 text-xs">
          {report.timing?.timed
            ? copy.results.timed(
                formatClock(report.timing.secondsUsed),
                caseData.timeLimitMinutes,
              )
            : copy.results.untimed}
        </p>
      </Panel>

      {caseData.steps.map((step, index) => {
        const truth = hidden.steps[index];
        const why = new Map(truth.options.map((o) => [o.id, o.why]));
        const text = new Map(step.options.map((o) => [o.id, o.text]));
        const options = [...(report.steps[index]?.options ?? [])].sort(
          (a, b) => b.rating - a.rating,
        );
        return (
          <Panel
            key={step.id}
            icon="target"
            id={`result-${step.id}`}
            title={`${copy.steps.decision(index + 1, caseData.steps.length)} · ${step.title}`}
          >
            <p className="font-medium">{step.question}</p>
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
          </Panel>
        );
      })}

      <Exhibits exhibits={caseData.exhibits} />

      <Panel icon="bulb" title={copy.results.principle}>
        <p className="leading-relaxed">{hidden.principle}</p>
      </Panel>
    </div>
  );
}
