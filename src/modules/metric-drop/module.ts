import type { ModuleMeta } from "@/core/case-engine";

/** Client-safe description of the module. Schemas, cases and scoring arrive in Hito 1.6+. */
export const metricDropMeta: ModuleMeta = {
  id: "metric-drop",
  name: "Metric Drop",
  tagline: "DAU fell 15% this week. Find out why.",
  description:
    "Investigate a sudden metric drop in an analytics dashboard built on synthetic data. Slice by platform, country, app version and channel, tell the real root cause from the red herrings, and recommend what to do next.",
  skills: ["analytics"],
  status: "in_development",
  icon: "metric-drop",
  estimatedMinutes: 20,
};
