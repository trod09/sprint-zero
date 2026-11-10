"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { ScoreBreakdown } from "@/components/score-breakdown";
import { Button } from "@/components/ui/button";
import type { AttemptReward } from "@/core/progress";
import { starsFor } from "@/core/progress";
import type { ScoreResult } from "@/core/scoring";
import { getMessages } from "@/i18n";
import { useCountUp } from "@/lib/motion";
import { playSfx } from "@/lib/sfx";

import { PixelIcon } from "./icons";
import { ModuleScene } from "./module-banner";
import { StarRating } from "./star-rating";
import { XPBar } from "./xp-bar";

/**
 * The end-of-case screen: big score, one to three stars, the XP the attempt
 * earned filling the bar, any new badge, and the way to the next case.
 */
export function ResultScreen({
  moduleId,
  title,
  subtitle,
  result,
  reward,
  nextHref,
  playAgainHref,
}: {
  moduleId: string;
  title: string;
  subtitle?: string;
  result: ScoreResult;
  /** What the attempt earned; `null` while loading or when unknown. */
  reward: AttemptReward | null;
  nextHref: string;
  playAgainHref: string;
}) {
  const messages = getMessages();
  const copy = messages.arcade;
  const stars = starsFor(result.total);
  const score = useCountUp(result.total, { duration: 800 });
  const xp = useCountUp(reward?.xpGained ?? 0, { duration: 900, delay: 400 });
  const leveledUp = reward
    ? reward.after.level.level > reward.before.level.level
    : false;
  const played = useRef(false);

  useEffect(() => {
    if (!reward || played.current) return;
    played.current = true;
    if (leveledUp) playSfx("levelup");
    else if (stars > 0) playSfx("star");
    else playSfx("coin");
  }, [reward, leveledUp, stars]);

  const heading =
    stars === 3
      ? copy.result.complete
      : stars > 0
        ? copy.result.cleared
        : copy.result.tryAgain;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
      <section
        aria-labelledby="result-title"
        className="pixel-card animate-in fade-in-0 zoom-in-95 overflow-hidden duration-200"
      >
        <ModuleScene moduleId={moduleId} className="block h-16 w-full" />
        <div className="space-y-5 p-6">
          <div>
            <p className="text-muted-foreground text-sm">{subtitle}</p>
            <h1
              id="result-title"
              className="font-pixel text-ink mt-1 text-3xl tracking-wide uppercase"
            >
              {heading}
            </h1>
            <p className="mt-1 text-sm text-balance">{title}</p>
          </div>

          <div className="flex flex-wrap items-end gap-6">
            <p className="flex items-baseline gap-1">
              <span className="sr-only">
                {copy.result.score}: {result.total} / 100
              </span>
              <span
                aria-hidden="true"
                className="font-pixel text-7xl leading-none tabular-nums [text-shadow:4px_4px_0_var(--shadow-color)]"
              >
                {score}
              </span>
              <span
                aria-hidden="true"
                className="font-pixel text-muted-foreground text-xl"
              >
                /100
              </span>
            </p>
            <StarRating stars={stars} size={36} animate />
          </div>

          {reward && (
            <div className="bg-muted border-frame space-y-3 rounded-sm border-2 p-4">
              <p className="flex items-center gap-2">
                <PixelIcon name="xp" size={20} />
                <span className="font-pixel text-sm">
                  {copy.result.xpGained}
                </span>
                <span
                  className="font-pixel text-ink ml-auto text-2xl tabular-nums"
                  aria-label={`+${reward.xpGained} XP`}
                >
                  +{xp}
                </span>
              </p>
              <XPBar
                level={reward.after.level.level}
                value={reward.after.level.into}
                max={reward.after.level.needed}
                from={leveledUp ? 0 : reward.before.level.into}
              />
              {leveledUp && (
                <p
                  role="status"
                  className="font-pixel bg-primary text-primary-foreground animate-pixel-pop rounded-sm px-2 py-1 text-sm"
                >
                  {copy.result.levelUp(reward.after.level.level)}
                </p>
              )}
              {reward.xpGained === 0 && (
                <p className="text-muted-foreground text-xs">
                  {copy.result.replayNote}
                </p>
              )}
              {reward.newBadges.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {reward.newBadges.map((id) => (
                    <li
                      key={id}
                      className="border-frame bg-card animate-pixel-pop flex items-center gap-2 rounded-sm border-2 px-2 py-1 text-sm"
                    >
                      <PixelIcon name="trophy" size={16} />
                      <span className="font-pixel text-xs">
                        {copy.result.newBadge}:
                      </span>
                      {copy.badges[id].name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={nextHref} onClick={() => playSfx("click")}>
                {copy.result.nextCase}
                <PixelIcon name="play" size={14} />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={playAgainHref}>{copy.result.playAgain}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="breakdown-title" className="pixel-card p-6">
        <h2 id="breakdown-title" className="font-pixel text-lg">
          {copy.result.breakdown}
        </h2>
        <div className="mt-4">
          <ScoreBreakdown criteria={result.criteria} />
        </div>
      </section>
    </div>
  );
}
