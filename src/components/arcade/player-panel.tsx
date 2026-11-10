"use client";

import { useState } from "react";

import { BADGE_IDS, type CaseInfo } from "@/core/progress";
import { getMessages } from "@/i18n";
import { useAvatar } from "@/lib/use-avatar";
import { useProgress } from "@/lib/use-progress";
import { cn } from "@/lib/utils";

import { PixelAvatar, PixelIcon } from "./icons";
import { AVATARS } from "./sprites";
import { XPBar } from "./xp-bar";

/** Avatar, level, XP, streak, stars and badges, from the attempts in this browser. */
export function PlayerPanel({
  catalog,
  className,
}: {
  catalog: readonly CaseInfo[];
  className?: string;
}) {
  const copy = getMessages().arcade;
  const { progress } = useProgress(catalog);
  const [avatar, setAvatar] = useAvatar();
  const [picking, setPicking] = useState(false);
  const level = progress?.level ?? { level: 1, into: 0, needed: 200 };

  return (
    <section
      aria-labelledby="player-title"
      className={cn("pixel-card space-y-4 p-4", className)}
    >
      <h2 id="player-title" className="sr-only">
        {copy.player.title}
      </h2>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-expanded={picking}
          aria-controls="avatar-picker"
          aria-label={copy.player.chooseAvatar}
          onClick={() => setPicking(!picking)}
          className="border-frame bg-muted pixel-lift shadow-pixel-sm focus-visible:ring-ring/60 rounded-sm border-2 p-1 focus-visible:ring-3 focus-visible:outline-none"
        >
          <PixelAvatar id={avatar} size={48} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-pixel text-lg leading-tight">{copy.player.name}</p>
          <p className="font-pixel text-ink text-sm">
            {copy.levelLong(level.level)}
          </p>
        </div>
      </div>

      {picking && (
        <fieldset id="avatar-picker" className="space-y-2">
          <legend className="font-pixel text-xs">
            {copy.player.chooseAvatar}
          </legend>
          <div className="grid grid-cols-6 gap-1.5">
            {AVATARS.map((option) => (
              <label
                key={option.id}
                className={cn(
                  "border-frame has-[:focus-visible]:ring-ring/60 flex cursor-pointer justify-center rounded-sm border-2 p-0.5 has-[:focus-visible]:ring-3",
                  option.id === avatar ? "bg-primary" : "bg-muted",
                )}
              >
                <input
                  type="radio"
                  name="avatar"
                  className="sr-only"
                  checked={option.id === avatar}
                  aria-label={copy.player.avatar(option.id)}
                  onChange={() => {
                    setAvatar(option.id);
                    setPicking(false);
                  }}
                />
                <PixelAvatar id={option.id} size={32} />
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <XPBar level={level.level} value={level.into} max={level.needed} />

      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          {
            icon: "streak" as const,
            label: copy.player.streakShort,
            value: progress?.streak ?? 0,
          },
          {
            icon: "xp" as const,
            label: copy.player.totalXp,
            value: progress?.xp ?? 0,
          },
          {
            icon: "star" as const,
            label: copy.player.starsLabel,
            value: progress?.totalStars ?? 0,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-muted border-frame rounded-sm border-2 px-1 py-2"
          >
            <dt className="text-muted-foreground flex items-center justify-center gap-1 text-[11px]">
              <PixelIcon
                name={stat.icon}
                size={14}
                className={stat.icon === "star" ? "text-primary" : undefined}
              />
              {stat.label}
            </dt>
            <dd className="font-pixel mt-0.5 text-lg tabular-nums">
              {stat.value.toLocaleString("en-US")}
            </dd>
          </div>
        ))}
      </dl>

      <div>
        <h3 className="font-pixel text-xs tracking-wide uppercase">
          {copy.player.badges}
        </h3>
        <ul className="mt-2 grid grid-cols-8 gap-1">
          {BADGE_IDS.map((id) => {
            const earned = progress?.badges[id] ?? false;
            const badge = copy.badges[id];
            return (
              <li
                key={id}
                title={`${badge.name}: ${badge.hint}`}
                className={cn(
                  "border-frame flex aspect-square items-center justify-center rounded-sm border-2",
                  earned ? "bg-primary/15" : "bg-muted opacity-60",
                )}
              >
                <PixelIcon
                  name={earned ? "trophy" : "lock"}
                  size={16}
                  className={earned ? undefined : "text-muted-foreground"}
                />
                <span className="sr-only">
                  {earned
                    ? copy.player.badgeEarned(badge.name)
                    : copy.player.badgeLocked(badge.name)}
                  . {badge.hint}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** Level and XP in the header. */
export function HeaderPlayer() {
  const copy = getMessages().arcade;
  const { progress } = useProgress();
  const [avatar] = useAvatar();
  if (!progress) return null;
  return (
    <div className="hidden items-center gap-2 sm:flex" aria-live="off">
      <PixelAvatar id={avatar} size={24} />
      <span className="font-pixel text-ink text-xs">
        {copy.level(progress.level.level)}
      </span>
      <XPBar
        level={progress.level.level}
        value={progress.level.into}
        max={progress.level.needed}
        size="sm"
        showLabel={false}
        className="w-20"
      />
    </div>
  );
}
