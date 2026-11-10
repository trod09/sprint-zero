import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** One featured case per playable module. */
export const CASES = {
  backlog: "backlog-fintech-01",
  "metric-drop": "metric-drop-android-onboarding",
  "ab-test": "ab-test-one-tap-reorder",
  "feedback-triage": "feedback-triage-coinpath",
  "ux-critique": "ux-critique-harvest-checkout",
  "product-case": "product-case-tunebox-podcasts",
  "prd-writer": "prd-writer-trailhead-offline-maps",
  "roadmap-okrs": "roadmap-okrs-coinpath-q3",
  "quick-cases": "quick-cases-rosterly-pricing",
  "user-interview": "user-interview-maya-shift-swaps",
} as const;

export const MODULES = Object.keys(CASES) as (keyof typeof CASES)[];

/** Collects console errors and uncaught exceptions while a page is used. */
export function watchErrors(page: Page): () => string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return () =>
    errors.filter(
      // Dev-only noise from the framework, not from the app.
      (text) =>
        !/Download the React DevTools|\[Fast Refresh\]|\[HMR\]/.test(text),
    );
}

/** Fails if the page scrolls sideways: every layout must fit its viewport. */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const offenders: string[] = [];
    for (const element of document.querySelectorAll<HTMLElement>("body *")) {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.right <= width + 1) continue;
      // Content inside a scrolling container is fine.
      let parent = element.parentElement;
      let clipped = false;
      while (parent && parent !== document.body) {
        const style = getComputedStyle(parent);
        if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
          clipped = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (!clipped) {
        const id = element.id ? `#${element.id}` : "";
        const cls =
          typeof element.className === "string"
            ? `.${element.className.split(" ").slice(0, 3).join(".")}`
            : "";
        offenders.push(
          `${element.tagName.toLowerCase()}${id}${cls} (${Math.round(rect.right)}px)`,
        );
      }
    }
    return {
      scrollWidth: document.documentElement.scrollWidth,
      width,
      offenders: offenders.slice(0, 5),
    };
  });
  expect(
    overflow.scrollWidth,
    `Horizontal scroll: ${overflow.offenders.join(", ")}`,
  ).toBeLessThanOrEqual(overflow.width + 1);
}

/** Fails on serious or critical WCAG A/AA violations. */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    // UX Critique screens contain planted usability flaws on purpose.
    .exclude("[data-mock-screen]")
    .analyze();
  const serious = results.violations.filter((v) =>
    ["serious", "critical"].includes(v.impact ?? ""),
  );
  const report = serious
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes
          .slice(0, 3)
          .map((n) => n.target.join(" "))
          .join("\n    ")}`,
    )
    .join("\n");
  expect(serious, report).toEqual([]);
}

/** Waits until client components have hydrated and drafts have loaded. */
export async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
}
