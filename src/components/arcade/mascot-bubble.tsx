import type { ReactNode } from "react";

import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import { Mascot } from "./icons";

/** Kanbo with a speech bubble, like a character in a game's dialogue box. */
export function MascotBubble({
  children,
  label,
  size = 56,
  className,
}: {
  children: ReactNode;
  /** Short heading inside the bubble, e.g. "Kanbo's tip". */
  label?: string;
  size?: number;
  className?: string;
}) {
  const copy = getMessages().arcade;
  return (
    <div className={cn("flex items-end gap-3", className)} role="note">
      <Mascot size={size} title={copy.mascotAlt} />
      <div className="pixel-card relative min-w-0 flex-1 px-4 py-3">
        {/* Pixel tail pointing at Kanbo. */}
        <span
          aria-hidden="true"
          className="border-frame bg-card absolute bottom-3 -left-[9px] size-3 border-b-2 border-l-2"
          style={{ clipPath: "polygon(0 0, 100% 100%, 0 100%)" }}
        />
        <p className="font-pixel text-ink text-xs tracking-wide uppercase">
          {label ?? copy.mascotName}
        </p>
        <div className="mt-1 text-sm leading-relaxed text-pretty">
          {children}
        </div>
      </div>
    </div>
  );
}
