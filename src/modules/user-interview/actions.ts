"use server";

import { caseRepository } from "@/modules/registry.server";

import { answerQuestion, type AskOutcome } from "./ask.server";

/** The persona's reply to the last question. `input` comes from the browser and is validated. */
export async function askInterviewee(input: unknown): Promise<AskOutcome> {
  return answerQuestion(caseRepository, input);
}
