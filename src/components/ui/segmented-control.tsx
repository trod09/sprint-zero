"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
}

/**
 * A choice between a few modes or views, styled like tabs. Use it when the
 * buttons switch what one area shows; use `Tabs` only when each option has
 * its own panel. Arrow keys move and select, as in a radio group.
 */
export function SegmentedControl<T extends string>({
  label,
  value,
  onValueChange,
  options,
  className,
}: {
  /** Accessible name of the group, e.g. "Planning method". */
  label: string;
  value: T;
  onValueChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    const target =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? options.length - 1
          : step === 0
            ? null
            : (current + step + options.length) % options.length;
    if (target === null) return;
    event.preventDefault();
    onValueChange(options[target].value);
    refs.current[target]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "border-frame bg-muted inline-flex h-9 w-fit items-center justify-center rounded-md border-2 p-[3px]",
        className,
      )}
    >
      {options.map((option, index) => {
        const checked = index === current;
        return (
          <button
            key={option.value}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            data-state={checked ? "on" : "off"}
            onClick={() => onValueChange(option.value)}
            onKeyDown={onKeyDown}
            className={cn(
              "font-pixel focus-visible:ring-ring/50 inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-sm px-2 py-0.5 text-sm tracking-wide whitespace-nowrap transition-colors focus-visible:ring-[3px] focus-visible:outline-none",
              checked
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
