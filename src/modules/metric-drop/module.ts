import type { ModuleMeta } from "@/core/case-engine";

/** Client-safe description of the module. The full definition lives in `module.server.ts`. */
export const metricDropMeta: ModuleMeta = {
  id: "metric-drop",
  name: "Metric Drop",
  tagline: "DAU fell 15% this week. Find out why.",
  description:
    "Investigate a sudden metric drop in an analytics dashboard built on synthetic data. Slice by platform, country, app version and channel, tell the real root cause from the red herrings, and recommend what to do next.",
  skills: ["analytics"],
  status: "available",
  icon: "metric-drop",
  estimatedMinutes: 20,
};
