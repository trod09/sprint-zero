"use client";

import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import type { InterviewCase } from "../schema";
import type { InterviewReport } from "../scoring";

const QUALITY_STYLE = {
  good: "border-success",
  ok: "border-warning",
  poor: "border-destructive",
  none: "border-border",
} as const;

export function InterviewResults({
  caseData,
  report,
}: {
  caseData: InterviewCase;
  report: InterviewReport;
}) {
  const copy = getMessages().interview.results;
  const { hidden } = caseData;
  const findingText = new Map(caseData.findings.map((f) => [f.id, f.text]));
  const truth = new Map(hidden.findings.map((f) => [f.id, f]));
  const topic = new Map(hidden.topics.map((t) => [t.id, t]));

  return (
    <div className="space-y-6">
      <section aria-labelledby="results-findings" className="pixel-card p-4">
        <h2 id="results-findings" className="font-heading font-semibold">
          {copy.findings}
        </h2>
        <ul className="mt-2 divide-y">
          {[...report.findings]
            .sort((a, b) => Number(b.supported) - Number(a.supported))
            .map((finding) => {
              const details = truth.get(finding.id);
              const status = !finding.supported
                ? "unsupported"
                : finding.revealed
                  ? "found"
                  : "missed";
              const example =
                status === "missed" && details?.topicId
                  ? topic.get(details.topicId)?.exampleQuestion
                  : undefined;
              return (
                <li key={finding.id} className="py-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 font-medium">
                      {findingText.get(finding.id)}
                    </p>
                    <span className="flex shrink-0 items-center gap-2">
                      {finding.claimed && (
                        <Badge variant="outline">{copy.claimed}</Badge>
                      )}
                      <span
                        className={cn(
                          "font-pixel text-xs uppercase",
                          status === "found"
                            ? "text-success"
                            : status === "missed"
                              ? "text-warning"
                              : "text-destructive",
                        )}
                      >
                        {copy.status[status]}
                      </span>
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1">{details?.why}</p>
                  {example && (
                    <p className="mt-1">
                      <span className="text-muted-foreground">
                        {copy.tryAsking}:{" "}
                      </span>
                      <span className="italic">“{example}”</span>
                    </p>
                  )}
                </li>
              );
            })}
        </ul>
      </section>

      <section aria-labelledby="results-transcript" className="pixel-card p-4">
        <h2 id="results-transcript" className="font-heading font-semibold">
          {copy.transcript}
        </h2>
        <ol className="mt-3 space-y-4">
          {report.turns.map((turn, index) => {
            const tags = [
              copy.tags[turn.form],
              turn.leading && copy.tags.leading,
              turn.hypothetical && copy.tags.hypothetical,
              turn.pastBehavior && copy.tags.pastBehavior,
              turn.double && copy.tags.double,
            ].filter((tag): tag is string => Boolean(tag));
            return (
              <li
                key={index}
                className={cn(
                  "border-l-4 pl-3 text-sm",
                  QUALITY_STYLE[turn.quality],
                )}
              >
                <p className="font-medium">
                  <span className="font-pixel text-ink mr-2 text-xs">
                    {index + 1}
                  </span>
                  {turn.question}
                </p>
                <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                  <span className="text-muted-foreground text-xs">
                    → {copy.depth[turn.depth] ?? turn.depth}
                    {turn.topicId &&
                      ` (${topic.get(turn.topicId)?.label ?? turn.topicId})`}
                  </span>
                </p>
                <p className="text-muted-foreground mt-1.5">“{turn.reply}”</p>
                {turn.revealedFindingId && (
                  <p className="text-success mt-1.5 font-medium">
                    {copy.uncovered}: {findingText.get(turn.revealedFindingId)}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="pixel-card p-4">
        <h2 className="font-pixel text-ink text-xs tracking-wide uppercase">
          {copy.principle}
        </h2>
        <p className="mt-2 leading-relaxed">{hidden.principle}</p>
      </section>
    </div>
  );
}
