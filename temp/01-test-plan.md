# Authentication UI -- BDD Test Plan

**Feature file:** `features/ui/auth.feature`
**Tags:** `@ui @auth`
**Base URL:** `https://sdet-store-testbed-26.fly.dev`
**Test data:** `users.json`

---

## 1. Discovered Selectors (from live app inspection)

### 1a. Login Page (`/login`)

| Element              | Selector (data-testid)          | Fallback / Notes                                   |
|----------------------|---------------------------------|-----------------------------------------------------|
| Login form           | `[data-testid="login-form"]`    | `form[action="/login"]`                             |
| Email input          | `[data-testid="login-email"]`   | `#email`, `input[name="email"]`                     |
| Password input       | `[data-testid="login-password"]`| `#password`, `input[name="password"]`               |
| Submit button        | `[data-testid="login-submit"]`  | `button[type="submit"]`, text "Log In"              |
| Error alert          | `[data-testid="login-error"]`   | `.alert.alert-error` -- only rendered on error POST |
| "Sign up" link       | `a[href="/signup"]`             | Inside `<p>` below the form                         |

**Form submission:** `method="POST" action="/login"` -- standard HTML form POST, not AJAX. The page fully reloads on submit. On error, the form re-renders with the error div injected above the form inside the card. On success, server-side redirect to `/products`.

### 1b. Sign Up Page (`/signup`)

| Element              | Selector (data-testid)           | Fallback / Notes                                   |
|----------------------|----------------------------------|-----------------------------------------------------|
| Signup form          | `[data-testid="signup-form"]`    | `form[action="/signup"]`                            |
| Full Name input      | `[data-testid="signup-name"]`    | `#name`, `input[name="name"]`                       |
| Email input          | `[data-testid="signup-email"]`   | `#email`, `input[name="email"]`                     |
| Password input       | `[data-testid="signup-password"]`| `#password`, `input[name="password"]`               |
| Confirm Password     | `[data-testid="signup-confirm"]` | `#confirm_password`, `input[name="confirm_password"]`|
| Submit button        | `[data-testid="signup-submit"]`  | `button[type="submit"]`, text "Sign Up"             |
| Error container      | `[data-testid="signup-errors"]`  | `.alert.alert-error` -- contains child `<div>` per error |
| "Log in" link        | `a[href="/login"]`               | Inside `<p>` below the form                         |

**Input placeholders:**
- Name: `Jane Doe`
- Email: `jane@example.com`
- Password: `Min 8 chars, 1 uppercase, 1 number`
- Confirm Password: `Re-enter password`

**Form fields have `required` attribute** -- the browser will block submission of truly empty fields. Step implementations must use `page.evaluate()` to remove the `required` attribute, OR they must fill fields with values that pass browser-level validation but fail server-side validation.

**Error rendering:** Errors appear as `<div class="alert alert-error" data-testid="signup-errors"><div>message</div></div>`. Multiple errors can appear as sibling `<div>` children.

### 1c. Authenticated Navigation (after login on `/products`)

| Element              | Selector (data-testid)          | Notes                                               |
|----------------------|---------------------------------|------------------------------------------------------|
| Account link         | `[data-testid="nav-account"]`   | Text = user's full name (e.g., "Alice Johnson"), href="/account" |
| Logout link          | `[data-testid="nav-logout"]`    | Text = "Logout", href="/logout"                      |
| Products link        | `[data-testid="nav-products"]`  | Always present                                       |
| Cart link            | `[data-testid="nav-cart"]`      | Present when logged in                               |

**When logged out**, the nav shows: `nav-products`, `nav-login`, `nav-signup`.
**When logged in**, the nav shows: `nav-products`, `nav-cart`, `nav-account`, `nav-logout`.

### 1d. Session Mechanism

- Cookie name: `session_id`
- Cookie value format: `sess_<hex>`
- Domain-scoped to the testbed

---

## 2. Scenario-to-Step Mapping

### Scenario 1: Sign up with valid details creates an account and logs in
**Tags:** `@guest`

| Step                                                 | Expression                                            | Action                                                                                   |
|------------------------------------------------------|-------------------------------------------------------|------------------------------------------------------------------------------------------|
| `Given I am on the sign up page`                     | `Given('I am on the sign up page', ...)`              | Navigate to `/signup`, wait for the form to be visible.                                  |
| `When I submit the sign up form with valid details`  | `When('I submit the sign up form with valid details', ...)` | Generate a unique email (e.g., `signup_<timestamp>@test.com`), fill name/email/password/confirm, click submit. |
| `Then I should be redirected to the products page`   | `Then('I should be redirected to the products page', ...)` | Assert `page.url()` ends with `/products`. Use `page.waitForURL('**/products')`.         |
| `And I should see my account link in the nav`        | `Then('I should see my account link in the nav', ...)` | Assert `[data-testid="nav-account"]` is visible and has non-empty text content.          |

### Scenario 2: Sign up validation errors (Scenario Outline x6)
**Tags:** `@guest @error`

| Step                                                        | Expression                                                 | Action                                                                                                    |
|-------------------------------------------------------------|------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| `Given I am on the sign up page`                            | (reused)                                                   | (same as above)                                                                                           |
| `When I submit the sign up form with <invalid_case>`        | `When('I submit the sign up form with {invalidCase}', ...)` | See "Invalid Case Dispatch" table below.                                                                   |
| `Then I should see the signup error "<message>"`            | `Then('I should see the signup error {string}', ...)`      | Wait for `[data-testid="signup-errors"]` to be visible, assert it contains the expected text.             |

**Invalid Case Dispatch** (each `<invalid_case>` maps to a specific fill strategy):

| `<invalid_case>`               | Fill Strategy                                                                                              |
|--------------------------------|------------------------------------------------------------------------------------------------------------|
| `a 1-character name`           | Name: `"A"`, Email: valid, Password: valid, Confirm: valid                                                 |
| `an invalid email`             | Name: valid, Email: `"not-an-email"` (must bypass browser `type=email` validation -- see note), Password: valid, Confirm: valid |
| `a short password`             | Name: valid, Email: valid, Password: `"Ab1"`, Confirm: `"Ab1"`                                            |
| `no uppercase in password`     | Name: valid, Email: valid, Password: `"password1!"`, Confirm: `"password1!"`                               |
| `no number in password`        | Name: valid, Email: valid, Password: `"Password!"`, Confirm: `"Password!"`                                |
| `mismatched confirm password`  | Name: valid, Email: valid, Password: `"Password123!"`, Confirm: `"Different123!"`                          |

**IMPORTANT -- "an invalid email" case:** The email input has `type="email"` and `required`, so the browser will block submission of a clearly invalid value like `"not-an-email"`. The step must either:
1. Use `page.evaluate()` to change the input type to `text` before filling, OR
2. Use `page.evaluate()` to remove the `required` attribute and set the value directly, OR
3. Use a value that passes browser validation but fails server-side (e.g., `"missing-at-sign"` -- note: this may still pass browser validation check). The safest approach is option 1: `await page.evaluate(() => document.querySelector('#email')!.setAttribute('type', 'text'))`.

### Scenario 3: Sign up with an existing email shows an error
**Tags:** `@guest @xfail-buggy-auth-2`

| Step                                                                | Expression                                                               | Action                                                                                        |
|---------------------------------------------------------------------|--------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| `Given I am on the sign up page`                                    | (reused)                                                                 | (same)                                                                                        |
| `When I submit the sign up form with an email that already exists`  | `When('I submit the sign up form with an email that already exists', ...)` | Fill form with `taken@example.com` (from users.json), valid name, valid password+confirm. Submit. |
| `Then I should see the signup error "An account with this email already exists."` | (reused from `Then('I should see the signup error {string}', ...)`)       | (same)                                                                                        |

### Scenario 4: Login with valid credentials creates a session
**Tags:** `@guest`

| Step                                                      | Expression                                                    | Action                                                                                      |
|-----------------------------------------------------------|---------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| `Given I am on the login page`                            | `Given('I am on the login page', ...)`                        | Navigate to `/login`, wait for form to be visible.                                          |
| `When I submit the login form with valid credentials`     | `When('I submit the login form with valid credentials', ...)` | Fill email/password with `alice@example.com` / `Password123!` (from users.json). Submit.    |
| `Then I should be redirected to the products page`        | (reused)                                                      | (same)                                                                                      |

### Scenario 5: Login with missing credentials shows an error
**Tags:** `@guest @error`

| Step                                                                | Expression                                                                  | Action                                                                                        |
|---------------------------------------------------------------------|-----------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| `Given I am on the login page`                                      | (reused)                                                                    | (same)                                                                                        |
| `When I submit the login form with missing email or password`       | `When('I submit the login form with missing email or password', ...)`       | Must bypass browser `required` validation. Use `page.evaluate()` to remove `required` from both inputs, then submit empty. |
| `Then I should see the login error "Please enter both email and password."` | `Then('I should see the login error {string}', ...)`                       | Wait for `[data-testid="login-error"]`, assert text matches.                                  |

### Scenario 6: Login with invalid credentials shows an error
**Tags:** `@guest @error`

| Step                                                                | Expression                                                               | Action                                                                            |
|---------------------------------------------------------------------|--------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| `Given I am on the login page`                                      | (reused)                                                                 | (same)                                                                            |
| `When I submit the login form with invalid credentials`             | `When('I submit the login form with invalid credentials', ...)`          | Fill with `nobody@doesnotexist.com` / `WrongPass999!`. Submit.                    |
| `Then I should see the login error "Invalid email or password."`    | (reused)                                                                 | (same)                                                                            |

### Scenario 7: Login with wrong password for Alice is rejected
**Tags:** `@guest @error @xfail-buggy-auth-1`

| Step                                                                              | Expression                                                                                    | Action                                                                        |
|-----------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| `Given I am on the login page`                                                    | (reused)                                                                                      | (same)                                                                        |
| `When I submit the login form with email "alice@example.com" and a wrong password`| `When('I submit the login form with email {string} and a wrong password', ...)`               | Fill email with the parameterized string, password with `"WrongPassword999!"`. Submit. |
| `Then I should see the login error "Invalid email or password."`                  | (reused)                                                                                      | (same)                                                                        |

### Scenario 8: Logout clears the session
**Tags:** `@user`

| Step                                           | Expression                                              | Action                                                                                       |
|------------------------------------------------|---------------------------------------------------------|----------------------------------------------------------------------------------------------|
| `Given I am logged in`                         | `Given('I am logged in', ...)`                          | Navigate to `/login`, fill alice credentials, submit, wait for `/products` redirect.         |
| `When I log out`                               | `When('I log out', ...)`                                | Click `[data-testid="nav-logout"]`.                                                          |
| `Then I should be redirected to the login page`| `Then('I should be redirected to the login page', ...)` | Assert URL ends with `/login`. Use `page.waitForURL('**/login')`.                            |

### Scenario 9: Logged in users are redirected away from auth pages
**Tags:** `@user @edge`

| Step                                                 | Expression                                            | Action                                                |
|------------------------------------------------------|-------------------------------------------------------|-------------------------------------------------------|
| `Given I am logged in`                               | (reused)                                              | (same)                                                |
| `When I visit the login page`                        | `When('I visit the login page', ...)`                 | Navigate to `/login`.                                 |
| `Then I should be redirected to the products page`   | (reused)                                              | (same)                                                |

### Scenario 10: Logged in users are redirected away from sign up
**Tags:** `@user @edge`

| Step                                                 | Expression                                            | Action                                                |
|------------------------------------------------------|-------------------------------------------------------|-------------------------------------------------------|
| `Given I am logged in`                               | (reused)                                              | (same)                                                |
| `When I visit the sign up page`                      | `When('I visit the sign up page', ...)`               | Navigate to `/signup`.                                |
| `Then I should be redirected to the products page`   | (reused)                                              | (same)                                                |

### Scenario 11: Expired sessions are rejected
**Tags:** `@user @edge @xfail-buggy-auth-3`

| Step                                                 | Expression                                                   | Action                                                                                         |
|------------------------------------------------------|--------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| `Given I have an expired session cookie`             | `Given('I have an expired session cookie', ...)`             | Set a fake/expired cookie: `await context.addCookies([{ name: 'session_id', value: 'sess_expired_fake_000', domain: 'sdet-store-testbed-26.fly.dev', path: '/' }])`. |
| `When I visit the products page`                     | `When('I visit the products page', ...)`                     | Navigate to `/products`.                                                                       |
| `Then I should be redirected to the login page`      | (reused)                                                     | (same)                                                                                         |

---

## 3. Page Objects Required

### 3a. `LoginPage` (file: `pages/login.page.ts`)

```typescript
import { BasePage } from './base.page.js';
import type { Page, Locator } from '@playwright/test';

export class LoginPage extends BasePage {
  // --- Locators ---
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;
  readonly form: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput     = page.locator('[data-testid="login-email"]');
    this.passwordInput  = page.locator('[data-testid="login-password"]');
    this.submitButton   = page.locator('[data-testid="login-submit"]');
    this.errorAlert     = page.locator('[data-testid="login-error"]');
    this.form           = page.locator('[data-testid="login-form"]');
  }

  // --- Methods ---
  async navigate(): Promise<void>;
    // goto(BASE_URL + '/login'), waitForReady()

  async login(email: string, password: string): Promise<void>;
    // fill email, fill password, click submit, wait for navigation

  async loginExpectingError(email: string, password: string): Promise<void>;
    // fill email, fill password, click submit, wait for errorAlert to be visible

  async submitEmpty(): Promise<void>;
    // remove 'required' attrs via page.evaluate(), click submit

  async getErrorMessage(): Promise<string>;
    // return errorAlert.textContent()
}
```

### 3b. `SignupPage` (file: `pages/signup.page.ts`)

```typescript
import { BasePage } from './base.page.js';
import type { Page, Locator } from '@playwright/test';

export class SignupPage extends BasePage {
  // --- Locators ---
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmInput: Locator;
  readonly submitButton: Locator;
  readonly errorsContainer: Locator;
  readonly form: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput        = page.locator('[data-testid="signup-name"]');
    this.emailInput       = page.locator('[data-testid="signup-email"]');
    this.passwordInput    = page.locator('[data-testid="signup-password"]');
    this.confirmInput     = page.locator('[data-testid="signup-confirm"]');
    this.submitButton     = page.locator('[data-testid="signup-submit"]');
    this.errorsContainer  = page.locator('[data-testid="signup-errors"]');
    this.form             = page.locator('[data-testid="signup-form"]');
  }

  // --- Methods ---
  async navigate(): Promise<void>;
    // goto(BASE_URL + '/signup'), waitForReady()

  async signup(name: string, email: string, password: string, confirm: string): Promise<void>;
    // fill all four fields, click submit, wait for navigation

  async signupExpectingError(name: string, email: string, password: string, confirm: string): Promise<void>;
    // fill all four fields, click submit, wait for errorsContainer to be visible

  async bypassEmailValidation(): Promise<void>;
    // page.evaluate(() => document.querySelector('#email')?.setAttribute('type', 'text'))

  async getErrorMessages(): Promise<string[]>;
    // return array of text from errorsContainer child divs

  async getFirstError(): Promise<string>;
    // return textContent of the errorsContainer (contains all error messages)
}
```

### 3c. `NavComponent` (file: `pages/nav.component.ts`)

```typescript
import type { Page, Locator } from '@playwright/test';

export class NavComponent {
  readonly page: Page;
  readonly accountLink: Locator;
  readonly logoutLink: Locator;
  readonly loginLink: Locator;
  readonly signupLink: Locator;
  readonly productsLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.accountLink  = page.locator('[data-testid="nav-account"]');
    this.logoutLink   = page.locator('[data-testid="nav-logout"]');
    this.loginLink    = page.locator('[data-testid="nav-login"]');
    this.signupLink   = page.locator('[data-testid="nav-signup"]');
    this.productsLink = page.locator('[data-testid="nav-products"]');
  }

  // --- Methods ---
  async logout(): Promise<void>;
    // click logoutLink, wait for navigation

  async getAccountName(): Promise<string>;
    // return accountLink.textContent()

  async isLoggedIn(): Promise<boolean>;
    // return accountLink.isVisible()
}
```

### 3d. Update `PageManager` (file: `pages/pageManager.page.ts`)

Add lazy-initialized accessors for `LoginPage`, `SignupPage`, and `NavComponent`:

```typescript
import type { Page } from '@playwright/test';
import { BasePage } from './base.page.js';
import { LoginPage } from './login.page.js';
import { SignupPage } from './signup.page.js';
import { NavComponent } from './nav.component.js';

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
```

---

## 4. Step Definition Files

### 4a. `steps/auth.steps.ts` -- All authentication step definitions

This single file contains all step definitions needed for `features/ui/auth.feature`. Grouping them here keeps the mapping 1-feature : 1-step-file clean.

```
Given('I am on the sign up page', ...)
Given('I am on the login page', ...)
Given('I am logged in', ...)
Given('I have an expired session cookie', ...)

When('I submit the sign up form with valid details', ...)
When('I submit the sign up form with a 1-character name', ...)
When('I submit the sign up form with an invalid email', ...)
When('I submit the sign up form with a short password', ...)
When('I submit the sign up form with no uppercase in password', ...)
When('I submit the sign up form with no number in password', ...)
When('I submit the sign up form with mismatched confirm password', ...)
When('I submit the sign up form with an email that already exists', ...)
When('I submit the login form with valid credentials', ...)
When('I submit the login form with missing email or password', ...)
When('I submit the login form with invalid credentials', ...)
When('I submit the login form with email {string} and a wrong password', ...)
When('I log out', ...)
When('I visit the login page', ...)
When('I visit the sign up page', ...)
When('I visit the products page', ...)

Then('I should be redirected to the products page', ...)
Then('I should be redirected to the login page', ...)
Then('I should see my account link in the nav', ...)
Then('I should see the signup error {string}', ...)
Then('I should see the login error {string}', ...)
```

**Note on Scenario Outline matching:** The `<invalid_case>` column in the Examples table produces literal step text like `When I submit the sign up form with a 1-character name`. Each case needs its own `When(...)` definition since the cases are semantically different fill strategies (not just parameterized strings).

---

## 5. Test Data Strategy

### 5a. Existing Users (from `users.json`)

| User     | Email                  | Password       | Purpose                                  |
|----------|------------------------|----------------|------------------------------------------|
| Alice    | alice@example.com      | Password123!   | Valid login, wrong password scenarios     |
| Bob      | bob@example.com        | TestPass456!   | Alternative valid login (if needed)       |
| Existing | taken@example.com      | Exists789!     | "Email already exists" signup scenario    |

Load these at the top of `auth.steps.ts`:
```typescript
import users from '../users.json' assert { type: 'json' };
const alice = users[0];  // { email, password, name }
const taken = users[2];
```

Or, if JSON import assertion is not supported, read the file with `fs.readFileSync`.

### 5b. Dynamic Sign-Up Data

For the "valid details" signup scenario, generate a unique email to avoid collision:
```typescript
const uniqueEmail = `testuser_${Date.now()}@test.com`;
const signupData = {
  name: 'Test User',
  email: uniqueEmail,
  password: 'Password123!',
  confirm: 'Password123!',
};
```

Store this on the World object if the `Then` step needs to verify the account name:
```typescript
// In world.ts, add:
signupData?: { name: string; email: string; password: string };
```

### 5c. Invalid Credential Data (hardcoded in steps)

| Scenario                 | Email                        | Password           |
|--------------------------|------------------------------|---------------------|
| Invalid credentials      | `nobody@doesnotexist.com`    | `WrongPass999!`     |
| Wrong password for Alice | `alice@example.com` (param)  | `WrongPassword999!` |
| Missing credentials      | (empty)                      | (empty)             |

### 5d. Validation Error Test Data

All values are hardcoded in each When step since they are specific to the validation rule being tested. A helper function can reduce duplication:

```typescript
async function fillSignupWithOverrides(
  signupPage: SignupPage,
  overrides: Partial<{ name: string; email: string; password: string; confirm: string }>
): Promise<void> {
  const defaults = {
    name: 'Valid Name',
    email: `valid_${Date.now()}@test.com`,
    password: 'Password123!',
    confirm: 'Password123!',
  };
  const data = { ...defaults, ...overrides };
  await signupPage.signupExpectingError(data.name, data.email, data.password, data.confirm);
}
```

---

## 6. Tag Strategy

### 6a. Standard Tags

| Tag       | Meaning                                              | Cucumber Usage                                 |
|-----------|------------------------------------------------------|------------------------------------------------|
| `@ui`     | UI (browser) test                                    | `--tags @ui` to run all UI tests               |
| `@auth`   | Authentication feature                               | `--tags @auth` to run only auth tests          |
| `@guest`  | Scenario starts as unauthenticated user              | No special hook needed (default state)         |
| `@user`   | Scenario starts as authenticated user                | Could wire a Before hook to auto-login         |
| `@error`  | Scenario expects an error condition                  | Informational, no hook needed                  |
| `@edge`   | Edge case scenario                                   | Informational, no hook needed                  |

### 6b. `@xfail-buggy-*` Tags (Expected Failures)

These three scenarios test known bugs in the testbed that are expected to fail:

| Tag                    | Scenario                                        | Known Bug                                         |
|------------------------|-------------------------------------------------|---------------------------------------------------|
| `@xfail-buggy-auth-1` | Login with wrong password for Alice is rejected  | Server may accept wrong password for Alice        |
| `@xfail-buggy-auth-2` | Sign up with existing email shows error          | Server may not properly reject duplicate emails   |
| `@xfail-buggy-auth-3` | Expired sessions are rejected                    | Server may not validate expired session cookies   |

**Handling strategy -- two options (recommend Option A):**

**Option A: Exclude from default runs, run separately.**
- Default run: `--tags "@auth and not @xfail-buggy-auth-1 and not @xfail-buggy-auth-2 and not @xfail-buggy-auth-3"`
- Xfail run: `--tags "@xfail-buggy-auth-1 or @xfail-buggy-auth-2 or @xfail-buggy-auth-3"` (expect failures)
- Add npm scripts for convenience.

**Option B: Use a Before/After hook to invert the pass/fail result.**
```typescript
Before({ tags: '@xfail-buggy-auth-1 or @xfail-buggy-auth-2 or @xfail-buggy-auth-3' }, async function () {
  this.xfail = true;
});
```
Then in an After hook, if `this.xfail` is true and the scenario PASSED, mark it as a concern (bug may have been fixed). If it FAILED, treat it as an expected failure and skip reporting. This approach is more complex and Cucumber does not natively support "expected failure" status, so Option A is recommended.

---

## 7. Edge Cases and Risks

### 7a. Browser-Level Validation vs. Server-Level Validation

The HTML form uses `required` and `type="email"` attributes. These cause the browser to block submission before the request reaches the server.

**Affected scenarios:**
- "Login with missing credentials" -- both inputs have `required`.
- "Sign up with an invalid email" -- email input has `type="email"`.

**Mitigation:** Use `page.evaluate()` in the step to strip `required` attributes (and change `type` to `text` for the email case) before filling and submitting.

### 7b. Redirect Assertion Timing

After form submission, the server issues a 302 redirect. Playwright's `page.waitForURL()` is the correct primitive here. Use it with a glob pattern and a reasonable timeout:
```typescript
await page.waitForURL('**/products', { timeout: 10000 });
```
Do NOT rely on `page.url()` alone without waiting, as the check may run before the redirect completes.

### 7c. Cookie Manipulation for Expired Sessions

The `Given I have an expired session cookie` step must:
1. NOT actually log in first (that would create a valid session).
2. Use `context.addCookies()` to inject a fabricated `session_id` cookie.
3. The cookie value should be syntactically plausible but not correspond to a real session (e.g., `sess_expired_fake_000`).
4. The domain must match: `sdet-store-testbed-26.fly.dev`.
5. The path should be `/`.

**Risk:** If the server only checks cookie existence (not validity), this scenario would pass instead of redirecting to login. That is the known bug tagged `@xfail-buggy-auth-3`.

### 7d. Signup Creating Real Accounts

Each run of the "valid details" signup scenario creates a real account in the testbed. Over time this could accumulate test data. Use timestamped or UUID-based emails to avoid collision, but be aware the testbed may have data that persists.

### 7e. Form Submission Method

All forms use standard `method="POST"` with full page reload (not SPA/AJAX). This means:
- After submit, Playwright will see a full navigation event.
- `page.waitForURL()` and `page.waitForLoadState()` are appropriate.
- No need to intercept XHR/fetch calls.

### 7f. Race Condition on Redirect Assertions

For the "logged in user redirected away from auth pages" scenarios: the redirect might happen server-side (302) or client-side (JS). If server-side, the redirect occurs before the page body loads. If client-side, there's a brief flash of the auth page. Use `page.waitForURL()` with the expected destination URL to handle both cases reliably.

---

## 8. File Structure

Files to **create** (new):

```
pages/login.page.ts          -- LoginPage class
pages/signup.page.ts         -- SignupPage class
pages/nav.component.ts       -- NavComponent class
steps/auth.steps.ts          -- All auth step definitions
```

Files to **modify** (existing):

```
pages/pageManager.page.ts    -- Add LoginPage, SignupPage, NavComponent accessors
support/world.ts             -- Add signupData and xfail properties to MyWorld
```

Files that require **no changes**:

```
pages/base.page.ts           -- No changes needed
support/hooks.ts             -- No changes needed (unless adding @user auto-login hook)
cucumber.mjs                 -- No changes needed
features/ui/auth.feature     -- Already complete, no changes
users.json                   -- Already complete, no changes
steps/common.steps.ts        -- Keep as-is; auth steps go in auth.steps.ts
```

### Full directory tree after implementation:

```
agentic-pw-ts/
  features/
    ui/
      auth.feature            (existing, unchanged)
  pages/
    base.page.ts              (existing, unchanged)
    login.page.ts             (NEW)
    signup.page.ts            (NEW)
    nav.component.ts          (NEW)
    pageManager.page.ts       (MODIFIED)
  steps/
    common.steps.ts           (existing, unchanged)
    auth.steps.ts             (NEW)
  support/
    hooks.ts                  (existing, unchanged or minor @user hook addition)
    world.ts                  (MODIFIED -- add signupData property)
  users.json                  (existing, unchanged)
  cucumber.mjs                (existing, unchanged)
  tsconfig.json               (existing, unchanged)
  package.json                (existing, unchanged)
```

---

## 9. Recommended npm Scripts

Add these to `package.json` for convenient execution:

```json
{
  "cucumber:auth": "node --loader ts-node/esm node_modules/@cucumber/cucumber/bin/cucumber-js --config cucumber.mjs --tags \"@auth and not @xfail-buggy-auth-1 and not @xfail-buggy-auth-2 and not @xfail-buggy-auth-3\"",
  "cucumber:auth:xfail": "node --loader ts-node/esm node_modules/@cucumber/cucumber/bin/cucumber-js --config cucumber.mjs --tags \"@xfail-buggy-auth-1 or @xfail-buggy-auth-2 or @xfail-buggy-auth-3\"",
  "cucumber:auth:all": "node --loader ts-node/esm node_modules/@cucumber/cucumber/bin/cucumber-js --config cucumber.mjs --tags @auth"
}
```

---

## 10. Summary of Unique Step Expressions (27 total)

**Given steps (4):**
1. `I am on the sign up page`
2. `I am on the login page`
3. `I am logged in`
4. `I have an expired session cookie`

**When steps (12):**
1. `I submit the sign up form with valid details`
2. `I submit the sign up form with a 1-character name`
3. `I submit the sign up form with an invalid email`
4. `I submit the sign up form with a short password`
5. `I submit the sign up form with no uppercase in password`
6. `I submit the sign up form with no number in password`
7. `I submit the sign up form with mismatched confirm password`
8. `I submit the sign up form with an email that already exists`
9. `I submit the login form with valid credentials`
10. `I submit the login form with missing email or password`
11. `I submit the login form with invalid credentials`
12. `I submit the login form with email {string} and a wrong password`
13. `I log out`
14. `I visit the login page`
15. `I visit the sign up page`
16. `I visit the products page`

**Then steps (5):**
1. `I should be redirected to the products page`
2. `I should be redirected to the login page`
3. `I should see my account link in the nav`
4. `I should see the signup error {string}`
5. `I should see the login error {string}`

**Total unique step definitions to implement: 25**
