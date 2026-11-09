/**
 * Server-side module registry.
 *
 * `registerModule` erases a module's generic types behind closures, so the core
 * can list cases and score answers for any module without `any`, and so that
 * adding a module never requires touching this folder.
 */
import "server-only";

import { z } from "zod";

import type { ScoreResult } from "@/core/scoring";

import { assertNoHiddenKeys } from "./public-case";
import type {
  BaseCase,
  ModuleMeta,
  PublicBaseCase,
  SimulationModule,
} from "./types";

export type ScoreOutcome =
  { ok: true; result: ScoreResult } | { ok: false; issues: string[] };

/** One validated case, with its ground truth kept inside closures. */
export interface CaseRecord {
  id: string;
  moduleId: string;
  /** Safe to send to the client. */
  publicCase: PublicBaseCase;
  /** Validates the answer against the module schema and scores it. */
  score(rawAnswer: unknown): ScoreOutcome;
  /** Full case including ground truth. Only call after the user has submitted. */
  reveal(): BaseCase;
}

export interface RegisteredModule {
  meta: ModuleMeta;
  feedbackRubric: string;
  /** Loads and validates the module's cases. The result is memoized. */
  loadCases(): Promise<readonly CaseRecord[]>;
}

export interface ModuleRegistration<
  TCase extends BaseCase,
  TPublicCase extends PublicBaseCase,
  TAnswer,
  TResult extends ScoreResult,
> {
  module: SimulationModule<TCase, TPublicCase, TAnswer, TResult>;
  /** Raw case documents (pregenerated JSON). Validated on first load. */
  loadRawCases: () => readonly unknown[] | Promise<readonly unknown[]>;
}

export class CaseValidationError extends Error {
  constructor(moduleId: string, detail: string, options?: ErrorOptions) {
    super(`Invalid case in module "${moduleId}": ${detail}`, options);
    this.name = "CaseValidationError";
  }
}

export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}

function toCaseRecord<
  TCase extends BaseCase,
  TPublicCase extends PublicBaseCase,
  TAnswer,
  TResult extends ScoreResult,
>(
  module: SimulationModule<TCase, TPublicCase, TAnswer, TResult>,
  raw: unknown,
): CaseRecord {
  const moduleId = module.meta.id;
  const parsed = module.caseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new CaseValidationError(
      moduleId,
      formatIssues(parsed.error).join("; "),
    );
  }
  const caseData = parsed.data;
  if (caseData.moduleId !== moduleId) {
    throw new CaseValidationError(
      moduleId,
      `case "${caseData.id}" declares moduleId "${caseData.moduleId}"`,
    );
  }

  // Check the module's own output first so a leaky toPublicCase() fails loudly,
  // then parse it so the public schema acts as an allow-list.
  const stripped = module.toPublicCase(caseData);
  assertNoHiddenKeys(stripped);
  const publicParsed = module.publicCaseSchema.safeParse(stripped);
  if (!publicParsed.success) {
    throw new CaseValidationError(
      moduleId,
      `public view of "${caseData.id}" is invalid: ${formatIssues(publicParsed.error).join("; ")}`,
    );
  }
  const publicCase = publicParsed.data;
  assertNoHiddenKeys(publicCase);

  return {
    id: caseData.id,
    moduleId,
    publicCase,
    score(rawAnswer) {
      const answer = module.answerSchema.safeParse(rawAnswer);
      if (!answer.success) {
        return { ok: false, issues: formatIssues(answer.error) };
      }
      return { ok: true, result: module.score(caseData, answer.data) };
    },
    reveal: () => caseData,
  };
}

export function registerModule<
  TCase extends BaseCase,
  TPublicCase extends PublicBaseCase,
  TAnswer,
  TResult extends ScoreResult,
>(
  registration: ModuleRegistration<TCase, TPublicCase, TAnswer, TResult>,
): RegisteredModule {
  const { module, loadRawCases } = registration;
  let cases: Promise<readonly CaseRecord[]> | undefined;

  return {
    meta: module.meta,
    feedbackRubric: module.feedbackRubric,
    loadCases() {
      cases ??= Promise.resolve(loadRawCases()).then((rawCases) => {
        const records = rawCases.map((raw) => toCaseRecord(module, raw));
        const ids = new Set<string>();
        for (const record of records) {
          if (ids.has(record.id)) {
            throw new CaseValidationError(
              module.meta.id,
              `duplicate case id "${record.id}"`,
            );
          }
          ids.add(record.id);
        }
        return records;
      });
      return cases;
    },
  };
}

export interface ModuleRegistry {
  list(): readonly RegisteredModule[];
  get(moduleId: string): RegisteredModule | undefined;
}

export function createModuleRegistry(
  modules: readonly RegisteredModule[],
): ModuleRegistry {
  const byId = new Map<string, RegisteredModule>();
  for (const registered of modules) {
    if (byId.has(registered.meta.id)) {
      throw new Error(`Module "${registered.meta.id}" is registered twice`);
    }
    byId.set(registered.meta.id, registered);
  }
  return {
    list: () => modules,
    get: (moduleId) => byId.get(moduleId),
  };
}
