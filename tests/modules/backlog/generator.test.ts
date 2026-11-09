import { describe, expect, it } from "vitest";

import { assertNoHiddenKeys, DIFFICULTIES } from "@/core/case-engine";
import { backlogCaseSpecs } from "@/modules/backlog/case-specs";
import {
  allTicketTemplates,
  companies,
  eventPool,
  eventTemplates,
  GENERIC_EXCLUSIONS,
  INDUSTRIES,
  ticketPool,
} from "@/modules/backlog/content";
import { genericTickets } from "@/modules/backlog/content/generic";
import {
  DIFFICULTY_PROFILES,
  findFairnessIssue,
  generateBacklogCase,
} from "@/modules/backlog/generator";
import {
  initialScenario,
  scenarioAfterEvents,
  solveOptimalSprint,
} from "@/modules/backlog/plan";
import { toPublicBacklogCase } from "@/modules/backlog/public";
import {
  backlogCaseSchema,
  EFFORT_POINTS,
  publicBacklogCaseSchema,
  type BacklogCase,
  type Ticket,
} from "@/modules/backlog/schema";

const base = backlogCaseSpecs[0];
const allCases = backlogCaseSpecs.map((spec) => generateBacklogCase(spec));

function everyTicket(caseData: BacklogCase): Ticket[] {
  return [
    ...caseData.tickets,
    ...caseData.midSprintEvents.flatMap((event) =>
      event.addedTicket ? [event.addedTicket] : [],
    ),
  ];
}

function countTrap(caseData: BacklogCase, trap: Ticket["hidden"]["trap"]) {
  return caseData.tickets.filter((ticket) => ticket.hidden.trap === trap)
    .length;
}

describe("content bank", () => {
  it("has unique template keys", () => {
    const keys = [
      ...allTicketTemplates().map((template) => template.key),
      ...eventTemplates.map((template) => template.key),
      ...companies.map((company) => company.key),
    ];
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("only excludes generic tickets that exist", () => {
    const genericKeys = new Set(genericTickets.map((template) => template.key));
    for (const keys of Object.values(GENERIC_EXCLUSIONS)) {
      for (const key of keys) expect(genericKeys, key).toContain(key);
    }
  });

  it("gives every ticket valid ranges and a requester the company has", () => {
    for (const company of companies) {
      const roles = new Set(company.stakeholders.map((entry) => entry.role));
      const templates = [
        ...ticketPool(company.industry),
        ...eventPool(company.industry).flatMap((event) =>
          event.ticket ? [event.ticket] : [],
        ),
      ];
      for (const template of templates) {
        const where = `${template.key} at ${company.key}`;
        expect(roles, where).toContain(template.by);
        if (template.duplicate) {
          expect(roles, where).toContain(template.duplicate.by);
        }
        const [min, max] = template.value;
        expect(min, where).toBeGreaterThanOrEqual(0);
        expect(max, where).toBeLessThanOrEqual(100);
        expect(min, where).toBeLessThanOrEqual(max);
        expect(template.effort.length, where).toBeGreaterThan(0);
        for (const effort of template.effort) {
          expect(EFFORT_POINTS, where).toContain(effort);
        }
        if (template.debt) {
          expect(template.debt[0], where).toBeLessThanOrEqual(template.debt[1]);
        }
      }
    }
  });

  it("writes traps so their real value stays low and critical work high", () => {
    for (const template of allTicketTemplates()) {
      const trap = template.trap ?? "none";
      if (template.critical) {
        expect(template.value[0], template.key).toBeGreaterThanOrEqual(75);
      } else if (trap !== "none") {
        expect(template.value[1], template.key).toBeLessThanOrEqual(40);
      }
      if (trap === "hidden_critical_bug") {
        expect(template.critical, template.key).toBe(true);
      }
      if (template.duplicate) {
        expect(trap, template.key).toBe("none");
        expect(template.critical ?? false, template.key).toBe(false);
      }
    }
  });

  it("covers the four industries with companies", () => {
    expect(new Set(companies.map((company) => company.industry))).toEqual(
      new Set(INDUSTRIES),
    );
  });
});

describe("generateBacklogCase", () => {
  it("is deterministic: same options, same case", () => {
    expect(generateBacklogCase(base)).toEqual(generateBacklogCase(base));
    expect(JSON.stringify(generateBacklogCase(base))).toBe(
      JSON.stringify(allCases[0]),
    );
  });

  it("produces a different case for a different seed", () => {
    const other = generateBacklogCase({ ...base, seed: base.seed + 1 });
    expect(other.tickets.map((ticket) => ticket.title)).not.toEqual(
      allCases[0].tickets.map((ticket) => ticket.title),
    );
    expect(other.seed).toBe(base.seed + 1);
  });

  it("follows the profile of each difficulty", () => {
    for (const caseData of allCases) {
      const profile = DIFFICULTY_PROFILES[caseData.difficulty];
      const where = caseData.id;
      expect(caseData.tickets.length, where).toBeGreaterThanOrEqual(
        profile.tickets[0],
      );
      expect(caseData.tickets.length, where).toBeLessThanOrEqual(
        profile.tickets[1],
      );
      expect(countTrap(caseData, "duplicate"), where).toBe(profile.duplicates);
      expect(countTrap(caseData, "single_customer"), where).toBe(
        profile.singleCustomer,
      );
      expect(countTrap(caseData, "vanity"), where).toBe(profile.vanity);
      expect(countTrap(caseData, "low_evidence"), where).toBe(
        profile.lowEvidence,
      );
      expect(countTrap(caseData, "hidden_critical_bug"), where).toBe(
        profile.hiddenCritical,
      );
      expect(
        caseData.tickets.filter((ticket) => ticket.hidden.critical).length,
        where,
      ).toBe(profile.obviousCritical + profile.hiddenCritical);
      expect(caseData.midSprintEvents.length, where).toBe(profile.events);
    }
  });

  it("makes harder cases tighter on capacity", () => {
    const share = (caseData: BacklogCase) =>
      caseData.sprintCapacity /
      caseData.tickets.reduce((sum, ticket) => sum + ticket.effort, 0);
    for (const caseData of allCases) {
      const [min, max] = DIFFICULTY_PROFILES[caseData.difficulty].capacityShare;
      expect(share(caseData), caseData.id).toBeGreaterThan(min - 0.02);
      expect(share(caseData), caseData.id).toBeLessThan(max + 0.02);
    }
  });

  it("produces valid, fair cases", () => {
    for (const caseData of allCases) {
      expect(backlogCaseSchema.safeParse(caseData).success, caseData.id).toBe(
        true,
      );
      expect(findFairnessIssue(caseData), caseData.id).toBeNull();
    }
  });

  it("keeps trap tickets out of the best sprint, before and after events", () => {
    for (const caseData of allCases) {
      for (const scenario of [
        initialScenario(caseData),
        scenarioAfterEvents(caseData),
      ]) {
        const optimal = solveOptimalSprint(scenario);
        const chosen = scenario.tickets.filter((ticket) =>
          optimal.ticketIds.includes(ticket.id),
        );
        for (const ticket of chosen) {
          expect(["none", "hidden_critical_bug"], ticket.id).toContain(
            ticket.hidden.trap,
          );
        }
        const criticals = scenario.tickets.filter((t) => t.hidden.critical);
        for (const ticket of criticals) {
          expect(optimal.ticketIds, ticket.id).toContain(ticket.id);
        }
        // There is always a real choice to make.
        expect(chosen.length).toBeLessThan(scenario.tickets.length / 1.5);
        expect(optimal.effort).toBeGreaterThan(scenario.capacity * 0.9);
      }
    }
  });

  it("leaves no template placeholders in any text", () => {
    for (const caseData of allCases) {
      expect(JSON.stringify(caseData), caseData.id).not.toMatch(/\{\w+\}/);
    }
  });

  it("links every ticket to a stakeholder and labels the requester", () => {
    for (const caseData of allCases) {
      const byId = new Map(caseData.stakeholders.map((s) => [s.id, s]));
      for (const ticket of everyTicket(caseData)) {
        const stakeholder = byId.get(ticket.stakeholderId);
        expect(stakeholder, ticket.id).toBeDefined();
        expect(ticket.requester, ticket.id).toContain(stakeholder!.name);
      }
      const names = caseData.stakeholders.map((s) => s.name);
      expect(new Set(names).size, caseData.id).toBe(names.length);
    }
  });

  it("makes a duplicate worth the same as its original and never cheaper to spot by id", () => {
    for (const caseData of allCases) {
      const byId = new Map(caseData.tickets.map((t) => [t.id, t]));
      for (const ticket of caseData.tickets) {
        if (ticket.hidden.trap !== "duplicate") continue;
        const original = byId.get(ticket.hidden.duplicateOf!);
        expect(original, ticket.id).toBeDefined();
        expect(ticket.hidden.trueValue).toBe(original!.hidden.trueValue);
        expect(ticket.effort).toBeGreaterThanOrEqual(original!.effort);
        expect(ticket.title).not.toBe(original!.title);
        expect(ticket.hidden.explanation).toContain(original!.id);
      }
    }
  });

  it("keeps every number in a sensible range", () => {
    for (const caseData of allCases) {
      for (const ticket of everyTicket(caseData)) {
        const { visible, hidden } = ticket;
        if (visible.reach !== undefined) {
          expect(visible.reach, ticket.id).toBeLessThanOrEqual(
            caseData.activeUsers,
          );
        }
        if (visible.revenueAtRisk !== undefined) {
          expect(visible.revenueAtRisk, ticket.id).toBeLessThan(
            caseData.baselineMetrics.revenue * 12 * 0.1,
          );
        }
        for (const effect of Object.values(hidden.metricEffects)) {
          expect(effect, ticket.id).toBeGreaterThanOrEqual(0);
        }
        expect(hidden.metricEffects.revenue, ticket.id).toBeLessThan(
          caseData.baselineMetrics.revenue * 0.03,
        );
      }
    }
  });

  it("can build a fair case for every company at every difficulty", () => {
    for (const company of companies) {
      for (const difficulty of DIFFICULTIES) {
        const caseData = generateBacklogCase({
          caseId: `test-${company.key}-${difficulty}`,
          companyKey: company.key,
          difficulty,
          seed: 7,
        });
        expect(findFairnessIssue(caseData)).toBeNull();
        expect(caseData.company.name).toBe(company.name);
      }
    }
  });

  it("rejects unknown companies and events", () => {
    expect(() => generateBacklogCase({ ...base, companyKey: "nope" })).toThrow(
      /Unknown company/,
    );
    expect(() =>
      generateBacklogCase({ ...base, eventKeys: ["outage-saas"] }),
    ).toThrow(/not available/);
  });
});

describe("public view of a case", () => {
  it("contains no ground truth and no event content", () => {
    for (const caseData of allCases) {
      const publicCase = toPublicBacklogCase(caseData);
      assertNoHiddenKeys(publicCase);
      expect(publicBacklogCaseSchema.safeParse(publicCase).success).toBe(true);

      const serialized = JSON.stringify(publicCase);
      for (const secret of [
        "trueValue",
        "trap",
        "duplicateOf",
        "metricEffects",
        "explanation",
        "midSprintEvents",
        "keyInsight",
        "guidance",
      ]) {
        expect(serialized, `${caseData.id}: ${secret}`).not.toContain(
          `"${secret}":`,
        );
      }
      for (const event of caseData.midSprintEvents) {
        expect(serialized).not.toContain(event.title);
        if (event.addedTicket) {
          expect(serialized).not.toContain(event.addedTicket.id);
        }
      }
      expect(publicCase.eventCount).toBe(caseData.midSprintEvents.length);
      expect(publicCase.tickets).toHaveLength(caseData.tickets.length);
    }
  });

  it("strips unknown keys even if a case document carries extra data", () => {
    const publicCase = toPublicBacklogCase(allCases[0]);
    const parsed = publicBacklogCaseSchema.parse({
      ...publicCase,
      midSprintEvents: allCases[0].midSprintEvents,
    });
    expect(parsed).not.toHaveProperty("midSprintEvents");
  });
});
