"use client";

import Link from "next/link";

import { ScoreBreakdown } from "@/components/score-breakdown";
import { Button } from "@/components/ui/button";
import type { ScoreResult } from "@/core/scoring";
import { getMessages } from "@/i18n";

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
      <div className="mt-3">
        <ScoreBreakdown criteria={result.criteria} />
      </div>
    </section>
  );
}
