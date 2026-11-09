import type { ModuleMeta } from "@/core/case-engine";

/** Client-safe description of the module. Schemas, cases and scoring arrive in Hito 1.2+. */
export const backlogMeta: ModuleMeta = {
  id: "backlog",
  name: "Backlog Simulator",
  tagline: "Plan a sprint from a messy backlog full of traps.",
  description:
    "A fictional company hands you 20 to 40 tickets: features, bugs, tech debt, and requests from sales and the CEO. Information is incomplete, some tickets are traps, and capacity is limited. Commit a sprint, survive a mid-sprint event, and compare your plan with the optimal one.",
  skills: ["execution", "strategy"],
  status: "in_development",
  icon: "backlog",
  estimatedMinutes: 25,
};
