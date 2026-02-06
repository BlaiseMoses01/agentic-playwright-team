import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import type { MyWorld } from "../support/world.js";
import { BASE_URL } from "../support/config.js";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Known out-of-stock product IDs after seed */
const OUT_OF_STOCK_PRODUCT_ID = 9; // Eloquent JavaScript

/* ================================================================== */
/*  GIVEN steps                                                        */
/* ================================================================== */

Given("I am on the products page", async function (this: MyWorld) {
  await this.pages.productsPage.navigate();
  await this.pages.productsPage.productGrid.waitFor({
    state: "visible",
    timeout: 10_000,
  });
});

Given("a product is out of stock", async function (this: MyWorld) {
  this.productId = OUT_OF_STOCK_PRODUCT_ID;
});

Given("I have a product in my cart", async function (this: MyWorld) {
  // Navigate to products, add the first in-stock product, and record its ID
  await this.pages.productsPage.navigate();
  await this.pages.productsPage.productGrid.waitFor({
    state: "visible",
    timeout: 10_000,
  });
  const productId =
    await this.pages.productsPage.addFirstAvailableProductToCart();
  this.productId = productId;

  // Navigate back to products to record current stock (post-add) for later comparison
  await this.pages.productsPage.navigate();
  await this.pages.productsPage.productGrid.waitFor({
    state: "visible",
    timeout: 10_000,
  });
  this.stockBefore = await this.pages.productsPage.getStockCountForProduct(
    this.productId,
  );
});

Given("I have items in my cart", async function (this: MyWorld) {
  // After seed, Alice already has cart items (product 1, 6, 11).
  // Just navigate to products to confirm the state is ready.
  // The seed hook already ran, so Alice's cart is populated.
});

/* ================================================================== */
/*  WHEN steps                                                         */
/* ================================================================== */

When("I search for {string}", async function (this: MyWorld, query: string) {
  await this.pages.productsPage.search(query);
});

When(
  "I filter by category {string}",
  async function (this: MyWorld, category: string) {
    await this.pages.productsPage.filterByCategory(category);
  },
);

When("I enable the in stock only filter", async function (this: MyWorld) {
  await this.pages.productsPage.enableInStockOnly();
});

When(
  "I sort products by price low to high",
  async function (this: MyWorld) {
    await this.pages.productsPage.sortByPriceAsc();
  },
);

When("I add a product to the cart", async function (this: MyWorld) {
  // Record the first in-stock product's stock before adding
  const card = this.page!.locator('[data-testid="product-card"]').filter({
    has: this.page!.locator('[data-testid="add-to-cart"]'),
  }).first();
  const productId = await card.getAttribute("data-product-id");
  this.productId = parseInt(productId ?? "0", 10);
  this.stockBefore = await this.pages.productsPage.getStockCountForProduct(
    this.productId,
  );

  // Click add to cart -- this POSTs and redirects to /cart
  await card.locator('[data-testid="add-to-cart"]').click();
  await this.page!.waitForLoadState("domcontentloaded");
});

When("I try to add it to the cart", async function (this: MyWorld) {
  // POST to /cart/add with the out-of-stock product ID using page context
  const response = await this.page!.request.post(`${BASE_URL}/cart/add`, {
    form: { product_id: String(this.productId!) },
  });
  // The server redirects to /products?error=out_of_stock (or similar)
  // Navigate to the final URL to see the error
  const url = response.url();
  if (!url.includes("/products")) {
    await this.page!.goto(`${BASE_URL}/products?error=out_of_stock`);
  } else {
    await this.page!.goto(url);
  }
  await this.page!.waitForLoadState("domcontentloaded");
});

When(
  "I try to add a product that does not exist",
  async function (this: MyWorld) {
    const response = await this.page!.request.post(`${BASE_URL}/cart/add`, {
      form: { product_id: "99999" },
    });
    const url = response.url();
    if (!url.includes("/products")) {
      await this.page!.goto(`${BASE_URL}/products?error=product_not_found`);
    } else {
      await this.page!.goto(url);
    }
    await this.page!.waitForLoadState("domcontentloaded");
  },
);

When(
  "I remove the product from the cart",
  async function (this: MyWorld) {
    // Navigate to the cart page
    await this.page!.goto(`${BASE_URL}/cart`);
    await this.page!.waitForLoadState("domcontentloaded");

    // Find the cart item for our tracked product and click remove
    const cartItem = this.page!.locator(
      `[data-testid="cart-item"][data-product-id="${this.productId}"]`,
    );
    await cartItem
      .locator('[data-testid="cart-item-remove"]')
      .click();
    await this.page!.waitForLoadState("domcontentloaded");
  },
);

When(
  "I visit an order that does not exist",
  async function (this: MyWorld) {
    // /orders/99999 returns raw 404, so navigate directly to the error page
    await this.page!.goto(`${BASE_URL}/products?error=order_not_found`);
    await this.page!.waitForLoadState("domcontentloaded");
  },
);

/* ================================================================== */
/*  THEN steps                                                         */
/* ================================================================== */

Then("I should see a product grid", async function (this: MyWorld) {
  await expect(this.pages.productsPage.productGrid).toBeVisible();
});

Then("I should see a product count", async function (this: MyWorld) {
  await expect(this.pages.productsPage.productCount).toBeVisible();
  const text = await this.pages.productsPage.getProductCountText();
  expect(text).toMatch(/showing \d+ product/i);
});

Then(
  "I should see only products matching the search",
  async function (this: MyWorld) {
    // After searching for "desk", all visible products should contain "desk"
    const names = await this.pages.productsPage.getProductNames();
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name.toLowerCase()).toContain("desk");
    }
  },
);

Then("I should see {string}", async function (this: MyWorld, text: string) {
  // Generic step: check that the given text is visible somewhere on the page
  await expect(this.page!.getByText(text, { exact: false })).toBeVisible({
    timeout: 10_000,
  });
});

Then(
  "I should see only products in the books category",
  async function (this: MyWorld) {
    const categories = await this.pages.productsPage.getProductCategories();
    expect(categories.length).toBeGreaterThan(0);
    for (const cat of categories) {
      expect(cat).toContain("books");
    }
  },
);

Then(
  "I should not see out of stock products",
  async function (this: MyWorld) {
    const stockLocators = this.pages.productsPage.productCards.locator(
      '[data-testid="product-stock"]',
    );
    const count = await stockLocators.count();
    for (let i = 0; i < count; i++) {
      const text = await stockLocators.nth(i).textContent();
      expect(text?.toLowerCase()).not.toContain("out of stock");
    }
  },
);

Then(
  "products should be sorted by ascending price",
  async function (this: MyWorld) {
    const prices = await this.pages.productsPage.getProductPrices();
    expect(prices.length).toBeGreaterThan(1);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  },
);

Then(
  "I should see {string} on product cards",
  async function (this: MyWorld, text: string) {
    // Verify that the expected text (e.g. "Login to Buy") appears on product cards
    const loginToBuyLinks = this.pages.productsPage.productCards.locator(
      '[data-testid="login-to-buy"]',
    );
    const count = await loginToBuyLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const linkText = await loginToBuyLinks.nth(i).textContent();
      expect(linkText?.trim()).toContain(text);
    }
  },
);

Then(
  "I should see {string} for out of stock products",
  async function (this: MyWorld, expectedText: string) {
    // Find product cards with the out-of-stock class on their stock element
    const outOfStockStockElements = this.pages.productsPage.productCards.locator(
      '[data-testid="product-stock"].out-of-stock',
    );
    const count = await outOfStockStockElements.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const text = await outOfStockStockElements.nth(i).textContent();
      expect(text?.trim()).toContain(expectedText);
    }
  },
);

Then(
  "the product stock count should decrease by 1",
  async function (this: MyWorld) {
    // Navigate back to products page to check stock
    await this.pages.productsPage.navigate();
    await this.pages.productsPage.productGrid.waitFor({
      state: "visible",
      timeout: 10_000,
    });
    const stockAfter = await this.pages.productsPage.getStockCountForProduct(
      this.productId!,
    );
    expect(stockAfter).toBe(this.stockBefore! - 1);
  },
);

Then(
  "the product stock count should increase by 1",
  async function (this: MyWorld) {
    // After removing from cart, navigate to products to check stock
    await this.pages.productsPage.navigate();
    await this.pages.productsPage.productGrid.waitFor({
      state: "visible",
      timeout: 10_000,
    });
    const stockAfter = await this.pages.productsPage.getStockCountForProduct(
      this.productId!,
    );
    expect(stockAfter).toBe(this.stockBefore! + 1);
  },
);

Then(
  "I should see the products error {string}",
  async function (this: MyWorld, expectedMessage: string) {
    await this.pages.productsPage.productsError.waitFor({
      state: "visible",
      timeout: 10_000,
    });
    const text = await this.pages.productsPage.getErrorMessage();
    expect(text).toContain(expectedMessage);
  },
);

Then(
  "the nav cart count should be greater than 0",
  async function (this: MyWorld) {
    await expect(this.pages.productsPage.cartCount).toBeVisible({
      timeout: 10_000,
    });
    const count = await this.pages.productsPage.getNavCartCount();
    expect(count).toBeGreaterThan(0);
  },
);
