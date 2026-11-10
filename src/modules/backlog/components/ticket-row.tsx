"use client";

import { useDraggable } from "@dnd-kit/core";
import {
  Check,
  DollarSign,
  GripVertical,
  LifeBuoy,
  Plus,
  Quote,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n";
import { formatCompact, formatUsdCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { PublicTicket, TicketMark } from "../schema";
import { EffortPill, TicketTypeIcon } from "./ticket-meta";

export const backlogDragId = (ticketId: string) => `backlog:${ticketId}`;

/** The data a ticket shows at a glance. */
export function TicketSignals({ ticket }: { ticket: PublicTicket }) {
  const copy = getMessages().backlog.ticket;
  const { visible } = ticket;
  const items: { key: string; icon: typeof Users; text: string }[] = [];
  if (visible.reach !== undefined) {
    items.push({
      key: "reach",
      icon: Users,
      text: copy.reachShort(formatCompact(visible.reach)),
    });
  }
  if (visible.supportTickets !== undefined) {
    items.push({
      key: "support",
      icon: LifeBuoy,
      text: copy.supportShort(visible.supportTickets),
    });
  }
  if (visible.revenueAtRisk !== undefined) {
    items.push({
      key: "revenue",
      icon: DollarSign,
      text: copy.revenueShort(formatUsdCompact(visible.revenueAtRisk)),
    });
  }
  if (visible.impactHint) {
    items.push({ key: "claim", icon: Quote, text: copy.claim });
  }
  if (items.length === 0) return null;
  return (
    <ul className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
      {items.map(({ key, icon: Icon, text }) => (
        <li key={key} className="flex items-center gap-1">
          <Icon className="size-3" aria-hidden="true" />
          {text}
        </li>
      ))}
    </ul>
  );
}

export function TicketRow({
  ticket,
  inSprint,
  mark,
  draggable,
  onOpen,
  onAdd,
  children,
}: {
  ticket: PublicTicket;
  inSprint: boolean;
  mark?: TicketMark;
  /** Rows can be dragged into the sprint when they are not in it already. */
  draggable: boolean;
  onOpen: () => void;
  onAdd: () => void;
  /** Method-specific controls (RICE inputs, MoSCoW buckets). */
  children?: ReactNode;
}) {
  const copy = getMessages().backlog;
  const canDrag = draggable && !inSprint && !mark;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } =
    useDraggable({ id: backlogDragId(ticket.id), disabled: !canDrag });

  return (
    <li
      ref={setNodeRef}
      className={cn(
        "bg-card flex flex-col gap-2 px-2 py-2.5 transition-opacity sm:flex-row sm:items-center sm:gap-3",
        isDragging && "opacity-40",
        mark && "opacity-70",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2">
        {draggable && (
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label={copy.ticket.dragHandle(ticket.id)}
            disabled={!canDrag}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 mt-0.5 flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md focus-visible:ring-3 focus-visible:outline-none active:cursor-grabbing disabled:invisible"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
        )}
        <TicketTypeIcon type={ticket.type} className="mt-1" />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpen}
            aria-label={copy.ticket.open(ticket.id)}
            className="focus-visible:ring-ring/50 -mx-1 block max-w-full rounded-md px-1 text-left focus-visible:ring-3 focus-visible:outline-none"
          >
            <span className="text-muted-foreground mr-2 font-mono text-xs">
              {ticket.id}
            </span>
            <span className="text-sm font-medium hover:underline">
              {ticket.title}
            </span>
          </button>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="text-muted-foreground text-xs">
              {ticket.requester}
            </span>
            <TicketSignals ticket={ticket} />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-8 sm:pl-0">
        {children}
        <EffortPill effort={ticket.effort} />
        {!mark &&
          (inSprint ? (
            <span
              className="text-brand flex size-7 items-center justify-center"
              title={copy.ticket.inSprint}
            >
              <Check className="size-4" aria-hidden="true" />
              <span className="sr-only">{copy.ticket.inSprint}</span>
            </span>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onAdd}
              aria-label={copy.ticket.add(ticket.id)}
            >
              <Plus aria-hidden="true" />
            </Button>
          ))}
      </div>
    </li>
  );
}
