import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e", fullyParallel: false, workers: 1, retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: process.env.BASE_URL || "http://127.0.0.1:3100", trace: process.env.BASE_URL ? "off" : "retain-on-failure", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1080 } } }],
  webServer: process.env.BASE_URL ? undefined : { command: "npm run start -- --port 3100", url: "http://127.0.0.1:3100", reuseExistingServer: false, timeout: 60000, env: { TRACEEVAL_STORAGE: "local", TRACEEVAL_LIVE_ENABLED: "false" } }
});
