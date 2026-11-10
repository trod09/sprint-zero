"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { ScoreResult } from "@/core/scoring";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

/** The official score after committing, criterion by criterion. */
export function SprintResult({
  result,
  moduleId,
  onPlanAgain,
}: {
  result: ScoreResult;
  moduleId: string;
  onPlanAgain: () => void;
}) {
  const copy = getMessages().backlog.result;
  return (
    <section
      aria-labelledby="result-title"
      className="bg-card animate-in fade-in-0 slide-in-from-bottom-2 rounded-xl border p-6 duration-300"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="result-title"
            className="text-muted-foreground text-sm font-medium"
          >
            {copy.title}
          </h2>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="sr-only">{copy.scoreLabel}: </span>
            <span className="font-heading text-5xl font-semibold tabular-nums">
              {result.total}
            </span>
            <span className="text-muted-foreground text-lg">{copy.outOf}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onPlanAgain}>
            {copy.planAgain}
          </Button>
          <Button asChild>
            <Link href={`/modules/${moduleId}`}>{copy.backToCases}</Link>
          </Button>
        </div>
      </div>

      <h3 className="mt-8 text-sm font-medium">{copy.breakdown}</h3>
      <ul className="mt-3 space-y-4">
        {result.criteria.map((criterion) => (
          <li key={criterion.id}>
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="font-medium">{criterion.label}</span>
              <span className="font-mono tabular-nums">
                {criterion.points}
                <span className="text-muted-foreground">
                  {" "}
                  / {criterion.weight}
                </span>
              </span>
            </div>
            <div className="bg-muted mt-1.5 h-1.5 overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full rounded-full",
                  criterion.ratio >= 0.8
                    ? "bg-emerald-500"
                    : criterion.ratio >= 0.5
                      ? "bg-amber-500"
                      : "bg-destructive",
                )}
                style={{ width: `${criterion.ratio * 100}%` }}
              />
            </div>
            {criterion.detail && (
              <p className="text-muted-foreground mt-1 text-xs">
                {criterion.detail}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
