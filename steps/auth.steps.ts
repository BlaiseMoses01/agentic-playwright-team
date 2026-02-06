import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { MyWorld } from "../support/world.js";
import { BASE_URL } from "../support/config.js";

/* ------------------------------------------------------------------ */
/*  Test data                                                          */
/* ------------------------------------------------------------------ */

interface TestUser {
  email: string;
  password: string;
  name: string;
}

const users: TestUser[] = JSON.parse(
  readFileSync(resolve(process.cwd(), "users.json"), "utf-8"),
);
const alice = users.find((u) => u.email === "alice@example.com")!;
const taken = users.find((u) => u.email === "taken@example.com")!;

/** Defaults for a valid signup form — override individual fields per test */
function validSignupDefaults() {
  return {
    name: "Test User",
    email: `testuser_${Date.now()}@test.com`,
    password: "Password123!",
    confirm: "Password123!",
  };
}

/* ================================================================== */
/*  GIVEN steps                                                        */
/* ================================================================== */

Given("I am on the sign up page", async function (this: MyWorld) {
  await this.pages.signupPage.navigate();
  await this.pages.signupPage.form.waitFor({ state: "visible" });
});

Given("I am on the login page", async function (this: MyWorld) {
  await this.pages.loginPage.navigate();
  await this.pages.loginPage.form.waitFor({ state: "visible" });
});

Given("I am logged in", async function (this: MyWorld) {
  await this.pages.loginPage.navigate();
  await this.pages.loginPage.login(alice.email, alice.password);
});

Given("I have an expired session cookie", async function (this: MyWorld) {
  await this.context!.addCookies([
    {
      name: "session_id",
      value: "sess_expired_fake_000",
      domain: new URL(BASE_URL).hostname,
      path: "/",
    },
  ]);
});

/* ================================================================== */
/*  WHEN steps — Sign Up                                               */
/* ================================================================== */

When(
  "I submit the sign up form with valid details",
  async function (this: MyWorld) {
    const data = validSignupDefaults();
    this.signupName = data.name;
    await this.pages.signupPage.signup(
      data.name,
      data.email,
      data.password,
      data.confirm,
    );
  },
);

When(
  "I submit the sign up form with a 1-character name",
  async function (this: MyWorld) {
    const d = validSignupDefaults();
    await this.pages.signupPage.signupExpectingError(
      "A",
      d.email,
      d.password,
      d.confirm,
    );
  },
);

When(
  "I submit the sign up form with an invalid email",
  async function (this: MyWorld) {
    const d = validSignupDefaults();
    await this.pages.signupPage.bypassBrowserEmailValidation();
    await this.pages.signupPage.signupExpectingError(
      d.name,
      "not-an-email",
      d.password,
      d.confirm,
    );
  },
);

When(
  "I submit the sign up form with a short password",
  async function (this: MyWorld) {
    const d = validSignupDefaults();
    await this.pages.signupPage.signupExpectingError(
      d.name,
      d.email,
      "Ab1",
      "Ab1",
    );
  },
);

When(
  "I submit the sign up form with no uppercase in password",
  async function (this: MyWorld) {
    const d = validSignupDefaults();
    await this.pages.signupPage.signupExpectingError(
      d.name,
      d.email,
      "password1!",
      "password1!",
    );
  },
);

When(
  "I submit the sign up form with no number in password",
  async function (this: MyWorld) {
    const d = validSignupDefaults();
    await this.pages.signupPage.signupExpectingError(
      d.name,
      d.email,
      "Password!",
      "Password!",
    );
  },
);

When(
  "I submit the sign up form with mismatched confirm password",
  async function (this: MyWorld) {
    const d = validSignupDefaults();
    await this.pages.signupPage.signupExpectingError(
      d.name,
      d.email,
      "Password123!",
      "Different123!",
    );
  },
);

When(
  "I submit the sign up form with an email that already exists",
  async function (this: MyWorld) {
    await this.pages.signupPage.signupExpectingError(
      "Existing User",
      taken.email,
      taken.password,
      taken.password,
    );
  },
);

/* ================================================================== */
/*  WHEN steps — Login                                                 */
/* ================================================================== */

When(
  "I submit the login form with valid credentials",
  async function (this: MyWorld) {
    await this.pages.loginPage.login(alice.email, alice.password);
  },
);

When(
  "I submit the login form with missing email or password",
  async function (this: MyWorld) {
    await this.pages.loginPage.submitEmpty();
  },
);

When(
  "I submit the login form with invalid credentials",
  async function (this: MyWorld) {
    await this.pages.loginPage.loginExpectingError(
      "nobody@doesnotexist.com",
      "WrongPass999!",
    );
  },
);

When(
  "I submit the login form with email {string} and a wrong password",
  async function (this: MyWorld, email: string) {
    await this.pages.loginPage.loginExpectingError(
      email,
      "WrongPassword999!",
    );
  },
);

/* ================================================================== */
/*  WHEN steps — Navigation                                            */
/* ================================================================== */

When("I log out", async function (this: MyWorld) {
  await this.pages.nav.logout();
});

When("I visit the login page", async function (this: MyWorld) {
  await this.page!.goto(`${BASE_URL}/login`);
  await this.page!.waitForLoadState("domcontentloaded");
});

When("I visit the sign up page", async function (this: MyWorld) {
  await this.page!.goto(`${BASE_URL}/signup`);
  await this.page!.waitForLoadState("domcontentloaded");
});

When("I visit the products page", async function (this: MyWorld) {
  await this.page!.goto(`${BASE_URL}/products`);
  await this.page!.waitForLoadState("domcontentloaded");
});

/* ================================================================== */
/*  THEN steps                                                         */
/* ================================================================== */

Then(
  "I should be redirected to the products page",
  async function (this: MyWorld) {
    await this.page!.waitForURL("**/products", { timeout: 10_000 });
    expect(this.page!.url()).toContain("/products");
  },
);

Then(
  "I should be redirected to the login page",
  async function (this: MyWorld) {
    await this.page!.waitForURL("**/login", { timeout: 10_000 });
    expect(this.page!.url()).toContain("/login");
  },
);

Then(
  "I should see my account link in the nav",
  async function (this: MyWorld) {
    await expect(this.pages.nav.accountLink).toBeVisible();
    const name = await this.pages.nav.getAccountName();
    expect(name.trim().length).toBeGreaterThan(0);
    if (this.signupName) {
      expect(name.trim()).toBe(this.signupName);
    }
  },
);

Then(
  "I should see the signup error {string}",
  async function (this: MyWorld, expectedMessage: string) {
    await this.pages.signupPage.errorsContainer.waitFor({
      state: "visible",
      timeout: 10_000,
    });
    const text = await this.pages.signupPage.getErrorText();
    expect(text).toContain(expectedMessage);
  },
);

Then(
  "I should see the login error {string}",
  async function (this: MyWorld, expectedMessage: string) {
    await this.pages.loginPage.errorAlert.waitFor({
      state: "visible",
      timeout: 10_000,
    });
    const text = await this.pages.loginPage.getErrorMessage();
    expect(text).toContain(expectedMessage);
  },
);
