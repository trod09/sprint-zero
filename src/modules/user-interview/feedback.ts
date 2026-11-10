/**
 * What the AI coach is told about an interview: every question with how
 * code read it and what it uncovered, the findings with their status, and
 * the learner's summary in the untrusted block.
 */
import type { FeedbackContext } from "@/core/case-engine";

import type { InterviewAnswer, InterviewCase } from "./schema";
import type { InterviewResult } from "./scoring";

export function buildInterviewFeedbackContext(
  caseData: InterviewCase,
  answer: InterviewAnswer,
  result: InterviewResult,
): FeedbackContext {
  const { hidden } = caseData;
  const findingText = new Map(caseData.findings.map((f) => [f.id, f.text]));
  const findingTruth = new Map(hidden.findings.map((f) => [f.id, f]));
  const topic = new Map(hidden.topics.map((t) => [t.id, t]));

  return {
    analysis: {
      researchGoal: caseData.researchGoal,
      persona: caseData.persona,
      questionsReadByCode: result.report.turns.map((turn, index) => ({
        number: index + 1,
        form: turn.form,
        leading: turn.leading,
        hypothetical: turn.hypothetical,
        aboutPastBehaviour: turn.pastBehavior,
        topic: turn.topicId ? topic.get(turn.topicId)?.label : "none",
        depthReached: turn.depth,
        uncovered: turn.revealedFindingId
          ? findingText.get(turn.revealedFindingId)
          : null,
        personaReply: turn.reply,
      })),
      findings: result.report.findings.map((finding) => ({
        finding: findingText.get(finding.id),
        supportedByThePersona: finding.supported,
        cameOutInThisInterview: finding.revealed,
        claimedByLearner: finding.claimed,
        why: findingTruth.get(finding.id)?.why,
        questionThatWouldReachIt: finding.supported
          ? topic.get(findingTruth.get(finding.id)?.topicId ?? "")
              ?.exampleQuestion
          : undefined,
      })),
      principle: hidden.principle,
    },
    learnerAnswer: {
      questionsAsked: answer.questions,
      summaryForTheTeam: answer.summary,
    },
  };
}
