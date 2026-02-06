# Authentication UI -- Code Review & Deliverables Summary

**Reviewer:** Senior Code Reviewer (automated)
**Date:** 2026-02-06
**Feature:** `features/ui/auth.feature` (Authentication UI)
**Framework:** Cucumber v11 + Playwright + TypeScript (ESM)
**Target App:** https://sdet-store-testbed-26.fly.dev

---

## Section A: Code Review

### File 1: `pages/login.page.ts`

**Purpose:** Page object for the `/login` page.

**Findings -- Positive:**
- Extends `BasePage` correctly, inheriting `goto()` and `waitForReady()`.
- All locators use `data-testid` selectors consistently -- this is the preferred strategy for test automation as it decouples tests from CSS/layout changes.
- Locators declared as `readonly` in the constructor -- good TypeScript practice, prevents accidental reassignment.
- Clean separation of concerns: `login()` expects success (waits for redirect), `loginExpectingError()` expects failure (waits for error element). This dual-path pattern prevents flaky timeouts.
- `submitEmpty()` correctly uses `page.evaluate()` to strip the browser-level `required` attribute before clicking submit, acknowledging that HTML5 form validation would otherwise block the submission.
- Explicit return types on all methods (`Promise<void>`, `Promise<string>`).
- Timeout of `10_000` ms is reasonable and uses numeric separator for readability.

**Findings -- Minor Concerns:**
1. **BASE_URL duplication:** The `BASE_URL` constant is defined identically in `login.page.ts`, `signup.page.ts`, and `auth.steps.ts`. This should ideally live in a single shared config file or environment utility. If the URL format changes, three files need updating.
2. **`submitEmpty()` uses raw selectors:** Line 44 uses `#email` and `#password` as selectors inside `page.evaluate()`, while the class constructor uses `data-testid` selectors. This inconsistency is minor (the `evaluate()` targets DOM attributes, not Playwright locators), but could break if the app changes its `id` attributes while keeping `data-testid`.
3. **Null coalescing in `getErrorMessage()`:** `(await this.errorAlert.textContent()) ?? ""` is correct but the caller should be aware that `textContent()` returns `null` only if the element is detached. Since `waitFor` is called before this in the step, this is safe.

**Rating:** 9/10

---

### File 2: `pages/signup.page.ts`

**Purpose:** Page object for the `/signup` page.

**Findings -- Positive:**
- Mirrors `LoginPage` structure -- consistent patterns across page objects reduce cognitive load for maintainers.
- Seven locators covering all form elements and the error container.
- `signup()` and `signupExpectingError()` follow the same dual-path pattern as the login page.
- `bypassBrowserEmailValidation()` uses `data-testid` selector inside `page.evaluate()` (line 61), which is consistent with the class's selector strategy. This is better than the `#email`/`#password` approach in `LoginPage.submitEmpty()`.
- Method naming is descriptive: `bypassBrowserEmailValidation` clearly communicates intent.

**Findings -- Minor Concerns:**
1. **BASE_URL duplication:** Same issue as `LoginPage` -- duplicated constant.
2. **Method name inconsistency with test plan:** The test plan spec called for `bypassEmailValidation()` and `getErrorMessages()` / `getFirstError()`, but the implementation uses `bypassBrowserEmailValidation()` and `getErrorText()`. The implementation names are actually better and more descriptive, so this is a deviation that improved quality.
3. **No `getErrorMessages()` (array variant):** The test plan proposed returning an array of individual error messages. The implementation returns the full container text instead. This works for the current tests (which use `toContain()`), but if future tests need to assert on specific error positions or counts, an array method would be useful.

**Rating:** 9/10

---

### File 3: `pages/nav.component.ts`

**Purpose:** Component object for the navigation bar (shared across pages).

**Findings -- Positive:**
- Correctly modeled as a component rather than a page -- it does not extend `BasePage` because it does not represent a full page. This is an appropriate architectural choice.
- Five locators covering both authenticated and unauthenticated nav states.
- `logout()` waits for URL redirect after clicking -- prevents race conditions.
- `isLoggedIn()` provides a reusable boolean check.
- Compact, focused class with no bloat.

**Findings -- Minor Concerns:**
1. **`page` property is `readonly` but public:** While this works, it breaks encapsulation. External code could call `this.pages.nav.page.goto(...)` directly. Consider making it `private` or `protected` if it is only used internally. However, since `BasePage` also exposes `page` as `protected`, and this class does not extend `BasePage`, the public access is consistent with the component pattern used here.
2. **`isLoggedIn()` is not awaited properly in step code:** The method returns `this.accountLink.isVisible()` which returns a `Promise<boolean>`. This is correct. However, the method is never actually called in the current step definitions, so it is dead code at this point.

**Rating:** 8.5/10

---

### File 4: `steps/auth.steps.ts`

**Purpose:** All 25 step definitions for the `auth.feature` file.

**Findings -- Positive:**
- **Complete coverage:** All 25 unique step expressions from the feature file are implemented. No missing steps.
- **Clean organization:** Steps are grouped by type (Given, When-Signup, When-Login, When-Navigation, Then) with clear section headers. The sectioned comment blocks (`/* === */`) make the file scannable.
- **Type safety:** Every step function explicitly types `this: MyWorld`, enabling full IntelliSense and type checking on the World object.
- **Test data loading:** Uses `readFileSync` + `JSON.parse` for `users.json` -- this is a pragmatic choice that avoids ESM JSON import assertion complexity. The file is read once at module load time, not per scenario.
- **Dynamic email generation:** `validSignupDefaults()` generates a timestamp-based email (`testuser_${Date.now()}@test.com`), preventing collision across test runs.
- **`validSignupDefaults()` helper:** Reduces duplication across the six validation error scenarios. Each scenario only overrides the field being tested.
- **Proper assertion pattern:** Then steps wait for the element to be visible before asserting content, preventing race conditions.
- **Parameterized step:** `When('I submit the login form with email {string} and a wrong password', ...)` correctly uses Cucumber's `{string}` parameter type.

**Findings -- Concerns:**
1. **Test user indexing is fragile:** `const alice = users[0]` and `const taken = users[2]` rely on array index positions. If someone reorders `users.json`, tests silently use the wrong user. Consider finding users by email: `const alice = users.find(u => u.email === 'alice@example.com')!`.
2. **`this.context!` non-null assertion (line 57):** In the expired session cookie step, `this.context!` uses a non-null assertion. The `Before` hook guarantees `context` is set, so this is safe in practice, but a guard clause or assertion would be more defensive.
3. **`this.page!` non-null assertions (lines 223-234, 244, 252):** Same pattern -- the `Before` hook guarantees `page` is set, but defensive checks would be more robust.
4. **Navigation steps bypass page objects:** The `When('I visit the login page', ...)` step calls `this.page!.goto(...)` directly instead of using `this.pages.loginPage.navigate()`. This is intentional -- these steps simulate a user directly navigating to a URL (not going through the page object's setup flow), so the direct approach is appropriate for testing redirect behavior. However, it does mean `BASE_URL` is used in the steps file as well as the page objects.
5. **Redundant error wait in Then steps:** The `Then('I should see the signup error {string}', ...)` step (line 269) waits for `errorsContainer` to be visible, but the preceding `When` step's `signupExpectingError()` method already waits for the same element. The double-wait is harmless (Playwright resolves instantly if already visible) and arguably adds resilience if step ordering changes in the future.
6. **Step count in test plan vs. actual:** The test plan (Section 10) lists "27 total" step expressions but then says "25 unique step definitions to implement." The actual implementation has exactly 25 step definitions, which is correct. The discrepancy in the plan's heading is cosmetic only (16 When steps listed = 16, not 12 as stated in the heading).

**Rating:** 9/10

---

### File 5: `temp/01-test-plan.md`

**Purpose:** BDD test plan document produced before implementation.

**Findings -- Positive:**
- Exceptionally thorough: covers selectors, step mappings, page object specs, test data strategy, tag strategy, edge cases, and file structure.
- Correctly identified the browser-level validation challenge (`required` attribute, `type="email"`) and proposed the right mitigation.
- Correctly anticipated the cookie manipulation strategy for the expired session scenario.
- The risk analysis (Section 7) identified real concerns: signup data accumulation, form submission method, redirect timing.
- Test plan served as an effective blueprint -- the implementation follows it closely.

**Findings -- Minor Concerns:**
1. **Step count inconsistency:** Section 10 says "27 total" in the heading but "25 unique step definitions" in the summary. The When section heading says "12" but lists 16 items. The actual count of 25 is correct.
2. **Code snippets use `assert { type: 'json' }` syntax:** The plan suggests JSON import assertions as an option, but the implementation correctly chose `readFileSync` instead (avoiding ESM import assertion compatibility issues).

**Rating:** 9/10 (as a planning document)

---

### File 6: `pages/pageManager.page.ts` (Modified)

**Purpose:** Central manager that lazily instantiates page objects.

**Findings -- Positive:**
- Lazy initialization using nullish coalescing assignment (`??=`) -- page objects are only created when first accessed, improving performance.
- Private backing fields with public getters -- clean encapsulation.
- Imports are correct with `.js` extensions for ESM compatibility.
- No breaking changes to the existing `basePage` property.

**Findings -- Minor Concerns:**
1. **No type export for the page manager's type:** Other files import `PageManager` as a type (e.g., `world.ts`), which works. No issue here, just noting the pattern.

**Rating:** 10/10

---

### File 7: `support/world.ts` (Modified)

**Purpose:** Custom Cucumber World object that carries test state across steps.

**Findings -- Positive:**
- `signupName?: string` is the minimal addition needed -- stores only what the Then step needs to verify.
- The JSDoc comment explains purpose clearly.
- `pages!` uses the definite assignment assertion (`!`) because it is set in the `Before` hook -- this is the correct pattern for Cucumber World properties.

**Findings -- Minor Concerns:**
1. **Broader `signupData` vs. narrow `signupName`:** The test plan suggested storing a full `signupData` object (`{ name, email, password }`), but the implementation stores only `signupName`. The narrow approach is better -- store only what is needed. However, `signupName` is set in the When step but never actually read in the Then step (the Then step checks for non-empty text but does not compare against `signupName`). This means `signupName` is technically dead state in the current implementation.

**Rating:** 9/10

---

### File 8: `features/ui/auth.feature` (Reference, unchanged)

**Assessment:** Well-structured Gherkin with 13 scenarios (including 6 from the Scenario Outline). Tags are consistent and meaningful. The three `@xfail-buggy-*` scenarios correctly identify known application bugs. Feature file uses natural language that is readable by non-technical stakeholders.

---

### File 9: `users.json` (Reference, unchanged)

**Assessment:** Clean JSON with three test users. Each entry has `email`, `password`, and `name`. The `taken@example.com` user is purpose-built for the duplicate-email signup test.

---

### File 10: `pages/base.page.ts` (Reference, unchanged)

**Assessment:** Minimal base class providing `goto()`, `locator()`, and `waitForReady()`. Clean and focused. The `waitForReady()` default of `"domcontentloaded"` is appropriate for server-rendered pages.

---

### File 11: `support/hooks.ts` (Reference, unchanged)

**Assessment:** Solid hook structure:
- `BeforeAll`: launches browser once (shared across scenarios).
- `Before`: creates fresh context + page per scenario (isolation).
- `After`: captures screenshot on failure (diagnostic), then cleans up.
- `AfterAll`: closes browser.
- Multi-browser support via `BROWSER` env var.
- Configurable headless mode and timeout via env vars.

---

### File 12: `cucumber.mjs` (Reference, unchanged)

**Assessment:** Exports a function (required for Cucumber v11 ESM). Defines `default` and `report` profiles. Glob patterns use `./` prefix consistently. Output formats include JSON for CI integration.

---

### Overall Code Quality Assessment

| Category                          | Rating | Notes                                                      |
|-----------------------------------|--------|------------------------------------------------------------|
| TypeScript best practices         | 9/10   | Proper types, readonly, explicit return types throughout    |
| Page object pattern adherence     | 9/10   | Clean POM with component separation, lazy initialization   |
| Step definition completeness      | 10/10  | All 25 steps implemented, all scenarios covered            |
| Test data handling                | 8/10   | Works correctly, but array indexing is fragile             |
| Error handling and assertions     | 9/10   | Proper wait-then-assert pattern, good timeout values       |
| Selector strategy                 | 9.5/10 | Consistent `data-testid` usage with one minor exception    |
| Naming conventions and readability| 9/10   | Clear, descriptive names; good section organization        |
| Maintainability                   | 8.5/10 | BASE_URL duplication is the main debt item                 |
| **Overall**                       | **9/10** | **Production-quality test automation code**               |

---

## Section B: Test Coverage Matrix

### Scenario-to-Implementation Mapping

| # | Scenario | Tags | Feature Line | Step Definitions | Status |
|---|----------|------|-------------|------------------|--------|
| 1 | Sign up with valid details creates an account and logs in | `@guest` | 5-9 | `Given I am on the sign up page` / `When I submit the sign up form with valid details` / `Then I should be redirected to the products page` / `Then I should see my account link in the nav` | IMPLEMENTED |
| 2a | Sign up validation: 1-character name | `@guest @error` | 12-19 | `Given I am on the sign up page` / `When I submit the sign up form with a 1-character name` / `Then I should see the signup error {string}` | IMPLEMENTED |
| 2b | Sign up validation: invalid email | `@guest @error` | 12-20 | `Given I am on the sign up page` / `When I submit the sign up form with an invalid email` / `Then I should see the signup error {string}` | IMPLEMENTED |
| 2c | Sign up validation: short password | `@guest @error` | 12-21 | `Given I am on the sign up page` / `When I submit the sign up form with a short password` / `Then I should see the signup error {string}` | IMPLEMENTED |
| 2d | Sign up validation: no uppercase | `@guest @error` | 12-22 | `Given I am on the sign up page` / `When I submit the sign up form with no uppercase in password` / `Then I should see the signup error {string}` | IMPLEMENTED |
| 2e | Sign up validation: no number | `@guest @error` | 12-23 | `Given I am on the sign up page` / `When I submit the sign up form with no number in password` / `Then I should see the signup error {string}` | IMPLEMENTED |
| 2f | Sign up validation: mismatched confirm | `@guest @error` | 12-24 | `Given I am on the sign up page` / `When I submit the sign up form with mismatched confirm password` / `Then I should see the signup error {string}` | IMPLEMENTED |
| 3 | Sign up with existing email shows error | `@guest @xfail-buggy-auth-2` | 26-30 | `Given I am on the sign up page` / `When I submit the sign up form with an email that already exists` / `Then I should see the signup error {string}` | IMPLEMENTED (xfail) |
| 4 | Login with valid credentials | `@guest` | 32-36 | `Given I am on the login page` / `When I submit the login form with valid credentials` / `Then I should be redirected to the products page` | IMPLEMENTED |
| 5 | Login with missing credentials | `@guest @error` | 38-42 | `Given I am on the login page` / `When I submit the login form with missing email or password` / `Then I should see the login error {string}` | IMPLEMENTED |
| 6 | Login with invalid credentials | `@guest @error` | 44-48 | `Given I am on the login page` / `When I submit the login form with invalid credentials` / `Then I should see the login error {string}` | IMPLEMENTED |
| 7 | Login with wrong password for Alice | `@guest @error @xfail-buggy-auth-1` | 50-54 | `Given I am on the login page` / `When I submit the login form with email {string} and a wrong password` / `Then I should see the login error {string}` | IMPLEMENTED (xfail) |
| 8 | Logout clears session | `@user` | 56-60 | `Given I am logged in` / `When I log out` / `Then I should be redirected to the login page` | IMPLEMENTED |
| 9 | Logged in users redirected from login | `@user @edge` | 62-66 | `Given I am logged in` / `When I visit the login page` / `Then I should be redirected to the products page` | IMPLEMENTED |
| 10 | Logged in users redirected from signup | `@user @edge` | 68-72 | `Given I am logged in` / `When I visit the sign up page` / `Then I should be redirected to the products page` | IMPLEMENTED |
| 11 | Expired sessions rejected | `@user @edge @xfail-buggy-auth-3` | 74-78 | `Given I have an expired session cookie` / `When I visit the products page` / `Then I should be redirected to the login page` | IMPLEMENTED (xfail) |

### Coverage Summary

| Metric | Count |
|--------|-------|
| Total scenarios in feature file | 16 (5 standalone + 1 outline x 6 examples + 3 xfail scenarios -- but note: scenarios 2a-2f are from one Scenario Outline, giving 11 distinct scenario blocks expanding to 16 scenario instances) |
| Unique step definitions required | 25 |
| Step definitions implemented | 25 |
| Coverage gaps | **0** |
| Dead/unused step definitions | 0 |

**Verdict:** Full coverage. Every scenario in `auth.feature` has complete step definition implementations.

---

## Section C: Test Results Summary

### Main Run (excluding xfail scenarios)

```
Tags: @auth and not @xfail-buggy-auth-1 and not @xfail-buggy-auth-2 and not @xfail-buggy-auth-3

13 scenarios (13 passed)
40 steps (40 passed)
Duration: 5.062s
```

| Result | Count | Percentage |
|--------|-------|------------|
| Passed | 13 | 100% |
| Failed | 0 | 0% |
| Pending | 0 | 0% |
| Skipped | 0 | 0% |

**Assessment:** Clean pass. All 13 non-xfail scenarios pass reliably in ~5 seconds, indicating stable selectors, correct assertions, and no flakiness.

### xfail Run (known-buggy scenarios only)

```
Tags: @xfail-buggy-auth-1 or @xfail-buggy-auth-2 or @xfail-buggy-auth-3

3 scenarios (1 failed, 2 passed)
9 steps (1 failed, 8 passed)
Duration: 11.309s
```

| Tag | Scenario | Expected | Actual | Analysis |
|-----|----------|----------|--------|----------|
| `@xfail-buggy-auth-1` | Login with wrong password for Alice is rejected | FAIL | **PASS** | The server now correctly rejects wrong passwords for Alice. This bug appears to have been **fixed**. The xfail tag can potentially be removed. |
| `@xfail-buggy-auth-2` | Sign up with existing email shows error | FAIL | **PASS** | The server now correctly rejects duplicate email registration. This bug appears to have been **fixed**. The xfail tag can potentially be removed. |
| `@xfail-buggy-auth-3` | Expired sessions are rejected | FAIL | **FAIL** | The server still does not validate expired/fake session cookies. The fake `session_id` cookie is accepted, and the user is not redirected to login. This is a **confirmed open bug** in the application. |

### Performance Analysis

| Metric | Value | Assessment |
|--------|-------|------------|
| Main run total time | 5.062s | Excellent -- 13 scenarios in ~5s |
| Average per scenario (main) | ~0.39s | Very fast for browser-based tests |
| xfail run total time | 11.309s | Higher due to timeout waits on failures |
| Average per scenario (xfail) | ~3.77s | Expected -- failed assertion waits for timeout |

The main run performance is excellent. The xfail run is slower because the failing scenario (`@xfail-buggy-auth-3`) waits for a redirect that never happens, hitting the 10-second timeout before failing. This is expected behavior.

---

## Section D: PR Summary

### Title

Add BDD test automation for Authentication UI (login, signup, logout)

### Summary

- Implement complete BDD test suite for the Authentication UI feature using Cucumber v11 + Playwright + TypeScript (ESM)
- Add three new page objects: `LoginPage`, `SignupPage`, and `NavComponent` following the Page Object Model pattern with `data-testid` selectors
- Add 25 step definitions covering all 16 scenarios in `auth.feature` (13 standard + 3 xfail)
- All 13 standard scenarios pass; 2 of 3 xfail scenarios now pass (bugs appear fixed), 1 xfail still fails as expected (expired session validation bug)
- Integrate new page objects into existing `PageManager` with lazy initialization
- Include comprehensive BDD test plan document

### Test Plan

- [x] Run `cucumber:ui` -- all 13 non-xfail scenarios pass (40/40 steps)
- [x] Run xfail scenarios separately -- 1 expected failure confirmed (session validation bug)
- [x] Verify signup creates account with unique email (no collision between runs)
- [x] Verify login/logout flow end-to-end
- [x] Verify all 6 signup validation error messages render correctly
- [x] Verify login error messages for missing and invalid credentials
- [x] Verify authenticated redirect guards (login page, signup page)
- [x] Verify screenshot capture on failure (After hook)
- [ ] Run in CI environment to confirm cross-environment stability
- [ ] Run against Firefox/WebKit (`BROWSER=firefox`, `BROWSER=webkit`) to confirm cross-browser compatibility

### Known Issues

1. **`@xfail-buggy-auth-3` (Expired sessions):** The application server does not validate session cookie authenticity. A fabricated `session_id` cookie (`sess_expired_fake_000`) is accepted without verification, allowing unauthenticated access to protected pages. This is a **security vulnerability** in the application under test.
2. **`@xfail-buggy-auth-1` and `@xfail-buggy-auth-2` now pass:** These scenarios were tagged as expected failures but now pass, suggesting the underlying bugs have been fixed in the application. The xfail tags should be reviewed and potentially removed in a follow-up PR.
3. **`signupName` property is set but never read:** The `signupName` property on `MyWorld` is populated during the valid signup test but is not used in any assertion. The Then step checks for non-empty account name text but does not compare it against the stored value.

### Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `pages/login.page.ts` | **New** | LoginPage page object with login, error handling, and empty-submit methods |
| `pages/signup.page.ts` | **New** | SignupPage page object with signup, validation bypass, and error retrieval |
| `pages/nav.component.ts` | **New** | NavComponent for navigation elements (account, logout, login, signup links) |
| `steps/auth.steps.ts` | **New** | 25 step definitions covering all auth.feature scenarios |
| `temp/01-test-plan.md` | **New** | Comprehensive BDD test plan with selector discovery, step mapping, and risk analysis |
| `pages/pageManager.page.ts` | **Modified** | Added lazy accessors for LoginPage, SignupPage, and NavComponent |
| `support/world.ts` | **Modified** | Added `signupName` property for cross-step state sharing |

---

## Section E: Recommendations

### Immediate Actions (Before or Alongside Merge)

1. **Reassess xfail tags:** Since `@xfail-buggy-auth-1` and `@xfail-buggy-auth-2` now pass, file a follow-up ticket to either remove the xfail tags (promoting them to standard tests) or investigate whether the bug fixes are permanent. Run these scenarios multiple times to confirm they pass consistently before removing the tags.

2. **Remove or use `signupName`:** Either delete the `signupName` property from `MyWorld` (and the assignment in the step), or update the "I should see my account link in the nav" Then step to assert that the displayed name matches the stored `signupName` value. The latter would strengthen the assertion.

3. **Add npm scripts for auth tests:** The test plan recommends auth-specific scripts. Add these to `package.json`:
   ```
   "cucumber:auth": "... --tags \"@auth and not @xfail-buggy-auth-1 and not @xfail-buggy-auth-2 and not @xfail-buggy-auth-3\""
   "cucumber:auth:xfail": "... --tags \"@xfail-buggy-auth-1 or @xfail-buggy-auth-2 or @xfail-buggy-auth-3\""
   ```

### Technical Debt Items

1. **Extract `BASE_URL` to a shared config:**
   - `BASE_URL` is defined identically in `login.page.ts`, `signup.page.ts`, and `auth.steps.ts`.
   - Create a `support/config.ts` (or similar) that exports the base URL:
     ```typescript
     export const BASE_URL = process.env.TARGET?.replace(/\/products$/, "") || "https://sdet-store-testbed-26.fly.dev";
     ```
   - Import from there in all three files.

2. **Replace array indexing with lookup for test users:**
   - Change `const alice = users[0]` to `const alice = users.find(u => u.email === 'alice@example.com')!` to prevent silent breakage if `users.json` is reordered.

3. **Consistent selector strategy in `page.evaluate()` calls:**
   - `LoginPage.submitEmpty()` uses `#email` and `#password` inside `page.evaluate()`.
   - `SignupPage.bypassBrowserEmailValidation()` uses `[data-testid="signup-email"]`.
   - Standardize on `data-testid` selectors everywhere for consistency.

4. **Consider a shared `fillSignupWithOverrides()` helper:**
   - The test plan proposed this pattern (Section 5d). The current implementation uses `validSignupDefaults()` plus manual calls, which works but is slightly more verbose. A helper that accepts partial overrides would reduce duplication further, especially if more signup validation scenarios are added.

5. **`NavComponent` does not extend `BasePage`:**
   - This is intentional (it is a component, not a page), but it means it does not inherit `waitForReady()`. If nav state assertions ever become flaky, adding a `waitForNavReady()` method may be needed.

### Suggestions for the Broader Test Suite

1. **Cross-browser CI matrix:** The hooks already support `BROWSER=firefox|webkit` via environment variable. Set up CI matrix jobs for all three browsers.

2. **Parallel execution:** Cucumber v11 supports `--parallel <n>` for running scenarios in parallel. Each scenario already gets its own browser context (via the `Before` hook), so parallelization should work out of the box. This would reduce the ~5s main run further.

3. **Accessibility testing:** Consider adding `@a11y` tagged scenarios that verify ARIA labels, focus order, and color contrast on the auth pages. The `data-testid` selectors already indicate good testability practices in the app.

4. **API-level auth tests:** The current tests are all UI-level. Consider adding `@api` tagged scenarios that test the `/login` and `/signup` endpoints directly (POST requests) for faster feedback and to separate concerns.

5. **Test data cleanup:** The valid signup scenario creates a real account on each run. Consider adding a teardown mechanism (API call or database cleanup) if the testbed accumulates excessive test accounts.

6. **Reporting:** The `cucumber.mjs` config already supports JSON, HTML, JUnit, and NDJSON formats via the `report` profile. Wire `npm run cucumber:report` into CI to generate test reports on every build.

7. **Common step file cleanup:** The existing `steps/common.steps.ts` has a step with a leading space in the expression (`' I will go to url {string}'`). This should be fixed to prevent matching issues.

8. **Security test for `@xfail-buggy-auth-3`:** The expired session bug is a real security concern. Consider escalating this as a security defect rather than just a test xfail. The application should validate session cookies server-side before granting access to protected routes.

---

*End of review document.*
