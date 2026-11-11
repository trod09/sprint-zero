"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVertical, Headset, MessageSquareText, Star } from "lucide-react";

import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import { NOISE, UNSORTED, type Target } from "../board";
import type { Cluster, FeedbackItem, Source } from "../schema";
import { NativeSelect } from "@/components/ui/native-select";

export const itemDragId = (id: string) => `item:${id}`;
export const itemIdOfDrag = (dragId: string) =>
  dragId.startsWith("item:") ? dragId.slice(5) : null;

const SOURCE_ICON: Record<Source, typeof Star> = {
  app_review: Star,
  support: Headset,
  nps: MessageSquareText,
};

export function ItemMeta({ item }: { item: FeedbackItem }) {
  const copy = getMessages().triage;
  const Icon = SOURCE_ICON[item.source];
  return (
    <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
      <span className="font-mono">{item.id}</span>
      <span className="inline-flex items-center gap-1">
        <Icon className="size-3" aria-hidden="true" />
        {copy.sources[item.source]}
      </span>
      {item.rating !== undefined && (
        <span role="img" aria-label={copy.inbox.stars(item.rating)}>
          <span aria-hidden="true">
            {"★".repeat(item.rating)}
            <span className="opacity-30">{"★".repeat(5 - item.rating)}</span>
          </span>
        </span>
      )}
      {item.npsScore !== undefined && (
        <span>{copy.inbox.nps(item.npsScore)}</span>
      )}
      {item.plan && <span>{item.plan}</span>}
      <span>{item.date}</span>
    </span>
  );
}

export function FeedbackCard({
  item,
  target,
  clusters,
  selected,
  onSelect,
  onMove,
}: {
  item: FeedbackItem;
  target: Target;
  clusters: readonly Cluster[];
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onMove: (target: Target) => void;
}) {
  const copy = getMessages().triage.inbox;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } =
    useDraggable({ id: itemDragId(item.id) });
  const clusterName = clusters.find((c) => c.id === target)?.name;

  return (
    <li
      ref={setNodeRef}
      className={cn(
        "bg-card flex gap-2 px-2 py-2.5 transition-opacity",
        isDragging && "opacity-40",
        selected && "bg-brand/5",
      )}
    >
      <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={(event) => onSelect(event.target.checked)}
          aria-label={copy.select(item.id)}
          className="accent-brand"
        />
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={copy.dragHandle(item.id)}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 flex size-6 cursor-grab touch-none items-center justify-center rounded-md focus-visible:ring-3 focus-visible:outline-none active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <ItemMeta item={item} />
        <p className="text-sm leading-relaxed text-pretty">{item.text}</p>
        {target !== UNSORTED && (
          <p className="text-brand text-xs">
            {target === NOISE
              ? copy.inNoise
              : copy.inCluster(clusterName ?? "")}
          </p>
        )}
      </div>
      <NativeSelect
        size="sm"
        wrapperClassName="max-w-40 shrink-0 self-start"
        aria-label={copy.moveItem(item.id)}
        value={target}
        onChange={(event) => onMove(event.target.value)}
      >
        <option value={UNSORTED}>{copy.unsortedOption}</option>
        {clusters.map((cluster) => (
          <option key={cluster.id} value={cluster.id}>
            {cluster.name || "Untitled"}
          </option>
        ))}
        <option value={NOISE}>{copy.noiseOption}</option>
      </NativeSelect>
    </li>
  );
}
