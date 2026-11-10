"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDay, formatMetric, valueLabel } from "../labels";
import type { Annotation, MetricKey } from "../schema";

/** Theme tokens, so series stay distinguishable in light and dark. */
export const SERIES_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--module-metric-drop)",
  "var(--muted-foreground)",
];

export interface ChartSeries {
  key: string;
  label: string;
  values: number[];
}

export function TrendChart({
  metric,
  dates,
  series,
  annotations,
  label,
}: {
  metric: MetricKey;
  dates: string[];
  series: ChartSeries[];
  /** Annotations with the date they fall on. */
  annotations: (Annotation & { date: string })[];
  label: string;
}) {
  const rows = dates.map((date, index) => {
    const row: Record<string, number | string> = { date };
    for (const entry of series) row[entry.key] = entry.values[index];
    return row;
  });
  const visibleDates = new Set(dates);

  return (
    <figure aria-label={label} className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={rows}
          margin={{ top: 16, right: 16, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDay}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            stroke="var(--border)"
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(value: number) =>
              formatMetric(metric, value, "compact")
            }
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            stroke="var(--border)"
            width={64}
            domain={["auto", "auto"]}
          />
          <Tooltip
            labelFormatter={(value) => formatDay(String(value))}
            formatter={(value, name) => [
              formatMetric(metric, Number(value)),
              String(name),
            ]}
            contentStyle={{
              background: "var(--popover)",
              border: "2px solid var(--frame)",
              borderRadius: 4,
              boxShadow: "3px 3px 0 0 var(--shadow-color)",
              color: "var(--popover-foreground)",
              fontSize: 12,
            }}
          />
          {series.length > 1 && (
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => (
                <span style={{ color: "var(--foreground)" }}>{value}</span>
              )}
            />
          )}
          {annotations
            .filter((annotation) => visibleDates.has(annotation.date))
            .map((annotation) => (
              <ReferenceLine
                key={`${annotation.day}-${annotation.label}`}
                x={annotation.date}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                ifOverflow="extendDomain"
              />
            ))}
          {series.map((entry, index) => (
            <Line
              key={entry.key}
              type="linear"
              dataKey={entry.key}
              name={entry.label}
              stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
}

export { valueLabel };
