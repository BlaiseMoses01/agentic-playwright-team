import type { Page } from "@playwright/test";
import { BasePage } from "./base.page.js";
import { LoginPage } from "./login.page.js";
import { SignupPage } from "./signup.page.js";
import { NavComponent } from "./nav.component.js";

export class PageManager {
  readonly basePage: BasePage;

  private _loginPage?: LoginPage;
  private _signupPage?: SignupPage;
  private _nav?: NavComponent;

  constructor(private page: Page) {
    this.basePage = new BasePage(page);
  }

  get loginPage(): LoginPage {
    return (this._loginPage ??= new LoginPage(this.page));
  }

  get signupPage(): SignupPage {
    return (this._signupPage ??= new SignupPage(this.page));
  }

  get nav(): NavComponent {
    return (this._nav ??= new NavComponent(this.page));
  }
}
