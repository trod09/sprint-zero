"use client";

/**
 * A world's cases as levels: one zone per difficulty, a tile per case with
 * its number, its stars and the best score in this browser.
 */
import Link from "next/link";

import { PixelIcon } from "@/components/arcade/icons";
import { Panel } from "@/components/arcade/panel";
import { StarRating } from "@/components/arcade/star-rating";
import type { CaseSummary } from "@/components/case-library";
import { DIFFICULTIES } from "@/core/case-engine";
import { starsFor } from "@/core/progress";
import { getMessages } from "@/i18n";
import { bestScores, useAttempts } from "@/lib/use-attempts";
import { cn } from "@/lib/utils";

const ZONE_ICONS = ["play", "level", "trophy"] as const;

export function WorldLevels({ cases }: { cases: readonly CaseSummary[] }) {
  const messages = getMessages();
  const copy = messages.module.levels;
  const { attempts } = useAttempts();
  const best = attempts ? bestScores(attempts) : new Map<string, number>();

  const zones = DIFFICULTIES.map((difficulty) => ({
    difficulty,
    cases: cases.filter((c) => c.difficulty === difficulty),
  })).filter((zone) => zone.cases.length > 0);
  // Levels are numbered across zones, in the order they are shown.
  const numberOf = new Map(
    zones.flatMap((zone) => zone.cases).map((c, index) => [c.id, index + 1]),
  );

  return (
    <div className="space-y-6">
      {zones.map((zone, index) => {
        const cleared = zone.cases.filter((c) => best.has(c.id)).length;
        return (
          <Panel
            key={zone.difficulty}
            icon={ZONE_ICONS[DIFFICULTIES.indexOf(zone.difficulty)]}
            title={copy.zone(index + 1, messages.difficulty[zone.difficulty])}
            aside={copy.cleared(cleared, zone.cases.length)}
          >
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {zone.cases.map((summary) => {
                const score = best.get(summary.id);
                const played = score !== undefined;
                return (
                  <li key={summary.id}>
                    <Link
                      href={`/case/${summary.id}`}
                      className={cn(
                        "pixel-lift group focus-visible:ring-ring/60 flex h-full flex-col gap-3 rounded-md border-2 p-3 focus-visible:ring-3 focus-visible:outline-none",
                        played
                          ? "bg-card border-frame shadow-pixel-sm"
                          : "bg-background/60 border-border hover:border-frame border-dashed",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          aria-hidden="true"
                          className="font-pixel flex size-8 shrink-0 items-center justify-center rounded-sm border-2 text-sm"
                          style={{
                            borderColor: "var(--world-ink)",
                            color: "var(--world-ink)",
                          }}
                        >
                          {numberOf.get(summary.id)}
                        </span>
                        {played ? (
                          <StarRating stars={starsFor(score)} size={14} />
                        ) : (
                          <span className="font-pixel bg-primary text-primary-foreground rounded-sm px-1.5 py-0.5 text-[0.625rem] tracking-wider uppercase">
                            {copy.new}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug font-semibold text-pretty group-hover:underline">
                          {summary.title}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {summary.company} · {summary.industry}
                        </p>
                      </div>
                      <p className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {played ? copy.best(score) : copy.notPlayed}
                        </span>
                        <span
                          aria-hidden="true"
                          className="text-muted-foreground group-hover:text-foreground"
                        >
                          <PixelIcon name="play" size={12} />
                        </span>
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Panel>
        );
      })}
    </div>
  );
}
