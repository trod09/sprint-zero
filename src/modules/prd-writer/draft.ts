/**
 * Drafts a new PRD specification with Claude. The model writes the words,
 * the ratings and the number ranges; code checks everything a fair case
 * needs (`checkPrdSpecData`, which also builds the case with several seeds)
 * and sends the problems back until the draft passes or the rounds run out.
 *
 * Runs offline from `npm run draft:prd-writer`, never while someone plays:
 * a person reviews the JSON before it reaches the game.
 */
import type { AIClient, AIUsage } from "@/core/ai";
import type { Difficulty, IndustryKey } from "@/core/case-engine";

import {
  checkPrdSpecData,
  prdSpecDataSchema,
  type PrdSpecData,
} from "./spec-data";

export const DRAFT_ROUNDS = 3;

export interface DraftRequest {
  industry: IndustryKey;
  difficulty: Difficulty;
  /** An idea for the feature; the model picks one when it is missing. */
  feature?: string;
  /** Companies and features already in the game, so drafts stay new. */
  avoid: readonly string[];
}

export interface DraftOutcome {
  /** The draft that passed every check, or `null` when none did. */
  data: PrdSpecData | null;
  /** What was still wrong after the last round. */
  issues: string[];
  rounds: number;
  usage: AIUsage;
}

const LEVELS: Record<Difficulty, string> = {
  apm: "APM: a clear problem, documents that mostly agree, obvious non-goals.",
  pm: "PM: one document pulls in a misleading direction (a vanity metric, a pet feature), and one constraint changes the scope.",
  senior:
    "Senior: documents conflict, the right metric is not the one leadership names, and a constraint (legal, supply, platform) decides what is out.",
};

export const DRAFT_SYSTEM = `You write practice cases for product managers. A case is a brief plus the documents a PM would gather (a memo, data, an email from leadership, notes from legal, engineering or operations). The learner reads them and writes a one-pager: the problem with its evidence, a success metric with baseline, target and horizon, what is in version 1, later or out, and the main risks. Code scores the structured choices, so your ratings must have one clearly best answer that the documents justify.

Rules:
- Numbers are never written directly in texts. Declare each one in "numbers" with a range (min, max, step) and write {name} where it appears. Values computed from others go in "derived" as arithmetic with + - * / and parentheses, e.g. "baseline + lift".
- "baseline" is an expression for the primary metric's current value, and a document must state it with {name}. "targetMin" and "targetMax" bound the target the documents support (usually around a goal leadership names) and must not include the baseline.
- Evidence: exactly three pieces rated 2 (direct, recent, about this problem), one rated 1 (context) and the rest 0 (anecdotes, unrelated). Risks: exactly three rated 2 (raised by the documents), one rated 1 and the rest 0. Explain every rating in "why", citing the documents.
- Requirements: at least one in "v1", one in "later" and one in "out". Something must be "out" because a document rules it out (a licence, insurance, a law, a contract).
- One metric is the outcome the problem hurts (the primary); the others are tempting but wrong: an output, a vanity number, something too slow or noisy.
- Ids are snake_case; "key" is kebab-case and starts with the company name.
- Plain, concrete English. No real companies or people. Every claim the ideal one-pager makes must be in the documents.`;

function draftPrompt(request: DraftRequest, example: PrdSpecData): string {
  return [
    `Write a new case for the "${request.industry}" industry at this level:`,
    LEVELS[request.difficulty],
    request.feature
      ? `The feature: ${request.feature}.`
      : "Pick a feature a real product team in this industry would plausibly write a one-pager for.",
    request.avoid.length > 0
      ? `Do not reuse these companies or features: ${request.avoid.join("; ")}.`
      : "",
    "",
    "This is a finished case in the same format, for reference only. Write a different company, feature and problem:",
    JSON.stringify(example),
  ]
    .filter(Boolean)
    .join("\n");
}

function repairPrompt(
  request: DraftRequest,
  draft: PrdSpecData,
  issues: readonly string[],
): string {
  return [
    `You drafted this case for the "${request.industry}" industry:`,
    JSON.stringify(draft),
    "",
    "It does not pass the checks:",
    ...issues.map((issue) => `- ${issue}`),
    "",
    "Return the whole case again with these problems fixed. Keep everything that already works.",
  ].join("\n");
}

export async function draftPrdSpec(
  client: AIClient,
  request: DraftRequest,
  example: PrdSpecData,
  rounds = DRAFT_ROUNDS,
): Promise<DraftOutcome> {
  const usage: AIUsage = { inputTokens: 0, outputTokens: 0 };
  let previous: PrdSpecData | null = null;
  let issues: string[] = [];

  for (let round = 1; round <= rounds; round++) {
    const result = await client.generateStructured({
      label: "prd-writer.draft",
      schema: prdSpecDataSchema,
      system: DRAFT_SYSTEM,
      prompt:
        previous === null
          ? draftPrompt(request, example)
          : repairPrompt(request, previous, issues),
      effort: "high",
      maxTokens: 16_000,
      timeoutMs: 300_000,
    });
    usage.inputTokens += result.usage.inputTokens;
    usage.outputTokens += result.usage.outputTokens;

    // The request decides these; the model does not get to change them.
    const draft: PrdSpecData = {
      ...result.data,
      industry: request.industry,
      difficulty: request.difficulty,
    };
    issues = checkPrdSpecData(draft);
    if (issues.length === 0) {
      return { data: draft, issues: [], rounds: round, usage };
    }
    previous = draft;
  }
  return { data: null, issues, rounds, usage };
}
