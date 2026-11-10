/**
 * Builds the PRD Writer cases from their specifications.
 *
 *   npm run generate:prd-writer              write src/modules/prd-writer/cases/*.json
 *   npm run generate:prd-writer -- --check   fail if the committed JSON is out of date
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { prdSpecs } from "@/modules/prd-writer/content/cases";
import { generatePrdCase } from "@/modules/prd-writer/generator";

const CASES_DIR = path.join(process.cwd(), "src/modules/prd-writer/cases");

async function main(): Promise<void> {
  const check = process.argv.includes("--check");
  await mkdir(CASES_DIR, { recursive: true });
  let outdated = 0;

  for (const spec of prdSpecs) {
    const caseData = generatePrdCase(spec);
    const { metric } = caseData.hidden;
    console.log(
      [
        caseData.id.padEnd(36),
        caseData.difficulty.padEnd(7),
        `baseline ${metric.baseline} | target ${metric.targetMin}-${metric.targetMax} | ${metric.horizon}`,
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
      `${outdated} case file(s) are out of date. Run "npm run generate:prd-writer".`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
