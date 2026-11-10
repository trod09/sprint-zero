import {
  Building2,
  Crown,
  Flame,
  Handshake,
  UserMinus,
  type LucideIcon,
} from "lucide-react";

import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import type { EventType, PublicMidSprintEvent } from "../schema";

const EVENT_ICONS: Record<EventType, LucideIcon> = {
  production_outage: Flame,
  sales_promise: Handshake,
  dev_unavailable: UserMinus,
  compliance_deadline: Building2,
  ceo_escalation: Crown,
};

/** One mid-sprint event: what happened and what it changes. */
export function EventCard({
  event,
  onOpenTicket,
  className,
}: {
  event: PublicMidSprintEvent;
  onOpenTicket?: (id: string) => void;
  className?: string;
}) {
  const copy = getMessages().backlog.events;
  const Icon = EVENT_ICONS[event.type];
  return (
    <article className={cn("flex gap-3", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 space-y-1">
        <p className="text-muted-foreground text-xs font-medium">
          {copy.types[event.type]}
        </p>
        <h3 className="leading-snug font-medium">{event.title}</h3>
        <p className="text-muted-foreground text-sm">{event.description}</p>
        <ul className="space-y-0.5 pt-1 text-sm">
          {event.capacityDelta !== 0 && (
            <li className="text-destructive font-medium">
              {copy.capacityChange(event.capacityDelta)}
            </li>
          )}
          {event.addedTicket && (
            <li>
              {onOpenTicket ? (
                <button
                  type="button"
                  onClick={() => onOpenTicket(event.addedTicket!.id)}
                  className="text-brand focus-visible:ring-ring/50 rounded-sm font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:outline-none"
                >
                  {copy.newTicket(event.addedTicket.id)}
                </button>
              ) : (
                <span className="font-medium">
                  {copy.newTicket(event.addedTicket.id)}
                </span>
              )}
            </li>
          )}
        </ul>
      </div>
    </article>
  );
}
