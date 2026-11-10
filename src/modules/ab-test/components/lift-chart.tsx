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

import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import { formatLift, formatPValue, type ExperimentReadout } from "../analysis";
import { changeTone } from "./scorecard";

const DAILY_COLOR = "#94a3b8";
const CUMULATIVE_COLOR = "#6366f1";

export function LiftOverTime({ readout }: { readout: ExperimentReadout }) {
  const copy = getMessages().abTest.readout;
  const rows = readout.daily.map((entry) => ({
    day: entry.day + 1,
    daily: Number((entry.comparison.relativeLift * 100).toFixed(2)),
    cumulative: Number((entry.cumulative.relativeLift * 100).toFixed(2)),
  }));
  const weeks = [
    { label: copy.firstWeek, comparison: readout.firstWeek },
    { label: copy.lastWeek, comparison: readout.lastWeek },
  ];

  return (
    <div className="bg-card space-y-4 rounded-xl border p-4">
      <div>
        <h3 className="font-medium">{copy.overTimeTitle}</h3>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {copy.overTimeIntro}
        </p>
      </div>
      <figure aria-label={copy.chartLabel} className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={rows}
            margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tickFormatter={(day: number) => copy.dayLabel(day)}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              stroke="var(--border)"
              minTickGap={16}
            />
            <YAxis
              tickFormatter={(value: number) => `${value}%`}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              stroke="var(--border)"
              width={52}
              domain={["auto", "auto"]}
            />
            <ReferenceLine y={0} stroke="var(--muted-foreground)" />
            <Tooltip
              labelFormatter={(day) => copy.dayLabel(Number(day))}
              formatter={(value, name) => [
                formatLift(Number(value) / 100),
                String(name),
              ]}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--popover-foreground)",
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => (
                <span style={{ color: "var(--foreground)" }}>{value}</span>
              )}
            />
            <Line
              type="linear"
              dataKey="daily"
              name={copy.dailyLift}
              stroke={DAILY_COLOR}
              strokeWidth={1.5}
              dot={{ r: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="cumulative"
              name={copy.cumulativeLift}
              stroke={CUMULATIVE_COLOR}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </figure>
      {readout.firstWeek && readout.lastWeek && (
        <table className="w-full max-w-md text-sm">
          <thead>
            <tr className="text-muted-foreground border-b text-left text-xs">
              <th scope="col" className="py-2 pr-4 font-medium" />
              <th scope="col" className="py-2 pr-4 font-medium">
                {copy.change}
              </th>
              <th scope="col" className="py-2 font-medium">
                {copy.pValue}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {weeks.map(({ label, comparison }) =>
              comparison ? (
                <tr key={label}>
                  <th scope="row" className="py-2 pr-4 text-left font-normal">
                    {label}
                  </th>
                  <td
                    className={cn(
                      "py-2 pr-4 font-medium tabular-nums",
                      changeTone(comparison, "up"),
                    )}
                  >
                    {formatLift(comparison.relativeLift)}
                  </td>
                  <td className="py-2 tabular-nums">
                    {formatPValue(comparison.pValue)}
                  </td>
                </tr>
              ) : null,
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
