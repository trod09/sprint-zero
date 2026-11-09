/**
 * Persistence layer. UI code depends on `AttemptStore` only, obtained through
 * `getAttemptStore()`, so swapping localStorage for Supabase in Phase 2 is a
 * change in this file.
 */
import {
  createLocalAttemptStore,
  createMemoryStorage,
  type StorageLike,
} from "./local-attempt-store";
import type { AttemptStore } from "./types";

export * from "./types";
export {
  ATTEMPTS_STORAGE_KEY,
  createLocalAttemptStore,
  createMemoryStorage,
  type StorageLike,
} from "./local-attempt-store";

function resolveBrowserStorage(): StorageLike {
  try {
    const storage = window.localStorage;
    // Some privacy modes expose localStorage but throw on write.
    const probe = "sprint-zero:probe";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    // Progress lasts for the session only, but the app keeps working.
    return createMemoryStorage();
  }
}

let browserStore: AttemptStore | undefined;

/** The attempt store for the current browser. Call from Client Components only. */
export function getAttemptStore(): AttemptStore {
  if (typeof window === "undefined") {
    throw new Error(
      "getAttemptStore() is browser-only in Phase 1: progress lives in localStorage.",
    );
  }
  browserStore ??= createLocalAttemptStore(resolveBrowserStorage());
  return browserStore;
}
