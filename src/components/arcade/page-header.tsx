/** The top of a hub page (library, history, skills): icon, title, subtitle. */
import type { ReactNode } from "react";

import { PixelIcon } from "./icons";
import type { IconName } from "./sprites";

export function PageHeader({
  icon,
  title,
  subtitle,
}: {
  icon: IconName;
  title: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <header className="flex items-start gap-4">
      <span
        aria-hidden="true"
        className="border-frame bg-card shadow-pixel-sm mt-1 flex size-12 shrink-0 items-center justify-center rounded-md border-2"
      >
        <PixelIcon name={icon} size={28} />
      </span>
      <div className="min-w-0">
        <h1 className="font-pixel text-3xl leading-tight text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground mt-1 max-w-2xl text-pretty">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
