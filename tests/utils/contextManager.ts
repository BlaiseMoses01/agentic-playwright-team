import { Browser, BrowserContext, Page } from "@playwright/test";

export type ContextEntry = {
  entryName: string; // the persona , role , or nickname for tab(context)
  context: BrowserContext;
  page: Page;
  baseUrl: string; // the baseUrl of the instance (important in auth scenarios where URL is different in different permission sets)
};

export class ContextManager {
  private contexts: Map<string, ContextEntry> = new Map();
  private browser: Browser;

  constructor(browser: Browser) {
    this.browser = browser;
  }

  /**
   * Creates a new contextWindow and page and stores it for reference and lazy load
   * @param entryName the persona , role , or nickname a context window will be referenced by
   * @returns
   */
  async initEntry(entryName: string): Promise<void> {
    if (this.contexts.has(entryName)) return;
    const context: BrowserContext = await this.browser.newContext();
    const page: Page = await context.newPage();
    this.contexts.set(entryName, {
      entryName,
      context,
      page,
      baseUrl: "",
    });
  }

  /**
   * returns a context entry's config from the contexts map
   * @param entryName the persona role or nickname a context window will be referenced by
   */
  async getEntry(entryName: string) {
    const entry = this.contexts.get(entryName);
    if (!entry)
      throw new Error(`Entry ${entryName} not registered. Make sure to initialize it first`);
    return entry;
  }

  /**
   * close a specific context entry and delete it from the contexts map
   * @param entryName the persona role or nickname a context window will be referenced by
   */
  async closeEntryContext(entryName: string) {
    const entry = this.contexts.get(entryName);
    if (!entry) throw new Error(`Entry ${entryName} not registered, was it already closed ?`);
    await entry.context.close();
    this.contexts.delete(entryName);
  }

  /**
   * close all contexts stored in the contexts map, useful for not leaving orphaned browser stuff hanging around
   */
  async closeAllContexts() {
    for (const entry of this.contexts.values()) {
      await entry.context.close();
    }
  }
}
