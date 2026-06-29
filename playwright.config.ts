import { defineConfig } from "@playwright/test";
import { cucumberReporter } from "playwright-bdd";
import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`missing the ${name} env config! fix your .env or secrets`);
  return value;
}

// const testDirectory = defineBddConfig({
//     features: '',
//     steps:'',
// });

export default defineConfig({
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? parseInt(process.env.WORKERS ?? "1", 10) : 2,
  timeout: 30_000,
  reporter: [
    ["html", { open: "never", outputFile: "test-artifacts/playwright-report.html" }],
    ["json", { outputFile: "test-artifacts/playwright-report.json" }],
    cucumberReporter("html", { outputFile: "test-artifacts/cucumber-report.html" }),
  ],
  use: {
    baseURL: required("TARGET_URL"),
    actionTimeout: 30_000,
    trace: "on",
    screenshot: "only-on-failure",
  },
  //   projects:[ {
  //         {
  //             ...defin
  //         }
  //   }]
});
