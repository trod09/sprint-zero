/**
 * Persistence contract for attempts.
 *
 * Phase 1 implements it on top of `localStorage`; Phase 2 will implement the
 * same interface with Supabase. Every method is async for that reason.
 */
import { z } from "zod";

import { scoreResultSchema } from "@/core/scoring";

export const ATTEMPT_SCHEMA_VERSION = 1;

export const attemptSchema = z.object({
  schemaVersion: z.literal(ATTEMPT_SCHEMA_VERSION),
  id: z.string().min(1),
  caseId: z.string().min(1),
  moduleId: z.string().min(1),
  /** ISO 8601 timestamps. */
  startedAt: z.iso.datetime(),
  submittedAt: z.iso.datetime(),
  /** The answer as submitted; its shape is owned by the module. */
  answer: z.unknown(),
  /** Official deterministic score. Modules may attach extra fields. */
  result: z.looseObject(scoreResultSchema.shape),
  /** Qualitative AI feedback, when it was generated. Never affects `result`. */
  aiFeedback: z.unknown().optional(),
});
export type Attempt = z.infer<typeof attemptSchema>;

export interface AttemptFilter {
  moduleId?: string;
  caseId?: string;
}

export interface AttemptStore {
  /** Inserts the attempt, or replaces the one with the same id. */
  saveAttempt(attempt: Attempt): Promise<void>;
  getAttempt(id: string): Promise<Attempt | null>;
  /** Newest first (by `submittedAt`). */
  listAttempts(filter?: AttemptFilter): Promise<Attempt[]>;
  /** Highest official score for a case, or `null` if never attempted. */
  getBestScore(caseId: string): Promise<number | null>;
  deleteAttempt(id: string): Promise<void>;
  clear(): Promise<void>;
}

export class StorageError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "StorageError";
  }
}
