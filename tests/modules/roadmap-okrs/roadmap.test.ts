import { describe, expect, it } from "vitest";

import { DIFFICULTIES, INDUSTRY_KEYS } from "@/core/case-engine";
import { assertNoHiddenKeys } from "@/core/case-engine/public-case";
import { buildFeaturedRoadmapCases } from "@/modules/roadmap-okrs/cases";
import { roadmapSpecs } from "@/modules/roadmap-okrs/content/specs";
import { generateRoadmapOnDemand } from "@/modules/roadmap-okrs/generate";
import {
  buildRoadmapCase,
  findRoadmapProblem,
} from "@/modules/roadmap-okrs/generator";
import { optimalPlan } from "@/modules/roadmap-okrs/optimal";
import { evaluatePlan, nextFreeSprint } from "@/modules/roadmap-okrs/planning";
import { toPublicRoadmapCase } from "@/modules/roadmap-okrs/public";
import type { RoadmapAnswer, RoadmapCase } from "@/modules/roadmap-okrs/schema";
import { ROADMAP_WEIGHTS, scoreRoadmap } from "@/modules/roadmap-okrs/scoring";

const cases = buildFeaturedRoadmapCases();
const coinpath = cases[0];

function idealAnswer(caseData: RoadmapCase): RoadmapAnswer {
  return {
    keyResultIds: caseData.hidden.keyResults
      .filter((k) => k.rating === 2)
      .map((k) => k.id),
    schedule: optimalPlan(caseData).schedule,
    rationale: "",
    tradeoffs: "",
  };
}

describe("roadmap specifications", () => {
  it("are fair at every level without any seed changes", () => {
    for (const spec of roadmapSpecs) {
      for (const difficulty of DIFFICULTIES) {
        const caseData = buildRoadmapCase(
          {
            spec,
            id: `roadmap-okrs-${spec.key}-${difficulty}`,
            seed: 1,
            difficulty,
          },
          null,
        );
        expect(
          findRoadmapProblem(caseData),
          `${spec.key} ${difficulty}`,
        ).toBeNull();
      }
    }
  });

  it("keep dependencies inside the level that includes them", () => {
    const order = [...DIFFICULTIES];
    for (const spec of roadmapSpecs) {
      const level = new Map(spec.initiatives.map((i) => [i.id, i.level]));
      for (const initiative of spec.initiatives) {
        for (const dependency of initiative.dependsOn) {
          expect(
            order.indexOf(level.get(dependency)!),
            `${spec.key}: ${initiative.id} -> ${dependency}`,
          ).toBeLessThanOrEqual(order.indexOf(initiative.level));
        }
      }
    }
  });
});

describe("planning rules", () => {
  const { initiatives } = coinpath;
  const effort = (id: string) => initiatives.find((i) => i.id === id)!.effort;

  it("delivers a plan that respects capacity and dependencies", () => {
    const plan = evaluatePlan(initiatives, [
      { initiativeId: "trial_billing", startSprint: 1 },
      { initiativeId: "trial_flow", startSprint: effort("trial_billing") + 1 },
    ]);
    expect(plan.deliveredIds).toEqual(["trial_billing", "trial_flow"]);
  });

  it("blocks an initiative that starts before its dependency ends", () => {
    const plan = evaluatePlan(initiatives, [
      { initiativeId: "trial_billing", startSprint: 1 },
      { initiativeId: "trial_flow", startSprint: 1 },
    ]);
    const flow = plan.items.find((i) => i.initiativeId === "trial_flow")!;
    expect(flow.status).toBe("blocked");
    expect(flow.blockedBy).toEqual(["trial_billing"]);
  });

  it("blocks an initiative whose dependency is not scheduled", () => {
    const plan = evaluatePlan(initiatives, [
      { initiativeId: "trial_flow", startSprint: 3 },
    ]);
    expect(plan.items[0].status).toBe("blocked");
    expect(plan.deliveredIds).toEqual([]);
  });

  it("flags overlaps in a team and work that runs past the quarter", () => {
    const plan = evaluatePlan(initiatives, [
      { initiativeId: "identity_checks", startSprint: 1 },
      { initiativeId: "trial_billing", startSprint: 2 },
      { initiativeId: "audit_log", startSprint: 6 },
    ]);
    const status = Object.fromEntries(
      plan.items.map((i) => [i.initiativeId, i.status]),
    );
    expect(status.identity_checks).toBe("ok");
    expect(status.trial_billing).toBe("overlap");
    expect(status.audit_log).toBe(effort("audit_log") > 1 ? "overflow" : "ok");
  });

  it("suggests the first sprint after the team's work and the dependencies", () => {
    const schedule = [{ initiativeId: "trial_billing", startSprint: 2 }];
    expect(nextFreeSprint(initiatives, schedule, "trial_flow")).toBe(
      2 + effort("trial_billing"),
    );
    expect(nextFreeSprint(initiatives, [], "deposit_nudges")).toBe(1);
  });
});

describe("optimal roadmap", () => {
  it("is valid and at least as good as any greedy plan", () => {
    for (const caseData of cases) {
      const optimal = optimalPlan(caseData);
      const plan = evaluatePlan(caseData.initiatives, optimal.schedule);
      expect(plan.deliveredIds).toHaveLength(optimal.schedule.length);
      // Greedy: schedule in the listed order wherever it fits.
      const schedule: { initiativeId: string; startSprint: number }[] = [];
      for (const initiative of caseData.initiatives) {
        const start = nextFreeSprint(
          caseData.initiatives,
          schedule,
          initiative.id,
        );
        schedule.push({ initiativeId: initiative.id, startSprint: start });
      }
      const greedy = scoreRoadmap(caseData, {
        keyResultIds: [],
        schedule,
        rationale: "",
        tradeoffs: "",
      });
      expect(greedy.report.deliveredValue).toBeLessThanOrEqual(optimal.value);
    }
  });

  it("never schedules work that serves no objective", () => {
    for (const caseData of cases) {
      const scheduled = new Set(
        optimalPlan(caseData).schedule.map((p) => p.initiativeId),
      );
      for (const initiative of caseData.hidden.initiatives) {
        if (initiative.objectiveId === null) {
          expect(scheduled.has(initiative.id)).toBe(false);
        }
      }
    }
  });
});

describe("scoring", () => {
  it("uses weights that add up to 100 and scores the ideal answer 100", () => {
    expect(Object.values(ROADMAP_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
    for (const caseData of cases) {
      expect(scoreRoadmap(caseData, idealAnswer(caseData)).total).toBe(100);
    }
  });

  it("scores an empty plan 0", () => {
    const result = scoreRoadmap(coinpath, {
      keyResultIds: [],
      schedule: [],
      rationale: "",
      tradeoffs: "",
    });
    expect(result.total).toBe(0);
  });

  it("only counts two key results per objective, in the order picked", () => {
    const ideal = idealAnswer(coinpath);
    const bad = coinpath.hidden.keyResults
      .filter((k) => k.rating === 0)
      .map((k) => k.id);
    const padded = scoreRoadmap(coinpath, {
      ...ideal,
      keyResultIds: [...ideal.keyResultIds, ...bad],
    });
    expect(padded.criteria.find((c) => c.id === "keyResults")!.ratio).toBe(1);
    const badFirst = scoreRoadmap(coinpath, {
      ...ideal,
      keyResultIds: [...bad, ...ideal.keyResultIds],
    });
    expect(
      badFirst.criteria.find((c) => c.id === "keyResults")!.ratio,
    ).toBeLessThan(1);
  });

  it("penalises pet projects and broken dependencies", () => {
    const ideal = idealAnswer(coinpath);
    const pet = coinpath.hidden.initiatives.find(
      (i) => i.objectiveId === null,
    )!;
    const withPet = scoreRoadmap(coinpath, {
      ...ideal,
      schedule: [
        ...ideal.schedule.filter(
          (p) =>
            coinpath.initiatives.find((i) => i.id === p.initiativeId)!
              .teamId !==
            coinpath.initiatives.find((i) => i.id === pet.id)!.teamId,
        ),
        { initiativeId: pet.id, startSprint: 1 },
      ],
    });
    expect(withPet.total).toBeLessThan(100);
    expect(withPet.criteria.find((c) => c.id === "focus")!.ratio).toBeLessThan(
      1,
    );

    const broken = scoreRoadmap(coinpath, {
      ...ideal,
      schedule: ideal.schedule.map((p) =>
        p.initiativeId === "trial_flow" ? { ...p, startSprint: 1 } : p,
      ),
    });
    expect(
      broken.criteria.find((c) => c.id === "dependencies")!.ratio,
    ).toBeLessThan(1);
  });

  it("is deterministic and ignores unknown initiatives", () => {
    const answer = {
      ...idealAnswer(coinpath),
      schedule: [
        ...idealAnswer(coinpath).schedule,
        { initiativeId: "made_up", startSprint: 1 },
      ],
    };
    expect(scoreRoadmap(coinpath, answer)).toEqual(
      scoreRoadmap(coinpath, answer),
    );
    expect(scoreRoadmap(coinpath, answer).total).toBe(100);
  });
});

describe("generated and public cases", () => {
  it("builds a fair case for every industry, level and seed", () => {
    for (const industry of INDUSTRY_KEYS) {
      for (const difficulty of DIFFICULTIES) {
        for (const seed of [1, 42, 9001, 123_456]) {
          const caseData = generateRoadmapOnDemand({
            seed,
            industry,
            difficulty,
            caseId: `gen-roadmap-okrs-${industry}-${difficulty}-${seed}`,
          });
          expect(findRoadmapProblem(caseData)).toBeNull();
          expect(scoreRoadmap(caseData, idealAnswer(caseData)).total).toBe(100);
        }
      }
    }
  });

  it("changes with the seed and is deterministic", () => {
    const build = (seed: number) =>
      generateRoadmapOnDemand({
        seed,
        industry: "saas",
        difficulty: "senior",
        caseId: `gen-roadmap-okrs-saas-senior-${seed}`,
      });
    expect(build(5)).toEqual(build(5));
    expect(build(5)).not.toEqual(build(6));
  });

  it("never exposes ratings, values or objectives served", () => {
    for (const caseData of cases) {
      const publicCase = toPublicRoadmapCase(caseData);
      assertNoHiddenKeys(publicCase);
      const text = JSON.stringify(publicCase);
      expect(text).not.toContain('"rating"');
      expect(text).not.toContain('"value"');
      expect(text).not.toContain('"why"');
    }
  });
});
