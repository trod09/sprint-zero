/**
 * Every page loads without errors, fits the screen and passes an automated
 * accessibility check, on desktop and on a phone.
 */
import { expect, test } from "@playwright/test";

import {
  CASES,
  expectAccessible,
  expectNoHorizontalScroll,
  MODULES,
  settle,
  watchErrors,
} from "./helpers";

const PAGES = [
  "/",
  "/library",
  "/history",
  "/skills",
  "/styleguide",
  "/login",
  ...MODULES.map((id) => `/modules/${id}`),
  ...Object.values(CASES).map((id) => `/case/${id}`),
  "/case/gen-backlog-saas-pm-4242",
  "/case/gen-metric-drop-consumer-senior-4242",
  "/case/gen-ab-test-fintech-apm-4242",
  "/case/gen-quick-cases-marketplace-pm-4242",
  "/case/gen-prd-writer-marketplace-senior-4242",
  "/case/prd-writer-fixly-rebook",
];

for (const path of PAGES) {
  test(`${path} loads, fits and is accessible`, async ({ page }) => {
    const errors = watchErrors(page);
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await settle(page);
    await expect(page.locator("main")).toBeVisible();
    await expectNoHorizontalScroll(page);
    await expectAccessible(page);
    expect(errors()).toEqual([]);
  });
}
