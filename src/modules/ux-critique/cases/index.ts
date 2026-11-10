/**
 * Pregenerated UX Critique cases (`npm run generate:ux-critique`). Server
 * only: they list the planted problems.
 */
import "server-only";

import harvestCheckout from "./ux-critique-harvest-checkout.json";
import ledgerlineSignup from "./ux-critique-ledgerline-signup.json";
import nimbusSignup from "./ux-critique-nimbus-signup.json";
import stillwaterSettings from "./ux-critique-stillwater-settings.json";
import taskhiveSettings from "./ux-critique-taskhive-settings.json";

export const uxCritiqueRawCases: readonly unknown[] = [
  nimbusSignup,
  harvestCheckout,
  taskhiveSettings,
  ledgerlineSignup,
  stillwaterSettings,
];
