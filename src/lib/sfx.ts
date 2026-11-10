"use client";

/**
 * Optional sound effects, synthesized with Web Audio square waves (no audio
 * files). Off by default; the choice is stored in this browser.
 */
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "sprint-zero:sound";

export type Sfx = "click" | "coin" | "star" | "levelup" | "error";

/** Notes as [frequency in Hz, duration in ms]. */
const TUNES: Record<Sfx, readonly (readonly [number, number])[]> = {
  click: [[660, 40]],
  coin: [
    [988, 60],
    [1319, 120],
  ],
  star: [
    [784, 60],
    [1047, 60],
    [1568, 120],
  ],
  levelup: [
    [523, 80],
    [659, 80],
    [784, 80],
    [1047, 200],
  ],
  error: [
    [220, 90],
    [165, 160],
  ],
};

const listeners = new Set<() => void>();
let context: AudioContext | null = null;

export function isSoundOn(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

export function setSoundOn(on: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Storage blocked: sound stays off.
  }
  for (const listener of listeners) listener();
}

export function playSfx(name: Sfx): void {
  if (!isSoundOn()) return;
  try {
    context ??= new AudioContext();
    let time = context.currentTime;
    for (const [frequency, ms] of TUNES[name]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.06, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + ms / 1000);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(time);
      oscillator.stop(time + ms / 1000);
      time += ms / 1000;
    }
  } catch {
    // No audio available: stay silent.
  }
}

/** Whether sound is on, kept in sync across components. Off on the server. */
export function useSoundOn(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    isSoundOn,
    () => false,
  );
}
