/**
 * What the AI coach is told about a Backlog Simulator attempt: the analysis
 * digested by code (titles instead of ids alone, what went right and wrong)
 * and, separately, what the learner wrote, which is untrusted text.
 */
import type { FeedbackContext } from "@/core/case-engine";

import { scenarioAfterEvents } from "./plan";
import type { BacklogAnswer, BacklogCase } from "./schema";
import type { BacklogResult } from "./scoring";

export function buildBacklogFeedbackContext(
  caseData: BacklogCase,
  answer: BacklogAnswer,
  result: BacklogResult,
): FeedbackContext {
  const { report } = result;
  const tickets = scenarioAfterEvents(caseData).tickets;
  const titleOf = new Map(tickets.map((t) => [t.id, `${t.id} "${t.title}"`]));
  const label = (id: string) => titleOf.get(id) ?? id;

  const optimal = new Set(report.optimal.ticketIds);
  const delivered = new Set(report.delivered.ticketIds);

  return {
    analysis: {
      company: `${caseData.company.name} (${caseData.company.industry}, ${caseData.company.stage})`,
      situation: caseData.brief,
      difficulty: caseData.difficulty,
      capacity: {
        initial: report.committed.capacity,
        afterEvents: report.delivered.capacity,
      },
      value: {
        delivered: report.delivered.value,
        optimal: report.optimal.value,
      },
      missedHighValue: report.optimal.ticketIds
        .filter((id) => !delivered.has(id))
        .map(label),
      includedButNotInOptimal: report.delivered.ticketIds
        .filter((id) => !optimal.has(id))
        .map(label),
      notFinishedBecauseOverbooked: report.delivered.spilledIds.map(label),
      criticalTickets: report.criticals.map((entry) => ({
        ticket: label(entry.ticketId),
        filedAsMinor: entry.disguised,
        delivered: entry.delivered,
        why: entry.explanation,
      })),
      traps: report.traps.map((entry) => ({
        ticket: label(entry.ticketId),
        trap: entry.trap,
        outcome: entry.outcome,
        why: entry.explanation,
      })),
      midSprintEvents: report.events.map((entry) => ({
        event: entry.title,
        handling: entry.handling,
        whatGoodLooksLike: entry.guidance,
      })),
      keyInsight: report.keyInsight,
      principle: report.principle,
    },
    learnerAnswer: {
      method: answer.method,
      committedSprint: answer.sprintTicketIds.map(label),
      replannedSprint: (answer.replanTicketIds ?? answer.sprintTicketIds).map(
        label,
      ),
      setAside: Object.entries(answer.marks).map(([id, mark]) =>
        mark.kind === "duplicate"
          ? {
              ticket: label(id),
              markedAsDuplicateOf: label(mark.duplicateOfId),
            }
          : {
              ticket: label(id),
              discardedBecause: mark.reason,
              ...(mark.note ? { note: mark.note } : {}),
            },
      ),
    },
  };
}
