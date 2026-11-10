import type { ModuleMeta } from "@/core/case-engine";

/** Client-safe description of the module. The full definition lives in `module.server.ts`. */
export const uxCritiqueMeta: ModuleMeta = {
  id: "ux-critique",
  name: "UX Critique",
  tagline: "Spot the usability problems planted in a screen.",
  description:
    "Use a real-looking sign-up, checkout or settings screen with deliberate usability problems. Mark each one, name it and say what you saw, without raising false alarms on the parts that work.",
  skills: ["product_sense"],
  status: "available",
  icon: "ux-critique",
  estimatedMinutes: 10,
};
