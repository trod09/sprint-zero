/**
 * The pregenerated UX Critique cases: a product, a screen template and a
 * seed. `npm run generate:ux-critique` picks the flawed regions.
 */
import type { Company, Difficulty } from "@/core/case-engine";

import type { TemplateKey } from "../schema";

export interface UxCaseSpec {
  id: string;
  seed: number;
  difficulty: Difficulty;
  company: Company;
  title: string;
  template: TemplateKey;
  accent: string;
}

export const uxCaseSpecs: readonly UxCaseSpec[] = [
  {
    id: "ux-critique-nimbus-signup",
    seed: 5101,
    difficulty: "apm",
    company: {
      name: "Nimbus Notes",
      industry: "SaaS B2B",
      stage: "Seed",
      description:
        "A note-taking app for teams. Most new accounts start from the website's free trial button.",
    },
    title: "Nimbus Notes: the sign-up page",
    template: "signup",
    accent: "#4f46e5",
  },
  {
    id: "ux-critique-harvest-checkout",
    seed: 5102,
    difficulty: "pm",
    company: {
      name: "Harvest Lane",
      industry: "Marketplace",
      stage: "Series B",
      description:
        "An online grocery marketplace. A third of carts are abandoned at checkout, and the team suspects the page.",
    },
    title: "Harvest Lane: the checkout page",
    template: "checkout",
    accent: "#15803d",
  },
  {
    id: "ux-critique-taskhive-settings",
    seed: 5103,
    difficulty: "pm",
    company: {
      name: "Taskhive",
      industry: "SaaS B2B",
      stage: "Series B",
      description:
        "Project management for agencies. Support gets weekly tickets from admins confused by the settings page.",
    },
    title: "Taskhive: the settings page",
    template: "settings",
    accent: "#d97706",
  },
  {
    id: "ux-critique-ledgerline-signup",
    seed: 5104,
    difficulty: "senior",
    company: {
      name: "Ledgerline",
      industry: "Fintech",
      stage: "Series A",
      description:
        "Invoicing and expense tracking for freelancers. Paid ads bring visitors to the sign-up page, and only one in five finishes it.",
    },
    title: "Ledgerline: the sign-up page",
    template: "signup",
    accent: "#0f766e",
  },
  {
    id: "ux-critique-stillwater-settings",
    seed: 5105,
    difficulty: "senior",
    company: {
      name: "Stillwater",
      industry: "Consumer",
      stage: "Series A",
      description:
        "A meditation and sleep app with a web dashboard for family plans. The family admin manages everything from settings.",
    },
    title: "Stillwater: the family settings page",
    template: "settings",
    accent: "#7c3aed",
  },
];
