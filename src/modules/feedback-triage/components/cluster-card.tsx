"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Flag,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import type { Cluster, FeedbackItem } from "../schema";

export const zoneId = (target: string) => `zone:${target}`;
export const targetOfZone = (id: string) =>
  id.startsWith("zone:") ? id.slice(5) : null;

function ItemList({
  items,
  onUnassign,
}: {
  items: readonly FeedbackItem[];
  onUnassign: (id: string) => void;
}) {
  const copy = getMessages().triage.clusters;
  return (
    <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-1.5 text-xs">
          <span className="text-muted-foreground shrink-0 font-mono">
            {item.id}
          </span>
          <span className="min-w-0 flex-1 truncate" title={item.text}>
            {item.text}
          </span>
          <button
            type="button"
            aria-label={copy.unassign(item.id)}
            onClick={() => onUnassign(item.id)}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ClusterCard({
  cluster,
  position,
  total,
  items,
  critical,
  dragging,
  onRename,
  onMove,
  onRemove,
  onToggleCritical,
  onOpportunity,
  onUnassign,
}: {
  cluster: Cluster;
  position: number;
  total: number;
  items: readonly FeedbackItem[];
  critical: boolean;
  dragging: boolean;
  onRename: (name: string) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
  onToggleCritical: () => void;
  onOpportunity: (text: string) => void;
  onUnassign: (id: string) => void;
}) {
  const copy = getMessages().triage.clusters;
  const [open, setOpen] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: zoneId(cluster.id) });
  const name = cluster.name || "Untitled";

  return (
    <li
      ref={setNodeRef}
      className={cn(
        "bg-card rounded-lg border p-2.5 transition-colors",
        critical && "border-destructive/50",
        dragging && "border-dashed",
        isOver && dragging && "border-brand bg-brand/5",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground w-6 shrink-0 font-mono text-xs">
          {copy.rank(position)}
        </span>
        <Input
          aria-label={copy.rename(name)}
          value={cluster.name}
          maxLength={60}
          onChange={(event) => onRename(event.target.value)}
          className="h-7 min-w-0 flex-1 px-2 text-sm font-medium"
        />
        <Button
          type="button"
          variant={critical ? "destructive" : "ghost"}
          size="icon-sm"
          aria-pressed={critical}
          aria-label={copy.markCritical(name)}
          title={copy.critical}
          onClick={onToggleCritical}
        >
          <Flag aria-hidden="true" />
        </Button>
      </div>
      <div className="mt-1.5 flex items-center gap-1">
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? copy.hide(name) : copy.show(name)}
          onClick={() => setOpen(!open)}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex items-center gap-1 rounded-sm text-xs focus-visible:ring-2 focus-visible:outline-none"
        >
          {open ? (
            <ChevronDown className="size-3.5" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-3.5" aria-hidden="true" />
          )}
          {copy.items(items.length)}
        </button>
        {critical && (
          <span className="bg-destructive/10 text-destructive rounded-sm px-1 text-xs font-medium">
            {copy.critical}
          </span>
        )}
        <span className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={copy.moveUp(name)}
          disabled={position === 1}
          onClick={() => onMove(-1)}
        >
          <ArrowUp aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={copy.moveDown(name)}
          disabled={position === total}
          onClick={() => onMove(1)}
        >
          <ArrowDown aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={copy.remove(name)}
          onClick={onRemove}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
      {open && (
        <>
          {items.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-xs">
              {copy.dropHere}
            </p>
          ) : (
            <ItemList items={items} onUnassign={onUnassign} />
          )}
          <Textarea
            aria-label={`${copy.opportunity}: ${name}`}
            placeholder={copy.opportunityPlaceholder}
            rows={2}
            maxLength={600}
            value={cluster.opportunity}
            onChange={(event) => onOpportunity(event.target.value)}
            className="mt-2 text-xs"
          />
        </>
      )}
    </li>
  );
}

export function NoiseBin({
  items,
  dragging,
  onUnassign,
}: {
  items: readonly FeedbackItem[];
  dragging: boolean;
  onUnassign: (id: string) => void;
}) {
  const copy = getMessages().triage.clusters;
  const [open, setOpen] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: zoneId("noise") });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-muted/40 rounded-lg border border-dashed p-2.5 transition-colors",
        isOver && dragging && "border-brand bg-brand/5",
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="focus-visible:ring-ring/50 flex w-full items-center gap-1 rounded-sm text-left text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
      >
        {open ? (
          <ChevronDown className="size-3.5" aria-hidden="true" />
        ) : (
          <ChevronRight className="size-3.5" aria-hidden="true" />
        )}
        {copy.noise}
        <span className="text-muted-foreground ml-auto text-xs font-normal">
          {copy.items(items.length)}
        </span>
      </button>
      <p className="text-muted-foreground mt-0.5 text-xs">{copy.noiseIntro}</p>
      {open && items.length > 0 && (
        <ItemList items={items} onUnassign={onUnassign} />
      )}
    </div>
  );
}
