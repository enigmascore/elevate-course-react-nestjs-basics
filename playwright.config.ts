import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests: the REAL app in a real browser - backend, Postgres,
 * MailHog and the Vite dev server all running. `make e2e` seeds the
 * database first and expects docker to be up ( make docker-up ).
 *
 * Knobs ( env vars, no code changes - `make e2e-demo` sets both ):
 *   HEADLESS=1   run headless ( the browser is VISIBLE by default )
 *   SLOWMO=<ms>  slow every action down, e.g. SLOWMO=2000 for a demo
 */
const headless = !!process.env.HEADLESS;
const slowMo = Number(process.env.SLOWMO ?? 0);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  // slowed demo runs stretch every action - give them a bigger budget
  timeout: slowMo > 0 ? 600_000 : 60_000,
  use: {
    baseURL: "http://localhost:5173",
    headless,
    launchOptions: { slowMo },
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "pnpm dev",
      cwd: "./backend",
      url: "http://localhost:3000/api/interests",
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: "pnpm dev",
      cwd: "./frontend",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
