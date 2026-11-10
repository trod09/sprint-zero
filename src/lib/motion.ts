"use client";

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia(QUERY).matches;
  } catch {
    return false;
  }
}

/**
 * Counts from `from` to `to` over `duration` ms, in steps like an arcade
 * counter. Jumps straight to `to` for people who prefer reduced motion.
 */
export function useCountUp(
  to: number,
  { from = 0, duration = 900, delay = 0 } = {},
): number {
  const [value, setValue] = useState(from);
  useEffect(() => {
    if (prefersReducedMotion() || duration <= 0) {
      const frame = requestAnimationFrame(() => setValue(to));
      return () => cancelAnimationFrame(frame);
    }
    let frame = 0;
    let start: number | null = null;
    const tick = (time: number) => {
      start ??= time + delay;
      const progress = Math.min(1, Math.max(0, (time - start) / duration));
      // Ease out, then snap to whole numbers for the arcade look.
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(from + (to - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, from, duration, delay]);
  return value;
}
