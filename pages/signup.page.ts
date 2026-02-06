import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page.js";
import { BASE_URL } from "../support/config.js";

export class SignupPage extends BasePage {
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmInput: Locator;
  readonly submitButton: Locator;
  readonly errorsContainer: Locator;
  readonly form: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.locator('[data-testid="signup-name"]');
    this.emailInput = page.locator('[data-testid="signup-email"]');
    this.passwordInput = page.locator('[data-testid="signup-password"]');
    this.confirmInput = page.locator('[data-testid="signup-confirm"]');
    this.submitButton = page.locator('[data-testid="signup-submit"]');
    this.errorsContainer = page.locator('[data-testid="signup-errors"]');
    this.form = page.locator('[data-testid="signup-form"]');
  }

  async navigate(): Promise<void> {
    await this.goto(`${BASE_URL}/signup`);
    await this.waitForReady();
  }

  async signup(
    name: string,
    email: string,
    password: string,
    confirm: string,
  ): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmInput.fill(confirm);
    await this.submitButton.click();
    await this.page.waitForURL("**/products", { timeout: 10_000 });
  }

  async signupExpectingError(
    name: string,
    email: string,
    password: string,
    confirm: string,
  ): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmInput.fill(confirm);
    await this.submitButton.click();
    await this.errorsContainer.waitFor({ state: "visible", timeout: 10_000 });
  }

  async bypassBrowserEmailValidation(): Promise<void> {
    await this.page.evaluate(() => {
      const el = document.querySelector('[data-testid="signup-email"]');
      if (el) el.setAttribute("type", "text");
    });
  }

  async getErrorText(): Promise<string> {
    return (await this.errorsContainer.textContent()) ?? "";
  }
}
