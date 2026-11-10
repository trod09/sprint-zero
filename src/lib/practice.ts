/**
 * A fresh case to practise on: same module and level, a new seed, so the
 * learner meets the same kind of problem with different numbers.
 */
import {
  generatedCaseId,
  INDUSTRY_KEYS,
  MAX_SEED,
  parseGeneratedCaseId,
  type Difficulty,
  type IndustryKey,
} from "@/core/case-engine";
import { INDUSTRY_LABEL } from "@/modules/shared/industry";

/** A fresh seed. It only picks which case to build; the case is deterministic. */
export function randomSeed(): number {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return (values[0] % MAX_SEED) + 1;
}

/** The industry key of a case, from its id or its company's industry label. */
export function industryOf(caseId: string, industryLabel: string): IndustryKey {
  const generated = parseGeneratedCaseId(caseId);
  if (generated) return generated.industry;
  const match = INDUSTRY_KEYS.find(
    (key) => INDUSTRY_LABEL[key].toLowerCase() === industryLabel.toLowerCase(),
  );
  return match ?? INDUSTRY_KEYS[caseId.length % INDUSTRY_KEYS.length];
}

export function freshCaseId(
  source: {
    caseId: string;
    moduleId: string;
    difficulty: Difficulty;
    industry: string;
  },
  seed: number,
): string {
  return generatedCaseId(source.moduleId, {
    seed,
    difficulty: source.difficulty,
    industry: industryOf(source.caseId, source.industry),
  });
}
