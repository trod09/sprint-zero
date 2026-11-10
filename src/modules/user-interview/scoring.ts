/**
 * Deterministic score of an interview.
 *
 * - Insights: supported findings the persona actually told the learner.
 * - Questions: how many were open and neutral.
 * - Bias: leading and hypothetical questions cost points.
 * - Synthesis: claiming what the interview showed, and nothing else.
 */
import { z } from "zod";

import { buildScoreResult, safeRatio, scoreResultSchema } from "@/core/scoring";

import { runInterview } from "./conversation";
import type { InterviewAnswer, InterviewCase } from "./schema";

export const INTERVIEW_WEIGHTS = {
  insights: 40,
  questions: 25,
  bias: 15,
  synthesis: 20,
} as const;

const QUALITY_POINTS = { good: 1, ok: 0.5, poor: 0, none: 0 } as const;
/** Three biased questions in an interview are enough to lose the criterion. */
const BIAS_LIMIT = 3;

export const interviewReportSchema = z.object({
  turns: z.array(
    z.object({
      question: z.string(),
      reply: z.string(),
      form: z.enum(["open", "closed", "smalltalk"]),
      quality: z.enum(["good", "ok", "poor", "none"]),
      leading: z.boolean(),
      hypothetical: z.boolean(),
      pastBehavior: z.boolean(),
      double: z.boolean(),
      topicId: z.string().nullable(),
      depth: z.string(),
      revealedFindingId: z.string().nullable(),
    }),
  ),
  findings: z.array(
    z.object({
      id: z.string(),
      supported: z.boolean(),
      revealed: z.boolean(),
      claimed: z.boolean(),
    }),
  ),
});
export type InterviewReport = z.infer<typeof interviewReportSchema>;

export const interviewResultSchema = scoreResultSchema.extend({
  report: interviewReportSchema,
});
export type InterviewResult = ReturnType<typeof scoreInterview>;

export function scoreInterview(
  caseData: InterviewCase,
  answer: InterviewAnswer,
) {
  const turns = runInterview(caseData, answer.questions);
  const revealed = new Set(
    turns.flatMap((turn) =>
      turn.revealedFindingId ? [turn.revealedFindingId] : [],
    ),
  );
  const claimed = new Set(answer.findingIds);
  const supported = caseData.hidden.findings.filter((f) => f.supported);

  const asked = turns.filter((turn) => turn.analysis.quality !== "none");
  const qualityPoints = asked.reduce(
    (total, turn) => total + QUALITY_POINTS[turn.analysis.quality],
    0,
  );
  const biased = asked.filter(
    (turn) => turn.analysis.leading || turn.analysis.hypothetical,
  ).length;

  // A claim counts when the interview showed it; a claim it did not show,
  // or could not show, counts against.
  let synthesis = 0;
  let unsupportedClaims = 0;
  for (const finding of caseData.hidden.findings) {
    if (!claimed.has(finding.id)) continue;
    if (finding.supported && revealed.has(finding.id)) synthesis += 1;
    else if (!finding.supported) unsupportedClaims += 1;
  }

  const report: InterviewReport = {
    turns: turns.map((turn) => ({
      question: turn.question,
      reply: turn.reply,
      form: turn.analysis.form,
      quality: turn.analysis.quality,
      leading: turn.analysis.leading,
      hypothetical: turn.analysis.hypothetical,
      pastBehavior: turn.analysis.pastBehavior,
      double: turn.analysis.double,
      topicId: turn.topicId,
      depth: turn.depth,
      revealedFindingId: turn.revealedFindingId,
    })),
    findings: caseData.hidden.findings.map((finding) => ({
      id: finding.id,
      supported: finding.supported,
      revealed: revealed.has(finding.id),
      claimed: claimed.has(finding.id),
    })),
  };

  const score = buildScoreResult([
    {
      id: "insights",
      label: "Insights uncovered",
      weight: INTERVIEW_WEIGHTS.insights,
      ratio: safeRatio(revealed.size, supported.length, 0),
      detail: `${revealed.size} of ${supported.length} things worth learning came out in the interview`,
    },
    {
      id: "questions",
      label: "Question quality",
      weight: INTERVIEW_WEIGHTS.questions,
      ratio: safeRatio(qualityPoints, asked.length, 0),
      detail: `${asked.filter((t) => t.analysis.quality === "good").length} of ${asked.length} questions were open and neutral`,
    },
    {
      id: "bias",
      label: "Bias avoided",
      weight: INTERVIEW_WEIGHTS.bias,
      ratio:
        asked.length === 0 ? 0 : 1 - Math.min(biased, BIAS_LIMIT) / BIAS_LIMIT,
      detail:
        asked.length === 0
          ? "No questions asked"
          : `${biased} leading or hypothetical question${biased === 1 ? "" : "s"}`,
    },
    {
      id: "synthesis",
      label: "Synthesis",
      weight: INTERVIEW_WEIGHTS.synthesis,
      ratio: safeRatio(
        Math.max(0, synthesis - unsupportedClaims),
        supported.length,
        0,
      ),
      detail: `${synthesis} finding${synthesis === 1 ? "" : "s"} claimed with evidence, ${unsupportedClaims} the interview does not support`,
    },
  ]);
  return { ...score, report };
}
