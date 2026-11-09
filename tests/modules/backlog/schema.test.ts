import { describe, expect, it } from "vitest";

import { backlogCaseSpecs } from "@/modules/backlog/case-specs";
import { generateBacklogCase } from "@/modules/backlog/generator";
import {
  backlogAnswerSchema,
  backlogCaseSchema,
  findCaseIssues,
  ticketSchema,
  type BacklogCase,
  type Ticket,
} from "@/modules/backlog/schema";

import { makeTicket } from "../../fixtures/backlog";

const valid = generateBacklogCase(backlogCaseSpecs[0]);

/** A copy of the valid case with its first ticket changed. */
function withFirstTicket(change: (ticket: Ticket) => Ticket): BacklogCase {
  const [first, ...rest] = valid.tickets;
  return { ...valid, tickets: [change(structuredClone(first)), ...rest] };
}

function issuesOf(caseData: BacklogCase): string {
  return findCaseIssues(caseData).join(" | ");
}

describe("ticket schema", () => {
  it("accepts a well-formed ticket", () => {
    expect(ticketSchema.safeParse(makeTicket("PAY-142")).success).toBe(true);
  });

  it("rejects efforts outside the story point scale and malformed ids", () => {
    expect(
      ticketSchema.safeParse(makeTicket("PAY-142", { effort: 4 })).success,
    ).toBe(false);
    expect(ticketSchema.safeParse(makeTicket("pay-142")).success).toBe(false);
    expect(ticketSchema.safeParse(makeTicket("PAY142")).success).toBe(false);
  });

  it("rejects a real value outside 0..100", () => {
    expect(
      ticketSchema.safeParse(makeTicket("PAY-1", { value: 101 })).success,
    ).toBe(false);
  });
});

describe("case integrity", () => {
  it("accepts a generated case", () => {
    expect(findCaseIssues(valid)).toEqual([]);
    expect(backlogCaseSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects duplicate ticket ids", () => {
    const broken = withFirstTicket((ticket) => ({
      ...ticket,
      id: valid.tickets[1].id,
    }));
    expect(issuesOf(broken)).toContain("Duplicate ticket id");
    expect(backlogCaseSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects tickets from unknown stakeholders", () => {
    const broken = withFirstTicket((ticket) => ({
      ...ticket,
      stakeholderId: "ghost",
    }));
    expect(issuesOf(broken)).toContain('unknown stakeholder "ghost"');
  });

  it("requires duplicateOf exactly when the trap is a duplicate", () => {
    const missing = withFirstTicket((ticket) => ({
      ...ticket,
      hidden: {
        ...ticket.hidden,
        critical: false,
        trap: "duplicate",
        duplicateOf: undefined,
      },
    }));
    expect(issuesOf(missing)).toContain('"duplicateOf" must be set exactly');

    const dangling = withFirstTicket((ticket) => ({
      ...ticket,
      hidden: {
        ...ticket.hidden,
        critical: false,
        trap: "duplicate",
        duplicateOf: "ZZZ-999",
      },
    }));
    expect(issuesOf(dangling)).toContain("duplicates unknown ticket");
  });

  it("requires hidden critical bugs to be critical, and other traps not to be", () => {
    const notCritical = withFirstTicket((ticket) => ({
      ...ticket,
      hidden: {
        ...ticket.hidden,
        trap: "hidden_critical_bug",
        critical: false,
        duplicateOf: undefined,
      },
    }));
    expect(issuesOf(notCritical)).toContain("must be critical");

    const criticalVanity = withFirstTicket((ticket) => ({
      ...ticket,
      hidden: {
        ...ticket.hidden,
        trap: "vanity",
        critical: true,
        duplicateOf: undefined,
      },
    }));
    expect(issuesOf(criticalVanity)).toContain("cannot be critical");
  });

  it("rejects a sprint that cannot hold its critical tickets", () => {
    expect(issuesOf({ ...valid, sprintCapacity: 8 })).toContain(
      "Critical tickets do not fit",
    );
  });

  it("rejects events that change nothing", () => {
    const [event] = valid.midSprintEvents;
    const broken = {
      ...valid,
      midSprintEvents: [{ ...event, capacityDelta: 0, addedTicket: undefined }],
    };
    expect(issuesOf(broken)).toContain("changes nothing");
  });

  it("rejects backlogs outside 20 to 40 tickets", () => {
    const tooFew = { ...valid, tickets: valid.tickets.slice(0, 19) };
    expect(backlogCaseSchema.safeParse(tooFew).success).toBe(false);
  });
});

describe("answer schema", () => {
  it("accepts an ordered list of distinct ticket ids", () => {
    expect(
      backlogAnswerSchema.safeParse({ sprintTicketIds: ["PAY-1", "PAY-2"] })
        .success,
    ).toBe(true);
    expect(backlogAnswerSchema.safeParse({ sprintTicketIds: [] }).success).toBe(
      true,
    );
  });

  it("rejects repeated ids, malformed ids and missing fields", () => {
    expect(
      backlogAnswerSchema.safeParse({ sprintTicketIds: ["PAY-1", "PAY-1"] })
        .success,
    ).toBe(false);
    expect(
      backlogAnswerSchema.safeParse({ sprintTicketIds: ["<script>"] }).success,
    ).toBe(false);
    expect(backlogAnswerSchema.safeParse({}).success).toBe(false);
  });
});
