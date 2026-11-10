import type { ModuleMeta } from "@/core/case-engine";

/**
 * Modules planned for later phases. Each one moves to its own folder under
 * `src/modules/<id>/` when it is built.
 */
export const comingSoonModules: readonly ModuleMeta[] = [
  {
    id: "user-interview",
    name: "User Interview Simulator",
    tagline: "Uncover hidden pain points with good questions.",
    description:
      "Interview an AI user who only opens up to open, unbiased questions about past behavior. Scored on insights discovered and leading questions asked.",
    skills: ["product_sense", "communication"],
    status: "coming_soon",
    icon: "user-interview",
  },
  {
    id: "stakeholder-arena",
    name: "Stakeholder Arena",
    tagline: "Align a CTO, a head of sales and a CEO who disagree.",
    description:
      "Negotiate with AI stakeholders who have conflicting goals and red lines, and leave the room with an agreement on what ships this quarter.",
    skills: ["communication", "strategy"],
    status: "coming_soon",
    icon: "stakeholder-arena",
  },
];
