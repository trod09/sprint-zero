"use server";

import { allowAction } from "@/lib/action-guard.server";
import { caseRepository } from "@/modules/registry.server";

import type { DashboardOutcome } from "./dashboard";
import { queryDashboard } from "./data.server";

/** One dashboard view. `input` comes from the browser and is validated. */
export async function queryMetricDrop(
  input: unknown,
): Promise<DashboardOutcome> {
  if (!(await allowAction())) {
    return { ok: false, error: { code: "invalid_request" } };
  }
  return queryDashboard(caseRepository, input);
}
