"use client";

import { Timer } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import { formatClock } from "../draft";

/** Optional interview clock. It is shown, stored with the answer, never scored. */
export function CaseTimer({
  limitMinutes,
  startedAt,
  onStart,
  onStop,
}: {
  limitMinutes: number;
  startedAt: number | null;
  onStart: () => void;
  onStop: () => void;
}) {
  const copy = getMessages().productCase.timer;
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (startedAt === null) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  if (startedAt === null) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={onStart}>
          <Timer aria-hidden="true" />
          {copy.start(limitMinutes)}
        </Button>
        <p className="text-muted-foreground text-xs">{copy.hint}</p>
      </div>
    );
  }

  const left = limitMinutes * 60 - ((now ?? startedAt) - startedAt) / 1000;
  const over = left <= 0;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p
        className={cn(
          "flex items-center gap-2 rounded-md border px-2.5 py-1 font-mono text-sm tabular-nums",
          over
            ? "border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-300"
            : left < 120
              ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
              : "bg-card",
        )}
      >
        <Timer aria-hidden="true" className="size-4" />
        <span className="sr-only">{copy.remaining}: </span>
        {formatClock(left)}
      </p>
      {over && (
        <p role="status" className="text-sm">
          {copy.over}
        </p>
      )}
      <Button type="button" variant="ghost" size="sm" onClick={onStop}>
        {copy.stop}
      </Button>
    </div>
  );
}
