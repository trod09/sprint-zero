"use client";

import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import type { FeedbackTriageCase, Severity } from "../schema";
import type { TriageReport } from "../scoring";

const SEVERITY_TONE: Record<Severity, string> = {
  critical: "bg-red-500/15 text-red-800 dark:text-red-300",
  high: "bg-orange-500/15 text-orange-800 dark:text-orange-300",
  medium: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  low: "bg-muted text-muted-foreground",
};

export function TriageResults({
  caseData,
  report,
}: {
  caseData: FeedbackTriageCase;
  report: TriageReport;
}) {
  const copy = getMessages().triage;
  const critical = report.themes.find((t) => t.severity === "critical");
  const examples = new Map(
    caseData.hidden.themes.map((theme) => [
      theme.key,
      caseData.items.find((item) => item.id === theme.itemIds[0])?.text,
    ]),
  );

  return (
    <div className="space-y-6">
      {critical && (
        <section className="rounded-xl border border-red-500/40 bg-red-500/5 p-5">
          <h2 className="text-xs font-medium tracking-wide text-red-800 uppercase dark:text-red-300">
            {copy.results.critical}
          </h2>
          <p className="mt-2 font-medium">{critical.label}</p>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            {critical.summary}
          </p>
        </section>
      )}

      <section
        aria-labelledby="themes-ranking"
        className="bg-card rounded-xl border p-5"
      >
        <h2 id="themes-ranking" className="font-heading font-semibold">
          {copy.results.ranking}
        </h2>
        <ol className="mt-4 space-y-5">
          {report.themes.map((theme) => (
            <li key={theme.key} className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground font-mono text-xs">
                  #{theme.rank}
                </span>
                <span className="font-medium">{theme.label}</span>
                <span
                  className={cn(
                    "rounded-sm px-1.5 py-0.5 text-xs font-medium",
                    SEVERITY_TONE[theme.severity],
                  )}
                >
                  {copy.severities[theme.severity]}
                </span>
                <span className="text-muted-foreground text-xs">
                  {theme.size} {copy.results.items.toLowerCase()}
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {theme.summary}
              </p>
              {examples.get(theme.key) && (
                <p className="border-muted border-l-2 pl-3 text-sm italic">
                  “{examples.get(theme.key)}”
                </p>
              )}
              <p className="text-sm">
                <span className="text-muted-foreground">
                  {copy.results.yourCluster}:{" "}
                </span>
                {theme.bestClusterName ? (
                  <span
                    className={cn(
                      theme.f1 >= 0.8
                        ? "text-emerald-700 dark:text-emerald-400"
                        : theme.f1 >= 0.5
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-destructive",
                    )}
                  >
                    “{theme.bestClusterName}” ·{" "}
                    {copy.results.match(Math.round(theme.f1 * 100))}
                    {theme.bestClusterRank !== null &&
                      ` · ${copy.results.atRank(theme.bestClusterRank)}`}
                  </span>
                ) : (
                  <span className="text-destructive">
                    {copy.results.noMatch}
                  </span>
                )}
              </p>
              <p className="text-muted-foreground text-xs">
                {copy.results.example}: {theme.opportunity}
              </p>
            </li>
          ))}
        </ol>
        <p className="text-muted-foreground mt-5 text-sm">
          {copy.results.noise(report.noise.setAside, report.noise.total)}
        </p>
      </section>

      <section
        aria-labelledby="ranking-why"
        className="bg-card rounded-xl border p-5"
      >
        <h2 id="ranking-why" className="font-heading font-semibold">
          {copy.results.explanation}
        </h2>
        <p className="mt-3 text-sm leading-relaxed">{report.explanation}</p>
        <p className="text-muted-foreground mt-3 text-sm">
          <span className="text-foreground font-medium">
            {copy.results.principle}:
          </span>{" "}
          {report.principle}
        </p>
      </section>
    </div>
  );
}
