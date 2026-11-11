/**
 * Drafts a new PRD Writer case with Claude, checks it and saves it for review.
 *
 *   npm run draft:prd-writer -- --industry marketplace
 *   npm run draft:prd-writer -- --industry fintech --level senior --feature "Shared savings goals"
 *   npm run draft:prd-writer -- --industry saas --dry-run      print, do not save
 *
 * Options: --level apm|pm|senior (default pm), --model <id> (default
 * claude-opus-5-5: drafting runs rarely and quality matters), --rounds <n>.
 *
 * Needs ANTHROPIC_API_KEY in .env.local. A passing draft is written to
 * src/modules/prd-writer/content/specs/<key>.json. Read it, edit what you
 * do not like, then run `npm run generate:prd-writer` and `npm run check`.
 */
import { existsSync } from "node:fs";
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createAnthropicClient, isAIConfigured } from "@/core/ai";
import {
  DIFFICULTIES,
  difficultySchema,
  INDUSTRY_KEYS,
  industryKeySchema,
} from "@/core/case-engine";
import { featuredPrdSpecs } from "@/modules/prd-writer/bank";
import { prdSpecData } from "@/modules/prd-writer/content/specs";
import { DRAFT_ROUNDS, draftPrdSpec } from "@/modules/prd-writer/draft";

const SPECS_DIR = path.join(
  process.cwd(),
  "src/modules/prd-writer/content/specs",
);
const DRAFT_MODEL = "claude-opus-5-5";

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
}

const camel = (key: string) =>
  key.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** Rewrites the specs index from the JSON files in the folder. */
async function writeIndex(): Promise<void> {
  const keys = (await readdir(SPECS_DIR))
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/, ""))
    .sort();
  const source = `/**
 * PRD specifications kept as data (\`npm run draft:prd-writer\` writes them;
 * people review them as JSON). This file is rewritten by the draft script:
 * add a spec by importing its JSON below.
 */
import { prdSpecDataSchema, type PrdSpecData } from "../../spec-data";

${keys.map((key) => `import ${camel(key)} from "./${key}.json";`).join("\n")}

export const prdSpecData: readonly PrdSpecData[] = [
${keys.map((key) => `  ${camel(key)},`).join("\n")}
].map((raw) => prdSpecDataSchema.parse(raw));
`;
  await writeFile(path.join(SPECS_DIR, "index.ts"), source, "utf8");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const industry = industryKeySchema.safeParse(option(args, "industry"));
  if (!industry.success) {
    throw new Error(`--industry is required: ${INDUSTRY_KEYS.join(", ")}`);
  }
  const difficulty = difficultySchema.safeParse(option(args, "level") ?? "pm");
  if (!difficulty.success) {
    throw new Error(`--level must be one of ${DIFFICULTIES.join(", ")}`);
  }
  const rounds = Number(option(args, "rounds") ?? DRAFT_ROUNDS);
  const dryRun = args.includes("--dry-run");

  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  if (!isAIConfigured()) {
    throw new Error(
      "Drafting needs ANTHROPIC_API_KEY. Add it to .env.local and run again.",
    );
  }
  const model = option(args, "model") ?? DRAFT_MODEL;
  const client = createAnthropicClient(model);
  const example = prdSpecData[0];
  const avoid = featuredPrdSpecs.map(
    (spec) => `${spec.company.name} (${spec.feature})`,
  );

  console.log(
    `Drafting a ${difficulty.data} case for ${industry.data} with ${model}…`,
  );
  const outcome = await draftPrdSpec(
    client,
    {
      industry: industry.data,
      difficulty: difficulty.data,
      feature: option(args, "feature"),
      avoid,
    },
    example,
    rounds,
  );
  console.log(
    `${outcome.rounds} round(s), ${outcome.usage.inputTokens} input and ${outcome.usage.outputTokens} output tokens.`,
  );

  if (!outcome.data) {
    console.error("No draft passed the checks. Still wrong:");
    for (const issue of outcome.issues) console.error(`  - ${issue}`);
    process.exitCode = 1;
    return;
  }

  const json = `${JSON.stringify(outcome.data, null, 2)}\n`;
  if (dryRun) {
    console.log(json);
    return;
  }
  let key = outcome.data.key;
  for (let n = 2; existsSync(path.join(SPECS_DIR, `${key}.json`)); n++) {
    key = `${outcome.data.key}-${n}`;
  }
  const file = path.join(SPECS_DIR, `${key}.json`);
  await writeFile(
    file,
    key === outcome.data.key ? json : json.replace(outcome.data.key, key),
    "utf8",
  );
  await writeIndex();
  console.log(`Saved ${path.relative(process.cwd(), file)}.`);
  console.log(
    'Review it, then run "npm run generate:prd-writer" and "npm run check".',
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
