import { setWorldConstructor, World } from "@cucumber/cucumber";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import type { PageManager } from "../pages/pageManager.page.js";

export class MyWorld extends World {
  browser: Browser | null = null;
  context: BrowserContext | null = null;
  page: Page | null = null;
  pages!: PageManager;

  /** Stores signup data so Then steps can verify the account name */
  signupName?: string;

  /** Stores the product ID being acted on for stock tracking */
  productId?: number;

  /** Stores stock count before an add/remove action for comparison */
  stockBefore?: number;

  constructor(options: ConstructorParameters<typeof World>[0]) {
    super(options);
  }
}

setWorldConstructor(MyWorld);
