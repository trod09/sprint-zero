import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

/** How much of the sprint is planned, with the overflow shown past the end. */
export function CapacityBar({
  used,
  capacity,
  spilledCount,
}: {
  used: number;
  capacity: number;
  spilledCount: number;
}) {
  const copy = getMessages().backlog.sprint;
  const over = Math.max(0, used - capacity);
  const total = Math.max(capacity, used, 1);
  const fillShare = Math.min(used, capacity) / total;
  const overShare = over / total;

  let status: string;
  if (over > 0) status = copy.over(over, spilledCount);
  else if (used === capacity) status = copy.full;
  else status = copy.left(capacity - used);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{copy.capacityLabel}</span>
        <span
          className={cn(
            "font-mono font-medium tabular-nums",
            over > 0 && "text-destructive",
          )}
        >
          {copy.capacity(used, capacity)}
        </span>
      </div>
      <div
        role="meter"
        aria-label={copy.capacityLabel}
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={used}
        aria-valuetext={`${copy.capacity(used, capacity)}. ${status}`}
        className="bg-muted mt-2 flex h-2 overflow-hidden rounded-full"
      >
        <div
          className={cn(
            "h-full transition-[width] duration-300 ease-out",
            over > 0 ? "bg-foreground/60" : "bg-brand",
          )}
          style={{ width: `${fillShare * 100}%` }}
        />
        <div
          className="bg-destructive h-full transition-[width] duration-300 ease-out"
          style={{ width: `${overShare * 100}%` }}
        />
      </div>
      <p
        aria-live="polite"
        className={cn(
          "mt-1.5 text-xs",
          over > 0 ? "text-destructive font-medium" : "text-muted-foreground",
        )}
      >
        {status}
      </p>
    </div>
  );
}
