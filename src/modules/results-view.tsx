"use client";

/**
 * Renders the module-specific part of a results page. Adding a playable
 * module means adding its results view here.
 */
import type { BaseCase } from "@/core/case-engine";
import type { ScoreResult } from "@/core/scoring";

import { PrdResults } from "./prd-writer/components/prd-results";
import { prdAnswerSchema, prdCaseSchema } from "./prd-writer/schema";
import { prdResultSchema } from "./prd-writer/scoring";
import { QuickResults } from "./quick-cases/components/quick-results";
import { quickCaseSchema } from "./quick-cases/schema";
import { quickResultSchema } from "./quick-cases/scoring";
import { RoadmapResults } from "./roadmap-okrs/components/roadmap-results";
import { roadmapCaseSchema } from "./roadmap-okrs/schema";
import { roadmapResultSchema } from "./roadmap-okrs/scoring";
import { ProductCaseResults } from "./product-case/components/product-case-results";
import {
  productCaseAnswerSchema,
  productCaseSchema,
} from "./product-case/schema";
import { productCaseResultSchema } from "./product-case/scoring";
import { InterviewResults } from "./user-interview/components/interview-results";
import { interviewCaseSchema } from "./user-interview/schema";
import { interviewResultSchema } from "./user-interview/scoring";
import { UxResults } from "./ux-critique/components/ux-results";
import { uxCritiqueCaseSchema } from "./ux-critique/schema";
import { uxResultSchema } from "./ux-critique/scoring";
import { TriageResults } from "./feedback-triage/components/triage-results";
import { feedbackTriageCaseSchema } from "./feedback-triage/schema";
import { triageResultSchema } from "./feedback-triage/scoring";
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
    case "feedback-triage": {
      const caseData = feedbackTriageCaseSchema.safeParse(revealedCase);
      const parsed = triageResultSchema.safeParse(result);
      if (!caseData.success || !parsed.success) return null;
      return (
        <TriageResults caseData={caseData.data} report={parsed.data.report} />
      );
    }
    case "ux-critique": {
      const caseData = uxCritiqueCaseSchema.safeParse(revealedCase);
      const parsed = uxResultSchema.safeParse(result);
      if (!caseData.success || !parsed.success) return null;
      return <UxResults caseData={caseData.data} report={parsed.data.report} />;
    }
    case "product-case": {
      const caseData = productCaseSchema.safeParse(revealedCase);
      const parsed = productCaseResultSchema.safeParse(result);
      if (!caseData.success || !parsed.success) return null;
      const stored = productCaseAnswerSchema.safeParse(answer);
      return (
        <ProductCaseResults
          caseData={caseData.data}
          report={parsed.data.report}
          answer={stored.success ? stored.data : null}
        />
      );
    }
    case "prd-writer": {
      const caseData = prdCaseSchema.safeParse(revealedCase);
      const parsed = prdResultSchema.safeParse(result);
      if (!caseData.success || !parsed.success) return null;
      const stored = prdAnswerSchema.safeParse(answer);
      return (
        <PrdResults
          caseData={caseData.data}
          report={parsed.data.report}
          answer={stored.success ? stored.data : null}
        />
      );
    }
    case "roadmap-okrs": {
      const caseData = roadmapCaseSchema.safeParse(revealedCase);
      const parsed = roadmapResultSchema.safeParse(result);
      if (!caseData.success || !parsed.success) return null;
      return (
        <RoadmapResults caseData={caseData.data} report={parsed.data.report} />
      );
    }
    case "quick-cases": {
      const caseData = quickCaseSchema.safeParse(revealedCase);
      const parsed = quickResultSchema.safeParse(result);
      if (!caseData.success || !parsed.success) return null;
      return (
        <QuickResults caseData={caseData.data} report={parsed.data.report} />
      );
    }
    case "user-interview": {
      const caseData = interviewCaseSchema.safeParse(revealedCase);
      const parsed = interviewResultSchema.safeParse(result);
      if (!caseData.success || !parsed.success) return null;
      return (
        <InterviewResults
          caseData={caseData.data}
          report={parsed.data.report}
        />
      );
    }
    default:
      return null;
  }
}
