import type { ModuleMeta } from "@/core/case-engine";

/**
 * Modules planned for later phases. Each one moves to its own folder under
 * `src/modules/<id>/` when it is built.
 */
export const comingSoonModules: readonly ModuleMeta[] = [
  {
    id: "product-case",
    name: "Product Case",
    tagline: "Interview-style cases, answered step by step.",
    description:
      "Design, improvement, estimation and strategy cases in the format of a PM interview: user, problem, solutions, prioritization and metrics, graded against a rubric.",
    skills: ["product_sense", "communication", "strategy"],
    status: "coming_soon",
    icon: "product-case",
  },
  {
    id: "prd-writer",
    name: "PRD Writer",
    tagline: "Turn a brief into a sharp one-pager.",
    description:
      "Write the problem, success metrics, scope, non-goals and risks from a brief, and get feedback anchored to specific sections and sentences.",
    skills: ["communication", "product_sense"],
    status: "coming_soon",
    icon: "prd-writer",
  },
  {
    id: "ux-critique",
    name: "UX Critique",
    tagline: "Spot the usability problems planted in a screen.",
    description:
      "Review a generated interface with deliberate usability issues. Mark each problem and describe it, without raising false alarms.",
    skills: ["product_sense"],
    status: "coming_soon",
    icon: "ux-critique",
  },
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
  {
    id: "roadmap-okrs",
    name: "Roadmap & OKRs",
    tagline: "Plan a quarter with limited teams and dependencies.",
    description:
      "Write OKRs from company goals and build a quarterly roadmap that respects team capacity and cross-team dependencies.",
    skills: ["strategy", "execution"],
    status: "coming_soon",
    icon: "roadmap-okrs",
  },
  {
    id: "quick-cases",
    name: "Quick Cases",
    tagline: "Pricing, launches, incidents and build vs. buy in 15 minutes.",
    description:
      "Short cases on pricing, go-to-market, incident communication and build vs. buy vs. partner decisions.",
    skills: ["strategy", "communication"],
    status: "coming_soon",
    icon: "quick-cases",
  },
];
