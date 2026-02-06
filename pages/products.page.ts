import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page.js";
import { BASE_URL } from "../support/config.js";

export class ProductsPage extends BasePage {
  /* ------------------------------------------------------------------ */
  /*  Filters                                                            */
  /* ------------------------------------------------------------------ */
  readonly filtersForm: Locator;
  readonly searchInput: Locator;
  readonly categorySelect: Locator;
  readonly sortSelect: Locator;
  readonly inStockCheckbox: Locator;
  readonly applyButton: Locator;

  /* ------------------------------------------------------------------ */
  /*  Product display                                                    */
  /* ------------------------------------------------------------------ */
  readonly productCount: Locator;
  readonly productGrid: Locator;
  readonly productCards: Locator;
  readonly noProducts: Locator;
  readonly productsError: Locator;

  /* ------------------------------------------------------------------ */
  /*  Nav cart elements                                                   */
  /* ------------------------------------------------------------------ */
  readonly navCart: Locator;
  readonly cartCount: Locator;

  constructor(page: Page) {
    super(page);

    // Filters
    this.filtersForm = page.locator('[data-testid="filters-form"]');
    this.searchInput = page.locator('[data-testid="filter-search"]');
    this.categorySelect = page.locator('[data-testid="filter-category"]');
    this.sortSelect = page.locator('[data-testid="filter-sort"]');
    this.inStockCheckbox = page.locator('[data-testid="filter-in-stock"]');
    this.applyButton = page.locator('[data-testid="filter-apply"]');

    // Product display
    this.productCount = page.locator('[data-testid="product-count"]');
    this.productGrid = page.locator('[data-testid="product-grid"]');
    this.productCards = page.locator('[data-testid="product-card"]');
    this.noProducts = page.locator('[data-testid="no-products"]');
    this.productsError = page.locator('[data-testid="products-error"]');

    // Nav cart
    this.navCart = page.locator('[data-testid="nav-cart"]');
    this.cartCount = page.locator('[data-testid="cart-count"]');
  }

  /* ================================================================== */
  /*  Navigation                                                         */
  /* ================================================================== */

  async navigate(): Promise<void> {
    await this.goto(`${BASE_URL}/products`);
    await this.waitForReady();
  }

  /* ================================================================== */
  /*  Filter actions                                                     */
  /* ================================================================== */

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.applyButton.click();
    await this.waitForReady();
  }

  async filterByCategory(category: string): Promise<void> {
    await this.categorySelect.selectOption(category);
    await this.applyButton.click();
    await this.waitForReady();
  }

  async enableInStockOnly(): Promise<void> {
    await this.inStockCheckbox.check();
    await this.applyButton.click();
    await this.waitForReady();
  }

  async sortByPriceAsc(): Promise<void> {
    await this.sortSelect.selectOption("price_asc");
    await this.applyButton.click();
    await this.waitForReady();
  }

  /* ================================================================== */
  /*  Product data getters                                               */
  /* ================================================================== */

  async getProductNames(): Promise<string[]> {
    const names = await this.productCards
      .locator('[data-testid="product-name"]')
      .allTextContents();
    return names.map((n) => n.trim());
  }

  async getProductPrices(): Promise<number[]> {
    const priceTexts = await this.productCards
      .locator('[data-testid="product-price"]')
      .allTextContents();
    return priceTexts.map((t) => parseFloat(t.replace("$", "")));
  }

  async getProductCategories(): Promise<string[]> {
    const cats = await this.productCards
      .locator('[data-testid="product-category"]')
      .allTextContents();
    return cats.map((c) => c.trim().toLowerCase());
  }

  async getProductCountText(): Promise<string> {
    return (await this.productCount.textContent()) ?? "";
  }

  async getVisibleProductCount(): Promise<number> {
    return this.productCards.count();
  }

  /* ================================================================== */
  /*  Stock helpers                                                      */
  /* ================================================================== */

  async getStockTextForProduct(productId: number): Promise<string> {
    const card = this.page.locator(
      `[data-testid="product-card"][data-product-id="${productId}"]`,
    );
    return (
      (await card.locator('[data-testid="product-stock"]').textContent()) ?? ""
    );
  }

  async parseStockCount(stockText: string): Promise<number> {
    const match = stockText.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async getStockCountForProduct(productId: number): Promise<number> {
    const text = await this.getStockTextForProduct(productId);
    return this.parseStockCount(text);
  }

  async getOutOfStockCards(): Promise<Locator> {
    return this.productCards.locator(
      '[data-testid="product-stock"].out-of-stock',
    );
  }

  async getAllStockLocators(): Promise<Locator> {
    return this.productCards.locator('[data-testid="product-stock"]');
  }

  /* ================================================================== */
  /*  Cart actions (on products page)                                    */
  /* ================================================================== */

  /**
   * Clicks the first available "Add to Cart" button and returns the
   * product-id of the card that was added.
   */
  async addFirstAvailableProductToCart(): Promise<number> {
    const addButton = this.productCards
      .locator('[data-testid="add-to-cart"]')
      .first();
    const card = this.page.locator(
      '[data-testid="product-card"]',
    ).filter({ has: this.page.locator('[data-testid="add-to-cart"]') }).first();
    const productId = await card.getAttribute("data-product-id");
    await addButton.click();
    await this.page.waitForLoadState("domcontentloaded");
    return parseInt(productId ?? "0", 10);
  }

  /* ================================================================== */
  /*  Error display                                                      */
  /* ================================================================== */

  async getErrorMessage(): Promise<string> {
    return (await this.productsError.textContent()) ?? "";
  }

  /* ================================================================== */
  /*  Nav cart badge                                                      */
  /* ================================================================== */

  async getNavCartCount(): Promise<number> {
    const text = (await this.cartCount.textContent()) ?? "0";
    return parseInt(text.trim(), 10);
  }
}
