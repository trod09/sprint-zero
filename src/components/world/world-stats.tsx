"use client";

/** A world's totals in this browser: cases cleared, stars and progress. */
import { PixelIcon } from "@/components/arcade/icons";
import { Panel } from "@/components/arcade/panel";
import type { CaseInfo } from "@/core/progress";
import { getMessages } from "@/i18n";
import { useProgress } from "@/lib/use-progress";

export function WorldStats({
  moduleId,
  catalog,
}: {
  moduleId: string;
  catalog: readonly CaseInfo[];
}) {
  const messages = getMessages();
  const copy = messages.module.levels;
  const { progress } = useProgress(catalog);
  const world = progress?.modules[moduleId];
  const total = catalog.filter((c) => c.moduleId === moduleId).length;
  const played = world?.played ?? 0;
  const stars = world?.stars ?? 0;
  const maxStars = world?.maxStars ?? total * 3;
  const stats = [
    {
      icon: "check" as const,
      label: copy.casesCleared,
      value: `${played}/${total}`,
    },
    { icon: "star" as const, label: copy.stars, value: `${stars}/${maxStars}` },
  ];

  return (
    <Panel icon="trophy" title={copy.progressTitle} bodyClassName="space-y-4">
      <dl className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-background/60 border-border rounded-md border-2 p-3"
          >
            <dt className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <PixelIcon name={stat.icon} size={12} />
              {stat.label}
            </dt>
            <dd className="font-pixel mt-1 text-2xl tabular-nums">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
      <div>
        <div
          className="border-frame bg-muted h-3 overflow-hidden rounded-sm border-2"
          role="img"
          aria-label={messages.arcade.stars(stars, maxStars)}
        >
          <div
            className="h-full transition-[width] duration-300"
            style={{
              width: `${maxStars ? (stars / maxStars) * 100 : 0}%`,
              background: "var(--world)",
            }}
          />
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          {played === 0 ? copy.startHint : copy.keepGoing(maxStars - stars)}
        </p>
      </div>
    </Panel>
  );
}
