"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** A radio or checkbox with a title and a description, as a selectable card. */
export function OptionCard({
  type,
  name,
  checked,
  disabled,
  onChange,
  title,
  description,
  aside,
}: {
  type: "radio" | "checkbox";
  name: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <label
      className={cn(
        "bg-card flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
        "has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-3",
        checked ? "border-primary bg-primary/5" : "hover:border-foreground/30",
        disabled && !checked && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        disabled={disabled && !checked}
        onChange={onChange}
        className="accent-primary mt-1 size-4 shrink-0"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        {description && (
          <span className="text-muted-foreground mt-0.5 block text-sm">
            {description}
          </span>
        )}
      </span>
      {aside}
    </label>
  );
}
