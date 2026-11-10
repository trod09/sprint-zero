"use server";

import { caseRepository } from "@/modules/registry.server";

import type { DashboardOutcome } from "./dashboard";
import { queryDashboard } from "./data.server";

/** One dashboard view. `input` comes from the browser and is validated. */
export async function queryMetricDrop(
  input: unknown,
): Promise<DashboardOutcome> {
  return queryDashboard(caseRepository, input);
}
