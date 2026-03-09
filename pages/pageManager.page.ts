import type { Page } from "@playwright/test";
import { BasePage } from "./base.page.js";

// Add your page objects here following this pattern:
//   ABOVE CLASS
//   import { LoginPage } from "./login.page.js";
//
//   IN CLASS ABOVE CONSTRUCTOR
//   private _loginPage?: LoginPage;
//
//   BELOW CONSTRUCTOR
//   get loginPage(): LoginPage {
//     return (this._loginPage ??= new LoginPage(this.page));
//   }

export class PageManager {
  readonly basePage: BasePage;

  constructor(private page: Page) {
    this.basePage = new BasePage(page);
  }
}
