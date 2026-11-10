import type { ModuleMeta } from "@/core/case-engine";

/** Client-safe description of the module. The full definition lives in `module.server.ts`. */
export const userInterviewMeta: ModuleMeta = {
  id: "user-interview",
  name: "User Interview Simulator",
  tagline: "Uncover hidden pain points with good questions.",
  description:
    "Interview a customer who only opens up to open, unbiased questions about what actually happened. You get twelve questions; leading and hypothetical ones earn polite agreement and nothing else. Then say what the interview really showed.",
  skills: ["product_sense", "communication"],
  status: "available",
  icon: "user-interview",
  estimatedMinutes: 15,
};
