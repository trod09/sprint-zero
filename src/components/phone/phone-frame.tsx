/**
 * A phone showing the case's product. The device is drawn in the arcade
 * style; the screen is a light, realistic app so the product reads as a
 * product. The app's accent comes from the world color, darkened so white
 * text on it stays readable.
 */
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PhoneFrame({
  label,
  children,
  className,
  time = "9:41",
}: {
  /** Accessible name, e.g. "Preview of the Rosterly app". */
  label: string;
  children: ReactNode;
  className?: string;
  time?: string;
}) {
  return (
    <figure
      aria-label={label}
      className={cn(
        "border-frame shadow-pixel mx-auto w-full max-w-[18rem] rounded-[2rem] border-2 bg-[#0a0e1f] p-2.5",
        className,
      )}
      style={{
        ["--app-accent" as string]:
          "color-mix(in oklab, var(--world, #4c8dff) 55%, #0a0e1f)",
        ["--app-tint" as string]:
          "color-mix(in oklab, var(--world, #4c8dff) 14%, #ffffff)",
      }}
    >
      <div className="relative flex aspect-[9/18.5] flex-col overflow-hidden rounded-[1.5rem] bg-white text-zinc-900 [color-scheme:light]">
        <div
          aria-hidden="true"
          className="flex h-7 shrink-0 items-center justify-between px-5 text-[0.6875rem] font-semibold"
        >
          <span>{time}</span>
          <span className="absolute top-1.5 left-1/2 h-4 w-16 -translate-x-1/2 rounded-full bg-[#0a0e1f]" />
          <span className="flex items-center gap-1">
            <span className="flex items-end gap-px">
              {[4, 6, 8, 10].map((h) => (
                <span
                  key={h}
                  className="w-0.5 bg-zinc-900"
                  style={{ height: h }}
                />
              ))}
            </span>
            <span className="relative ml-1 h-2.5 w-5 rounded-[2px] border border-zinc-900">
              <span className="absolute inset-0.5 right-1.5 rounded-[1px] bg-zinc-900" />
            </span>
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto text-[0.8125rem] leading-snug">
          {children}
        </div>
        <div
          aria-hidden="true"
          className="mx-auto mb-1.5 h-1 w-24 shrink-0 rounded-full bg-zinc-900/80"
        />
      </div>
    </figure>
  );
}

/** The top of an app screen: the company's mark and a title. */
export function AppBar({ company, title }: { company: string; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-2.5">
      <span
        aria-hidden="true"
        className="flex size-7 items-center justify-center rounded-lg text-xs font-bold text-white"
        style={{ background: "var(--app-accent)" }}
      >
        {company.charAt(0)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[0.6875rem] text-zinc-600">{company}</p>
        <p className="truncate text-sm font-semibold">{title}</p>
      </div>
    </div>
  );
}

/** A notification as it lands on the lock screen. */
export function PushNotification({
  app,
  title,
  body,
  when = "now",
}: {
  app: string;
  title: string;
  body: ReactNode;
  when?: string;
}) {
  return (
    <div className="rounded-2xl bg-zinc-100 p-3 shadow-sm">
      <p className="flex items-center justify-between text-[0.6875rem] text-zinc-600">
        <span className="flex items-center gap-1.5 font-semibold uppercase">
          <span
            aria-hidden="true"
            className="inline-block size-3.5 rounded"
            style={{ background: "var(--app-accent)" }}
          />
          {app}
        </span>
        {when}
      </p>
      <p className="mt-1 font-semibold">{title}</p>
      <div className="mt-0.5 text-zinc-700">{body}</div>
    </div>
  );
}

/** Grey text standing in for something the learner has not decided yet. */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-zinc-100 px-1 text-zinc-600 italic">
      {children}
    </span>
  );
}
