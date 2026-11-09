/**
 * Claude client for structured (JSON) generation.
 *
 * The LLM only writes text: narrative, tickets, qualitative feedback. Numbers
 * and scores come from deterministic code. Every output is constrained to a
 * JSON schema by the API and then validated again with Zod; one corrective
 * retry is made if that validation fails.
 *
 * The API transport is injected so the logic is unit-tested without network.
 */
import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

import {
  AIRefusalError,
  AIRequestError,
  AITruncatedError,
  AIValidationError,
  type AIErrorCode,
} from "./errors";

export const DEFAULT_MODEL = "claude-sonnet-5-5";

/** One original request plus one corrective retry. */
export const MAX_ATTEMPTS = 2;

/**
 * Opt-in beta: if the model declines for policy reasons, the API re-runs the
 * request on the model's default fallback inside the same call. Models without
 * fallback support simply ignore it.
 */
const SERVER_SIDE_FALLBACK_BETA = "server-side-fallback-2026-07-01";

const DEFAULT_MAX_TOKENS = 16_000;
const DEFAULT_TIMEOUT_MS = 90_000;

type BetaMessage = Anthropic.Beta.Messages.BetaMessage;
type BetaMessageParam = Anthropic.Beta.Messages.BetaMessageParam;
export type MessageCreateParams =
  Anthropic.Beta.Messages.MessageCreateParamsNonStreaming;

/** The single SDK call this client needs; mocked in tests. */
export interface MessagesTransport {
  create(
    params: MessageCreateParams,
    options?: { timeout?: number },
  ): Promise<BetaMessage>;
}

export type AIEffort = "low" | "medium" | "high";

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
}

/** One entry per `generateStructured` call, for cost tracking. */
export interface AICallLog {
  label: string;
  model: string;
  attempts: number;
  usage: AIUsage;
  outcome: "ok" | AIErrorCode;
}

export interface StructuredRequest<TSchema extends z.ZodType> {
  /** Identifies the call in logs, e.g. "backlog.feedback". */
  label: string;
  schema: TSchema;
  system?: string;
  prompt: string;
  maxTokens?: number;
  /** Thinking depth and token spend. Defaults to "medium". */
  effort?: AIEffort;
  timeoutMs?: number;
}

export interface StructuredResult<T> {
  data: T;
  /** The model that produced the output (differs from the request if a fallback ran). */
  model: string;
  attempts: number;
  /** Tokens summed over all attempts. */
  usage: AIUsage;
}

export interface AIClient {
  readonly model: string;
  generateStructured<TSchema extends z.ZodType>(
    request: StructuredRequest<TSchema>,
  ): Promise<StructuredResult<z.infer<TSchema>>>;
}

export interface AIClientOptions {
  transport: MessagesTransport;
  model?: string;
  log?: (entry: AICallLog) => void;
}

type Validation<T> = { ok: true; data: T } | { ok: false; issues: string[] };

function validateOutput<TSchema extends z.ZodType>(
  schema: TSchema,
  text: string,
): Validation<z.infer<TSchema>> {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, issues: ["The response is not valid JSON."] };
  }
  const parsed = schema.safeParse(json);
  if (parsed.success) return { ok: true, data: parsed.data };
  return {
    ok: false,
    issues: parsed.error.issues.map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    }),
  };
}

function retryPrompt(issues: readonly string[]): string {
  return [
    "Your previous response did not pass validation:",
    ...issues.map((issue) => `- ${issue}`),
    "",
    "Return the complete JSON object again with these problems fixed.",
  ].join("\n");
}

function toRequestError(error: unknown): AIRequestError {
  if (error instanceof Anthropic.APIError) {
    return new AIRequestError(
      `Claude API request failed: ${error.message}`,
      typeof error.status === "number" ? error.status : undefined,
      { cause: error },
    );
  }
  const message = error instanceof Error ? error.message : String(error);
  return new AIRequestError(
    `Claude API request failed: ${message}`,
    undefined,
    { cause: error },
  );
}

function defaultLog(entry: AICallLog): void {
  console.info(`[ai] ${JSON.stringify(entry)}`);
}

export function createAIClient(options: AIClientOptions): AIClient {
  const { transport, log = defaultLog } = options;
  const model = options.model?.trim() || DEFAULT_MODEL;

  return {
    model,
    async generateStructured<TSchema extends z.ZodType>(
      request: StructuredRequest<TSchema>,
    ): Promise<StructuredResult<z.infer<TSchema>>> {
      const outputFormat = betaZodOutputFormat(request.schema);
      const messages: BetaMessageParam[] = [
        { role: "user", content: request.prompt },
      ];
      const usage: AIUsage = { inputTokens: 0, outputTokens: 0 };
      let attempts = 0;
      let issues: string[] = [];

      const finish = (outcome: AICallLog["outcome"], usedModel = model) =>
        log({
          label: request.label,
          model: usedModel,
          attempts,
          usage,
          outcome,
        });

      while (attempts < MAX_ATTEMPTS) {
        attempts += 1;

        let response: BetaMessage;
        try {
          // No `temperature` or `thinking`: current models reject sampling
          // parameters and think adaptively. Depth is controlled by `effort`.
          response = await transport.create(
            {
              model,
              max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
              ...(request.system ? { system: request.system } : {}),
              messages,
              output_config: {
                effort: request.effort ?? "medium",
                format: {
                  type: outputFormat.type,
                  schema: outputFormat.schema,
                },
              },
              betas: [SERVER_SIDE_FALLBACK_BETA],
              fallbacks: "default",
            },
            { timeout: request.timeoutMs ?? DEFAULT_TIMEOUT_MS },
          );
        } catch (error) {
          finish("request_failed");
          throw toRequestError(error);
        }

        usage.inputTokens += response.usage.input_tokens;
        usage.outputTokens += response.usage.output_tokens;

        if (response.stop_reason === "refusal") {
          finish("refusal", response.model);
          throw new AIRefusalError(response.stop_details?.category ?? null);
        }
        if (response.stop_reason === "max_tokens") {
          finish("truncated", response.model);
          throw new AITruncatedError();
        }

        const text = response.content
          .flatMap((block) => (block.type === "text" ? [block.text] : []))
          .join("");
        const validation = validateOutput(request.schema, text);
        if (validation.ok) {
          finish("ok", response.model);
          return {
            data: validation.data,
            model: response.model,
            attempts,
            usage,
          };
        }

        issues = validation.issues;
        // Append only: the assistant turn goes back unchanged (thinking blocks
        // included), followed by the validation errors.
        messages.push(
          { role: "assistant", content: response.content },
          { role: "user", content: retryPrompt(issues) },
        );
      }

      finish("invalid_output");
      throw new AIValidationError(issues, attempts);
    },
  };
}
