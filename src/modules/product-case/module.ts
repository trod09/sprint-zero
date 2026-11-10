import type { ModuleMeta } from "@/core/case-engine";

/** Client-safe description of the module. The full definition lives in `module.server.ts`. */
export const productCaseMeta: ModuleMeta = {
  id: "product-case",
  name: "Product Case",
  tagline: "Interview-style cases, answered step by step.",
  description:
    "Design, improvement, strategy and estimation cases in the format of a PM interview. Choose the users, the problems, what to build first and how to measure it, or build an estimate from a fact sheet with traps, then compare with an annotated ideal answer.",
  skills: ["product_sense", "strategy", "communication"],
  status: "available",
  icon: "product-case",
  estimatedMinutes: 25,
};
