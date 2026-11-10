import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against the dev server (started if it is not already
 * running). They use the installed Chrome, so no browser download is needed;
 * set PLAYWRIGHT_CHANNEL="" to use Playwright's own Chromium instead (CI).
 */
const PORT = Number(process.env.E2E_PORT ?? 3000);
const channel = process.env.PLAYWRIGHT_CHANNEL ?? "chrome";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    actionTimeout: 10_000,
    ...(channel ? { channel } : {}),
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], ...(channel ? { channel } : {}) },
    },
    {
      // Dark is the default theme; this project runs the page checks in light.
      name: "desktop-light",
      testMatch: /pages\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        ...(channel ? { channel } : {}),
        storageState: {
          cookies: [],
          origins: [
            {
              origin: `http://localhost:${PORT}`,
              localStorage: [{ name: "sprint-zero:theme", value: "light" }],
            },
          ],
        },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        ...(channel ? { channel } : {}),
      },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
