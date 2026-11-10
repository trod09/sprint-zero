import type { ModuleMeta } from "@/core/case-engine";

/** Client-safe description of the module. The full definition lives in `module.server.ts`. */
export const quickCasesMeta: ModuleMeta = {
  id: "quick-cases",
  name: "Quick Cases",
  tagline: "Pricing, launches, incidents and build vs. buy in 15 minutes.",
  description:
    "Short cases with a handful of exhibits and three decisions: set a price, pick a beachhead for a launch, handle an incident and what to tell customers, or decide whether to build, buy or partner. The numbers change with every case, and so does the right call.",
  skills: ["strategy", "communication"],
  status: "available",
  icon: "quick-cases",
  estimatedMinutes: 12,
};
