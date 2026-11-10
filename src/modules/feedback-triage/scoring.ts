/**
 * Deterministic scoring of a feedback triage.
 *
 * MASTER_PROMPT (Hito 2.4) asks for theme coverage, the critical problem
 * detected and the quality of the opportunities (AI). The opportunities are
 * free text, so the AI coach reviews them without changing the score; the
 * deterministic part splits into theme coverage 40, critical problem 25,
 * ranking 20 and noise set aside 15.
 */
import { z } from "zod";

import { buildScoreResult, clamp01, scoreResultSchema } from "@/core/scoring";

import {
  severitySchema,
  type Cluster,
  type FeedbackTriageAnswer,
  type FeedbackTriageCase,
  type ThemeTruth,
} from "./schema";

export const TRIAGE_WEIGHTS = {
  themes: 40,
  critical: 25,
  ranking: 20,
  noise: 15,
} as const;

/** A cluster stands for a theme when this share of it comes from the theme. */
export const MAJORITY = 0.5;
/** Overlap (F1) with the critical theme that earns full credit. */
export const CRITICAL_FULL_CREDIT = 0.8;
export const TOP_THEMES = 3;

/** Harmonic mean of precision and recall of a cluster against a set. */
export function overlapF1(
  clusterItems: readonly string[],
  truthItems: readonly string[],
): number {
  if (clusterItems.length === 0 || truthItems.length === 0) return 0;
  const truth = new Set(truthItems);
  const shared = clusterItems.filter((id) => truth.has(id)).length;
  return (2 * shared) / (clusterItems.length + truthItems.length);
}

/** The theme a cluster stands for: the one most of its items come from. */
export function themeOfCluster(
  cluster: Pick<Cluster, "itemIds">,
  themes: readonly ThemeTruth[],
): ThemeTruth | null {
  if (cluster.itemIds.length === 0) return null;
  let best: ThemeTruth | null = null;
  let bestShare = 0;
  for (const theme of themes) {
    const ids = new Set(theme.itemIds);
    const share =
      cluster.itemIds.filter((id) => ids.has(id)).length /
      cluster.itemIds.length;
    if (share > bestShare) {
      best = theme;
      bestShare = share;
    }
  }
  return bestShare >= MAJORITY ? best : null;
}

export const triageReportSchema = z.object({
  themes: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      severity: severitySchema,
      size: z.number().int(),
      rank: z.number().int(),
      summary: z.string(),
      opportunity: z.string(),
      /** The learner's cluster that best matches the theme. */
      bestClusterName: z.string().nullable(),
      bestClusterRank: z.number().int().nullable(),
      f1: z.number(),
    }),
  ),
  clusters: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      size: z.number().int(),
      themeKey: z.string().nullable(),
    }),
  ),
  noise: z.object({
    total: z.number().int(),
    setAside: z.number().int(),
    wronglySetAside: z.number().int(),
  }),
  unsorted: z.number().int(),
  criticalFlagged: z.boolean(),
  explanation: z.string(),
  principle: z.string(),
});
export type TriageReport = z.infer<typeof triageReportSchema>;

export const triageResultSchema = scoreResultSchema.extend({
  report: triageReportSchema,
});
export type TriageResult = ReturnType<typeof scoreTriageAnswer>;

export function scoreTriageAnswer(
  caseData: FeedbackTriageCase,
  answer: FeedbackTriageAnswer,
) {
  const { themes, noiseItemIds } = caseData.hidden;
  const knownIds = new Set(caseData.items.map((item) => item.id));
  const clusters = answer.clusters.map((cluster) => ({
    ...cluster,
    itemIds: cluster.itemIds.filter((id) => knownIds.has(id)),
  }));

  // Theme coverage: each theme against the cluster that matches it best.
  const themeRows = themes.map((theme, index) => {
    let bestIndex = -1;
    let bestF1 = 0;
    clusters.forEach((cluster, clusterIndex) => {
      const f1 = overlapF1(cluster.itemIds, theme.itemIds);
      if (f1 > bestF1) {
        bestF1 = f1;
        bestIndex = clusterIndex;
      }
    });
    return {
      key: theme.key,
      label: theme.label,
      severity: theme.severity,
      size: theme.itemIds.length,
      rank: index + 1,
      summary: theme.summary,
      opportunity: theme.opportunity,
      bestClusterName: bestIndex === -1 ? null : clusters[bestIndex].name,
      bestClusterRank: bestIndex === -1 ? null : bestIndex + 1,
      f1: bestF1,
    };
  });
  const coverage =
    themeRows.reduce((sum, row) => sum + row.f1, 0) / themeRows.length;

  // The critical problem, in the cluster the learner flagged.
  const criticalTheme = themes.find((theme) => theme.severity === "critical")!;
  const flagged = clusters.find((c) => c.id === answer.criticalClusterId);
  const criticalF1 = flagged
    ? overlapF1(flagged.itemIds, criticalTheme.itemIds)
    : 0;
  const criticalRatio = clamp01(criticalF1 / CRITICAL_FULL_CREDIT);

  // Ranking: the themes behind the learner's top clusters vs. the true top.
  const clusterThemes = clusters.map((cluster) =>
    themeOfCluster(cluster, themes),
  );
  const learnerTop = new Set(
    clusterThemes
      .slice(0, TOP_THEMES)
      .filter((theme): theme is ThemeTruth => theme !== null)
      .map((theme) => theme.key),
  );
  const trueTop = themes.slice(0, TOP_THEMES).map((theme) => theme.key);
  const rankingHits = trueTop.filter((key) => learnerTop.has(key)).length;

  // Noise set aside.
  const noiseF1 = overlapF1(answer.noiseItemIds, noiseItemIds);
  const noiseSet = new Set(noiseItemIds);
  const setAside = answer.noiseItemIds.filter((id) => noiseSet.has(id)).length;
  const wronglySetAside = answer.noiseItemIds.filter(
    (id) => knownIds.has(id) && !noiseSet.has(id),
  ).length;

  const placed = new Set([
    ...clusters.flatMap((cluster) => cluster.itemIds),
    ...answer.noiseItemIds,
  ]);
  const unsorted = caseData.items.filter((item) => !placed.has(item.id)).length;

  const percent = (value: number) => `${Math.round(value * 100)}%`;
  const result = buildScoreResult([
    {
      id: "themes",
      label: "Theme coverage",
      weight: TRIAGE_WEIGHTS.themes,
      ratio: clamp01(coverage),
      detail: `Your clusters match the ${themes.length} real themes at ${percent(coverage)} on average${unsorted > 0 ? `; ${unsorted} item${unsorted === 1 ? " was" : "s were"} left unsorted` : ""}.`,
    },
    {
      id: "critical",
      label: "Critical problem",
      weight: TRIAGE_WEIGHTS.critical,
      ratio: criticalRatio,
      detail: !flagged
        ? `You flagged no cluster as critical. The critical problem was "${criticalTheme.label}".`
        : criticalRatio === 1
          ? `Right: "${flagged.name}" is the critical problem.`
          : criticalF1 > 0
            ? `"${flagged.name}" only partly captures the critical problem, "${criticalTheme.label}".`
            : `"${flagged.name}" is not critical. The critical problem was "${criticalTheme.label}".`,
    },
    {
      id: "ranking",
      label: "Ranking",
      weight: TRIAGE_WEIGHTS.ranking,
      ratio: rankingHits / TOP_THEMES,
      detail: `${rankingHits} of the ${TOP_THEMES} most important themes are in your top ${TOP_THEMES} clusters.`,
    },
    {
      id: "noise",
      label: "Noise set aside",
      weight: TRIAGE_WEIGHTS.noise,
      ratio: clamp01(noiseF1),
      detail: `You set aside ${setAside} of ${noiseItemIds.length} noise items${wronglySetAside > 0 ? ` and ${wronglySetAside} real piece${wronglySetAside === 1 ? "" : "s"} of feedback` : ""}.`,
    },
  ]);

  const report: TriageReport = {
    themes: themeRows,
    clusters: clusters.map((cluster, index) => ({
      id: cluster.id,
      name: cluster.name,
      size: cluster.itemIds.length,
      themeKey: clusterThemes[index]?.key ?? null,
    })),
    noise: {
      total: noiseItemIds.length,
      setAside,
      wronglySetAside,
    },
    unsorted,
    criticalFlagged: criticalRatio === 1,
    explanation: caseData.hidden.explanation,
    principle: caseData.hidden.principle,
  };
  return { ...result, report };
}
