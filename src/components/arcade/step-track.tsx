"use client";

/**
 * The steps of a case as a track of numbered pixel tiles. The current step
 * is highlighted, finished ones carry a check in the world's color, and any
 * step can be opened. Shared by every module that answers step by step.
 */
import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import { PixelIcon } from "./icons";

export interface TrackStep<T extends string> {
  id: T;
  label: string;
  done: boolean;
}

export function StepTrack<T extends string>({
  label,
  steps,
  current,
  onSelect,
}: {
  label: string;
  steps: readonly TrackStep<T>[];
  current: T;
  onSelect: (step: T) => void;
}) {
  const copy = getMessages().arcade.steps;
  return (
    <nav aria-label={label}>
      <ol className="flex flex-wrap items-center gap-y-2">
        {steps.map((step, index) => {
          const active = step.id === current;
          return (
            <li key={step.id} className="flex items-center">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "mx-1 h-0.5 w-4 sm:w-6",
                    steps[index - 1].done ? "" : "bg-frame",
                  )}
                  style={
                    steps[index - 1].done
                      ? { background: "var(--world-ink)" }
                      : undefined
                  }
                />
              )}
              <button
                type="button"
                aria-current={active ? "step" : undefined}
                onClick={() => onSelect(step.id)}
                className={cn(
                  "group focus-visible:ring-ring/50 flex items-center gap-2 rounded-md py-1 pr-2.5 pl-1 text-sm transition-colors focus-visible:ring-3 focus-visible:outline-none",
                  active ? "bg-primary/15" : "hover:bg-muted",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "font-pixel flex size-7 items-center justify-center rounded-sm border-2 text-xs",
                    active
                      ? "bg-primary text-primary-foreground border-frame shadow-pixel-sm"
                      : step.done
                        ? "bg-card"
                        : "bg-muted text-muted-foreground border-frame",
                  )}
                  style={
                    step.done && !active
                      ? {
                          borderColor: "var(--world-ink)",
                          color: "var(--world-ink)",
                        }
                      : undefined
                  }
                >
                  {step.done && !active ? (
                    <PixelIcon name="check" size={12} />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "font-pixel text-xs tracking-wide",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                  {step.done && <span className="sr-only"> ({copy.done})</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
