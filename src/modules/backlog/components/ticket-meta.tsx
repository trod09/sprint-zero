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
  feature: "text-brand",
  bug: "text-destructive",
  tech_debt: "text-warning",
  sales_request: "text-success",
  ceo_request: "text-ink",
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
