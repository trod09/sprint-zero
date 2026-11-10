import type { ModuleMeta } from "@/core/case-engine";

/** Client-safe description of the module. The full definition lives in `module.server.ts`. */
export const prdWriterMeta: ModuleMeta = {
  id: "prd-writer",
  name: "PRD Writer",
  tagline: "Turn a brief into a sharp one-pager.",
  description:
    "Read a memo, the data, leadership's email and notes from legal or engineering, then write the one-pager: the problem and its evidence, a success metric with baseline and target, what is in and out of scope, and the risks.",
  skills: ["communication", "product_sense"],
  status: "available",
  icon: "prd-writer",
  estimatedMinutes: 25,
};
