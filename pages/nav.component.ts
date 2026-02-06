import type { Page, Locator } from "@playwright/test";

export class NavComponent {
  readonly page: Page;
  readonly accountLink: Locator;
  readonly logoutLink: Locator;
  readonly loginLink: Locator;
  readonly signupLink: Locator;
  readonly productsLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.accountLink = page.locator('[data-testid="nav-account"]');
    this.logoutLink = page.locator('[data-testid="nav-logout"]');
    this.loginLink = page.locator('[data-testid="nav-login"]');
    this.signupLink = page.locator('[data-testid="nav-signup"]');
    this.productsLink = page.locator('[data-testid="nav-products"]');
  }

  async logout(): Promise<void> {
    await this.logoutLink.click();
    await this.page.waitForURL("**/login", { timeout: 10_000 });
  }

  async getAccountName(): Promise<string> {
    return (await this.accountLink.textContent()) ?? "";
  }

  async isLoggedIn(): Promise<boolean> {
    return this.accountLink.isVisible();
  }
}
