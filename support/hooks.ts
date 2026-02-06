import { After, AfterAll, Before, BeforeAll, setDefaultTimeout } from "@cucumber/cucumber";
import { chromium, firefox, webkit, type Browser } from "@playwright/test";
import type { MyWorld } from "./world.js";
import { PageManager } from "../pages/pageManager.page.js";

const browserMap = { chromium, firefox, webkit };
const browserName = (process.env.BROWSER || "chromium").toLowerCase();
const headless = process.env.HEADLESS !== "false";
const timeoutMs = Number(process.env.E2E_TIMEOUT_MS || 30_000);

let browser: Browser;

setDefaultTimeout(timeoutMs);

BeforeAll(async () => {
  const launcher = browserMap[browserName as keyof typeof browserMap] || chromium;
  browser = await launcher.launch({ headless });
});

Before(async function (this: MyWorld) {
  this.context = await browser.newContext();
  const page = await this.context.newPage();
  this.page = page;
  this.pages = new PageManager(page);
});

After(async function (this: MyWorld, scenario) {
  if (scenario?.result?.status === "FAILED" && this.page) {
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.attach(screenshot, "image/png");
  }

  await this.page?.close();
  await this.context?.close();
});

AfterAll(async () => {
  await browser?.close();
});
