import { test as base, createBdd } from "playwright-bdd";
import { Page, BrowserContext } from "@playwright/test";
import { ContextManager, ContextEntry } from "./utils/contextManager";

/*
 * I learned BDD in Cucumber ,so I'm used to having a world for scenario scoped variables , I usually
 * create this type to sim it using a playwright fixture.
 */
type World = {
  currentContext: ContextEntry;
  baseUrl: string;
  page: Page;
  context: BrowserContext;
};

// add your custom fixtures, types , etc into the fixture type , then you will be able to customize and extend them below in the test config
type Fixtures = {
  world: World; // scenario-scoped global vars
  contextManager: ContextManager; //manager for multi-context scenarios
};

// customize the test config to initalize and use the custom fixtures
export const test = base.extend<Fixtures>({
  world: async ({ page, context }, use) => {
    await use({
      currentContext: {},
      baseUrl: "",
      page: page,
      context: context,
    });
  },
  contextManager: async ({ browser }, use) => {
    const cm = new ContextManager(browser);
    await use(cm);
    await cm.closeAllContexts();
  },
});

export { expect } from "@playwright/test";
export const { Given, When, Then } = createBdd(test);
