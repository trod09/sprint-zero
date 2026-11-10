/**
 * Builds the pregenerated UX Critique cases.
 *
 *   npm run generate:ux-critique              write src/modules/ux-critique/cases/*.json
 *   npm run generate:ux-critique -- --check   fail if the committed JSON is out of date
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { uxCaseSpecs } from "@/modules/ux-critique/content/cases";
import { generateUxCase } from "@/modules/ux-critique/generator";

const CASES_DIR = path.join(process.cwd(), "src/modules/ux-critique/cases");

async function main(): Promise<void> {
  const check = process.argv.includes("--check");
  await mkdir(CASES_DIR, { recursive: true });
  let outdated = 0;

  for (const spec of uxCaseSpecs) {
    const caseData = generateUxCase(spec);
    console.log(
      [
        caseData.id.padEnd(32),
        caseData.difficulty.padEnd(7),
        caseData.hidden.issues
          .map((issue) => `${issue.regionId}:${issue.type}`)
          .join(" "),
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
      `${outdated} case file(s) are out of date. Run "npm run generate:ux-critique".`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
