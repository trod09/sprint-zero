"use client";

import { Check, X } from "lucide-react";

import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import { dimensionLabel, valueLabel } from "../labels";
import type { MetricDropAnswer, MetricDropCase } from "../schema";
import type { MetricDropReport } from "../scoring";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="bg-card rounded-xl border p-5">
      <h2 id={id} className="font-heading font-semibold">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function MetricDropResults({
  caseData,
  report,
  answer,
}: {
  caseData: MetricDropCase;
  report: MetricDropReport;
  answer: MetricDropAnswer | null;
}) {
  const copy = getMessages().metricDrop;
  const segmentText = (segment: {
    dimension: MetricDropReport["truth"]["segment"]["dimension"];
    value: string;
  }) => `${dimensionLabel(segment.dimension)}: ${valueLabel(segment.value)}`;
  const actionLabel = (id: string) =>
    caseData.actionOptions.find((option) => option.id === id)?.label ?? id;

  const rows = answer
    ? [
        {
          label: copy.results.segment,
          yours: segmentText(answer.segment),
          truth: segmentText(report.truth.segment),
          right: report.segmentMatch === 1,
        },
        {
          label: copy.results.category,
          yours: copy.categories[answer.category],
          truth: copy.categories[report.truth.category],
          right: answer.category === report.truth.category,
        },
        {
          label: copy.results.action,
          yours: actionLabel(answer.actionId),
          truth: actionLabel(report.truth.idealActionId),
          right: report.actionCredit === 1,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
        <h2 className="text-xs font-medium tracking-wide text-amber-800 uppercase dark:text-amber-300">
          {copy.results.rootCause}
        </h2>
        <p className="mt-2 font-medium">{report.truth.summary}</p>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          {report.truth.explanation}
        </p>
        <p className="mt-3 text-sm">{report.truth.idealAction}</p>
      </section>

      {rows.length > 0 && (
        <Section id="diagnosis-compare" title={copy.results.yourDiagnosis}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs">
                  <th scope="col" className="py-2 pr-4 font-medium" />
                  <th scope="col" className="py-2 pr-4 font-medium">
                    {copy.results.yours}
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    {copy.results.answer}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th
                      scope="row"
                      className="text-muted-foreground py-2 pr-4 text-left font-normal"
                    >
                      {row.label}
                    </th>
                    <td
                      className={cn(
                        "py-2 pr-4",
                        row.right
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-destructive",
                      )}
                    >
                      <span className="inline-flex items-start gap-1.5">
                        {row.right ? (
                          <Check
                            className="mt-0.5 size-3.5 shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <X
                            className="mt-0.5 size-3.5 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        {row.yours}
                      </span>
                    </td>
                    <td className="py-2">{row.truth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section id="ideal-path" title={copy.results.idealPath}>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm">
            {report.truth.idealPath.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="text-muted-foreground mt-4 text-xs">
            {copy.results.investigation(report.totalViews, report.stepsToCause)}
          </p>
        </Section>
        <Section id="false-leads" title={copy.results.falseLeads}>
          <ul className="space-y-3 text-sm">
            {report.falseLeads.map((lead) => (
              <li key={`${lead.segment.dimension}-${lead.segment.value}`}>
                <p className="font-medium">
                  {segmentText(lead.segment)}
                  {lead.chosen && (
                    <span className="bg-destructive/10 text-destructive ml-2 rounded-md px-1.5 py-0.5 text-xs">
                      {copy.results.youChoseThis}
                    </span>
                  )}
                </p>
                <p className="text-muted-foreground mt-0.5">
                  {lead.explanation}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
