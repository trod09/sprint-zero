/**
 * Builds the pregenerated Metric Drop cases.
 *
 *   npm run generate:metric-drop              write src/modules/metric-drop/cases/*.json
 *   npm run generate:metric-drop -- --check   fail if the committed JSON is out of date
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildMetricDropCase } from "@/modules/metric-drop/build-case";
import { metricDropCaseSpecs } from "@/modules/metric-drop/content/cases";
import { buildDataset } from "@/modules/metric-drop/dataset";
import { windowChange } from "@/modules/metric-drop/query";

const CASES_DIR = path.join(process.cwd(), "src/modules/metric-drop/cases");

async function main(): Promise<void> {
  const check = process.argv.includes("--check");
  await mkdir(CASES_DIR, { recursive: true });
  let outdated = 0;

  for (const spec of metricDropCaseSpecs) {
    const caseData = buildMetricDropCase(spec);
    const dataset = buildDataset(caseData);
    const headline = windowChange(dataset, caseData.headlineMetric);
    const { dimension, value } = caseData.hidden.rootCause.segment;
    const segment = windowChange(dataset, caseData.headlineMetric, {
      [dimension]: [value],
    });
    console.log(
      [
        caseData.id.padEnd(34),
        caseData.difficulty.padEnd(7),
        `${caseData.headlineMetric} ${headline.changePercent}%`,
        `${dimension}=${value} ${segment.changePercent}%`,
      ].join(" | "),
    );

    const file = path.join(CASES_DIR, `${caseData.id}.json`);
    const content = `${JSON.stringify(caseData, null, 2)}\n`;
    if (check) {
      const current = existsSync(file) ? await readFile(file, "utf8") : "";
      if (current !== content) {
        outdated += 1;
        console.error(`out of date: ${path.relative(process.cwd(), file)}`);
      }
    } else {
      await writeFile(file, content, "utf8");
    }
  }

  if (check && outdated > 0) {
    throw new Error(
      `${outdated} case file(s) are out of date. Run "npm run generate:metric-drop".`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
