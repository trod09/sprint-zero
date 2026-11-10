/**
 * One full case per module: play it with the controls a learner uses,
 * submit, and land on a results page with a score. Each test runs in a
 * fresh browser profile, so nothing carries over between them.
 */
import { expect, test, type Page } from "@playwright/test";

import { CASES, expectAccessible, settle, watchErrors } from "./helpers";

test.describe.configure({ mode: "parallel" });
test.skip(
  ({ isMobile }) => isMobile,
  "Full flows run on desktop; the page checks cover phones.",
);

async function open(page: Page, caseId: string) {
  await page.goto(`/case/${caseId}`);
  await settle(page);
}

/** Clicks the submit button, confirms, and checks the results page. */
async function submitAndSeeResults(page: Page, button: string | RegExp) {
  await page.getByRole("button", { name: button }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page).toHaveURL(/\/results\//, { timeout: 30_000 });
  await expect(page.getByText(/^Score: \d+ \/ 100$/)).toBeAttached();
  await expect(page.getByRole("heading", { name: "Breakdown" })).toBeVisible();
  await settle(page);
  await expectAccessible(page);
}

test("Quick Cases", async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, CASES["quick-cases"]);
  for (const group of await page.locator("fieldset").all()) {
    const options = group.locator("input");
    const type = await options.first().getAttribute("type");
    await options.nth(0).check();
    if (type === "checkbox") await options.nth(1).check();
  }
  await submitAndSeeResults(page, "Submit answer");
  expect(errors()).toEqual([]);
});

test("Roadmap & OKRs", async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, CASES["roadmap-okrs"]);
  for (const group of await page.locator("fieldset").all()) {
    await group.getByRole("checkbox").first().check();
  }
  await page.getByRole("tab", { name: /Roadmap/ }).click();
  await page.getByRole("button", { name: "Next free slot" }).first().click();
  await expect(page.getByText("Ships this quarter").first()).toBeVisible();
  await page.getByRole("tab", { name: /Review/ }).click();
  await submitAndSeeResults(page, "Submit plan");
  expect(errors()).toEqual([]);
});

test("User Interview", async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, CASES["user-interview"]);
  const input = page.getByLabel("Your question");
  for (const question of [
    "Do people swap shifts?",
    "Tell me about the last time someone needed their shift covered.",
    "What happened the last time payroll went out?",
  ]) {
    await input.fill(question);
    await input.press("Enter");
    await expect(input).toHaveValue("");
    await expect(page.getByRole("status")).toHaveCount(0);
  }
  await expect(
    page.getByText("3 questions left").or(page.getByText("9 questions left")),
  ).toBeVisible();
  await page.getByRole("button", { name: "Wrap up" }).click();
  await page.getByRole("checkbox").first().check();
  await submitAndSeeResults(page, "Submit interview");
  await expect(page.getByText(/^Uncovered:/).first()).toBeVisible();
  expect(errors()).toEqual([]);
});

test("A/B Test Interpreter", async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, CASES["ab-test"]);
  await page.getByRole("radio", { name: "Segments" }).click();
  await page.getByRole("radio", { name: /It really improves/ }).check();
  await page.getByRole("radio", { name: /^Ship/ }).check();
  await submitAndSeeResults(page, "Submit decision");
  expect(errors()).toEqual([]);
});

test("Metric Drop", async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, CASES["metric-drop"]);
  await page.getByLabel("Break down by").selectOption({ label: "App version" });
  await settle(page);
  await page
    .getByLabel("Affected dimension")
    .selectOption({ label: "App version" });
  const value = page.getByLabel("Affected value");
  await expect(value).toBeEnabled();
  await value.selectOption({ index: 1 });
  await page.getByLabel("Kind of cause").selectOption({ index: 1 });
  await page.getByRole("radio", { name: /Halt the Android/ }).check();
  await submitAndSeeResults(page, "Submit diagnosis");
  expect(errors()).toEqual([]);
});

test("Product Case (estimation)", async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, "product-case-pawpal-dog-walking");
  await page
    .getByRole("checkbox", { name: /Households in Marlow Bay/ })
    .check();
  await page
    .getByRole("checkbox", { name: /Households with at least one dog/ })
    .check();
  await page.getByLabel("Your estimate").fill("8,000,000");
  await submitAndSeeResults(page, "Submit answer");
  expect(errors()).toEqual([]);
});

test("UX Critique", async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, CASES["ux-critique"]);
  await page.getByRole("radio", { name: "Mark problems" }).click();
  await page
    .getByRole("button", { name: /^Mark / })
    .first()
    .click();
  await page.getByLabel("Kind of problem").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Add finding" }).click();
  await submitAndSeeResults(page, "Submit critique");
  expect(errors()).toEqual([]);
});

test("Feedback Triage", async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, CASES["feedback-triage"]);
  const select = page.getByRole("checkbox", { name: /^Select FB-/ });
  for (let i = 0; i < 3; i++) await select.nth(i).check();
  await page.getByLabel("New theme name").fill("Login problems");
  await page
    .getByRole("button", { name: "New cluster from selection" })
    .click();
  await expect(page.getByText("0 selected")).toHaveCount(0);
  await submitAndSeeResults(page, "Submit triage");
  expect(errors()).toEqual([]);
});

test("PRD Writer", async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, CASES["prd-writer"]);
  await page
    .getByLabel("Problem statement")
    .fill("Hikers lose the map on trails without signal.");
  await page.getByRole("checkbox").first().check();
  for (let step = 0; step < 5; step++) {
    await page.getByRole("button", { name: "Next", exact: true }).click();
  }
  await submitAndSeeResults(page, /^Submit/);
  expect(errors()).toEqual([]);
});

test("Product Case (structured)", async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, CASES["product-case"]);
  await page.getByRole("radio").first().check();
  for (let step = 0; step < 4; step++) {
    await page.getByRole("button", { name: "Next", exact: true }).click();
  }
  await submitAndSeeResults(page, /^Submit/);
  expect(errors()).toEqual([]);
});

test("Backlog Simulator", async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, CASES.backlog);
  const add = page.getByRole("button", { name: /^Add LED-\d+ to the sprint$/ });
  for (let i = 0; i < 4; i++) await add.first().click();
  await page.getByRole("button", { name: "Commit sprint" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Commit", exact: true })
    .click();
  // A mid-sprint event lands: replan, then confirm the new sprint.
  await page.getByRole("button", { name: "Replan the sprint" }).click();
  await page.getByRole("button", { name: "Confirm replanned sprint" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /^(Commit|Submit)$/ })
    .click();
  await expect(page).toHaveURL(/\/results\//, { timeout: 30_000 });
  await expect(page.getByText(/^Score: \d+ \/ 100$/)).toBeAttached();
  await settle(page);
  await expectAccessible(page);
  expect(errors()).toEqual([]);
});
