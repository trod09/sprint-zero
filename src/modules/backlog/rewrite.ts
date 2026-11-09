/**
 * Optional polish of ticket wording with Claude.
 *
 * The generator already produces complete, playable text. This step only
 * rephrases ticket titles and descriptions so that cases built from the same
 * template do not read identically. It never touches numbers, ids or ground
 * truth, and any rewrite that changes a number in the text is discarded.
 */
import { z } from "zod";

import type { AIClient } from "@/core/ai/client";
import { dataBlock } from "@/core/ai/prompts";

import type { BacklogCase, Ticket } from "./schema";

export const ticketRewriteSchema = z.object({
  tickets: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
    }),
  ),
});
export type TicketRewrites = z.infer<typeof ticketRewriteSchema>;

const MAX_TITLE_LENGTH = 110;
const MAX_DESCRIPTION_LENGTH = 420;

export const REWRITE_SYSTEM_PROMPT = `You edit backlog tickets for Sprint Zero, a training simulation where learners practise prioritising a product backlog at a fictional company.

Each ticket was written by a different person at that company: a salesperson, a support lead, an engineer, the CEO. Rewrite the title and description of every ticket so it sounds like that person wrote it in a real issue tracker, in plain English.

The learner has to judge each ticket from its wording, so the meaning must survive exactly:
- Keep every fact, every clue and every number. Copy numbers, percentages, amounts, dates and names character for character.
- Do not add facts, urgency, opinions or hints about how valuable the ticket is. Do not soften or strengthen what the requester claims.
- Keep titles under ${MAX_TITLE_LENGTH} characters and descriptions under ${MAX_DESCRIPTION_LENGTH} characters, in one to three sentences.

Return every ticket you were given, with the same id.`;

export function buildRewritePrompt(caseData: BacklogCase): string {
  const tickets = allTickets(caseData).map((ticket) => ({
    id: ticket.id,
    requester: ticket.requester,
    type: ticket.type,
    title: ticket.title,
    description: ticket.description,
  }));
  return [
    dataBlock("company", caseData.company),
    dataBlock("tickets", tickets),
    "Rewrite the title and description of each ticket in <tickets>.",
  ].join("\n\n");
}

function allTickets(caseData: BacklogCase): Ticket[] {
  return [
    ...caseData.tickets,
    ...caseData.midSprintEvents.flatMap((event) =>
      event.addedTicket ? [event.addedTicket] : [],
    ),
  ];
}

/** Digit groups in a text, e.g. "41% of 1,200" gives ["41", "1,200"]. */
function numbersIn(text: string): string[] {
  return (text.match(/\d[\d.,]*\d|\d/g) ?? []).sort();
}

/** Why a rewrite cannot be used, or null if it is safe. */
export function findRewriteIssue(
  ticket: Pick<Ticket, "title" | "description">,
  rewrite: { title: string; description: string },
): string | null {
  const title = rewrite.title.trim();
  const description = rewrite.description.trim();
  if (!title || !description) return "empty text";
  if (title.length > MAX_TITLE_LENGTH) return "title too long";
  if (description.length > MAX_DESCRIPTION_LENGTH)
    return "description too long";
  const before = numbersIn(`${ticket.title} ${ticket.description}`);
  const after = numbersIn(`${title} ${description}`);
  if (before.join("|") !== after.join("|")) return "numbers changed";
  return null;
}

export interface RewriteReport {
  applied: string[];
  rejected: { id: string; reason: string }[];
}

/**
 * Merges rewrites into a case. Unknown ids and unsafe rewrites are skipped, so
 * the result is always a valid case with the same ground truth.
 */
export function applyTicketRewrites(
  caseData: BacklogCase,
  rewrites: TicketRewrites,
): { caseData: BacklogCase; report: RewriteReport } {
  const byId = new Map(rewrites.tickets.map((entry) => [entry.id, entry]));
  const report: RewriteReport = { applied: [], rejected: [] };

  const rewriteTicket = (ticket: Ticket): Ticket => {
    const rewrite = byId.get(ticket.id);
    if (!rewrite) {
      report.rejected.push({ id: ticket.id, reason: "missing" });
      return ticket;
    }
    const issue = findRewriteIssue(ticket, rewrite);
    if (issue) {
      report.rejected.push({ id: ticket.id, reason: issue });
      return ticket;
    }
    report.applied.push(ticket.id);
    return {
      ...ticket,
      title: rewrite.title.trim(),
      description: rewrite.description.trim(),
    };
  };

  return {
    caseData: {
      ...caseData,
      tickets: caseData.tickets.map(rewriteTicket),
      midSprintEvents: caseData.midSprintEvents.map((event) =>
        event.addedTicket
          ? { ...event, addedTicket: rewriteTicket(event.addedTicket) }
          : event,
      ),
    },
    report,
  };
}

export async function rewriteCaseTexts(
  client: AIClient,
  caseData: BacklogCase,
): Promise<{ caseData: BacklogCase; report: RewriteReport }> {
  const { data } = await client.generateStructured({
    label: "backlog.rewrite-tickets",
    schema: ticketRewriteSchema,
    system: REWRITE_SYSTEM_PROMPT,
    prompt: buildRewritePrompt(caseData),
    effort: "low",
    timeoutMs: 180_000,
  });
  return applyTicketRewrites(caseData, data);
}
