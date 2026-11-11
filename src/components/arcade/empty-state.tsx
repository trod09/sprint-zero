/** An empty area with Kanbo saying what goes there and how to fill it. */
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Mascot } from "./icons";

export function EmptyState({
  title,
  children,
  className,
  size = "default",
}: {
  title: ReactNode;
  children?: ReactNode;
  className?: string;
  size?: "sm" | "default";
}) {
  return (
    <div
      className={cn(
        "border-frame flex items-center gap-4 rounded-md border-2 border-dashed",
        size === "sm" ? "px-3 py-3" : "px-5 py-6",
        className,
      )}
    >
      <Mascot size={size === "sm" ? 32 : 44} />
      <div className="min-w-0 text-sm">
        <p className="font-pixel text-ink">{title}</p>
        {children && (
          <div className="text-muted-foreground mt-1 text-pretty">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
