/**
 * Builds the pregenerated Feedback Triage cases.
 *
 *   npm run generate:feedback-triage              write src/modules/feedback-triage/cases/*.json
 *   npm run generate:feedback-triage -- --check   fail if the committed JSON is out of date
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { triageCaseSpecs } from "@/modules/feedback-triage/content/cases";
import {
  generateTriageCase,
  themeImpact,
} from "@/modules/feedback-triage/generator";

const CASES_DIR = path.join(process.cwd(), "src/modules/feedback-triage/cases");

async function main(): Promise<void> {
  const check = process.argv.includes("--check");
  await mkdir(CASES_DIR, { recursive: true });
  let outdated = 0;

  for (const spec of triageCaseSpecs) {
    const caseData = generateTriageCase(spec);
    console.log(
      [
        caseData.id.padEnd(28),
        caseData.difficulty.padEnd(7),
        `${caseData.items.length} items`,
        caseData.hidden.themes
          .map((t) => `${t.key}:${t.itemIds.length}/${themeImpact(t)}`)
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
      `${outdated} case file(s) are out of date. Run "npm run generate:feedback-triage".`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
