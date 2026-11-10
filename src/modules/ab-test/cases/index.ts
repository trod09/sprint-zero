/**
 * Pregenerated A/B Test Interpreter cases (`npm run generate:ab-test`).
 * Server only: they contain the ground truth.
 */
import "server-only";

import aiEmailDrafts from "./ab-test-ai-email-drafts.json";
import annualPaywall from "./ab-test-annual-paywall.json";
import cardActivation from "./ab-test-card-activation.json";
import friendsPush from "./ab-test-friends-push.json";
import onboardingChecklist from "./ab-test-onboarding-checklist.json";
import oneTapReorder from "./ab-test-one-tap-reorder.json";
import savingsStreaks from "./ab-test-savings-streaks.json";
import scarcityBanner from "./ab-test-scarcity-banner.json";

export const abTestRawCases: readonly unknown[] = [
  oneTapReorder,
  onboardingChecklist,
  scarcityBanner,
  annualPaywall,
  savingsStreaks,
  aiEmailDrafts,
  cardActivation,
  friendsPush,
];
