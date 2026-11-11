/**
 * A window of the game: a title bar with the world's accent, an icon and
 * optional actions, over the panel body. Every block of a case uses it, so
 * reading material and controls share one frame.
 */
import { useId, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { PixelIcon } from "./icons";
import type { IconName } from "./sprites";

export function Panel({
  title,
  icon,
  subtitle,
  aside,
  children,
  className,
  bodyClassName,
  flat = false,
  headingLevel = "h2",
  id,
  bodyProps,
}: {
  title: ReactNode;
  icon?: IconName;
  /** One line under the title bar, before the body. */
  subtitle?: ReactNode;
  /** Right side of the title bar: a count, a badge or a small control. */
  aside?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Dense data (tables, long lists) stays flat: no offset shadow. */
  flat?: boolean;
  headingLevel?: "h2" | "h3";
  id?: string;
  /** Extra attributes for the body, e.g. to make it a focusable scroll region. */
  bodyProps?: HTMLAttributes<HTMLDivElement>;
}) {
  const generated = useId();
  const titleId = id ?? `panel-${generated}`;
  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        flat ? "pixel-frame" : "pixel-card",
        "overflow-hidden",
        className,
      )}
    >
      <PanelTitleBar
        titleId={titleId}
        icon={icon}
        title={title}
        aside={aside}
        headingLevel={headingLevel}
      />
      {subtitle && (
        <p className="text-muted-foreground px-4 pt-3 text-sm text-pretty">
          {subtitle}
        </p>
      )}
      <div {...bodyProps} className={cn("p-4", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

/** The title bar of a panel, for panels that need their own body layout. */
export function PanelTitleBar({
  titleId,
  icon,
  title,
  aside,
  headingLevel = "h2",
}: {
  titleId: string;
  icon?: IconName;
  title: ReactNode;
  aside?: ReactNode;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <div className="bg-muted/60 border-frame relative flex min-h-11 items-center gap-2.5 border-b-2 py-2 pr-3 pl-4">
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: "var(--world-ink, var(--frame))" }}
      />
      {icon && (
        <span aria-hidden="true" style={{ color: "var(--world-ink)" }}>
          <PixelIcon name={icon} size={16} />
        </span>
      )}
      <Heading
        id={titleId}
        className="font-pixel min-w-0 flex-1 truncate text-sm tracking-wide"
      >
        {title}
      </Heading>
      {aside && (
        <div className="text-muted-foreground flex shrink-0 items-center gap-2 text-xs">
          {aside}
        </div>
      )}
    </div>
  );
}
