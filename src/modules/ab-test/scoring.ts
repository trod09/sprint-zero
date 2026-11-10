/**
 * Deterministic scoring of an A/B test readout.
 *
 * MASTER_PROMPT (Hito 2.3): the deterministic score covers the trap detected
 * and the right decision; the AI coach comments on the justification. Weights:
 * decision 40, problems flagged 35, read of the real effect 25.
 */
import { z } from "zod";

import { buildScoreResult, clamp01, scoreResultSchema } from "@/core/scoring";

import {
  decisionSchema,
  effectReadSchema,
  ISSUES,
  issueSchema,
  type AbTestAnswer,
  type AbTestCase,
  type Decision,
  type EffectRead,
  type Issue,
} from "./schema";

export const AB_TEST_WEIGHTS = {
  decision: 40,
  issues: 35,
  effect: 25,
} as const;

/** Each problem flagged that is not there costs this share of the criterion. */
export const FALSE_ALARM_PENALTY = 0.34;

export const ISSUE_STATUSES = [
  "found",
  "missed",
  "false_alarm",
  "acceptable",
  "clear",
] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const abTestReportSchema = z.object({
  truth: z.object({
    issues: z.array(issueSchema),
    acceptableIssues: z.array(issueSchema),
    effect: effectReadSchema,
    decision: decisionSchema,
    summary: z.string(),
    explanation: z.string(),
    recommendation: z.string(),
    issueNotes: z.partialRecord(issueSchema, z.string()),
  }),
  issues: z.array(
    z.object({ issue: issueSchema, status: z.enum(ISSUE_STATUSES) }),
  ),
  decisionCredit: z.number(),
  effectCredit: z.number(),
});
export type AbTestReport = z.infer<typeof abTestReportSchema>;

export const abTestResultSchema = scoreResultSchema.extend({
  report: abTestReportSchema,
});
export type AbTestResult = ReturnType<typeof scoreAbTestAnswer>;

function credit<T>(answer: T, right: T, partial: readonly T[]): number {
  if (answer === right) return 1;
  return partial.includes(answer) ? 0.5 : 0;
}

export function issueStatus(
  issue: Issue,
  flagged: readonly Issue[],
  caseData: AbTestCase,
): IssueStatus {
  const present = caseData.hidden.issues.includes(issue);
  const isFlagged = flagged.includes(issue);
  if (present) return isFlagged ? "found" : "missed";
  if (!isFlagged) return "clear";
  return caseData.hidden.acceptableIssues.includes(issue)
    ? "acceptable"
    : "false_alarm";
}

const DECISION_WORDS: Record<Decision, string> = {
  ship: "ship",
  iterate: "iterate",
  kill: "kill",
};
const EFFECT_WORDS: Record<EffectRead, string> = {
  improves: "a real improvement",
  no_effect: "no real effect",
  harms: "real harm",
  inconclusive: "impossible to tell from this data",
};
const ISSUE_WORDS: Record<Issue, string> = {
  srm: "sample ratio mismatch",
  novelty: "novelty effect",
  simpson: "Simpson's paradox",
  guardrail: "guardrail breach",
  underpowered: "not enough data",
};

const list = (issues: readonly Issue[]) =>
  issues.map((issue) => ISSUE_WORDS[issue]).join(", ");

export function scoreAbTestAnswer(caseData: AbTestCase, answer: AbTestAnswer) {
  const { hidden } = caseData;
  const statuses = ISSUES.map((issue) => ({
    issue,
    status: issueStatus(issue, answer.issues, caseData),
  }));
  const found = statuses.filter((s) => s.status === "found").length;
  const missed = statuses
    .filter((s) => s.status === "missed")
    .map((s) => s.issue);
  const falseAlarms = statuses
    .filter((s) => s.status === "false_alarm")
    .map((s) => s.issue);
  const detection =
    hidden.issues.length === 0 ? 1 : found / hidden.issues.length;
  const issuesRatio = clamp01(
    detection - FALSE_ALARM_PENALTY * falseAlarms.length,
  );

  const decisionCredit = credit(
    answer.decision,
    hidden.decision,
    hidden.partialDecisions,
  );
  const effectCredit = credit(
    answer.effect,
    hidden.effect,
    hidden.partialEffects,
  );

  const issuesDetail = (() => {
    const parts: string[] = [];
    if (hidden.issues.length === 0) {
      parts.push("The readout was clean.");
    } else if (missed.length === 0) {
      parts.push(`You caught ${list(hidden.issues)}.`);
    } else {
      parts.push(`You missed ${list(missed)}.`);
    }
    if (falseAlarms.length > 0) {
      parts.push(`False alarm: ${list(falseAlarms)}.`);
    }
    return parts.join(" ");
  })();

  const result = buildScoreResult([
    {
      id: "decision",
      label: "Decision",
      weight: AB_TEST_WEIGHTS.decision,
      ratio: decisionCredit,
      detail:
        decisionCredit === 1
          ? `Right call: ${DECISION_WORDS[hidden.decision]}.`
          : decisionCredit > 0
            ? `Defensible, but the best call was ${DECISION_WORDS[hidden.decision]}.`
            : `The right call was ${DECISION_WORDS[hidden.decision]}, not ${DECISION_WORDS[answer.decision]}.`,
    },
    {
      id: "issues",
      label: "Problems detected",
      weight: AB_TEST_WEIGHTS.issues,
      ratio: issuesRatio,
      detail: issuesDetail,
    },
    {
      id: "effect",
      label: "Real effect",
      weight: AB_TEST_WEIGHTS.effect,
      ratio: effectCredit,
      detail:
        effectCredit === 1
          ? `Right: the change has ${EFFECT_WORDS[hidden.effect]}.`
          : `The change has ${EFFECT_WORDS[hidden.effect]}; you read ${EFFECT_WORDS[answer.effect]}.`,
    },
  ]);

  const report: AbTestReport = {
    truth: {
      issues: hidden.issues,
      acceptableIssues: hidden.acceptableIssues,
      effect: hidden.effect,
      decision: hidden.decision,
      summary: hidden.summary,
      explanation: hidden.explanation,
      recommendation: hidden.recommendation,
      issueNotes: hidden.issueNotes,
    },
    issues: statuses,
    decisionCredit,
    effectCredit,
  };
  return { ...result, report };
}
