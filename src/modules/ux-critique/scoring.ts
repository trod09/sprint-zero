/**
 * Deterministic scoring of a UX critique.
 *
 * MASTER_PROMPT (Hito 2.7): problems found and false positives. A planted
 * problem is found when a finding points at its region: full credit with the
 * right kind of problem, half with another kind. Findings on clean regions
 * are false alarms. Weights: problems found 70, precision 30. The written
 * notes are for the AI coach.
 */
import { z } from "zod";

import { buildScoreResult, clamp01, scoreResultSchema } from "@/core/scoring";

import {
  issueTypeSchema,
  type UxCritiqueAnswer,
  type UxCritiqueCase,
} from "./schema";

export const UX_WEIGHTS = { found: 70, precision: 30 } as const;
export const WRONG_TYPE_CREDIT = 0.5;
/** Each false alarm costs this share of the precision criterion. */
export const FALSE_ALARM_PENALTY = 0.25;

export const uxReportSchema = z.object({
  issues: z.array(
    z.object({
      regionId: z.string(),
      regionLabel: z.string(),
      type: issueTypeSchema,
      explanation: z.string(),
      fix: z.string(),
      outcome: z.enum(["found", "wrong_type", "missed"]),
      /** The kind of problem the learner named, when they marked the region. */
      learnerType: issueTypeSchema.nullable(),
    }),
  ),
  falseAlarms: z.array(
    z.object({
      regionId: z.string(),
      regionLabel: z.string(),
      type: issueTypeSchema,
    }),
  ),
  principle: z.string(),
});
export type UxReport = z.infer<typeof uxReportSchema>;

export const uxResultSchema = scoreResultSchema.extend({
  report: uxReportSchema,
});
export type UxResult = ReturnType<typeof scoreUxAnswer>;

export function scoreUxAnswer(
  caseData: UxCritiqueCase,
  answer: UxCritiqueAnswer,
) {
  const labelOf = new Map(
    caseData.screen.regions.map((region) => [region.id, region.label]),
  );
  const flawedRegions = new Set(
    caseData.hidden.issues.map((issue) => issue.regionId),
  );

  const issues = caseData.hidden.issues.map((issue) => {
    const onRegion = answer.findings.filter(
      (finding) => finding.regionId === issue.regionId,
    );
    const exact = onRegion.find((finding) => finding.type === issue.type);
    const outcome = exact
      ? ("found" as const)
      : onRegion.length > 0
        ? ("wrong_type" as const)
        : ("missed" as const);
    return {
      regionId: issue.regionId,
      regionLabel: labelOf.get(issue.regionId) ?? issue.regionId,
      type: issue.type,
      explanation: issue.explanation,
      fix: issue.fix,
      outcome,
      learnerType: exact?.type ?? onRegion[0]?.type ?? null,
    };
  });

  // One false alarm per clean region and kind, however often it is repeated.
  const seen = new Set<string>();
  const falseAlarms = answer.findings
    .filter((finding) => labelOf.has(finding.regionId))
    .filter((finding) => !flawedRegions.has(finding.regionId))
    .filter((finding) => {
      const key = `${finding.regionId}:${finding.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((finding) => ({
      regionId: finding.regionId,
      regionLabel: labelOf.get(finding.regionId)!,
      type: finding.type,
    }));

  const credit = issues.reduce(
    (sum, issue) =>
      sum +
      (issue.outcome === "found"
        ? 1
        : issue.outcome === "wrong_type"
          ? WRONG_TYPE_CREDIT
          : 0),
    0,
  );
  const foundCount = issues.filter((i) => i.outcome !== "missed").length;
  const total = issues.length;

  const result = buildScoreResult([
    {
      id: "found",
      label: "Problems found",
      weight: UX_WEIGHTS.found,
      ratio: credit / total,
      detail: `You found ${foundCount} of ${total} problems${
        issues.some((i) => i.outcome === "wrong_type")
          ? ", some under the wrong kind"
          : ""
      }.`,
    },
    {
      id: "precision",
      label: "No false alarms",
      weight: UX_WEIGHTS.precision,
      ratio:
        answer.findings.length === 0
          ? 0
          : clamp01(1 - FALSE_ALARM_PENALTY * falseAlarms.length),
      detail:
        answer.findings.length === 0
          ? "You did not mark anything."
          : falseAlarms.length === 0
            ? "Every problem you marked is real."
            : `${falseAlarms.length} of your findings point at parts of the screen that work fine.`,
    },
  ]);

  const report: UxReport = {
    issues,
    falseAlarms,
    principle: caseData.hidden.principle,
  };
  return { ...result, report };
}
