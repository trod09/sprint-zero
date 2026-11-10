/**
 * Deterministic scoring of a Backlog Simulator answer.
 *
 * Weights follow MASTER_PROMPT (Hito 1.5): value delivered vs. the optimal
 * sprint 40, critical tickets 20, traps avoided 15, handling of the mid-sprint
 * event 15, capacity respected 10. Every number comes from `buildBacklogReport`.
 */
import { buildScoreResult, scoreResultSchema } from "@/core/scoring";

import {
  backlogReportSchema,
  buildBacklogReport,
  type BacklogReport,
} from "./report";
import type { BacklogAnswer, BacklogCase } from "./schema";

export const BACKLOG_WEIGHTS = {
  value: 40,
  critical: 20,
  traps: 15,
  events: 15,
  capacity: 10,
} as const;

/** The official score plus the report the results screen is built from. */
export const backlogResultSchema = scoreResultSchema.extend({
  report: backlogReportSchema,
});
export type BacklogResult = ReturnType<typeof scoreBacklogAnswer>;

/** The sprint the team works on once the events have happened. */
export function deliveredPlan(answer: BacklogAnswer): string[] {
  return answer.replanTicketIds ?? answer.sprintTicketIds;
}

function details(
  report: BacklogReport,
): Record<keyof typeof BACKLOG_WEIGHTS, string> {
  const { delivered, optimal, committed } = report;
  const criticalDone = report.criticals.filter((c) => c.delivered).length;
  const caught = report.traps.filter((t) => t.outcome !== "fell_for").length;
  const named = report.traps.filter((t) => t.outcome === "identified").length;
  const handled = report.events.filter((e) => e.handling >= 0.999).length;
  return {
    value: `Your sprint delivers ${delivered.value} of the ${optimal.value} value points the best sprint delivers.`,
    critical: `${criticalDone} of ${report.criticals.length} critical tickets are delivered.`,
    traps: `You stayed clear of ${caught} of ${report.traps.length} traps and named ${named} of them correctly.`,
    events: `You handled ${handled} of ${report.events.length} mid-sprint event${report.events.length === 1 ? "" : "s"} fully.`,
    capacity:
      delivered.spilledIds.length === 0
        ? `You committed ${committed.effort} of ${committed.capacity} pts and replanned ${delivered.plannedEffort} of ${delivered.capacity} pts.`
        : `You committed ${committed.effort} of ${committed.capacity} pts and replanned ${delivered.plannedEffort} of ${delivered.capacity} pts; ${delivered.spilledIds.length} ticket(s) will not be finished.`,
  };
}

export function scoreBacklogAnswer(
  caseData: BacklogCase,
  answer: BacklogAnswer,
) {
  const report = buildBacklogReport(caseData, answer);
  const detail = details(report);
  const result = buildScoreResult([
    {
      id: "value",
      label: "Value delivered vs. the optimal sprint",
      weight: BACKLOG_WEIGHTS.value,
      ratio: report.ratios.value,
      detail: detail.value,
    },
    {
      id: "critical",
      label: "Critical tickets addressed",
      weight: BACKLOG_WEIGHTS.critical,
      ratio: report.ratios.critical,
      detail: detail.critical,
    },
    {
      id: "traps",
      label: "Traps avoided",
      weight: BACKLOG_WEIGHTS.traps,
      ratio: report.ratios.traps,
      detail: detail.traps,
    },
    {
      id: "events",
      label: "Mid-sprint event handled",
      weight: BACKLOG_WEIGHTS.events,
      ratio: report.ratios.events,
      detail: detail.events,
    },
    {
      id: "capacity",
      label: "Capacity respected",
      weight: BACKLOG_WEIGHTS.capacity,
      ratio: report.ratios.capacity,
      detail: detail.capacity,
    },
  ]);
  return { ...result, report };
}
