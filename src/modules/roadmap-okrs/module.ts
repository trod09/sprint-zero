import type { ModuleMeta } from "@/core/case-engine";

/** Client-safe description of the module. The full definition lives in `module.server.ts`. */
export const roadmapMeta: ModuleMeta = {
  id: "roadmap-okrs",
  name: "Roadmap & OKRs",
  tagline: "Plan a quarter with limited teams and dependencies.",
  description:
    "Three company objectives, three squads with six sprints each and more initiatives than fit. Choose key results that measure outcomes, then lay out a roadmap that ships the most value in an order the dependencies allow.",
  skills: ["strategy", "execution"],
  status: "available",
  icon: "roadmap-okrs",
  estimatedMinutes: 20,
};
