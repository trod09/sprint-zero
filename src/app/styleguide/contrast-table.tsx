"use client";

import { useEffect, useState } from "react";

import { getMessages } from "@/i18n";
import { contrastRatio, TEXT_PAIRS, UI_PAIRS } from "@/lib/contrast";
import { cn } from "@/lib/utils";

interface Row {
  pair: string;
  ratio: number;
  needed: number;
}

/** Reads the live tokens of the current theme and measures each pair. */
export function ContrastTable() {
  const copy = getMessages().arcade.styleguide;
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    const measure = () => {
      const style = getComputedStyle(document.documentElement);
      const token = (name: string) =>
        style.getPropertyValue(`--${name}`).trim();
      const build = (
        pairs: readonly (readonly [string, string])[],
        needed: number,
      ) =>
        pairs.map(([a, b]) => ({
          pair: `${a} / ${b}`,
          ratio: contrastRatio(token(a), token(b)),
          needed,
        }));
      setRows([...build(TEXT_PAIRS, 4.5), ...build(UI_PAIRS, 3)]);
    };
    measure();
    // Re-measure when the theme toggles the class on <html>.
    const observer = new MutationObserver(measure);
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  if (!rows) return null;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-muted-foreground text-left text-xs">
          <th scope="col" className="pb-2 font-medium">
            {copy.pair}
          </th>
          <th scope="col" className="pb-2 text-right font-medium">
            {copy.ratio}
          </th>
          <th scope="col" className="pb-2 text-right font-medium">
            AA
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const pass = row.ratio >= row.needed;
          return (
            <tr key={row.pair} className="border-t">
              <th
                scope="row"
                className="py-1.5 text-left font-mono text-xs font-normal"
              >
                {row.pair}
              </th>
              <td className="py-1.5 text-right font-mono text-xs tabular-nums">
                {row.ratio.toFixed(2)}:1
              </td>
              <td
                className={cn(
                  "font-pixel py-1.5 text-right text-xs",
                  pass ? "text-success" : "text-destructive",
                )}
              >
                {pass ? copy.pass : copy.fail} ({row.needed}:1)
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
