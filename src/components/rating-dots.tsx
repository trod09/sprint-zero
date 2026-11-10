import { cn } from "@/lib/utils";

/** A 0-max rating as filled dots, with the number for screen readers. */
export function RatingDots({ value, max }: { value: number; max: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="sr-only">
        {value} / {max}
      </span>
      {Array.from({ length: max }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={cn(
            "size-2 rounded-full",
            index < value ? "bg-primary" : "bg-muted-foreground/25",
          )}
        />
      ))}
    </span>
  );
}
