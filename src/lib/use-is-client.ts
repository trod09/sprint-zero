import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * False during the server render and hydration, true afterwards. Lets a
 * component read browser-only state (localStorage) without a hydration
 * mismatch: render the server version first, then remount with the real one.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
