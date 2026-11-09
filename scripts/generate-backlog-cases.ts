/**
 * Builds the pregenerated Backlog Simulator cases.
 *
 *   npm run generate:backlog              deterministic cases from the content bank
 *   npm run generate:backlog -- --check   fail if the committed JSON is out of date
 *   npm run generate:backlog -- --rewrite also polish ticket wording with Claude
 *                                         (needs ANTHROPIC_API_KEY in .env.local)
 *
 * Numbers, ids and ground truth always come from the seeded generator. The
 * optional rewrite only rephrases ticket titles and descriptions.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getAIClient, isAIConfigured } from "@/core/ai/anthropic";
import { backlogCaseSpecs } from "@/modules/backlog/case-specs";
import { generateBacklogCase } from "@/modules/backlog/generator";
import {
  initialScenario,
  scenarioAfterEvents,
  solveOptimalSprint,
} from "@/modules/backlog/plan";
import { rewriteCaseTexts } from "@/modules/backlog/rewrite";
import { backlogCaseSchema, type BacklogCase } from "@/modules/backlog/schema";

const CASES_DIR = path.join(process.cwd(), "src/modules/backlog/cases");

function serialize(caseData: BacklogCase): string {
  return `${JSON.stringify(caseData, null, 2)}\n`;
}

function summarize(caseData: BacklogCase): string {
  const initial = solveOptimalSprint(initialScenario(caseData));
  const final = solveOptimalSprint(scenarioAfterEvents(caseData));
  const traps = caseData.tickets.filter((t) => t.hidden.trap !== "none").length;
  return [
    caseData.id.padEnd(24),
    caseData.difficulty.padEnd(7),
    `${caseData.tickets.length} tickets`,
    `${traps} traps`,
    `capacity ${caseData.sprintCapacity}`,
    `optimal ${initial.value} -> ${final.value}`,
    `events: ${caseData.midSprintEvents.map((e) => e.type).join(", ")}`,
  ].join(" | ");
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const check = args.has("--check");
  const rewrite = args.has("--rewrite");

  if (rewrite) {
    if (existsSync(".env.local")) process.loadEnvFile(".env.local");
    if (!isAIConfigured()) {
      throw new Error(
        "--rewrite needs ANTHROPIC_API_KEY. Add it to .env.local and run again.",
      );
    }
  }

  await mkdir(CASES_DIR, { recursive: true });
  let outdated = 0;

  for (const spec of backlogCaseSpecs) {
    let caseData = generateBacklogCase(spec);

    if (rewrite) {
      const result = await rewriteCaseTexts(getAIClient(), caseData);
      // The rewrite must never produce an invalid case.
      caseData = backlogCaseSchema.parse(result.caseData);
      console.log(
        `  rewrite: ${result.report.applied.length} applied, ${result.report.rejected.length} kept as written`,
      );
    }

    const file = path.join(CASES_DIR, `${spec.caseId}.json`);
    const content = serialize(caseData);
    if (check) {
      const current = existsSync(file) ? await readFile(file, "utf8") : "";
      if (current !== content) {
        outdated += 1;
        console.error(`out of date: ${path.relative(process.cwd(), file)}`);
      }
    } else {
      await writeFile(file, content, "utf8");
    }
    console.log(summarize(caseData));
  }

  if (check && outdated > 0) {
    throw new Error(
      `${outdated} case file(s) are out of date. Run "npm run generate:backlog".`,
    );
  }
  console.log(
    check
      ? "All case files are up to date."
      : `Wrote ${backlogCaseSpecs.length} cases to ${path.relative(process.cwd(), CASES_DIR)}`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
