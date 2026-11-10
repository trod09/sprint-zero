"use client";

/**
 * Which case the player opened last, for "Jump back in", and whether it has
 * a draft. Drafts are found by their key pattern, shared by every module:
 * `sprint-zero:<module>-draft:v<n>:<caseId>`.
 */
import { z } from "zod";

const STORAGE_KEY = "sprint-zero:last-case";
const DRAFT_KEY = /^sprint-zero:[a-z-]+-draft:v\d+:(.+)$/;

const lastCaseSchema = z.object({
  caseId: z.string().min(1).max(120),
  openedAt: z.iso.datetime(),
});
export type LastCase = z.infer<typeof lastCaseSchema>;

export function recordLastCase(caseId: string): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ caseId, openedAt: new Date().toISOString() }),
    );
  } catch {
    // Storage blocked: "Jump back in" falls back to a suggestion.
  }
}

export function readLastCase(): LastCase | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = lastCaseSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Case ids with a draft in progress. */
export function casesWithDrafts(): Set<string> {
  const ids = new Set<string>();
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const match = DRAFT_KEY.exec(window.localStorage.key(index) ?? "");
      if (match) ids.add(match[1]);
    }
  } catch {
    // Storage blocked: no drafts.
  }
  return ids;
}
