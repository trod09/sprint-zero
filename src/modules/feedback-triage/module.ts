import type { ModuleMeta } from "@/core/case-engine";

/** Client-safe description of the module. The full definition lives in `module.server.ts`. */
export const feedbackTriageMeta: ModuleMeta = {
  id: "feedback-triage",
  name: "Feedback Triage",
  tagline: "Find the signal in 60 reviews, tickets and NPS comments.",
  description:
    "Cluster a noisy inbox of app reviews, support tickets and NPS comments into themes, set the noise aside, spot the one problem that really matters, rank the rest and turn the top themes into opportunities.",
  skills: ["product_sense", "analytics"],
  status: "available",
  icon: "feedback-triage",
  estimatedMinutes: 25,
};
