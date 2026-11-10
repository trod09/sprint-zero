/**
 * Queries over a Metric Drop dataset: one metric over time, optionally
 * filtered and broken down by a dimension. This is what the dashboard asks
 * the server for; the learner never receives the raw cube.
 */
import { z } from "zod";

import type { Cell, Dataset } from "./dataset";
import {
  DIMENSIONS,
  dimensionSchema,
  metricSchema,
  RATE_METRICS,
  type Dimension,
  type MetricKey,
} from "./schema";

export const filtersSchema = z
  .partialRecord(
    dimensionSchema,
    z.array(z.string().min(1).max(40)).min(1).max(10),
  )
  .default({});
export type Filters = z.infer<typeof filtersSchema>;

export const metricQuerySchema = z.object({
  metric: metricSchema,
  filters: filtersSchema,
  breakdown: dimensionSchema.optional(),
});
export type MetricQuery = z.infer<typeof metricQuerySchema>;

export interface SeriesPoint {
  date: string;
  value: number;
}

export interface QueryResult {
  metric: MetricKey;
  dates: string[];
  /** Value per day for everything that matches the filters. */
  total: number[];
  /** Per value of the breakdown dimension, largest first by recent volume. */
  breakdown?: { value: string; values: number[] }[];
}

interface Sums {
  active: number;
  signups: number;
  activated: number;
  sessions: number;
  purchases: number;
}

const emptySums = (): Sums => ({
  active: 0,
  signups: 0,
  activated: 0,
  sessions: 0,
  purchases: 0,
});

function addCell(sums: Sums, cell: Cell, day: number): void {
  sums.active += cell.active[day];
  sums.signups += cell.signups[day];
  sums.activated += cell.activated[day];
  sums.sessions += cell.sessions[day];
  sums.purchases += cell.purchases[day];
}

const round = (value: number, decimals: number) =>
  Math.round(value * 10 ** decimals) / 10 ** decimals;

/** Turns summed counters into the metric. Rates are percentages. */
export function metricValue(metric: MetricKey, sums: Sums): number {
  switch (metric) {
    case "dau":
      return sums.active;
    case "signups":
      return sums.signups;
    case "sessions":
      return sums.sessions;
    case "activation":
      return sums.signups === 0
        ? 0
        : round((100 * sums.activated) / sums.signups, 2);
    case "conversion":
      return sums.active === 0
        ? 0
        : round((100 * sums.purchases) / sums.active, 2);
  }
}

export function isRateMetric(metric: MetricKey): boolean {
  return RATE_METRICS.includes(metric);
}

function matchesFilters(cell: Cell, filters: Filters): boolean {
  return (Object.entries(filters) as [Dimension, string[] | undefined][]).every(
    ([dimension, values]) => !values || values.includes(cell.dims[dimension]),
  );
}

function series(
  cells: readonly Cell[],
  metric: MetricKey,
  days: number,
): number[] {
  const values: number[] = [];
  for (let day = 0; day < days; day++) {
    const sums = emptySums();
    for (const cell of cells) addCell(sums, cell, day);
    values.push(metricValue(metric, sums));
  }
  return values;
}

export function runQuery(dataset: Dataset, query: MetricQuery): QueryResult {
  const cells = dataset.cells.filter((cell) =>
    matchesFilters(cell, query.filters),
  );
  const result: QueryResult = {
    metric: query.metric,
    dates: dataset.dates,
    total: series(cells, query.metric, dataset.days),
  };
  if (query.breakdown) {
    const dimension = query.breakdown;
    const groups = new Map<string, Cell[]>();
    for (const cell of cells) {
      const key = cell.dims[dimension];
      const group = groups.get(key);
      if (group) group.push(cell);
      else groups.set(key, [cell]);
    }
    // Order by recent activity so the biggest segments come first.
    const volume = (group: Cell[]) =>
      group.reduce((sum, cell) => sum + cell.active[dataset.days - 1], 0);
    result.breakdown = [...groups.entries()]
      .sort((a, b) => volume(b[1]) - volume(a[1]) || a[0].localeCompare(b[0]))
      .map(([value, group]) => ({
        value,
        values: series(group, query.metric, dataset.days),
      }));
  }
  return result;
}

export interface WindowChange {
  before: number;
  after: number;
  /** Relative change in percent, e.g. -14.2. */
  changePercent: number;
}

/**
 * The last `window` days against the `window` days before, for a filtered
 * slice. Counts are averaged per day; rates are recomputed over the window.
 */
export function windowChange(
  dataset: Dataset,
  metric: MetricKey,
  filters: Filters = {},
  window = 7,
): WindowChange {
  const cells = dataset.cells.filter((cell) => matchesFilters(cell, filters));
  const sumRange = (from: number, to: number) => {
    const sums = emptySums();
    for (let day = from; day < to; day++) {
      for (const cell of cells) addCell(sums, cell, day);
    }
    return sums;
  };
  const end = dataset.days;
  const valueOf = (sums: Sums) => {
    const value = metricValue(metric, sums);
    return isRateMetric(metric) ? value : value / window;
  };
  const before = valueOf(sumRange(end - 2 * window, end - window));
  const after = valueOf(sumRange(end - window, end));
  return {
    before: round(before, 2),
    after: round(after, 2),
    changePercent:
      before === 0 ? 0 : round((100 * (after - before)) / before, 1),
  };
}

export { DIMENSIONS };
