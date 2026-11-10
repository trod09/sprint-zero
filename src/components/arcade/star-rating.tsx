import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import { PixelIcon } from "./icons";

/** One to three stars; `animate` pops them in one after another. */
export function StarRating({
  stars,
  max = 3,
  size = 20,
  animate = false,
  className,
}: {
  stars: number;
  max?: number;
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  const copy = getMessages().arcade;
  return (
    <span
      role="img"
      aria-label={copy.stars(stars, max)}
      className={cn("inline-flex items-center gap-1", className)}
    >
      {Array.from({ length: max }, (_, index) => {
        const filled = index < stars;
        return (
          <span
            key={index}
            className={cn(
              "inline-flex",
              animate && filled && "animate-pixel-pop",
            )}
            // Staggered so each star lands on its own beat.
            style={animate ? { animationDelay: `${index * 160}ms` } : undefined}
          >
            <PixelIcon
              name="star"
              size={size}
              className={
                filled
                  ? "text-primary drop-shadow-[2px_2px_0_var(--shadow-color)]"
                  : "text-muted-foreground/30"
              }
            />
          </span>
        );
      })}
    </span>
  );
}
