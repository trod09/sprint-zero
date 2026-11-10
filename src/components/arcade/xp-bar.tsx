"use client";

import { useEffect, useState } from "react";

import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * A segmented XP bar. Mounts at `from` and fills to `value`, so a gain is
 * visible; without `from` it just shows `value`.
 */
export function XPBar({
  level,
  value,
  max,
  from,
  size = "default",
  showLabel = true,
  className,
}: {
  level: number;
  value: number;
  max: number;
  /** Starting value for the fill animation. */
  from?: number;
  size?: "default" | "sm";
  showLabel?: boolean;
  className?: string;
}) {
  const copy = getMessages().arcade;
  const target = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const start = from === undefined ? target : Math.min(1, from / max);
  const [fill, setFill] = useState(start);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setFill(target));
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="font-pixel flex items-baseline justify-between gap-2 text-xs">
          <span>{copy.level(level)}</span>
          <span className="text-muted-foreground tabular-nums">
            {copy.xpProgress(Math.round(value), max)}
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={copy.xpBarLabel(level)}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
        className={cn(
          "border-frame bg-muted relative overflow-hidden rounded-sm border-2",
          size === "sm" ? "h-3" : "h-5",
        )}
      >
        <div
          className="bg-primary h-full transition-[width] duration-700 ease-[steps(12,end)]"
          style={{ width: `${fill * 100}%` }}
        />
        {/* Segment gaps over the fill, like an arcade health bar. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0 calc(5% - 2px), var(--card) calc(5% - 2px) 5%)",
          }}
        />
      </div>
    </div>
  );
}
