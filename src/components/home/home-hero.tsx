"use client";

import Link from "next/link";
import { useMemo } from "react";

import { ModuleSprite, PixelIcon } from "@/components/arcade/icons";
import { MascotBubble } from "@/components/arcade/mascot-bubble";
import { ModuleScene } from "@/components/arcade/module-banner";
import { StarRating } from "@/components/arcade/star-rating";
import type { CaseSummary } from "@/components/case-library";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIFFICULTIES } from "@/core/case-engine";
import type { Progress } from "@/core/progress";
import { getMessages } from "@/i18n";
import { casesWithDrafts, readLastCase } from "@/lib/last-case";
import { useIsClient } from "@/lib/use-is-client";
import { useProgress } from "@/lib/use-progress";

interface Pick {
  summary: CaseSummary;
  kind: "in_progress" | "suggested";
  hasDraft: boolean;
}

/** The case to show in "Jump back in": the one left open, or a suggestion. */
function pickCase(
  catalog: readonly CaseSummary[],
  progress: Progress,
  submittedAfter: (caseId: string, iso: string) => boolean,
): Pick | null {
  const drafts = casesWithDrafts();
  const last = readLastCase();
  const lastSummary = last && catalog.find((c) => c.id === last.caseId);
  if (last && lastSummary && !submittedAfter(last.caseId, last.openedAt)) {
    return {
      summary: lastSummary,
      kind: "in_progress",
      hasDraft: drafts.has(last.caseId),
    };
  }
  const byDifficulty = [...catalog].sort(
    (a, b) =>
      DIFFICULTIES.indexOf(a.difficulty) - DIFFICULTIES.indexOf(b.difficulty),
  );
  const unplayed = byDifficulty.find((c) => !progress.cases[c.id]);
  const weakest = [...catalog].sort(
    (a, b) =>
      (progress.cases[a.id]?.best ?? 0) - (progress.cases[b.id]?.best ?? 0),
  )[0];
  const summary = unplayed ?? weakest;
  return summary
    ? { summary, kind: "suggested", hasDraft: drafts.has(summary.id) }
    : null;
}

export function HomeHero({ catalog }: { catalog: readonly CaseSummary[] }) {
  const messages = getMessages();
  const copy = messages.arcade;
  const isClient = useIsClient();
  const { progress, attempts } = useProgress(catalog);

  const pick = useMemo(() => {
    if (!isClient || !progress || !attempts) return null;
    return pickCase(catalog, progress, (caseId, iso) =>
      attempts.some((a) => a.caseId === caseId && a.submittedAt >= iso),
    );
  }, [isClient, progress, attempts, catalog]);

  const firstVisit = (attempts?.length ?? 0) === 0;
  const best = pick ? progress?.cases[pick.summary.id] : undefined;

  return (
    <div className="space-y-6">
      <MascotBubble size={72}>
        <p>
          {firstVisit || !progress
            ? copy.greeting.first
            : copy.greeting.back(progress.level.level)}
        </p>
      </MascotBubble>

      <section
        aria-labelledby="jump-title"
        className="pixel-card overflow-hidden"
      >
        <div className="relative h-24">
          {pick && (
            <ModuleScene
              moduleId={pick.summary.moduleId}
              className="absolute inset-0 h-full w-full"
            />
          )}
          <h2
            id="jump-title"
            className="font-pixel absolute top-3 left-4 rounded-sm bg-[#0a0e1f]/70 px-2 py-0.5 text-sm tracking-wide text-[#eef1ff] uppercase"
          >
            {copy.jumpBackIn.title}
          </h2>
          {pick && (
            <div className="absolute right-4 bottom-3 rounded-sm bg-[#0a0e1f]/70 p-1.5">
              <ModuleSprite moduleId={pick.summary.moduleId} size={32} />
            </div>
          )}
        </div>
        <div className="space-y-3 p-5">
          {!pick ? (
            <p className="text-muted-foreground text-sm" role="status">
              {progress ? copy.jumpBackIn.empty : copy.player.loading}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    pick.kind === "in_progress" ? "default" : "secondary"
                  }
                >
                  {pick.kind === "in_progress"
                    ? copy.jumpBackIn.inProgress
                    : copy.jumpBackIn.suggested}
                </Badge>
                <Badge variant="outline">
                  {messages.difficulty[pick.summary.difficulty]}
                </Badge>
                {best && <StarRating stars={best.stars} size={14} />}
              </div>
              <div>
                <p className="font-pixel text-xl leading-tight text-balance">
                  {pick.summary.title}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {pick.summary.moduleName} · {pick.summary.company} ·{" "}
                  {pick.summary.industry}
                </p>
              </div>
              <Button asChild size="lg">
                <Link href={`/case/${pick.summary.id}`}>
                  {pick.kind === "in_progress"
                    ? copy.jumpBackIn.resume
                    : copy.jumpBackIn.start}
                  <PixelIcon name="play" size={14} />
                </Link>
              </Button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
