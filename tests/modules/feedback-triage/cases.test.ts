import { describe, expect, it } from "vitest";

import { feedbackTriageRawCases } from "@/modules/feedback-triage/cases";
import { triageCaseSpecs } from "@/modules/feedback-triage/content/cases";
import { THEME_LIBRARY } from "@/modules/feedback-triage/content/themes";
import {
  CRITICAL_WINDOW_DAYS,
  findTriageFairnessIssue,
  generateTriageCase,
  themeImpact,
  TRIAGE_PROFILES,
} from "@/modules/feedback-triage/generator";
import { toPublicTriageCase } from "@/modules/feedback-triage/public";
import {
  feedbackTriageCaseSchema,
  publicFeedbackTriageCaseSchema,
} from "@/modules/feedback-triage/schema";

const cases = feedbackTriageRawCases.map((raw) =>
  feedbackTriageCaseSchema.parse(raw),
);

describe("pregenerated feedback triage cases", () => {
  it("has 5 inboxes of about 60 items across industries and difficulties", () => {
    expect(cases).toHaveLength(5);
    expect(new Set(cases.map((c) => c.difficulty))).toEqual(
      new Set(["apm", "pm", "senior"]),
    );
    expect(new Set(cases.map((c) => c.company.industry)).size).toBe(4);
    for (const caseData of cases) {
      const profile = TRIAGE_PROFILES[caseData.difficulty];
      const expected =
        profile.themeSizes.reduce((a, b) => a + b, 0) +
        profile.criticalItems +
        profile.noiseItems;
      expect(caseData.items).toHaveLength(expected);
      expect(caseData.items.length).toBeGreaterThanOrEqual(50);
    }
  });

  it("matches what the generator produces from the specifications", () => {
    expect(cases.map((c) => c.id)).toEqual(triageCaseSpecs.map((s) => s.id));
    for (const spec of triageCaseSpecs) {
      expect(cases.find((c) => c.id === spec.id)).toEqual(
        generateTriageCase(spec),
      );
    }
  });

  it("ranks the critical theme first, then by reach times severity", () => {
    for (const caseData of cases) {
      const [critical, ...others] = caseData.hidden.themes;
      expect(critical.severity).toBe("critical");
      const impacts = others.map(themeImpact);
      expect(impacts).toEqual([...impacts].sort((a, b) => b - a));
      expect(
        findTriageFairnessIssue(caseData.hidden.themes, caseData.difficulty),
      ).toBeNull();
    }
  });

  it("puts the critical problem in a few recent items", () => {
    for (const caseData of cases) {
      const critical = caseData.hidden.themes[0];
      const cutoff = new Date(`${caseData.period.to}T00:00:00Z`);
      cutoff.setUTCDate(cutoff.getUTCDate() - CRITICAL_WINDOW_DAYS);
      for (const id of critical.itemIds) {
        const item = caseData.items.find((i) => i.id === id)!;
        expect(new Date(`${item.date}T00:00:00Z`) > cutoff).toBe(true);
      }
      expect(critical.itemIds.length).toBeLessThanOrEqual(5);
    }
  });

  it("fills every slot and keeps texts unique", () => {
    for (const caseData of cases) {
      for (const item of caseData.items) {
        expect(item.text, item.id).not.toMatch(/\{\w+\}/);
      }
      for (const theme of caseData.hidden.themes) {
        expect(theme.label + theme.summary + theme.opportunity).not.toMatch(
          /\{\w+\}/,
        );
      }
    }
  });

  it("gives each source its own metadata", () => {
    for (const caseData of cases) {
      for (const item of caseData.items) {
        expect(item.rating !== undefined).toBe(item.source === "app_review");
        expect(item.npsScore !== undefined).toBe(item.source === "nps");
        expect(item.plan !== undefined).toBe(item.source === "support");
      }
    }
  });

  it("has enough texts in the library for the largest theme", () => {
    const largest = Math.max(
      ...Object.values(TRIAGE_PROFILES).flatMap((p) => p.themeSizes),
    );
    const enough = Object.values(THEME_LIBRARY).filter(
      (theme) => theme.texts.length >= largest,
    );
    expect(enough.length).toBeGreaterThanOrEqual(3);
  });

  it("never sends the themes to the browser", () => {
    for (const caseData of cases) {
      const publicCase = toPublicTriageCase(caseData);
      expect(publicFeedbackTriageCaseSchema.parse(publicCase)).toEqual(
        publicCase,
      );
      const json = JSON.stringify(publicCase);
      expect(json).not.toContain('"hidden"');
      expect(json).not.toContain('"severity"');
      expect(json).not.toContain(caseData.hidden.themes[0].summary);
    }
  });
});
