/**
 * Reveals the mid-sprint events of a case once the learner has committed a
 * sprint. Only the public view of each event leaves the server: the guidance
 * on how to handle it stays hidden until the final submit.
 */
import "server-only";

import { z } from "zod";

import { caseIdSchema } from "@/core/case-engine";
import type { CaseRepository } from "@/core/case-engine/case-repository";

import { toPublicEvent } from "./public";
import {
  BACKLOG_MODULE_ID,
  backlogCaseSchema,
  ticketIdSchema,
  type PublicMidSprintEvent,
} from "./schema";

export const revealEventsRequestSchema = z.object({
  caseId: caseIdSchema,
  /** The committed sprint. Events only happen once a sprint has started. */
  sprintTicketIds: z.array(ticketIdSchema).min(1).max(60),
});

export type RevealEventsOutcome =
  | { ok: true; events: PublicMidSprintEvent[] }
  | { ok: false; error: { code: "invalid_request" | "case_not_found" } };

export async function revealMidSprintEvents(
  repository: CaseRepository,
  input: unknown,
): Promise<RevealEventsOutcome> {
  const request = revealEventsRequestSchema.safeParse(input);
  if (!request.success) {
    return { ok: false, error: { code: "invalid_request" } };
  }
  const record = await repository.getCaseRecord(request.data.caseId);
  if (!record || record.moduleId !== BACKLOG_MODULE_ID) {
    return { ok: false, error: { code: "case_not_found" } };
  }
  const caseData = backlogCaseSchema.parse(record.reveal());
  return { ok: true, events: caseData.midSprintEvents.map(toPublicEvent) };
}
