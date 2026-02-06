import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./specs",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: 0,
  workers: 1, // sequential — tests share database state
  fullyParallel: false,

    reporter: process.env.CI
    ? [
        ["json", { outputFile: "./results/results.json" }],
        ["html", { open: "never" }],
      ]
    : [
        ["list"],
        ["json", { outputFile: "./results/results.json" }],
        ["html", { open: "never" }], // or "on-failure" / "always"
      ],

  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
});
