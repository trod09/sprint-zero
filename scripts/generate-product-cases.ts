/**
 * Builds the Product Case cases from their specifications.
 *
 *   npm run generate:product-case              write src/modules/product-case/cases/*.json
 *   npm run generate:product-case -- --check   fail if the committed JSON is out of date
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { productCaseSpecs } from "@/modules/product-case/content/cases";
import { generateProductCase } from "@/modules/product-case/generator";

const CASES_DIR = path.join(process.cwd(), "src/modules/product-case/cases");

async function main(): Promise<void> {
  const check = process.argv.includes("--check");
  await mkdir(CASES_DIR, { recursive: true });
  let outdated = 0;

  for (const spec of productCaseSpecs) {
    const caseData = generateProductCase(spec);
    console.log(
      [
        caseData.id.padEnd(40),
        caseData.kind.padEnd(12),
        caseData.kind === "estimation"
          ? `truth ${caseData.hidden.truth.toLocaleString("en-US")} | trap ${caseData.hidden.trapEstimate.toLocaleString("en-US")}`
          : caseData.hidden.segments.find((s) => s.fit === 3)?.id,
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
      `${outdated} case file(s) are out of date. Run "npm run generate:product-case".`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
