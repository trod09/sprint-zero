"use client";

/**
 * Renders the module-specific part of a results page. Adding a playable
 * module means adding its results view here.
 */
import type { BaseCase } from "@/core/case-engine";
import type { ScoreResult } from "@/core/scoring";

import { AbTestResults } from "./ab-test/components/ab-test-results";
import { abTestAnswerSchema, abTestCaseSchema } from "./ab-test/schema";
import { abTestResultSchema } from "./ab-test/scoring";
import { BacklogResults } from "./backlog/components/backlog-results";
import { backlogCaseSchema } from "./backlog/schema";
import { backlogResultSchema } from "./backlog/scoring";
import { MetricDropResults } from "./metric-drop/components/metric-drop-results";
import {
  metricDropAnswerSchema,
  metricDropCaseSchema,
} from "./metric-drop/schema";
import { metricDropResultSchema } from "./metric-drop/scoring";

export function ModuleResults({
  result,
  revealedCase,
  answer,
}: {
  result: ScoreResult;
  revealedCase: BaseCase;
  /** The stored answer, as submitted. */
  answer: unknown;
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
    case "metric-drop": {
      const caseData = metricDropCaseSchema.safeParse(revealedCase);
      const parsed = metricDropResultSchema.safeParse(result);
      if (!caseData.success || !parsed.success) return null;
      const stored = metricDropAnswerSchema.safeParse(answer);
      return (
        <MetricDropResults
          caseData={caseData.data}
          report={parsed.data.report}
          answer={stored.success ? stored.data : null}
        />
      );
    }
    case "ab-test": {
      const caseData = abTestCaseSchema.safeParse(revealedCase);
      const parsed = abTestResultSchema.safeParse(result);
      if (!caseData.success || !parsed.success) return null;
      const stored = abTestAnswerSchema.safeParse(answer);
      return (
        <AbTestResults
          caseData={caseData.data}
          report={parsed.data.report}
          answer={stored.success ? stored.data : null}
        />
      );
    }
    default:
      return null;
  }
}
