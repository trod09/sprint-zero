import type { ScoreResult } from "@/core/scoring";
import { cn } from "@/lib/utils";

/** The official score, criterion by criterion. */
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
            <span className="font-medium">{criterion.label}</span>
            <span className="font-mono tabular-nums">
              {criterion.points}
              <span className="text-muted-foreground">
                {" "}
                / {criterion.weight}
              </span>
            </span>
          </div>
          <div className="bg-muted mt-1.5 h-1.5 overflow-hidden rounded-full">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                criterion.ratio >= 0.8
                  ? "bg-emerald-500"
                  : criterion.ratio >= 0.5
                    ? "bg-amber-500"
                    : "bg-destructive",
              )}
              style={{ width: `${criterion.ratio * 100}%` }}
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
