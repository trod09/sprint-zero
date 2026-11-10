import {
  Bug,
  Crown,
  Handshake,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import type { TicketType } from "../schema";

const TYPE_ICONS: Record<TicketType, LucideIcon> = {
  feature: Sparkles,
  bug: Bug,
  tech_debt: Wrench,
  sales_request: Handshake,
  ceo_request: Crown,
};

const TYPE_TONES: Record<TicketType, string> = {
  feature: "text-sky-600 dark:text-sky-400",
  bug: "text-rose-600 dark:text-rose-400",
  tech_debt: "text-amber-600 dark:text-amber-400",
  sales_request: "text-emerald-600 dark:text-emerald-400",
  ceo_request: "text-violet-600 dark:text-violet-400",
};

/** Ticket type as an icon, with the type name for screen readers and on hover. */
export function TicketTypeIcon({
  type,
  className,
}: {
  type: TicketType;
  className?: string;
}) {
  const Icon = TYPE_ICONS[type];
  const label = getMessages().backlog.types[type];
  return (
    <span
      title={label}
      className={cn("inline-flex shrink-0", TYPE_TONES[type])}
    >
      <Icon className={cn("size-4", className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Story points as a small pill. */
export function EffortPill({
  effort,
  className,
}: {
  effort: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-5 min-w-9 shrink-0 items-center justify-center rounded-md px-1.5 font-mono text-xs tabular-nums",
        className,
      )}
    >
      {getMessages().backlog.ticket.points(effort)}
    </span>
  );
}
