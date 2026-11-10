"use client";

import { createContext, useContext } from "react";

import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import type { PublicUxCritiqueCase, RegionProps } from "../../schema";

export type MarkerTone = "found" | "missed" | "false_alarm" | "neutral";

export interface RegionContextValue {
  /** "use": the screen works; "mark": clicks select regions; "review": read-only with markers. */
  mode: "use" | "mark" | "review";
  selected: string | null;
  onSelect: (regionId: string) => void;
  /** Findings or results per region. */
  markers: ReadonlyMap<string, { count: number; tone: MarkerTone }>;
  labels: ReadonlyMap<string, string>;
}

export const RegionContext = createContext<RegionContextValue>({
  mode: "use",
  selected: null,
  onSelect: () => {},
  markers: new Map(),
  labels: new Map(),
});

const MARKER_TONE: Record<MarkerTone, string> = {
  found: "bg-emerald-600 text-white",
  missed: "bg-red-600 text-white",
  false_alarm: "bg-zinc-500 text-white",
  neutral: "bg-indigo-600 text-white",
};

const OUTLINE_TONE: Record<MarkerTone, string> = {
  found: "outline-emerald-600",
  missed: "outline-red-600",
  false_alarm: "outline-zinc-500",
  neutral: "outline-indigo-600",
};

/** A part of the mock screen that can be marked. */
export function Region({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  const context = useContext(RegionContext);
  const copy = getMessages().ux.frame;
  const marker = context.markers.get(id);
  const label = context.labels.get(id) ?? id;
  const selected = context.selected === id;

  return (
    <div
      className={cn(
        "relative rounded-md outline-offset-2",
        marker && `outline-2 ${OUTLINE_TONE[marker.tone]}`,
        selected && "outline-2 outline-indigo-600 outline-dashed",
        className,
      )}
    >
      {children}
      {context.mode === "mark" && (
        <button
          type="button"
          aria-label={copy.mark(label)}
          aria-pressed={selected}
          onClick={() => context.onSelect(id)}
          className="absolute inset-0 z-10 cursor-crosshair rounded-md hover:bg-indigo-500/10 hover:outline-2 hover:outline-indigo-500 focus-visible:bg-indigo-500/10 focus-visible:outline-2 focus-visible:outline-indigo-600"
        />
      )}
      {marker && marker.count > 0 && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute -top-2 -right-2 z-20 flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
            MARKER_TONE[marker.tone],
          )}
        >
          {marker.count}
        </span>
      )}
    </div>
  );
}

export type Regions = PublicUxCritiqueCase["screen"]["regions"];

/** Typed accessors over a region's free-form props. */
export function regionProps(regions: Regions, id: string) {
  const props: RegionProps =
    regions.find((region) => region.id === id)?.props ?? {};
  return {
    has: regions.some((region) => region.id === id),
    text: (key: string, fallback = "") =>
      typeof props[key] === "string" ? (props[key] as string) : fallback,
    list: (key: string): string[] =>
      Array.isArray(props[key])
        ? (props[key] as unknown[]).filter(
            (item): item is string => typeof item === "string",
          )
        : [],
    pairs: (key: string): [string, string][] =>
      Array.isArray(props[key])
        ? (props[key] as unknown[]).filter(
            (item): item is [string, string] =>
              Array.isArray(item) &&
              item.length === 2 &&
              item.every((part) => typeof part === "string"),
          )
        : [],
    flag: (key: string) => props[key] === true,
    number: (key: string, fallback = 0) =>
      typeof props[key] === "number" ? (props[key] as number) : fallback,
  };
}

/** Body text in a normal or a deliberately faint tone. */
export function noteClass(tone: string): string {
  return tone === "faint"
    ? "text-[11px] leading-snug text-zinc-300"
    : "text-sm leading-relaxed text-zinc-600";
}

/** Mock controls are reachable by keyboard only while the screen is in use. */
export function useMockTabIndex(): number {
  return useContext(RegionContext).mode === "use" ? 0 : -1;
}
