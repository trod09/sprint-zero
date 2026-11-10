/**
 * What the AI coach is told about a triage: the real themes, how the
 * learner's clusters map onto them, and the learner's cluster names and
 * opportunities, which go in the untrusted block.
 */
import type { FeedbackContext } from "@/core/case-engine";

import type { FeedbackTriageAnswer, FeedbackTriageCase } from "./schema";
import type { TriageResult } from "./scoring";

export function buildTriageFeedbackContext(
  caseData: FeedbackTriageCase,
  answer: FeedbackTriageAnswer,
  result: TriageResult,
): FeedbackContext {
  const { report } = result;
  const themeLabel = new Map(
    caseData.hidden.themes.map((theme) => [theme.key, theme.label]),
  );
  return {
    analysis: {
      company: `${caseData.company.name} (${caseData.company.industry})`,
      product: caseData.company.description,
      items: caseData.items.length,
      realThemesInPriorityOrder: report.themes.map((theme) => ({
        label: theme.label,
        severity: theme.severity,
        items: theme.size,
        whatIsBehindIt: theme.summary,
        exampleOpportunity: theme.opportunity,
        learnersBestMatchingCluster: theme.bestClusterName,
        matchQuality: Number(theme.f1.toFixed(2)),
      })),
      learnersClustersInTheirOrder: report.clusters.map((cluster, index) => ({
        position: index + 1,
        items: cluster.size,
        mostlyAbout: cluster.themeKey
          ? themeLabel.get(cluster.themeKey)
          : "a mix of themes",
      })),
      noise: report.noise,
      unsortedItems: report.unsorted,
      criticalProblemFlagged: report.criticalFlagged,
      ranking: report.explanation,
    },
    learnerAnswer: {
      clusters: answer.clusters.map((cluster, index) => ({
        position: index + 1,
        name: cluster.name,
        opportunity: cluster.opportunity,
        flaggedCritical: cluster.id === answer.criticalClusterId,
      })),
    },
  };
}
