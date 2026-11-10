/**
 * Turns a hand-written case specification into a stored case: validates it
 * and writes the measured size of the drop into the brief, so the number the
 * learner reads is the number the data shows.
 */
import { buildDataset } from "./dataset";
import type { MetricDropCaseSpec } from "./content/cases";
import { windowChange } from "./query";
import { metricDropCaseSchema, type MetricDropCase } from "./schema";

export function buildMetricDropCase(spec: MetricDropCaseSpec): MetricDropCase {
  const { briefTemplate, ...rest } = spec;
  const draft = metricDropCaseSchema.parse({ ...rest, brief: briefTemplate });
  const change = windowChange(buildDataset(draft), draft.headlineMetric);
  if (change.changePercent > -5) {
    throw new Error(
      `Case "${spec.id}": ${draft.headlineMetric} only moves ${change.changePercent}%, not a drop worth investigating`,
    );
  }
  const brief = briefTemplate.replace(
    "{change}",
    `${Math.round(Math.abs(change.changePercent))}%`,
  );
  if (/\{\w+\}/.test(brief)) {
    throw new Error(`Case "${spec.id}": unfilled placeholder in the brief`);
  }
  return metricDropCaseSchema.parse({ ...rest, brief });
}
