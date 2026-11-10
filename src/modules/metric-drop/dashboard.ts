/**
 * What the dashboard receives for one view: the series plus the
 * week-over-week change, computed by code for the total and for each
 * breakdown value. Shared by the server action and the client.
 */
import { z } from "zod";

import type { Dataset } from "./dataset";
import {
  metricQuerySchema,
  runQuery,
  windowChange,
  type QueryResult,
  type WindowChange,
} from "./query";
import { caseIdSchema } from "@/core/case-engine";

export const dashboardRequestSchema = z.object({
  caseId: caseIdSchema,
  query: metricQuerySchema,
});

export interface DashboardView extends QueryResult {
  change: WindowChange;
  breakdownChanges?: { value: string; change: WindowChange }[];
}

export type DashboardOutcome =
  | { ok: true; view: DashboardView }
  | { ok: false; error: { code: "invalid_request" | "case_not_found" } };

export function buildDashboardView(
  dataset: Dataset,
  query: z.infer<typeof metricQuerySchema>,
): DashboardView {
  const result = runQuery(dataset, query);
  const view: DashboardView = {
    ...result,
    change: windowChange(dataset, query.metric, query.filters),
  };
  if (query.breakdown && result.breakdown) {
    const dimension = query.breakdown;
    view.breakdownChanges = result.breakdown.map(({ value }) => ({
      value,
      change: windowChange(dataset, query.metric, {
        ...query.filters,
        [dimension]: [value],
      }),
    }));
  }
  return view;
}
