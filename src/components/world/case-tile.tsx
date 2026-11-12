"use client";

/**
 * A case as a level tile: a number or the level, its stars and the best
 * score in this browser. Shared by the world map and the case library, so a
 * case looks the same wherever it is listed. It carries its own world color.
 */
import Link from "next/link";

import { moduleColor, PixelIcon } from "@/components/arcade/icons";
import { StarRating } from "@/components/arcade/star-rating";
import type { CaseSummary } from "@/components/case-library";
import { starsFor } from "@/core/progress";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

export function CaseTile({
  summary,
  score,
  number,
  showLevel = false,
}: {
  summary: CaseSummary;
  /** Best score in this browser, if the case was played. */
  score?: number;
  /** Position in its world; shown instead of the level when given. */
  number?: number;
  showLevel?: boolean;
}) {
  const messages = getMessages();
  const copy = messages.module.levels;
  const played = score !== undefined;
  return (
    <Link
      href={`/case/${summary.id}`}
      style={{ ["--world" as string]: moduleColor(summary.moduleId) }}
      className={cn(
        "world-scope pixel-lift group focus-visible:ring-ring/60 relative flex h-full flex-col gap-3 overflow-hidden rounded-md border-2 p-3 pl-4 focus-visible:ring-3 focus-visible:outline-none",
        "bg-card",
        played
          ? "border-frame shadow-pixel-sm"
          : "border-border hover:border-frame",
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: "var(--world-ink)" }}
      />
      <div className="flex items-start justify-between gap-2">
        {number !== undefined ? (
          <span
            aria-hidden="true"
            className="font-pixel flex size-8 shrink-0 items-center justify-center rounded-sm border-2 text-sm"
            style={{
              borderColor: "var(--world-ink)",
              color: "var(--world-ink)",
            }}
          >
            {number}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            {showLevel && (
              <span className="font-pixel border-frame rounded-sm border-2 px-1.5 py-0.5 text-xs tracking-wider uppercase">
                {messages.difficulty[summary.difficulty]}
              </span>
            )}
          </span>
        )}
        {/* Empty stars on a new case: three to win, in the game's own terms. */}
        <StarRating stars={played ? starsFor(score) : 0} size={14} />
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
          className="text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5"
        >
          <PixelIcon name="play" size={12} />
        </span>
      </p>
    </Link>
  );
}
