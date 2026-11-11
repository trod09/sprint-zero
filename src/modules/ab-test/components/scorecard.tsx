import { getMessages } from "@/i18n";
import { formatInteger } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  formatLift,
  formatPValue,
  formatRate,
  SIGNIFICANCE,
  type ExperimentReadout,
} from "../analysis";
import type { PublicAbTestCase } from "../schema";
import type { Comparison } from "../stats";

/** Text color of a change: green when significantly better, red when significantly worse. */
export function changeTone(
  comparison: Comparison,
  goodDirection: "up" | "down",
): string {
  if (comparison.pValue >= SIGNIFICANCE || comparison.relativeLift === 0) {
    return "text-muted-foreground";
  }
  const better =
    goodDirection === "up"
      ? comparison.relativeLift > 0
      : comparison.relativeLift < 0;
  return better ? "text-success" : "text-destructive";
}

const th = "py-2 pr-4 text-xs font-medium";
const td = "py-2 pr-4 tabular-nums";

export function Scorecard({
  publicCase,
  readout,
}: {
  publicCase: PublicAbTestCase;
  readout: ExperimentReadout;
}) {
  const copy = getMessages().abTest.readout;
  const { experiment, results } = publicCase;
  const plannedShare = experiment.plan.treatmentShare;
  const observedShare = readout.sampleRatio.observedShare;

  const rows = [
    {
      key: experiment.primaryMetric.key,
      label: experiment.primaryMetric.label,
      kind: copy.primary,
      comparison: readout.primary,
      goodDirection: "up" as const,
      note: null as string | null,
    },
    ...readout.guardrails.map((guardrail) => ({
      key: guardrail.guardrail.key,
      label: guardrail.guardrail.label,
      kind: copy.guardrail,
      comparison: guardrail.comparison,
      goodDirection: guardrail.guardrail.goodDirection,
      note:
        guardrail.guardrail.denominator === "primary"
          ? getMessages().abTest.brief.overConverters
          : null,
    })),
  ];

  return (
    <div className="space-y-4">
      <div
        tabIndex={0}
        className="border-border bg-background/40 focus-visible:ring-ring/50 overflow-x-auto rounded-md border-2 p-4 focus-visible:ring-3 focus-visible:outline-none"
      >
        <table className="w-full text-sm">
          <caption className="text-muted-foreground mb-2 text-left text-xs">
            {copy.daysRun(results.daysRun, experiment.plan.days)}
          </caption>
          <thead>
            <tr className="text-muted-foreground border-b text-left">
              <th scope="col" className={th} />
              <th scope="col" className={th}>
                {copy.control}
              </th>
              <th scope="col" className={th}>
                {copy.treatment}
              </th>
              <th scope="col" className={th}>
                {copy.planned}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <th scope="row" className="py-2 pr-4 text-left font-normal">
                {copy.users}
              </th>
              <td className={td}>
                {formatInteger(readout.totals.control.users)}
              </td>
              <td className={td}>
                {formatInteger(readout.totals.treatment.users)}
              </td>
              <td className={cn(td, "text-muted-foreground")}>
                {formatInteger(experiment.plan.samplePerArm)}{" "}
                <span className="text-xs">/ arm</span>
              </td>
            </tr>
            <tr>
              <th scope="row" className="py-2 pr-4 text-left font-normal">
                {copy.split}
              </th>
              <td className={td}>{((1 - observedShare) * 100).toFixed(1)}%</td>
              <td className={td}>{(observedShare * 100).toFixed(1)}%</td>
              <td className={cn(td, "text-muted-foreground")}>
                {Math.round((1 - plannedShare) * 100)}% /{" "}
                {Math.round(plannedShare * 100)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        tabIndex={0}
        className="border-border bg-background/40 focus-visible:ring-ring/50 overflow-x-auto rounded-md border-2 p-4 focus-visible:ring-3 focus-visible:outline-none"
      >
        <table className="w-full min-w-[40rem] text-sm">
          <thead>
            <tr className="text-muted-foreground border-b text-left">
              <th scope="col" className={th}>
                {copy.metric}
              </th>
              <th scope="col" className={th}>
                {copy.control}
              </th>
              <th scope="col" className={th}>
                {copy.treatment}
              </th>
              <th scope="col" className={th}>
                {copy.change}
              </th>
              <th scope="col" className={th}>
                {copy.interval}
              </th>
              <th scope="col" className={cn(th, "pr-0")}>
                {copy.pValue}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="py-2 pr-4 text-left font-normal">
                  <span className="font-medium">{row.label}</span>
                  <span className="text-muted-foreground block text-xs">
                    {row.kind}
                    {row.note ? ` · ${row.note}` : ""}
                  </span>
                </th>
                <td className={td}>{formatRate(row.comparison.controlRate)}</td>
                <td className={td}>
                  {formatRate(row.comparison.treatmentRate)}
                </td>
                <td
                  className={cn(
                    td,
                    "font-medium",
                    changeTone(row.comparison, row.goodDirection),
                  )}
                >
                  {formatLift(row.comparison.relativeLift)}
                </td>
                <td className={cn(td, "text-muted-foreground")}>
                  {formatLift(row.comparison.ciLow)} to{" "}
                  {formatLift(row.comparison.ciHigh)}
                </td>
                <td className={cn(td, "pr-0")}>
                  {formatPValue(row.comparison.pValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-muted-foreground mt-3 text-xs">
          <span aria-hidden="true" className="text-success">
            ■
          </span>{" "}
          {copy.significant}, {copy.better} ·{" "}
          <span aria-hidden="true" className="text-destructive">
            ■
          </span>{" "}
          {copy.significant}, {copy.worse}
        </p>
      </div>
    </div>
  );
}
