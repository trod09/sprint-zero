import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import type { DashboardView } from "../dashboard";
import { formatChange, formatMetric, valueLabel } from "../labels";
import type { MetricKey } from "../schema";

/** Week-over-week change per segment, computed on the server. */
export function BreakdownTable({
  metric,
  view,
  dimensionName,
}: {
  metric: MetricKey;
  view: DashboardView;
  dimensionName: string;
}) {
  const copy = getMessages().metricDrop.dashboard;
  const rows = [
    { key: "__total", label: copy.total, change: view.change, isTotal: true },
    ...(view.breakdownChanges ?? []).map((entry) => ({
      key: entry.value,
      label: valueLabel(entry.value),
      change: entry.change,
      isTotal: false,
    })),
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">{dimensionName}</caption>
        <thead>
          <tr className="text-muted-foreground border-b text-left text-xs">
            <th scope="col" className="py-2 pr-4 font-medium">
              {dimensionName}
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">
              {copy.previousWeek}
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">
              {copy.lastWeek}
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              {copy.change}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.key} className={cn(row.isTotal && "font-medium")}>
              <th scope="row" className="py-2 pr-4 text-left font-normal">
                {row.label}
              </th>
              <td className="py-2 pr-4 text-right font-mono tabular-nums">
                {formatMetric(metric, row.change.before)}
              </td>
              <td className="py-2 pr-4 text-right font-mono tabular-nums">
                {formatMetric(metric, row.change.after)}
              </td>
              <td
                className={cn(
                  "py-2 text-right font-mono tabular-nums",
                  row.change.changePercent <= -5
                    ? "text-destructive"
                    : row.change.changePercent >= 5
                      ? "text-success"
                      : "text-muted-foreground",
                )}
              >
                {formatChange(row.change.changePercent)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
