"use client";

import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import {
  MOSCOW_BUCKETS,
  RICE_CONFIDENCES,
  RICE_IMPACTS,
  RICE_REACH_SHARES,
  type MoscowBucket,
  type RiceInput,
} from "../planning";
import { selectClassName } from "./ticket-sheet";

type RiceField = keyof RiceInput;

/** Three compact selects for the learner's RICE estimates. */
export function RiceControls({
  ticketId,
  input,
  score,
  onChange,
}: {
  ticketId: string;
  input: RiceInput | undefined;
  score: number | null;
  onChange: (input: RiceInput) => void;
}) {
  const copy = getMessages().backlog.rice;
  const fields: {
    field: RiceField;
    label: string;
    levels: readonly string[];
    size: number;
  }[] = [
    {
      field: "reach",
      label: copy.reach,
      levels: copy.reachLevels,
      size: RICE_REACH_SHARES.length,
    },
    {
      field: "impact",
      label: copy.impact,
      levels: copy.impactLevels,
      size: RICE_IMPACTS.length,
    },
    {
      field: "confidence",
      label: copy.confidence,
      levels: copy.confidenceLevels,
      size: RICE_CONFIDENCES.length,
    },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {fields.map(({ field, label, levels, size }) => (
        <select
          key={field}
          aria-label={`${label}: ${ticketId}`}
          title={label}
          className={cn(selectClassName, "h-7 w-[6.75rem] text-xs")}
          value={input?.[field] ?? ""}
          onChange={(event) => {
            const raw = event.target.value;
            const value = raw === "" ? undefined : Number(raw);
            onChange({
              ...input,
              [field]:
                value !== undefined && value >= 0 && value < size
                  ? value
                  : undefined,
            });
          }}
        >
          <option value="">{label}</option>
          {levels.map((level, index) => (
            <option key={level} value={index}>
              {level}
            </option>
          ))}
        </select>
      ))}
      <span
        className="w-14 text-right font-mono text-xs tabular-nums"
        title={copy.score}
      >
        <span className="sr-only">{copy.score}: </span>
        {score === null ? copy.notScored : score.toLocaleString("en-US")}
      </span>
    </div>
  );
}

const BUCKET_TONES: Record<MoscowBucket, string> = {
  must: "data-[active=true]:bg-brand data-[active=true]:text-brand-foreground",
  should:
    "data-[active=true]:bg-sky-600 data-[active=true]:text-white dark:data-[active=true]:bg-sky-500",
  could:
    "data-[active=true]:bg-foreground/70 data-[active=true]:text-background",
  wont: "data-[active=true]:bg-muted-foreground/30 data-[active=true]:text-foreground",
};

/** A segmented control: one bucket per ticket, click again to clear. */
export function MoscowControls({
  ticketId,
  bucket,
  onChange,
}: {
  ticketId: string;
  bucket: MoscowBucket | undefined;
  onChange: (bucket: MoscowBucket | null) => void;
}) {
  const copy = getMessages().backlog.moscow;
  return (
    <div
      role="group"
      aria-label={copy.label(ticketId)}
      className="bg-muted flex rounded-lg p-0.5"
    >
      {MOSCOW_BUCKETS.map((value) => {
        const active = bucket === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            data-active={active}
            onClick={() => onChange(active ? null : value)}
            className={cn(
              "text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 h-6 rounded-md px-2 text-xs font-medium transition-colors focus-visible:ring-3 focus-visible:outline-none",
              BUCKET_TONES[value],
            )}
          >
            {copy.buckets[value]}
          </button>
        );
      })}
    </div>
  );
}
