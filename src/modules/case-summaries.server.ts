/**
 * Public summaries of every playable case, for lists. Server only: it reads
 * the case repository.
 */
import "server-only";

import type { CaseSummary } from "@/components/case-library";

import { getModuleMeta } from "./catalog";
import { caseRepository, moduleRegistry } from "./registry.server";

export async function listCaseSummaries(
  moduleId?: string,
): Promise<CaseSummary[]> {
  const modules = moduleRegistry
    .list()
    .filter((registered) => !moduleId || registered.meta.id === moduleId);
  const summaries: CaseSummary[] = [];
  for (const registered of modules) {
    const meta = getModuleMeta(registered.meta.id) ?? registered.meta;
    for (const publicCase of await caseRepository.listPublicCases(meta.id)) {
      summaries.push({
        id: publicCase.id,
        moduleId: meta.id,
        moduleName: meta.name,
        title: publicCase.title,
        company: publicCase.company.name,
        industry: publicCase.company.industry,
        difficulty: publicCase.difficulty,
      });
    }
  }
  return summaries;
}
