/**
 * Builds a UX Critique screen: the seed picks which regions are flawed and
 * how; every other region stays good, so there is something to resist.
 */
import type { Difficulty } from "@/core/case-engine";
import { createRng } from "@/core/rng";

import type { UxCaseSpec } from "./content/cases";
import { SCREEN_TEMPLATES } from "./content/templates";
import {
  uxCritiqueCaseSchema,
  type IssueType,
  type RegionProps,
  type UxCritiqueCase,
} from "./schema";

export const ISSUES_BY_DIFFICULTY: Record<Difficulty, number> = {
  apm: 3,
  pm: 4,
  senior: 5,
};

function fillProduct<T>(value: T, product: string): T {
  if (typeof value === "string") {
    return value.replaceAll("{product}", product) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => fillProduct(item, product)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        fillProduct(item, product),
      ]),
    ) as T;
  }
  return value;
}

export function generateUxCase(spec: UxCaseSpec): UxCritiqueCase {
  const template = SCREEN_TEMPLATES[spec.template];
  const rng = createRng(spec.seed);
  const flawable = template.regions.filter(
    (region) => Object.keys(region.flaws).length > 0,
  );
  const count = ISSUES_BY_DIFFICULTY[spec.difficulty];
  if (flawable.length <= count) {
    throw new Error(
      `Case "${spec.id}": the template needs more than ${count} flawable regions, so some stay clean`,
    );
  }

  // Spread the issue types: prefer types not used yet in this screen.
  const chosen = rng.fork("regions").sample(flawable, count);
  const typeRng = rng.fork("types");
  const usedTypes = new Set<IssueType>();
  const flaws = new Map<string, IssueType>();
  for (const region of chosen) {
    const types = Object.keys(region.flaws) as IssueType[];
    const fresh = types.filter((type) => !usedTypes.has(type));
    const type = typeRng.pick(fresh.length > 0 ? fresh : types);
    usedTypes.add(type);
    flaws.set(region.id, type);
  }

  const regions = template.regions.map((region) => {
    const type = flaws.get(region.id);
    const props: RegionProps = type ? region.flaws[type]!.props : region.good;
    return {
      id: region.id,
      label: region.label,
      props: fillProduct(props, spec.company.name),
    };
  });
  const issues = template.regions
    .filter((region) => flaws.has(region.id))
    .map((region) => {
      const type = flaws.get(region.id)!;
      const flaw = region.flaws[type]!;
      return {
        regionId: region.id,
        type,
        explanation: fillProduct(flaw.explanation, spec.company.name),
        fix: fillProduct(flaw.fix, spec.company.name),
      };
    });

  return uxCritiqueCaseSchema.parse({
    id: spec.id,
    moduleId: "ux-critique",
    seed: spec.seed,
    difficulty: spec.difficulty,
    company: spec.company,
    title: spec.title,
    brief: `This is the ${template.key} page of ${spec.company.name}, as it ships today. Use it like a customer would, then mark every usability problem you find: click the part of the screen, name the problem and say what you saw. Some parts are fine, and flagging them counts against you.`,
    userGoal: fillProduct(template.userGoal, spec.company.name),
    screen: {
      template: template.key,
      product: { name: spec.company.name, accent: spec.accent },
      regions,
    },
    hidden: {
      issues,
      principle:
        "Judge a screen by the user's goal: every element should help them reach it, say clearly what will happen, and tell them what did happen.",
    },
  });
}
