/**
 * Answers one interview question on the server. The browser sends every
 * question asked so far; the persona's state is rebuilt from them, so
 * nothing is stored and the ground truth never leaves the server.
 */
import "server-only";

import { z } from "zod";

import type { CaseRepository } from "@/core/case-engine/case-repository";
import { caseIdSchema } from "@/core/case-engine";

import { runInterview } from "./conversation";
import {
  interviewCaseSchema,
  MAX_QUESTIONS,
  questionSchema,
  USER_INTERVIEW_MODULE_ID,
} from "./schema";

export const askRequestSchema = z.object({
  caseId: caseIdSchema,
  questions: z.array(questionSchema).min(1).max(MAX_QUESTIONS),
});

export type AskOutcome =
  | { ok: true; reply: string }
  | { ok: false; error: { code: "invalid_request" | "case_not_found" } };

export async function answerQuestion(
  repository: CaseRepository,
  input: unknown,
): Promise<AskOutcome> {
  const request = askRequestSchema.safeParse(input);
  if (!request.success) {
    return { ok: false, error: { code: "invalid_request" } };
  }
  const record = await repository.getCaseRecord(request.data.caseId);
  if (!record || record.moduleId !== USER_INTERVIEW_MODULE_ID) {
    return { ok: false, error: { code: "case_not_found" } };
  }
  const caseData = interviewCaseSchema.parse(record.reveal());
  const turns = runInterview(caseData, request.data.questions);
  return { ok: true, reply: turns.at(-1)!.reply };
}
