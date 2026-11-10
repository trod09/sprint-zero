/**
 * Server-side access to cases. The only door through which case data leaves
 * the server: public views before submitting, full cases after.
 */
import "server-only";

import type { CaseRecord, ModuleRegistry } from "./registry";
import { parseGeneratedCaseId, type PublicBaseCase } from "./types";

export interface CaseRepository {
  /** Public views of a module's cases. Unknown modules yield an empty list. */
  listPublicCases(moduleId: string): Promise<PublicBaseCase[]>;
  getPublicCase(caseId: string): Promise<PublicBaseCase | null>;
  /** Server-internal: gives access to scoring and ground truth. */
  getCaseRecord(caseId: string): Promise<CaseRecord | null>;
}

export function createCaseRepository(registry: ModuleRegistry): CaseRepository {
  let index: Promise<Map<string, CaseRecord>> | undefined;

  const loadIndex = (): Promise<Map<string, CaseRecord>> => {
    index ??= (async () => {
      const byId = new Map<string, CaseRecord>();
      for (const registered of registry.list()) {
        for (const record of await registered.loadCases()) {
          const existing = byId.get(record.id);
          if (existing) {
            throw new Error(
              `Case id "${record.id}" is used by both "${existing.moduleId}" and "${record.moduleId}"`,
            );
          }
          byId.set(record.id, record);
        }
      }
      return byId;
    })();
    return index;
  };

  /** Rebuilds a generated case from the parameters in its id. */
  const generatedRecord = (caseId: string): CaseRecord | null => {
    const params = parseGeneratedCaseId(caseId);
    if (!params) return null;
    const { moduleId, ...rest } = params;
    return registry.get(moduleId)?.generateCase(rest) ?? null;
  };

  return {
    async listPublicCases(moduleId) {
      const registered = registry.get(moduleId);
      if (!registered) return [];
      const records = await registered.loadCases();
      return records.map((record) => record.publicCase);
    },
    async getPublicCase(caseId) {
      return (
        (await loadIndex()).get(caseId)?.publicCase ??
        generatedRecord(caseId)?.publicCase ??
        null
      );
    },
    async getCaseRecord(caseId) {
      return (await loadIndex()).get(caseId) ?? generatedRecord(caseId);
    },
  };
}
