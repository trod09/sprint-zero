/**
 * Builds the PRD Writer cases from their specifications.
 *
 *   npm run generate:prd-writer              write src/modules/prd-writer/cases/*.json
 *   npm run generate:prd-writer -- --check   fail if the committed JSON is out of date
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { featuredPrdSpecs } from "@/modules/prd-writer/bank";
import { generatePrdCase } from "@/modules/prd-writer/generator";

const CASES_DIR = path.join(process.cwd(), "src/modules/prd-writer/cases");

const camel = (id: string) =>
  id
    .replace(/^prd-writer-/, "")
    .replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** The cases index, written by this script so new specs are picked up. */
function indexSource(ids: readonly string[]): string {
  const imports = ids
    .map((id) => `import ${camel(id)} from "./${id}.json";`)
    .sort()
    .join("\n");
  return `/**
 * Pregenerated PRD Writer cases (\`npm run generate:prd-writer\`). Server only:
 * they hold the ratings, the right scope and the ideal one-pager. This file
 * is written by the script.
 */
import "server-only";

${imports}

export const prdRawCases: readonly unknown[] = [
${ids.map((id) => `  ${camel(id)},`).join("\n")}
];
`;
}

async function main(): Promise<void> {
  const check = process.argv.includes("--check");
  await mkdir(CASES_DIR, { recursive: true });
  let outdated = 0;

  for (const spec of featuredPrdSpecs) {
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

  const index = indexSource(featuredPrdSpecs.map((spec) => spec.id));
  const indexFile = path.join(CASES_DIR, "index.ts");
  if (check) {
    const current = existsSync(indexFile)
      ? await readFile(indexFile, "utf8")
      : "";
    if (current !== index) {
      outdated += 1;
      console.error(`out of date: ${path.relative(process.cwd(), indexFile)}`);
    }
  } else {
    await writeFile(indexFile, index, "utf8");
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
