/**
 * Builds the pregenerated A/B Test Interpreter cases.
 *
 *   npm run generate:ab-test              write src/modules/ab-test/cases/*.json
 *   npm run generate:ab-test -- --check   fail if the committed JSON is out of date
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  formatLift,
  formatPValue,
  readExperiment,
} from "@/modules/ab-test/analysis";
import { buildAbTestCase } from "@/modules/ab-test/build-case";
import { abTestCaseSpecs } from "@/modules/ab-test/content/cases";

const CASES_DIR = path.join(process.cwd(), "src/modules/ab-test/cases");

async function main(): Promise<void> {
  const check = process.argv.includes("--check");
  await mkdir(CASES_DIR, { recursive: true });
  let outdated = 0;

  for (const spec of abTestCaseSpecs) {
    const caseData = buildAbTestCase(spec);
    const readout = readExperiment(caseData);
    console.log(
      [
        caseData.id.padEnd(30),
        caseData.difficulty.padEnd(7),
        `attempt ${caseData.hidden.simulation.attempt}`.padEnd(11),
        `${formatLift(readout.primary.relativeLift)} p=${formatPValue(readout.primary.pValue)}`.padEnd(
          20,
        ),
        `srm p=${formatPValue(readout.sampleRatio.pValue)}`.padEnd(14),
        caseData.hidden.issues.join("+") || "clean",
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
      `${outdated} case file(s) are out of date. Run "npm run generate:ab-test".`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
