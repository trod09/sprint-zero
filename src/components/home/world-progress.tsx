"use client";

import { PixelIcon } from "@/components/arcade/icons";
import type { CaseInfo } from "@/core/progress";
import { getMessages } from "@/i18n";
import { useProgress } from "@/lib/use-progress";

/** Cases played and stars collected in one world. */
export function WorldProgress({
  moduleId,
  catalog,
}: {
  moduleId: string;
  catalog: readonly CaseInfo[];
}) {
  const copy = getMessages().arcade;
  const { progress } = useProgress(catalog);
  const world = progress?.modules[moduleId];
  const total = catalog.filter((c) => c.moduleId === moduleId).length;
  const played = world?.played ?? 0;
  const stars = world?.stars ?? 0;
  const maxStars = world?.maxStars ?? total * 3;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="font-pixel text-sm tabular-nums">
        {copy.worlds.cases(played, total)}
      </span>
      <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <PixelIcon name="star" size={14} className="text-primary" />
        <span className="font-pixel tabular-nums">
          {stars}/{maxStars}
        </span>
        <span className="sr-only">{copy.stars(stars, maxStars)}</span>
      </span>
      <div
        className="border-frame bg-muted h-2.5 min-w-24 flex-1 overflow-hidden rounded-sm border-2"
        aria-hidden="true"
      >
        <div
          className="h-full bg-[var(--world)]"
          style={{ width: `${maxStars ? (stars / maxStars) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}
