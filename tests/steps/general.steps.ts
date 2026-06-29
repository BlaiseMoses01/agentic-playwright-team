import { Given } from "../baseTest";

Given("I open a context for {string}", async ({ world, contextManager }, contextName: string) => {
  await contextManager.initEntry(contextName);
  const contextEntry = await contextManager.getEntry(contextName);
  if (!contextEntry.context || !contextEntry.page)
    throw new Error(`initalization of context failed, check base configs + contextManager source`);
  world.currentContext = contextEntry;
  world.context = contextEntry.context;
  world.page = contextEntry.page;
});

Given(
  "I switch to the context for {string}",
  async ({ world, contextManager }, contextName: string) => {
    const contextEntry = await contextManager.getEntry(contextName);
    if (!contextEntry.context || !contextEntry.page)
      throw new Error(
        `context fetch failed,  make sure to use the open step for first interactions`,
      );
    world.currentContext = contextEntry;
    world.context = contextEntry.context;
    world.page = contextEntry.page;
  },
);

Given(
  "I close the context for {string}",
  async ({ world, contextManager }, contextName: string) => {
    if (world.currentContext.entryName == contextName)
      throw new Error(
        `${contextName} is the current context, please swap to another before closing.`,
      );
    await contextManager.closeEntryContext(contextName);
  },
);

Given("I navigate to the path {string}", async ({ world }, path: string) => {
  await world.page.goto(path);
  await world.page.waitForLoadState("load");
  await world.page.pause();
});
