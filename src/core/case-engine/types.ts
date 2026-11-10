/**
 * Generic contract shared by every simulation module.
 *
 * This file is safe to import from Client Components: it holds types and
 * schemas only, never case data.
 */
import { z } from "zod";

import type { ScoreResult } from "@/core/scoring";

export const SKILLS = [
  "execution",
  "analytics",
  "product_sense",
  "communication",
  "strategy",
] as const;
export const skillSchema = z.enum(SKILLS);
export type Skill = z.infer<typeof skillSchema>;

export const DIFFICULTIES = ["apm", "pm", "senior"] as const;
export const difficultySchema = z.enum(DIFFICULTIES);
export type Difficulty = z.infer<typeof difficultySchema>;

export const companySchema = z.object({
  name: z.string().min(1),
  industry: z.string().min(1),
  stage: z.string().min(1),
  description: z.string().min(1),
});
export type Company = z.infer<typeof companySchema>;

/** Lowercase kebab-case, e.g. "backlog-fintech-01". Unique across all modules. */
export const caseIdSchema = z
  .string()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Case ids are lowercase kebab-case");

export const baseCaseSchema = z.object({
  id: caseIdSchema,
  moduleId: z.string().min(1),
  seed: z.number().int().nonnegative(),
  difficulty: difficultySchema,
  company: companySchema,
  title: z.string().min(1),
  brief: z.string().min(1),
  /**
   * Ground truth (real cause, trap tickets, optimal plan...).
   * NEVER sent to the client before the user submits an answer.
   */
  hidden: z.unknown(),
});
export type BaseCase = z.infer<typeof baseCaseSchema>;

/** The part of a case every client is allowed to see. */
export const publicBaseCaseSchema = baseCaseSchema.omit({ hidden: true });
export type PublicBaseCase = z.infer<typeof publicBaseCaseSchema>;

export const MODULE_STATUSES = [
  "available",
  "in_development",
  "coming_soon",
] as const;
export type ModuleStatus = (typeof MODULE_STATUSES)[number];

/** Serializable description of a module, used by the catalog and the UI. */
export interface ModuleMeta {
  id: string;
  name: string;
  /** One line shown on cards. */
  tagline: string;
  /** A short paragraph shown on the module page. */
  description: string;
  skills: readonly Skill[];
  status: ModuleStatus;
  /** Icon key resolved by the `ModuleIcon` UI component (falls back to a default). */
  icon: string;
  estimatedMinutes?: number;
}

/**
 * A simulation module: schemas plus a pure, deterministic scoring engine.
 *
 * Full module definitions carry ground-truth logic and are registered on the
 * server only (see `src/modules/registry.server.ts`).
 */
export interface SimulationModule<
  TCase extends BaseCase,
  TPublicCase extends PublicBaseCase,
  TAnswer,
  TResult extends ScoreResult,
> {
  meta: ModuleMeta;
  /** Full case, including every `hidden` field. */
  caseSchema: z.ZodType<TCase>;
  /** Case as the client sees it before submitting. Must not contain `hidden` keys. */
  publicCaseSchema: z.ZodType<TPublicCase>;
  answerSchema: z.ZodType<TAnswer>;
  /** Strips ground truth at every nesting level. */
  toPublicCase(caseData: TCase): TPublicCase;
  /** Deterministic and pure: same case + same answer = same result. */
  score(caseData: TCase, answer: TAnswer): TResult;
  /** Fixed rubric the LLM follows when writing qualitative feedback. */
  feedbackRubric: string;
  /**
   * Optional: the facts the LLM needs to write feedback, already digested
   * (ticket titles, what went right and wrong). `learnerAnswer` holds text the
   * learner typed and is passed to the model as untrusted data. Without it the
   * full case and the raw answer are sent.
   */
  feedbackContext?(
    caseData: TCase,
    answer: TAnswer,
    result: TResult,
  ): FeedbackContext;
}

export interface FeedbackContext {
  analysis: unknown;
  learnerAnswer: unknown;
}

// ------------------------------------------------------- generated cases

/** Industries a generated case can be set in. */
export const INDUSTRY_KEYS = [
  "fintech",
  "marketplace",
  "saas",
  "consumer",
] as const;
export const industryKeySchema = z.enum(INDUSTRY_KEYS);
export type IndustryKey = z.infer<typeof industryKeySchema>;

export const MAX_SEED = 999_999;

/** Everything a generator needs: the same parameters always give the same case. */
export const generateParamsSchema = z.object({
  seed: z.number().int().min(1).max(MAX_SEED),
  difficulty: difficultySchema,
  industry: industryKeySchema,
});
export type GenerateParams = z.infer<typeof generateParamsSchema>;

/**
 * Generated cases are not stored: their id carries their parameters, e.g.
 * "gen-backlog-fintech-pm-48213", and the server rebuilds them on demand.
 */
export function generatedCaseId(
  moduleId: string,
  params: GenerateParams,
): string {
  return `gen-${moduleId}-${params.industry}-${params.difficulty}-${params.seed}`;
}

const GENERATED_ID =
  /^gen-([a-z0-9]+(?:-[a-z0-9]+)*)-(fintech|marketplace|saas|consumer)-(apm|pm|senior)-(\d{1,6})$/;

export function parseGeneratedCaseId(
  caseId: string,
): (GenerateParams & { moduleId: string }) | null {
  const match = GENERATED_ID.exec(caseId);
  if (!match) return null;
  const parsed = generateParamsSchema.safeParse({
    seed: Number(match[4]),
    difficulty: match[3],
    industry: match[2],
  });
  return parsed.success ? { moduleId: match[1], ...parsed.data } : null;
}
