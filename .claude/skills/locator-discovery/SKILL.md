---
name: locator-discovery
description: focused browser exploration for discovering and mapping element locators to Playwright page object syntax
---

# Skill: Locator Discovery

## When to use

Use this skill when the user asks you to:

- Discover locators for a specific page or component
- Build or update a page object model (POM) class
- Map agent-browser accessibility tree output to Playwright locator syntax
- Audit a page for testability (test IDs, roles, labels)
- Generate structured locator output ready for copy-paste into page objects

## Prerequisites

- `agent-browser` must be installed (see `agent-browser-explore` skill)
- Target URL must be accessible (check `TARGET` in `.env`)

## Locator Priority

Always prefer locators in this order:

1. **`getByRole()`** — most resilient, based on accessibility semantics
2. **`getByText()`** — for elements identified by visible text content
3. **`getByTestId()`** — for elements with `data-testid` attributes
4. **`getByLabel()`** — for form inputs associated with labels
5. **CSS selector** — when semantic locators aren't available
6. **XPath** — last resort only

## Core Workflow

### 1. Open the page and snapshot

```bash
agent-browser open <url>
agent-browser wait --load networkidle
agent-browser snapshot -i -c
```

Use `-c` (compact) to remove noise. Use `-d <depth>` to limit depth on complex pages.

### 2. Scope to sections

For large pages, scope snapshots to specific areas:

```bash
agent-browser snapshot -i -c -s "#sidebar"
agent-browser snapshot -i -c -s "main"
agent-browser snapshot -i -c -s "form"
agent-browser snapshot -i -c -s "[data-testid='user-table']"
```

### 3. Check for test IDs

```bash
agent-browser eval "JSON.stringify([...document.querySelectorAll('[data-testid]')].map(e => ({testId: e.dataset.testid, tag: e.tagName, text: e.textContent?.trim().slice(0, 50)})))"
```

### 4. Check for labels

```bash
agent-browser eval "JSON.stringify([...document.querySelectorAll('label')].map(l => ({for: l.htmlFor, text: l.textContent?.trim()})))"
```

## Converting Agent-Browser Refs to Playwright Locators

The accessibility tree from `agent-browser snapshot` outputs elements with roles, names, and refs. Here's how to convert them:

### Role-based elements

| Snapshot output                     | Playwright locator                                     |
| ----------------------------------- | ------------------------------------------------------ |
| `button "Save Changes" [ref=e5]`    | `page.getByRole('button', { name: 'Save Changes' })`   |
| `link "Home" [ref=e2]`              | `page.getByRole('link', { name: 'Home' })`             |
| `textbox "Email address" [ref=e8]`  | `page.getByRole('textbox', { name: 'Email address' })` |
| `checkbox "Accept terms" [ref=e9]`  | `page.getByRole('checkbox', { name: 'Accept terms' })` |
| `combobox "Country" [ref=e10]`      | `page.getByRole('combobox', { name: 'Country' })`      |
| `heading "Dashboard" [ref=e1]`      | `page.getByRole('heading', { name: 'Dashboard' })`     |
| `tab "Settings" [ref=e3]`           | `page.getByRole('tab', { name: 'Settings' })`          |
| `row "John Doe" [ref=e11]`          | `page.getByRole('row', { name: 'John Doe' })`          |
| `menuitem "Logout" [ref=e7]`        | `page.getByRole('menuitem', { name: 'Logout' })`       |
| `dialog "Confirm Delete" [ref=e12]` | `page.getByRole('dialog', { name: 'Confirm Delete' })` |

### Text-based elements (no clear role)

| Snapshot output          | Playwright locator                  |
| ------------------------ | ----------------------------------- |
| `text "Welcome back"`    | `page.getByText('Welcome back')`    |
| `text "3 items in cart"` | `page.getByText('3 items in cart')` |

### Elements with test IDs

When `data-testid` attributes exist, use them as a reliable alternative:

```typescript
page.getByTestId("submit-btn");
page.getByTestId("user-email-input");
page.getByTestId("nav-sidebar");
```

### Labeled inputs

When a `<label>` is associated with an input:

```typescript
page.getByLabel("Email");
page.getByLabel("Password");
page.getByLabel("Remember me");
```

## Output Format: Page Object Template

When reporting discovered locators, output them in this structured format that maps directly to a POM class:

```typescript
import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page.js";

export class LoginPage extends BasePage {
  // --- Locators ---
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;
  readonly rememberMeCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByRole("textbox", { name: "Email" });
    this.passwordInput = page.getByLabel("Password");
    this.submitButton = page.getByRole("button", { name: "Sign in" });
    this.forgotPasswordLink = page.getByRole("link", { name: "Forgot password" });
    this.errorMessage = page.getByRole("alert");
    this.rememberMeCheckbox = page.getByRole("checkbox", { name: "Remember me" });
  }
}
```

### Structured discovery table

Also output a discovery table for documentation:

```markdown
| Element        | Role/Type | Accessible Name | Recommended Locator                        | Confidence |
| -------------- | --------- | --------------- | ------------------------------------------ | ---------- |
| Email input    | textbox   | "Email"         | `getByRole('textbox', { name: 'Email' })`  | High       |
| Password input | (label)   | "Password"      | `getByLabel('Password')`                   | High       |
| Submit button  | button    | "Sign in"       | `getByRole('button', { name: 'Sign in' })` | High       |
| Error banner   | alert     | —               | `getByRole('alert')`                       | Medium     |
```

Confidence levels:

- **High** — role + unique accessible name, unlikely to break
- **Medium** — role only (no name) or text-based, could match multiple elements
- **Low** — CSS/XPath fallback, fragile to DOM changes

## Handling Ambiguous Locators

When a locator matches multiple elements:

1. **Add `exact: true`**: `getByRole('button', { name: 'Save', exact: true })`
2. **Scope with parent**: `page.getByRole('dialog').getByRole('button', { name: 'Save' })`
3. **Use nth()**: `page.getByRole('button', { name: 'Delete' }).nth(0)` (last resort)
4. **Use filter()**: `page.getByRole('listitem').filter({ hasText: 'Product A' })`

## Verifying Locators

After discovering locators, verify them interactively:

```bash
# Count matches — should be exactly 1 for unique locators
agent-browser eval "document.querySelectorAll('button').length"

# Check visibility
agent-browser eval "document.querySelector('[data-testid=\"submit\"]')?.offsetParent !== null"
```

## Tips

- Run discovery on each distinct page state (empty form, filled form, error state, success state) to capture all relevant elements.
- Dynamic content (modals, dropdowns, tooltips) requires triggering the interaction first, then re-snapshotting.
- If the page uses Shadow DOM, use `agent-browser eval` to pierce shadow roots: `document.querySelector('my-component').shadowRoot.querySelector('button')`.
- Always close the browser when done: `agent-browser close`.
- Register newly discovered page objects in `pages/pageManager.page.ts` so they're accessible via `this.pages` in step definitions.
