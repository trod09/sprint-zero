/**
 * Public views of Backlog Simulator data: what the browser may see before the
 * learner has finished. Everything under `hidden` is dropped, and mid-sprint
 * events are withheld until the first sprint is committed.
 */
import type {
  BacklogCase,
  MidSprintEvent,
  PublicBacklogCase,
  PublicMidSprintEvent,
  PublicTicket,
  Ticket,
} from "./schema";

export function toPublicTicket(ticket: Ticket): PublicTicket {
  const { hidden: _truth, ...publicTicket } = ticket;
  return publicTicket;
}

export function toPublicEvent(event: MidSprintEvent): PublicMidSprintEvent {
  const { hidden: _truth, addedTicket, ...publicEvent } = event;
  return addedTicket
    ? { ...publicEvent, addedTicket: toPublicTicket(addedTicket) }
    : publicEvent;
}

export function toPublicBacklogCase(caseData: BacklogCase): PublicBacklogCase {
  const { hidden: _truth, midSprintEvents, tickets, ...rest } = caseData;
  return {
    ...rest,
    tickets: tickets.map(toPublicTicket),
    eventCount: midSprintEvents.length,
  };
}
