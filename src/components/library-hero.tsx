"use client";

/**
 * The top of the case library: the player's totals across worlds and
 * Kanbo's pick for the next case (the weakest skill, or an easy first one).
 */
import Link from "next/link";
import { useMemo } from "react";

import { PixelIcon } from "@/components/arcade/icons";
import { MascotBubble } from "@/components/arcade/mascot-bubble";
import type { CaseSummary } from "@/components/case-library";
import { Button } from "@/components/ui/button";
import { DIFFICULTIES } from "@/core/case-engine";
import { getMessages } from "@/i18n";
import { recommendFromAttempts } from "@/lib/recommend";
import { useProgress } from "@/lib/use-progress";

export function LibraryHero({ cases }: { cases: readonly CaseSummary[] }) {
  const messages = getMessages();
  const copy = messages.library;
  const catalog = useMemo(
    () =>
      cases.map(({ id, moduleId, difficulty }) => ({
        id,
        moduleId,
        difficulty,
      })),
    [cases],
  );
  const { progress, attempts } = useProgress(catalog);

  const worlds = new Set(cases.map((c) => c.moduleId)).size;
  const modules = progress ? Object.values(progress.modules) : [];
  const played = modules.reduce((total, m) => total + m.played, 0);
  const stars = modules.reduce((total, m) => total + m.stars, 0);
  const maxStars = cases.length * 3;
  const explored = modules.filter((m) => m.played > 0).length;

  const suggestion = useMemo(() => {
    if (!attempts) return null;
    if (attempts.length === 0) {
      const easiest = [...cases].sort(
        (a, b) =>
          DIFFICULTIES.indexOf(a.difficulty) -
          DIFFICULTIES.indexOf(b.difficulty),
      )[0];
      return easiest ? { summary: easiest, text: copy.suggestion.first } : null;
    }
    const [pick] = recommendFromAttempts(attempts, cases, 1);
    const summary = pick && cases.find((c) => c.id === pick.caseId);
    if (!pick || !summary)
      return { summary: null, text: copy.suggestion.allDone };
    const skill = messages.skills[pick.skill];
    return {
      summary,
      text:
        pick.reason === "not_practiced"
          ? copy.suggestion.notPracticed(skill)
          : copy.suggestion.weakest(skill),
    };
  }, [attempts, cases, copy, messages.skills]);

  const stats = [
    {
      icon: "check" as const,
      label: copy.stats.played,
      value: `${played}/${cases.length}`,
    },
    {
      icon: "star" as const,
      label: copy.stats.stars,
      value: `${stars}/${maxStars}`,
    },
    {
      icon: "flag" as const,
      label: copy.stats.worlds,
      value: `${explored}/${worlds}`,
    },
  ];

  return (
    <div className="grid items-end gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <div className="space-y-5">
        <header className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="border-frame bg-card shadow-pixel-sm mt-1 flex size-12 shrink-0 items-center justify-center rounded-md border-2"
          >
            <PixelIcon name="star" size={28} />
          </span>
          <div className="min-w-0">
            <h1 className="font-pixel text-3xl leading-tight text-balance">
              {copy.title}
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl text-pretty">
              {copy.subtitle}
            </p>
          </div>
        </header>
        <dl className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="pixel-card px-3 py-2.5">
              <dt className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <PixelIcon name={stat.icon} size={12} />
                {stat.label}
              </dt>
              <dd className="font-pixel mt-1 text-2xl tabular-nums">
                {progress ? stat.value : "–"}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <MascotBubble label={copy.suggestion.label} size={64}>
        {suggestion ? (
          <div className="space-y-2">
            <p className="text-sm">{suggestion.text}</p>
            {suggestion.summary && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 text-sm font-semibold">
                  {suggestion.summary.title}
                  <span className="text-muted-foreground block text-xs font-normal">
                    {suggestion.summary.moduleName} ·{" "}
                    {messages.difficulty[suggestion.summary.difficulty]}
                  </span>
                </p>
                <Button asChild size="sm">
                  <Link href={`/case/${suggestion.summary.id}`}>
                    {copy.suggestion.play}
                    <PixelIcon name="play" size={12} />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            {messages.arcade.player.loading}
          </p>
        )}
      </MascotBubble>
    </div>
  );
}
