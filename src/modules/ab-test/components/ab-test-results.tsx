"use client";

import { Check, X } from "lucide-react";

import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import type { AbTestAnswer, AbTestCase, Issue } from "../schema";
import type { AbTestReport, IssueStatus } from "../scoring";
import { Panel } from "@/components/arcade/panel";

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
    <Panel icon="chart" id={id} title={title}>
      <div>{children}</div>
    </Panel>
  );
}

const STATUS_TONE: Record<IssueStatus, string> = {
  found: "border-success/40 bg-success/10 text-success",
  missed: "border-destructive/40 bg-destructive/10 text-destructive",
  false_alarm: "border-destructive/40 bg-destructive/10 text-destructive",
  acceptable: "border-brand/40 bg-brand/10 text-brand",
  clear: "text-muted-foreground",
};

export function AbTestResults({
  caseData,
  report,
  answer,
}: {
  caseData: AbTestCase;
  report: AbTestReport;
  answer: AbTestAnswer | null;
}) {
  const copy = getMessages().abTest;
  const issueList = (issues: readonly Issue[]) =>
    issues.length === 0
      ? copy.results.none
      : issues.map((issue) => copy.issues[issue].label).join(", ");

  const missedOrFalse = report.issues.some(
    (i) => i.status === "missed" || i.status === "false_alarm",
  );
  const rows = answer
    ? [
        {
          label: copy.results.problems,
          yours: issueList(answer.issues),
          truth: issueList(report.truth.issues),
          right: !missedOrFalse,
        },
        {
          label: copy.results.effect,
          yours: copy.effects[answer.effect],
          truth: copy.effects[report.truth.effect],
          right: report.effectCredit === 1,
        },
        {
          label: copy.results.decision,
          yours: copy.decisions[answer.decision].label,
          truth: copy.decisions[report.truth.decision].label,
          right: report.decisionCredit === 1,
        },
      ]
    : [];

  const notable = report.issues.filter((entry) => entry.status !== "clear");

  return (
    <div className="space-y-6">
      <section className="border-warning bg-warning/5 rounded-md border-2 p-5">
        <h2 className="text-warning text-xs font-medium tracking-wide uppercase">
          {copy.results.truth}
        </h2>
        <p className="mt-2 font-medium">{report.truth.summary}</p>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          {report.truth.explanation}
        </p>
      </section>

      {rows.length > 0 && (
        <Section id="call-compare" title={copy.results.yourCall}>
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
                        row.right ? "text-success" : "text-destructive",
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

      {notable.length > 0 && (
        <Section id="problems" title={copy.results.problemsTitle}>
          <ul className="space-y-4">
            {notable.map(({ issue, status }) => (
              <li key={issue} className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {copy.issues[issue].label}
                  </span>
                  <span
                    className={cn(
                      "rounded-md border px-1.5 py-0.5 text-xs font-medium",
                      STATUS_TONE[status],
                    )}
                  >
                    {copy.results.statuses[status]}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {status === "false_alarm"
                    ? copy.results.notPresent
                    : (report.truth.issueNotes[issue] ??
                      copy.issues[issue].hint)}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section id="recommendation" title={copy.results.recommendation}>
        <p className="text-sm leading-relaxed">{report.truth.recommendation}</p>
        <p className="text-muted-foreground mt-3 text-xs">
          {caseData.experiment.name} · {caseData.company.name}
        </p>
      </Section>
    </div>
  );
}
