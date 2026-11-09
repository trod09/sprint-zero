import { describe, expect, it, vi } from "vitest";

import type { AIClient } from "@/core/ai/client";
import { backlogCaseSpecs } from "@/modules/backlog/case-specs";
import { generateBacklogCase } from "@/modules/backlog/generator";
import {
  applyTicketRewrites,
  buildRewritePrompt,
  findRewriteIssue,
  REWRITE_SYSTEM_PROMPT,
  rewriteCaseTexts,
  ticketRewriteSchema,
} from "@/modules/backlog/rewrite";
import { backlogCaseSchema } from "@/modules/backlog/schema";

const caseData = generateBacklogCase(backlogCaseSpecs[0]);
const [first, second] = caseData.tickets;
const withNumbers = caseData.tickets.find((ticket) =>
  /\d/.test(`${ticket.title} ${ticket.description}`),
)!;

describe("findRewriteIssue", () => {
  const ticket = {
    title: "Export any table to CSV",
    description: "Asked for in 9 of the last 30 sales calls, by 1,200 users.",
  };

  it("accepts a rewording that keeps every number", () => {
    expect(
      findRewriteIssue(ticket, {
        title: "CSV export for all tables",
        description:
          "1,200 users want it; it came up in 9 of our last 30 calls.",
      }),
    ).toBeNull();
  });

  it("rejects changed, dropped or invented numbers", () => {
    expect(
      findRewriteIssue(ticket, {
        title: "CSV export",
        description:
          "Asked for in 19 of the last 30 sales calls, by 1,200 users.",
      }),
    ).toBe("numbers changed");
    expect(
      findRewriteIssue(ticket, {
        title: "CSV export",
        description: "Asked for in many sales calls.",
      }),
    ).toBe("numbers changed");
    expect(
      findRewriteIssue(ticket, {
        title: "CSV export in 2 weeks",
        description: ticket.description,
      }),
    ).toBe("numbers changed");
  });

  it("rejects empty or oversized text", () => {
    expect(
      findRewriteIssue(ticket, { title: " ", description: ticket.description }),
    ).toBe("empty text");
    expect(
      findRewriteIssue(ticket, {
        title: "x".repeat(200),
        description: ticket.description,
      }),
    ).toBe("title too long");
    expect(
      findRewriteIssue(ticket, {
        title: ticket.title,
        description: `${ticket.description} ${"y".repeat(500)}`,
      }),
    ).toBe("description too long");
  });
});

describe("applyTicketRewrites", () => {
  it("replaces wording only, keeping ids, numbers and ground truth", () => {
    const { caseData: rewritten, report } = applyTicketRewrites(caseData, {
      tickets: [
        {
          id: first.id,
          title: `${first.title} (reworded)`,
          description: first.description,
        },
      ],
    });
    expect(rewritten.tickets[0].title).toBe(`${first.title} (reworded)`);
    expect(rewritten.tickets[0].hidden).toEqual(first.hidden);
    expect(rewritten.tickets[0].effort).toBe(first.effort);
    expect(rewritten.tickets[1]).toEqual(second);
    expect(report.applied).toEqual([first.id]);
    expect(report.rejected.every((entry) => entry.reason === "missing")).toBe(
      true,
    );
    expect(backlogCaseSchema.safeParse(rewritten).success).toBe(true);
  });

  it("keeps the original text when a rewrite touches a number", () => {
    const { caseData: rewritten, report } = applyTicketRewrites(caseData, {
      tickets: [
        {
          id: withNumbers.id,
          title: withNumbers.title,
          description: `${withNumbers.description} Affects 99999 users.`,
        },
      ],
    });
    const after = rewritten.tickets.find((t) => t.id === withNumbers.id);
    expect(after).toEqual(withNumbers);
    expect(report.rejected).toContainEqual({
      id: withNumbers.id,
      reason: "numbers changed",
    });
  });

  it("ignores rewrites for tickets that do not exist", () => {
    const { caseData: rewritten, report } = applyTicketRewrites(caseData, {
      tickets: [{ id: "ZZZ-1", title: "Injected", description: "Injected" }],
    });
    expect(rewritten).toEqual(caseData);
    expect(report.applied).toEqual([]);
  });

  it("also rewrites tickets added by events", () => {
    const eventTicket = caseData.midSprintEvents[0].addedTicket!;
    const { caseData: rewritten } = applyTicketRewrites(caseData, {
      tickets: [
        {
          id: eventTicket.id,
          title: "Urgent fix for the stuck payment worker",
          description: eventTicket.description,
        },
      ],
    });
    expect(rewritten.midSprintEvents[0].addedTicket?.title).toBe(
      "Urgent fix for the stuck payment worker",
    );
  });
});

describe("rewrite prompt", () => {
  it("sends wording and requester, never ground truth or numbers to score", () => {
    const prompt = buildRewritePrompt(caseData);
    expect(prompt).toContain(first.id);
    expect(prompt).toContain(first.title);
    expect(prompt).toContain(first.requester);
    for (const secret of [
      "trueValue",
      "trap",
      "hidden",
      "explanation",
      "effort",
    ]) {
      expect(prompt).not.toContain(`"${secret}"`);
    }
    expect(REWRITE_SYSTEM_PROMPT).toContain("Keep every fact");
  });
});

describe("rewriteCaseTexts", () => {
  it("asks the AI client once and merges the validated result", async () => {
    const generateStructured = vi.fn().mockResolvedValue({
      data: {
        tickets: [
          {
            id: first.id,
            title: `${first.title} now`,
            description: first.description,
          },
        ],
      },
      model: "test-model",
      attempts: 1,
      usage: { inputTokens: 1, outputTokens: 1 },
    });
    const client = { model: "test-model", generateStructured } as AIClient;

    const { caseData: rewritten, report } = await rewriteCaseTexts(
      client,
      caseData,
    );
    expect(generateStructured).toHaveBeenCalledTimes(1);
    const request = generateStructured.mock.calls[0][0];
    expect(request.label).toBe("backlog.rewrite-tickets");
    expect(request.schema).toBe(ticketRewriteSchema);
    expect(request.system).toBe(REWRITE_SYSTEM_PROMPT);
    expect(rewritten.tickets[0].title).toBe(`${first.title} now`);
    expect(report.applied).toEqual([first.id]);
  });
});
