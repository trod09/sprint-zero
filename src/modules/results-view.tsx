"use client";

/**
 * Renders the module-specific part of a results page. Adding a playable
 * module means adding its results view here.
 */
import type { BaseCase } from "@/core/case-engine";
import type { ScoreResult } from "@/core/scoring";

import { BacklogResults } from "./backlog/components/backlog-results";
import { backlogCaseSchema } from "./backlog/schema";
import { backlogResultSchema } from "./backlog/scoring";

export function ModuleResults({
  result,
  revealedCase,
}: {
  result: ScoreResult;
  revealedCase: BaseCase;
}) {
  switch (revealedCase.moduleId) {
    case "backlog": {
      const caseData = backlogCaseSchema.safeParse(revealedCase);
      const parsed = backlogResultSchema.safeParse(result);
      if (!caseData.success || !parsed.success) return null;
      return (
        <BacklogResults caseData={caseData.data} report={parsed.data.report} />
      );
    }
    default:
      return null;
  }
}
