"use server";

import { allowAction } from "@/lib/action-guard.server";
import { caseRepository } from "@/modules/registry.server";

import { answerQuestion, type AskOutcome } from "./ask.server";

/** The persona's reply to the last question. `input` comes from the browser and is validated. */
export async function askInterviewee(input: unknown): Promise<AskOutcome> {
  if (!(await allowAction())) {
    return { ok: false, error: { code: "invalid_request" } };
  }
  return answerQuestion(caseRepository, input);
}
