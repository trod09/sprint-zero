/**
 * A native <select> in the arcade style: 2px frame, pixel chevron. Native on
 * purpose: it keeps the platform's keyboard and screen reader behavior.
 */
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-7 pl-2 pr-7 text-xs",
  default: "h-9 pl-3 pr-8 text-sm",
} as const;

export function NativeSelect({
  className,
  size = "default",
  wrapperClassName,
  ...props
}: Omit<ComponentProps<"select">, "size"> & {
  size?: keyof typeof SIZES;
  wrapperClassName?: string;
}) {
  return (
    <span className={cn("relative flex w-full min-w-0", wrapperClassName)}>
      <select
        className={cn(
          "border-frame bg-background text-foreground hover:border-ring focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 cursor-pointer appearance-none rounded-md border-2 font-medium outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50",
          SIZES[size],
          className,
        )}
        {...props}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 8 5"
        shapeRendering="crispEdges"
        className={cn(
          "text-muted-foreground pointer-events-none absolute top-1/2 -translate-y-1/2",
          size === "sm" ? "right-2 h-1.5 w-2.5" : "right-3 h-2 w-3",
        )}
      >
        <path
          fill="currentColor"
          d="M0 0h2v1H0zM6 0h2v1H6zM1 1h2v1H1zM5 1h2v1H5zM2 2h4v1H2zM3 3h2v1H3z"
        />
      </svg>
    </span>
  );
}
