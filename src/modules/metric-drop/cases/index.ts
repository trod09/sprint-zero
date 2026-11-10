/**
 * Pregenerated Metric Drop cases (`npm run generate:metric-drop`). Server
 * only: they contain the root cause.
 */
import "server-only";

import androidOnboarding from "./metric-drop-android-onboarding.json";
import campaignEnded from "./metric-drop-campaign-ended.json";
import paymentsBrazil from "./metric-drop-payments-brazil.json";
import usHoliday from "./metric-drop-us-holiday.json";
import webCheckout from "./metric-drop-web-checkout.json";

export const metricDropRawCases: readonly unknown[] = [
  androidOnboarding,
  campaignEnded,
  paymentsBrazil,
  webCheckout,
  usHoliday,
];
