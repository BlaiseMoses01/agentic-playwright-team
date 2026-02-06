import type { Page, Locator } from "@playwright/test";

export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  async goto(url: string, options?: Parameters<Page["goto"]>[1]) {
    return this.page.goto(url, options);
  }

  async waitForReady(state: "domcontentloaded" | "load" | "networkidle" = "domcontentloaded") {
    await this.page.waitForLoadState(state);
  }
}
