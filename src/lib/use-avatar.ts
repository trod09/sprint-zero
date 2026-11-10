"use client";

import { useSyncExternalStore } from "react";

import { AVATARS } from "@/components/arcade/sprites";

const STORAGE_KEY = "sprint-zero:avatar";
const listeners = new Set<() => void>();

function readAvatar(): string {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && AVATARS.some((avatar) => avatar.id === stored)) return stored;
  } catch {
    // Storage blocked: use the default avatar.
  }
  return AVATARS[0].id;
}

/** The avatar chosen in this browser, and a setter. */
export function useAvatar(): [string, (id: string) => void] {
  const avatar = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    readAvatar,
    () => AVATARS[0].id,
  );
  const setAvatar = (id: string) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Storage blocked: the choice lasts for this page view.
    }
    for (const listener of listeners) listener();
  };
  return [avatar, setAvatar];
}
