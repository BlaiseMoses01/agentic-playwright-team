import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    baseURL: process.env.TARGET || "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
});
