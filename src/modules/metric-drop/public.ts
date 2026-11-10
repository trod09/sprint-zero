import type { MetricDropCase, PublicMetricDropCase } from "./schema";

/** The case without its root cause and data specification. */
export function toPublicMetricDropCase(
  caseData: MetricDropCase,
): PublicMetricDropCase {
  const { hidden: _truth, scale: _scale, rates: _rates, ...rest } = caseData;
  return rest;
}
