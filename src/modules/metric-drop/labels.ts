import { getMessages } from "@/i18n";

import type { Dimension, MetricKey } from "./schema";

/** Human label of a dimension value, e.g. "android-4.2.0" → "Android 4.2.0". */
export function valueLabel(value: string): string {
  const values = getMessages().metricDrop.values;
  if (value in values) return values[value];
  const versionMatch = /^(ios|android)-(.+)$/.exec(value);
  if (versionMatch) return `${values[versionMatch[1]]} ${versionMatch[2]}`;
  return value;
}

export function dimensionLabel(dimension: Dimension): string {
  return getMessages().metricDrop.dimensions[dimension];
}

export function metricLabel(metric: MetricKey): string {
  return getMessages().metricDrop.metrics[metric];
}

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Rates are percentages with one decimal; counts are compact. */
export function formatMetric(
  metric: MetricKey,
  value: number,
  style: "compact" | "full" = "full",
): string {
  if (metric === "activation" || metric === "conversion") {
    return `${value.toFixed(metric === "conversion" ? 2 : 1)}%`;
  }
  return style === "compact" ? compact.format(value) : integer.format(value);
}

export function formatChange(percent: number): string {
  const sign = percent > 0 ? "+" : percent < 0 ? "−" : "";
  return `${sign}${Math.abs(percent).toFixed(1)}%`;
}

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
export function formatDay(isoDate: string): string {
  return shortDate.format(new Date(`${isoDate}T00:00:00Z`));
}
