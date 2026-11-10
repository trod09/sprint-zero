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
        <span className="font-pixel text-muted-foreground">
          {copy.capacityLabel}
        </span>
        <span
          className={cn(
            "font-pixel tabular-nums",
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
        className="border-frame bg-muted relative mt-2 flex h-4 overflow-hidden rounded-sm border-2"
      >
        <div
          className={cn(
            "h-full transition-[width] duration-200 ease-[steps(8,end)]",
            over > 0 ? "bg-warning" : "bg-primary",
          )}
          style={{ width: `${fillShare * 100}%` }}
        />
        <div
          className="bg-destructive h-full transition-[width] duration-200 ease-[steps(8,end)]"
          style={{ width: `${overShare * 100}%` }}
        />
        {/* Segment gaps, one per tenth of the sprint. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0 calc(10% - 2px), var(--card) calc(10% - 2px) 10%)",
          }}
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
