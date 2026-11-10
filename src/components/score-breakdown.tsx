import type { ScoreResult } from "@/core/scoring";
import { cn } from "@/lib/utils";

/** The official score, criterion by criterion, as segmented pixel bars. */
export function ScoreBreakdown({
  criteria,
}: {
  criteria: ScoreResult["criteria"];
}) {
  return (
    <ul className="space-y-4">
      {criteria.map((criterion) => (
        <li key={criterion.id}>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="font-pixel tracking-wide">{criterion.label}</span>
            <span className="font-pixel tabular-nums">
              {criterion.points}
              <span className="text-muted-foreground">
                {" "}
                / {criterion.weight}
              </span>
            </span>
          </div>
          <div className="border-frame bg-muted relative mt-1.5 h-3 overflow-hidden rounded-sm border-2">
            <div
              className={cn(
                "h-full transition-[width] duration-500 ease-[steps(10,end)]",
                criterion.ratio >= 0.8
                  ? "bg-success"
                  : criterion.ratio >= 0.5
                    ? "bg-warning"
                    : "bg-destructive",
              )}
              style={{ width: `${criterion.ratio * 100}%` }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, transparent 0 calc(10% - 2px), var(--card) calc(10% - 2px) 10%)",
              }}
            />
          </div>
          {criterion.detail && (
            <p className="text-muted-foreground mt-1 text-xs">
              {criterion.detail}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
