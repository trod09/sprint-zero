import type { ModuleMeta } from "@/core/case-engine";

/** Client-safe description of the module. The full definition lives in `module.server.ts`. */
export const abTestMeta: ModuleMeta = {
  id: "ab-test",
  name: "A/B Test Interpreter",
  tagline: "Ship, iterate or kill? Mind the statistical traps.",
  description:
    "Read experiment results that may hide a sample ratio mismatch, a novelty effect, Simpson's paradox, a degraded guardrail or too little data. Flag what is wrong, judge the real effect and make the call.",
  skills: ["analytics"],
  status: "available",
  icon: "ab-test",
  estimatedMinutes: 15,
};
