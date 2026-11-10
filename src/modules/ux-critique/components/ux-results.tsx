"use client";

import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import type { UxCritiqueCase } from "../schema";
import type { UxReport } from "../scoring";
import { ScreenView } from "./screen-view";
import type { MarkerTone } from "./screens/region";

const OUTCOME_TONE = {
  found:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  wrong_type:
    "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  missed: "border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-300",
} as const;

export function UxResults({
  caseData,
  report,
}: {
  caseData: UxCritiqueCase;
  report: UxReport;
}) {
  const copy = getMessages().ux;
  const markers = new Map<string, { count: number; tone: MarkerTone }>();
  report.issues.forEach((issue, index) => {
    markers.set(issue.regionId, {
      count: index + 1,
      tone: issue.outcome === "missed" ? "missed" : "found",
    });
  });
  for (const alarm of report.falseAlarms) {
    if (!markers.has(alarm.regionId)) {
      markers.set(alarm.regionId, { count: 0, tone: "false_alarm" });
    }
  }

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="planted-title"
        className="bg-card rounded-xl border p-5"
      >
        <h2 id="planted-title" className="font-heading font-semibold">
          {copy.results.planted}
        </h2>
        <ol className="mt-4 space-y-5">
          {report.issues.map((issue, index) => (
            <li key={issue.regionId} className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground font-mono text-xs">
                  {index + 1}
                </span>
                <span className="font-medium">
                  {copy.issues[issue.type].label}
                </span>
                <span className="text-muted-foreground text-sm">
                  · {issue.regionLabel}
                </span>
                <span
                  className={cn(
                    "rounded-md border px-1.5 py-0.5 text-xs font-medium",
                    OUTCOME_TONE[issue.outcome],
                  )}
                >
                  {copy.results.outcomes[issue.outcome]}
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {issue.explanation}
              </p>
              <p className="text-sm">
                <span className="font-medium">{copy.results.fix}:</span>{" "}
                {issue.fix}
              </p>
              {issue.outcome === "wrong_type" && issue.learnerType && (
                <p className="text-muted-foreground text-xs">
                  {copy.results.youSaid(copy.issues[issue.learnerType].label)}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="alarms-title"
        className="bg-card rounded-xl border p-5"
      >
        <h2 id="alarms-title" className="font-heading font-semibold">
          {copy.results.falseAlarms}
        </h2>
        {report.falseAlarms.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">
            {copy.results.noFalseAlarms}
          </p>
        ) : (
          <>
            <p className="text-muted-foreground mt-1 text-sm">
              {copy.results.falseAlarmsIntro}
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {report.falseAlarms.map((alarm) => (
                <li key={`${alarm.regionId}-${alarm.type}`}>
                  {alarm.regionLabel}: {copy.issues[alarm.type].label}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="screen-review" className="space-y-3">
        <h2 id="screen-review" className="font-heading font-semibold">
          {copy.results.screen}
        </h2>
        <ScreenView
          screen={caseData.screen}
          context={{
            mode: "review",
            selected: null,
            onSelect: () => {},
            markers,
          }}
        />
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium">
            {copy.results.principle}:
          </span>{" "}
          {report.principle}
        </p>
      </section>
    </div>
  );
}
