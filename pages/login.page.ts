import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page.js";
import { BASE_URL } from "../support/config.js";

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;
  readonly form: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('[data-testid="login-email"]');
    this.passwordInput = page.locator('[data-testid="login-password"]');
    this.submitButton = page.locator('[data-testid="login-submit"]');
    this.errorAlert = page.locator('[data-testid="login-error"]');
    this.form = page.locator('[data-testid="login-form"]');
  }

  async navigate(): Promise<void> {
    await this.goto(`${BASE_URL}/login`);
    await this.waitForReady();
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForURL("**/products", { timeout: 10_000 });
  }

  async loginExpectingError(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.errorAlert.waitFor({ state: "visible", timeout: 10_000 });
  }

  async submitEmpty(): Promise<void> {
    await this.page.evaluate(() => {
      document
        .querySelectorAll('[data-testid="login-email"], [data-testid="login-password"]')
        .forEach((el) => el.removeAttribute("required"));
    });
    await this.submitButton.click();
    await this.errorAlert.waitFor({ state: "visible", timeout: 10_000 });
  }

  async getErrorMessage(): Promise<string> {
    return (await this.errorAlert.textContent()) ?? "";
  }
}
