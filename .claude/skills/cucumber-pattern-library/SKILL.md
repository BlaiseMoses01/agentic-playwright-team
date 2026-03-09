---
name: cucumber-pattern-library
description: reference of reusable Gherkin step patterns, anti-patterns, and conventions for BDD test automation
---

# Skill: Cucumber Pattern Library

## When to use

Use this skill when the user asks you to:

- Write new Gherkin feature files or scenarios
- Create or refactor step definitions
- Follow best practices for BDD step design
- Understand tag conventions and test organization
- Use Scenario Outlines with Examples tables
- Avoid common Cucumber anti-patterns

## Reusable Step Patterns by Category

### Authentication

```gherkin
Given I am logged in as {string}
Given I am logged in as a user with role {string}
Given I am not logged in
When I log out
```

Step definition pattern:

```typescript
import { Given, When } from "@cucumber/cucumber";
import { getTestUser } from "../support/users.js";
import type { MyWorld } from "../support/world.js";

Given("I am logged in as {string}", async function (this: MyWorld, role: string) {
  const user = getTestUser(role);
  await this.pages.login.goto(process.env.TARGET + "/login");
  await this.pages.login.login(user.email, user.password);
});

Given("I am not logged in", async function (this: MyWorld) {
  await this.context.clearCookies();
});

When("I log out", async function (this: MyWorld) {
  await this.pages.nav.clickLogout();
});
```

### Navigation

```gherkin
When I navigate to {string}
When I navigate to the {string} page
When I click the {string} link
When I click the {string} button
When I go back
When I refresh the page
Then I should be on the {string} page
Then the URL should contain {string}
```

Step definition pattern:

```typescript
When("I navigate to {string}", async function (this: MyWorld, path: string) {
  await this.page.goto(`${process.env.TARGET}${path}`);
  await this.page.waitForLoadState("domcontentloaded");
});

Then("I should be on the {string} page", async function (this: MyWorld, pageName: string) {
  // Map page names to URL patterns
  const urlMap: Record<string, string> = {
    dashboard: "/dashboard",
    settings: "/settings",
    login: "/login",
  };
  const expected = urlMap[pageName.toLowerCase()];
  await expect(this.page).toHaveURL(new RegExp(expected));
});
```

### Forms

```gherkin
When I fill in {string} with {string}
When I clear the {string} field
When I select {string} from {string}
When I check {string}
When I uncheck {string}
When I submit the form
When I fill in the form with:
  | field    | value            |
  | Email    | test@example.com |
  | Password | secret123        |
```

Step definition pattern:

```typescript
When(
  "I fill in {string} with {string}",
  async function (this: MyWorld, field: string, value: string) {
    await this.page.getByLabel(field).fill(value);
  },
);

When("I fill in the form with:", async function (this: MyWorld, dataTable) {
  const rows = dataTable.rows() as string[][];
  for (const [field, value] of rows) {
    await this.page.getByLabel(field).fill(value);
  }
});

When(
  "I select {string} from {string}",
  async function (this: MyWorld, option: string, field: string) {
    await this.page.getByLabel(field).selectOption(option);
  },
);

When("I check {string}", async function (this: MyWorld, label: string) {
  await this.page.getByRole("checkbox", { name: label }).check();
});
```

### Assertions

```gherkin
Then I should see {string}
Then I should not see {string}
Then I should see the heading {string}
Then I should see {int} {string} items
Then the {string} field should contain {string}
Then the {string} field should be empty
Then the {string} button should be disabled
Then the {string} button should be enabled
Then I should see a success message
Then I should see an error message containing {string}
```

Step definition pattern:

```typescript
import { expect } from "@playwright/test";

Then("I should see {string}", async function (this: MyWorld, text: string) {
  await expect(this.page.getByText(text)).toBeVisible();
});

Then("I should not see {string}", async function (this: MyWorld, text: string) {
  await expect(this.page.getByText(text)).not.toBeVisible();
});

Then("I should see the heading {string}", async function (this: MyWorld, heading: string) {
  await expect(this.page.getByRole("heading", { name: heading })).toBeVisible();
});

Then("the {string} button should be disabled", async function (this: MyWorld, name: string) {
  await expect(this.page.getByRole("button", { name })).toBeDisabled();
});
```

### Tables and Lists

```gherkin
Then the table should have {int} rows
Then the table should contain a row with {string}
Then the list should contain:
  | Item A |
  | Item B |
  | Item C |
```

### Waits (explicit timing)

```gherkin
Then I should see {string} within {int} seconds
When I wait for the page to load
When I wait for the network to be idle
```

Step definition pattern:

```typescript
Then(
  "I should see {string} within {int} seconds",
  async function (this: MyWorld, text: string, seconds: number) {
    await expect(this.page.getByText(text)).toBeVisible({ timeout: seconds * 1000 });
  },
);

When("I wait for the page to load", async function (this: MyWorld) {
  await this.page.waitForLoadState("domcontentloaded");
});
```

## Scenario Outlines with Examples

Use Scenario Outlines to run the same scenario with different data:

```gherkin
@ui @login
Scenario Outline: Login with different roles
  Given I navigate to the login page
  When I fill in "Email" with "<email>"
  And I fill in "Password" with "<password>"
  And I click the "Sign in" button
  Then I should be on the "<landing>" page

  Examples:
    | email              | password  | landing    |
    | admin@test.com     | admin123  | dashboard  |
    | viewer@test.com    | view123   | reports    |

@ui @validation
Scenario Outline: Form validation messages
  Given I am on the registration page
  When I fill in "<field>" with "<value>"
  And I submit the form
  Then I should see an error message containing "<error>"

  Examples:
    | field    | value       | error                    |
    | Email    | not-email   | Please enter valid email |
    | Password | 123         | At least 8 characters    |
    | Name     |             | Name is required         |
```

## Tag Conventions

| Tag           | Purpose                  | When to use                                            |
| ------------- | ------------------------ | ------------------------------------------------------ |
| `@ui`         | Browser-based UI tests   | Any test that uses a browser                           |
| `@api`        | API-level tests          | Tests that call APIs directly without a browser        |
| `@smoke`      | Critical path tests      | Subset for quick validation (login, core flows)        |
| `@regression` | Full regression suite    | All tests, run on schedule or before release           |
| `@wip`        | Work in progress         | Tests being actively developed, excluded from CI       |
| `@known-bug`  | Known application defect | Tests expected to fail due to a reported bug           |
| `@flaky`      | Intermittently failing   | Tests with known stability issues, needs investigation |
| `@slow`       | Long-running tests       | Tests that take > 30 seconds, may skip in fast runs    |

### Running with tags

```bash
# Run only smoke tests
npm run cucumber:tags -- --tags "@smoke"

# Run UI tests but skip WIP
npm run cucumber:tags -- --tags "@ui and not @wip"

# Run a specific feature area
npm run cucumber:tags -- --tags "@login or @registration"

# Skip known bugs and flaky tests
npm run cucumber:tags -- --tags "not @known-bug and not @flaky"
```

## Anti-Patterns to Avoid

### 1. Step Definition Explosion

**Bad**: Creating hyper-specific steps for every variation.

```gherkin
# BAD - each of these needs a separate step definition
When I click the blue submit button on the login form
When I click the green submit button on the registration form
When I click the red cancel button on the modal
```

**Good**: Parameterize with `{string}`.

```gherkin
# GOOD - one step definition handles all
When I click the {string} button
```

### 2. Imperative Steps (Too Low-Level)

**Bad**: Writing steps that read like code.

```gherkin
# BAD - too implementation-focused
When I find the element with id "email-input"
And I clear the element
And I type "test@example.com" into the element
And I find the element with id "password-input"
And I type "secret" into the element
And I find the button with class "submit-btn"
And I click the button
```

**Good**: Declarative, behavior-focused steps.

```gherkin
# GOOD - describes intent
When I log in with email "test@example.com" and password "secret"
# or even better
Given I am logged in as "admin"
```

### 3. Coupled Scenarios

**Bad**: Scenarios that depend on each other or on execution order.

```gherkin
# BAD - Scenario 2 depends on Scenario 1
Scenario: Create a user
  When I create user "John"
  Then I should see "User created"

Scenario: Edit the user
  When I edit user "John"        # assumes "John" exists from previous scenario
  Then I should see "User updated"
```

**Good**: Each scenario is self-contained.

```gherkin
# GOOD - independent scenarios
Scenario: Edit a user
  Given a user "John" exists     # sets up its own data
  When I edit user "John"
  Then I should see "User updated"
```

### 4. Assertion in Given/When Steps

**Bad**: Mixing assertions into setup or action steps.

```gherkin
# BAD
Given I am on the dashboard and I can see the sidebar
When I click "Settings" and the page loads successfully
```

**Good**: Only assert in Then steps.

```gherkin
# GOOD
Given I am on the dashboard
When I click "Settings"
Then I should be on the settings page
```

### 5. Feature File as Test Script

**Bad**: Writing scenarios that read like test scripts with technical details.

```gherkin
# BAD
Scenario: Test login page CSS and redirect
  Given I open Chrome browser
  And I set viewport to 1920x1080
  And I navigate to https://app.example.com/login
  When I wait 2 seconds
  And I input "admin" into #username
```

**Good**: Feature files describe business behavior.

```gherkin
# GOOD
Scenario: Successful admin login
  Given I am on the login page
  When I log in as "admin"
  Then I should be on the dashboard
```

## Guidelines for Parameterizing Steps

1. Use `{string}` for text values — always wrap in double quotes in Gherkin
2. Use `{int}` for whole numbers
3. Use `{float}` for decimal numbers
4. Use DataTables for structured data (forms, lists)
5. Avoid boolean parameters — write two separate steps instead:
   - `Then the button should be enabled` / `Then the button should be disabled`
6. Keep parameter count to 3 or fewer per step — if you need more, use a DataTable

## Tips

- Write feature files first, then implement step definitions — this is the BDD workflow.
- Aim for 3-8 steps per scenario. If a scenario has 15+ steps, it's probably testing too many things.
- Use Background for common setup steps shared by all scenarios in a feature file.
- Keep step definitions thin — they should delegate to page objects, not contain locator logic.
- One step definition file per feature or domain area, not one per feature file.
- Store step definitions in `steps/` directory, matching the feature name: `steps/login.steps.ts` for `features/login.feature`.
