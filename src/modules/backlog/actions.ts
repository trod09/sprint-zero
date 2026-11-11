"use server";

import { allowAction } from "@/lib/action-guard.server";
import { caseRepository } from "@/modules/registry.server";

import {
  revealMidSprintEvents,
  type RevealEventsOutcome,
} from "./events.server";

/**
 * Starts the sprint: returns what happens mid-sprint. Called once the learner
 * commits a first plan; `input` comes from the browser and is validated.
 */
export async function revealBacklogEvents(
  input: unknown,
): Promise<RevealEventsOutcome> {
  if (!(await allowAction())) {
    return { ok: false, error: { code: "invalid_request" } };
  }
  return revealMidSprintEvents(caseRepository, input);
}
