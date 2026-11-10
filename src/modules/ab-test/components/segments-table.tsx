import { getMessages } from "@/i18n";
import { formatInteger } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  formatLift,
  formatPValue,
  formatRate,
  type ExperimentReadout,
} from "../analysis";
import type { PublicAbTestCase } from "../schema";
import { changeTone } from "./scorecard";

const th = "py-2 pr-4 text-xs font-medium";
const td = "py-2 pr-4 tabular-nums";

export function SegmentsTable({
  publicCase,
  readout,
}: {
  publicCase: PublicAbTestCase;
  readout: ExperimentReadout;
}) {
  const copy = getMessages().abTest.readout;
  const { experiment } = publicCase;
  const rows = [
    ...readout.segments.map((segment) => ({ ...segment, total: false })),
    {
      value: copy.all,
      comparison: readout.primary,
      users: readout.totals.control.users + readout.totals.treatment.users,
      treatmentShare: readout.sampleRatio.observedShare,
      total: true,
    },
  ];

  return (
    <div className="bg-card rounded-xl border p-4">
      <h3 className="font-medium">
        {copy.segmentsTitle(experiment.segmentDimension)}
      </h3>
      <p className="text-muted-foreground mt-0.5 text-xs">
        {experiment.primaryMetric.label} · {copy.segmentsIntro}
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead>
            <tr className="text-muted-foreground border-b text-left">
              <th scope="col" className={th}>
                {experiment.segmentDimension}
              </th>
              <th scope="col" className={th}>
                {copy.users}
              </th>
              <th scope="col" className={th}>
                {copy.treatmentShare}
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
              <th scope="col" className={cn(th, "pr-0")}>
                {copy.pValue}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.value} className={cn(row.total && "font-medium")}>
                <th scope="row" className="py-2 pr-4 text-left font-normal">
                  <span className={cn(row.total && "font-medium")}>
                    {row.value}
                  </span>
                </th>
                <td className={td}>{formatInteger(row.users)}</td>
                <td className={td}>{(row.treatmentShare * 100).toFixed(1)}%</td>
                <td className={td}>{formatRate(row.comparison.controlRate)}</td>
                <td className={td}>
                  {formatRate(row.comparison.treatmentRate)}
                </td>
                <td
                  className={cn(
                    td,
                    "font-medium",
                    changeTone(row.comparison, "up"),
                  )}
                >
                  {formatLift(row.comparison.relativeLift)}
                </td>
                <td className={cn(td, "pr-0")}>
                  {formatPValue(row.comparison.pValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
