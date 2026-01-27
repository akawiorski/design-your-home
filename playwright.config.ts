import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import { existsSync } from "node:fs";

const isCI = Boolean(process.env.CI);
const envTestPath = ".env.test";

// Load .env.test only for local runs (CI relies on environment variables)
if (!isCI && existsSync(envTestPath)) {
  dotenv.config({
    path: envTestPath,
    override: false,
  });
}

const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENROUTER_API_KEY",
  "OPENROUTER_MODEL",
];

const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
}

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["tests/e2e/dashboard/01-basic-display.spec.ts"],
  timeout: 60_000,
  reporter: [["line"], ["html", { open: "never" }], ["junit", { outputFile: "playwright-report/junit.xml" }]],
  expect: {
    timeout: 10_000,
  },
  retries: 0,
  workers: 1,
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL ?? "",
      SUPABASE_KEY: process.env.SUPABASE_KEY ?? "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "",
      OPENROUTER_MODEL: process.env.OPENROUTER_MODEL ?? "",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
