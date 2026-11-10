/**
 * The learning loop: after a case the results suggest what to do next, a
 * replay shows the weakest points of the last attempt, and a fresh case of
 * the same kind opens. Fresh profile per test.
 */
import { expect, test } from "@playwright/test";

import { CASES, expectAccessible, settle, watchErrors } from "./helpers";

test.skip(({ isMobile }) => isMobile, "Covered on desktop.");

test("first visit explains how a case works", async ({ page }) => {
  await page.goto("/");
  await settle(page);
  await expect(
    page.getByRole("heading", { name: "How a case works" }),
  ).toBeVisible();
});

test("results lead to a replay with hints and to a fresh case", async ({
  page,
}) => {
  const errors = watchErrors(page);
  await page.goto(`/case/${CASES["quick-cases"]}`);
  await settle(page);
  // A deliberately weak answer: the last option of every decision.
  for (const group of await page.locator("fieldset").all()) {
    const options = group.locator("input");
    const count = await options.count();
    const type = await options.first().getAttribute("type");
    await options.nth(count - 1).check();
    if (type === "checkbox") await options.nth(count - 2).check();
  }
  await page.getByRole("button", { name: "Submit answer" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Submit", exact: true })
    .click();
  await expect(page).toHaveURL(/\/results\//, { timeout: 30_000 });

  const next = page.getByRole("region", { name: "What to do next" });
  await expect(next).toBeVisible();
  await settle(page);
  await expectAccessible(page);
  const freshHref = await next
    .getByRole("link", { name: "New case" })
    .getAttribute("href");
  expect(freshHref).toMatch(/^\/case\/gen-quick-cases-saas-apm-\d+$/);

  await next.getByRole("link", { name: "Replay" }).click();
  await expect(page.getByText(/^Last time you scored \d+\/100$/)).toBeVisible();
  await expect(page.getByText("Focus on:")).toBeVisible();
  // The case starts afresh: no old answer, no submit dialog left open.
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("fieldset input:checked")).toHaveCount(0);

  await page.goto(freshHref!);
  await settle(page);
  await expect(page.locator("#case-title")).toContainText("case #");
  expect(errors()).toEqual([]);
});
