"use client";

import Link from "next/link";
import { useMemo } from "react";

import { ModuleSprite, PixelIcon } from "@/components/arcade/icons";
import { StarRating } from "@/components/arcade/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { starsFor } from "@/core/progress";
import { getMessages } from "@/i18n";
import { dailyCaseFor, dailyStreak, utcDay } from "@/lib/daily";
import { bestScores, useAttempts } from "@/lib/use-attempts";
import { useIsClient } from "@/lib/use-is-client";
import { getModuleMeta } from "@/modules/catalog";

/** Today's case, the same for everyone. Rendered on the client: it needs today's date. */
export function DailyCaseCard({
  moduleIds,
}: {
  /** Modules that can generate cases, in catalog order. */
  moduleIds: readonly string[];
}) {
  const messages = getMessages();
  const copy = messages.arcade.daily;
  const isClient = useIsClient();
  const { attempts } = useAttempts();

  const view = useMemo(() => {
    if (!isClient) return null;
    const now = new Date();
    const today = utcDay(now);
    const daily = dailyCaseFor(today, moduleIds);
    if (!daily) return null;
    const best = bestScores(attempts ?? []);
    return {
      daily,
      score: best.get(daily.caseId) ?? null,
      streak: dailyStreak(today, moduleIds, new Set(best.keys())),
      hoursLeft: 24 - now.getUTCHours(),
    };
  }, [isClient, attempts, moduleIds]);

  if (!view) {
    return (
      <section className="pixel-card min-h-28 p-5" aria-busy="true">
        <p className="font-pixel text-lg">{copy.title}</p>
      </section>
    );
  }

  const { daily, score, streak, hoursLeft } = view;
  const meta = getModuleMeta(daily.moduleId);
  return (
    <section aria-labelledby="daily-title" className="pixel-card p-5">
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-sm bg-[#0a0e1f] p-2">
          <ModuleSprite moduleId={daily.moduleId} size={32} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <h2 id="daily-title" className="font-pixel text-lg leading-tight">
            {copy.title}{" "}
            <span className="text-muted-foreground tabular-nums">
              {copy.number(daily.number)}
            </span>
          </h2>
          <p className="text-sm">
            <span className="font-medium">{meta?.name ?? daily.moduleId}</span>
            <span className="text-muted-foreground">
              {" "}
              · {messages.generate.industries[daily.industry]} ·{" "}
              {messages.difficulty[daily.difficulty]}
            </span>
          </p>
          <p className="text-muted-foreground text-sm">{copy.intro}</p>
          {streak > 0 && (
            <Badge variant="secondary">
              <PixelIcon name="streak" size={12} />
              {copy.streak(streak)}
            </Badge>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button asChild variant="outline">
              <Link href={`/case/${daily.caseId}`}>
                {score === null ? copy.play : copy.replay}
                <PixelIcon name="play" size={14} />
              </Link>
            </Button>
            {score !== null && (
              <span className="flex items-center gap-2 text-sm font-medium">
                <StarRating stars={starsFor(score)} size={14} />
                {copy.done(score)}
              </span>
            )}
            <span className="text-muted-foreground text-xs">
              {copy.next(hoursLeft)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
