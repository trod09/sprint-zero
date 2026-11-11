/**
 * Server-side access to Metric Drop data. The cube is built once per case
 * and kept in memory; only query results leave the server.
 */
import "server-only";

import type { CaseRepository } from "@/core/case-engine/case-repository";
import { createLruCache } from "@/lib/lru";

import {
  buildDashboardView,
  dashboardRequestSchema,
  type DashboardOutcome,
} from "./dashboard";
import { buildDataset, type Dataset } from "./dataset";
import { METRIC_DROP_MODULE_ID, metricDropCaseSchema } from "./schema";

/**
 * Bounded: generated case ids carry any seed the browser picks, so an
 * unbounded cache could be filled until the server runs out of memory.
 */
const datasets = createLruCache<string, Dataset>(64);

export async function queryDashboard(
  repository: CaseRepository,
  input: unknown,
): Promise<DashboardOutcome> {
  const request = dashboardRequestSchema.safeParse(input);
  if (!request.success)
    return { ok: false, error: { code: "invalid_request" } };

  const { caseId, query } = request.data;
  let dataset = datasets.get(caseId);
  if (!dataset) {
    const record = await repository.getCaseRecord(caseId);
    if (!record || record.moduleId !== METRIC_DROP_MODULE_ID) {
      return { ok: false, error: { code: "case_not_found" } };
    }
    dataset = buildDataset(metricDropCaseSchema.parse(record.reveal()));
    datasets.set(caseId, dataset);
  }
  return { ok: true, view: buildDashboardView(dataset, query) };
}
