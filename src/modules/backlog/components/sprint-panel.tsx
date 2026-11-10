"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical, X } from "lucide-react";
import { Fragment } from "react";

import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import type { CapacitySplit } from "../planning";
import type { PublicTicket } from "../schema";
import { CapacityBar } from "./capacity-bar";
import { EffortPill, TicketTypeIcon } from "./ticket-meta";

export const SPRINT_ZONE_ID = "sprint-zone";
export const sprintDragId = (ticketId: string) => `sprint:${ticketId}`;

function SprintItem({
  ticket,
  position,
  total,
  spilled,
  onOpen,
  onMove,
  onRemove,
}: {
  ticket: PublicTicket;
  position: number;
  total: number;
  spilled: boolean;
  onOpen: () => void;
  onMove: (toIndex: number) => void;
  onRemove: () => void;
}) {
  const copy = getMessages().backlog.ticket;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sprintDragId(ticket.id) });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "bg-card group/item flex items-center gap-1.5 rounded-lg border px-1.5 py-1.5",
        isDragging && "relative z-10 shadow-md",
        spilled && "border-destructive/40 border-dashed",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={copy.dragHandle(ticket.id)}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md focus-visible:ring-3 focus-visible:outline-none active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </button>
      <span className="text-muted-foreground w-5 shrink-0 text-right font-mono text-xs tabular-nums">
        {position + 1}
      </span>
      <TicketTypeIcon type={ticket.type} className="size-3.5" />
      <button
        type="button"
        onClick={onOpen}
        aria-label={copy.open(ticket.id)}
        className={cn(
          "focus-visible:ring-ring/50 min-w-0 flex-1 truncate rounded-md text-left text-sm focus-visible:ring-3 focus-visible:outline-none",
          spilled && "text-muted-foreground line-through",
        )}
        title={ticket.title}
      >
        {ticket.title}
      </button>
      {/* On wide screens the controls replace the points on hover or focus,
          so titles get the full width the rest of the time. */}
      <EffortPill
        effort={ticket.effort}
        className="sm:group-focus-within/item:hidden sm:group-hover/item:hidden"
      />
      <div className="flex items-center sm:hidden sm:group-focus-within/item:flex sm:group-hover/item:flex">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onMove(position - 1)}
          disabled={position === 0}
          aria-label={copy.moveUp(ticket.id)}
        >
          <ArrowUp aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onMove(position + 1)}
          disabled={position === total - 1}
          aria-label={copy.moveDown(ticket.id)}
        >
          <ArrowDown aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onRemove}
          aria-label={copy.remove(ticket.id)}
        >
          <X aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}

export function SprintPanel({
  tickets,
  capacity,
  split,
  onOpen,
  onMove,
  onRemove,
  onClear,
  onCommit,
  commitLabel,
  note,
}: {
  /** Sprint tickets in order. */
  tickets: readonly PublicTicket[];
  capacity: number;
  split: CapacitySplit;
  onOpen: (id: string) => void;
  onMove: (id: string, toIndex: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCommit: () => void;
  commitLabel: string;
  /** Extra line under the capacity bar, e.g. changes since the commit. */
  note?: string;
}) {
  const copy = getMessages().backlog.sprint;
  const { setNodeRef, isOver } = useDroppable({ id: SPRINT_ZONE_ID });
  const spilled = new Set(split.spilledIds);
  const firstSpilledIndex = tickets.findIndex((t) => spilled.has(t.id));

  return (
    <section
      aria-labelledby="sprint-title"
      className="bg-card flex flex-col rounded-xl border lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)]"
    >
      <div className="space-y-3 border-b p-4">
        <div className="flex items-center justify-between">
          <h2 id="sprint-title" className="font-heading font-semibold">
            {copy.title}
          </h2>
          {tickets.length > 0 && (
            <Button type="button" variant="ghost" size="xs" onClick={onClear}>
              {copy.clear}
            </Button>
          )}
        </div>
        <CapacityBar
          used={split.plannedEffort}
          capacity={capacity}
          spilledCount={split.spilledIds.length}
        />
        {note && <p className="text-muted-foreground text-xs">{note}</p>}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "min-h-40 flex-1 overflow-y-auto p-3 transition-colors",
          isOver && "bg-brand/5",
        )}
      >
        {tickets.length === 0 ? (
          <p
            className={cn(
              "text-muted-foreground flex h-full min-h-34 items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm",
              isOver && "border-brand text-foreground",
            )}
          >
            {copy.dropHere}
          </p>
        ) : (
          <SortableContext
            items={tickets.map((ticket) => sprintDragId(ticket.id))}
            strategy={verticalListSortingStrategy}
          >
            <ol className="space-y-1.5">
              {tickets.map((ticket, index) => (
                <Fragment key={ticket.id}>
                  {index === firstSpilledIndex && (
                    <li
                      role="separator"
                      className="text-destructive flex items-center gap-2 py-1 text-xs font-medium"
                    >
                      <span className="bg-destructive/40 h-px flex-1" />
                      {copy.capacityLine}
                      <span className="bg-destructive/40 h-px flex-1" />
                    </li>
                  )}
                  <SprintItem
                    ticket={ticket}
                    position={index}
                    total={tickets.length}
                    spilled={spilled.has(ticket.id)}
                    onOpen={() => onOpen(ticket.id)}
                    onMove={(toIndex) => onMove(ticket.id, toIndex)}
                    onRemove={() => onRemove(ticket.id)}
                  />
                </Fragment>
              ))}
            </ol>
          </SortableContext>
        )}
      </div>

      <div className="border-t p-3">
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={onCommit}
          disabled={tickets.length === 0}
        >
          {commitLabel}
        </Button>
      </div>
    </section>
  );
}
