/**
 * Names a case for lists, including generated cases, which have no stored
 * summary: their id carries the module, industry, level and seed.
 */
import type { CaseSummary } from "@/components/case-library";
import { parseGeneratedCaseId, type Difficulty } from "@/core/case-engine";
import { getMessages } from "@/i18n";
import { getModuleMeta } from "@/modules/catalog";

export interface CaseLabel {
  title: string;
  moduleId: string;
  moduleName: string;
  difficulty: Difficulty;
}

export function caseLabel(
  caseId: string,
  summaries: ReadonlyMap<string, CaseSummary>,
): CaseLabel | null {
  const summary = summaries.get(caseId);
  if (summary) return summary;
  const generated = parseGeneratedCaseId(caseId);
  const meta = generated ? getModuleMeta(generated.moduleId) : undefined;
  if (!generated || !meta) return null;
  const messages = getMessages();
  return {
    title: `${messages.generate.generatedLabel(
      meta.name,
      messages.generate.industries[generated.industry],
      messages.difficulty[generated.difficulty],
    )} · #${generated.seed}`,
    moduleId: meta.id,
    moduleName: meta.name,
    difficulty: generated.difficulty,
  };
}
