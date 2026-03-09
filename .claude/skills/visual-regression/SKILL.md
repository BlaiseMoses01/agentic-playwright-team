---
name: visual-regression
description: guide for visual regression testing with Playwright including screenshot baselines, diffs, and CI integration
---

# Skill: Visual Regression Testing

## When to use

Use this skill when the user asks you to:

- Set up visual regression testing for a page or component
- Compare screenshots against baseline images
- Configure diff thresholds for acceptable visual changes
- Mask dynamic content in screenshots (dates, animations, avatars)
- Manage baseline images across branches and environments
- Integrate visual tests into CI pipelines

## Directory Structure for Snapshots

```
project-root/
  screenshots/
    baselines/           # Committed baseline images (golden files)
      login-page/
        login-form.png
        login-form-error.png
      dashboard/
        dashboard-default.png
    diffs/               # Generated diff images (gitignored)
      login-page/
        login-form-diff.png
    actual/              # Current test run screenshots (gitignored)
      login-page/
        login-form-actual.png
```

Add to `.gitignore`:

```
screenshots/diffs/
screenshots/actual/
```

## Using Playwright's Built-in Visual Comparisons

### toHaveScreenshot() — Page-level

```typescript
import { expect } from "@playwright/test";

// Basic page screenshot comparison
await expect(this.page).toHaveScreenshot("login-page.png");

// With options
await expect(this.page).toHaveScreenshot("login-page.png", {
  maxDiffPixels: 100, // Allow up to 100 pixels to differ
  maxDiffPixelRatio: 0.01, // Or allow up to 1% of pixels to differ
  threshold: 0.2, // Per-pixel color diff threshold (0-1)
  fullPage: true, // Capture full scrollable page
});
```

### toHaveScreenshot() — Component-level

```typescript
// Screenshot a specific element
const header = this.page.getByRole("banner");
await expect(header).toHaveScreenshot("site-header.png");

const loginForm = this.page.getByTestId("login-form");
await expect(loginForm).toHaveScreenshot("login-form.png", {
  maxDiffPixelRatio: 0.02,
});

const sidebar = this.page.locator("nav.sidebar");
await expect(sidebar).toHaveScreenshot("sidebar-expanded.png");
```

### toMatchSnapshot() — For non-image data

```typescript
// Compare text snapshots (API responses, HTML fragments)
const tableHtml = await this.page.locator("table").innerHTML();
expect(tableHtml).toMatchSnapshot("users-table.txt");

// Compare JSON data
const apiResponse = await this.page.evaluate(() => fetch("/api/config").then((r) => r.json()));
expect(JSON.stringify(apiResponse, null, 2)).toMatchSnapshot("config.json");
```

## Diff Thresholds

Choose thresholds based on what you're testing:

| Use case            | maxDiffPixels | maxDiffPixelRatio | threshold | Notes                                    |
| ------------------- | ------------- | ----------------- | --------- | ---------------------------------------- |
| Pixel-perfect UI    | 0             | 0                 | 0.1       | Strictest — any change fails             |
| Standard UI test    | 50            | 0.01              | 0.2       | Tolerates minor rendering differences    |
| Content-heavy pages | 200           | 0.05              | 0.3       | Allows text reflow, font rendering diffs |
| Responsive layout   | 100           | 0.02              | 0.2       | Focus on layout, not pixel accuracy      |

### Threshold parameters explained

- **`maxDiffPixels`**: Maximum number of pixels that can differ. Good for absolute limits.
- **`maxDiffPixelRatio`**: Maximum ratio of differing pixels (0.01 = 1%). Good for responsive/variable-size screenshots.
- **`threshold`**: Per-pixel color comparison sensitivity (0 = exact, 1 = anything passes). Anti-aliasing and sub-pixel rendering cause small color diffs — 0.2 is a good default.

## Masking Dynamic Content

Dynamic content (timestamps, avatars, ads, animations) causes false failures. Mask them:

### Using mask option

```typescript
await expect(this.page).toHaveScreenshot("dashboard.png", {
  mask: [
    this.page.getByTestId("current-time"),
    this.page.getByTestId("user-avatar"),
    this.page.locator(".ad-banner"),
    this.page.getByRole("status"), // Loading indicators
  ],
  maskColor: "#FF00FF", // Visible mask color for debugging
});
```

### Hiding animations

```typescript
// Disable CSS animations before screenshot
await this.page.addStyleTag({
  content: `
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }
  `,
});

await expect(this.page).toHaveScreenshot("page-no-animations.png");
```

### Waiting for stable state

```typescript
// Wait for images to load
await this.page.waitForLoadState("networkidle");

// Wait for specific element to be stable (no layout shifts)
await this.page.getByTestId("chart").waitFor({ state: "visible" });
await this.page.waitForTimeout(500); // Allow render to settle (use sparingly)

await expect(this.page).toHaveScreenshot("chart-loaded.png");
```

## Component-Level vs Page-Level Comparisons

### When to use page-level

- Testing overall layout and composition
- Verifying header/footer/nav consistency
- Full-page responsive testing
- Landing page or marketing page consistency

### When to use component-level

- Testing isolated components (cards, forms, tables)
- More resilient to changes in unrelated areas
- Faster to update baselines when components change
- Better for design system component libraries

**Recommendation**: Prefer component-level screenshots. They are more stable, produce smaller diffs, and are easier to maintain.

## Baseline Management

### Creating baselines

First run with `--update-snapshots` creates the baseline files:

```bash
npx playwright test --update-snapshots
```

In a Cucumber context, take screenshots and save them manually:

```typescript
// Save baseline
const screenshot = await this.page.screenshot({ fullPage: true });
const baselinePath = path.join("screenshots/baselines", "page-name.png");
await fs.writeFile(baselinePath, screenshot);
```

### Updating baselines

When the UI intentionally changes:

```bash
# Update all baselines
npx playwright test --update-snapshots

# Update baselines for specific tests
npx playwright test login.spec.ts --update-snapshots
```

Review updated baselines in a PR diff viewer before merging.

### Cross-platform baselines

Different operating systems render fonts and colors slightly differently. Options:

1. **Run visual tests only in CI** (consistent environment) — recommended
2. **Platform-specific baselines**: Playwright auto-suffixes with platform (`screenshot-linux.png`, `screenshot-darwin.png`)
3. **Docker**: Run visual tests in a consistent container

## Cucumber Integration

Since this project uses Cucumber + Playwright (not Playwright Test runner), implement visual comparison manually:

```typescript
import { Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import * as fs from "fs/promises";
import * as path from "path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import type { MyWorld } from "../support/world.js";

const BASELINES_DIR = "screenshots/baselines";
const ACTUAL_DIR = "screenshots/actual";
const DIFFS_DIR = "screenshots/diffs";

Then("the {string} should match its visual baseline", async function (this: MyWorld, name: string) {
  const actual = await this.page.screenshot({ fullPage: true });
  const baselinePath = path.join(BASELINES_DIR, `${name}.png`);

  // If no baseline exists, save current as baseline
  if (!(await fileExists(baselinePath))) {
    await fs.mkdir(path.dirname(baselinePath), { recursive: true });
    await fs.writeFile(baselinePath, actual);
    return; // First run creates baseline
  }

  const baseline = await fs.readFile(baselinePath);
  const baselineImg = PNG.sync.read(baseline);
  const actualImg = PNG.sync.read(actual);

  const { width, height } = baselineImg;
  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(baselineImg.data, actualImg.data, diff.data, width, height, {
    threshold: 0.2,
  });

  const diffRatio = numDiffPixels / (width * height);

  if (diffRatio > 0.01) {
    // More than 1% different
    await fs.mkdir(DIFFS_DIR, { recursive: true });
    await fs.mkdir(ACTUAL_DIR, { recursive: true });
    await fs.writeFile(path.join(DIFFS_DIR, `${name}-diff.png`), PNG.sync.write(diff));
    await fs.writeFile(path.join(ACTUAL_DIR, `${name}-actual.png`), actual);
    throw new Error(
      `Visual regression: ${name} differs by ${(diffRatio * 100).toFixed(2)}% (${numDiffPixels} pixels)`,
    );
  }
});
```

### Required packages

```bash
npm install --save-dev pngjs pixelmatch
npm install --save-dev @types/pngjs
```

## CI Integration Considerations

### Consistent environment

- Use the same Docker image or CI runner for all visual tests
- Pin browser versions: `npx playwright install chromium`
- Set a fixed viewport size in test setup:

```typescript
this.context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
});
```

### Storing baselines in CI

- Commit baseline images to git (use Git LFS for large files)
- Store diffs and actual screenshots as CI artifacts for review
- Add a CI step to upload diff images on failure

### CI pipeline example

```yaml
- name: Run visual regression tests
  run: npm run cucumber:tags -- --tags "@visual"

- name: Upload visual diffs on failure
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: visual-diffs
    path: |
      screenshots/diffs/
      screenshots/actual/
    retention-days: 7
```

### Handling failures in CI

1. Download the diff artifacts
2. Compare baseline vs actual vs diff images
3. If the change is intentional, update baselines locally and commit
4. If the change is a bug, fix the code

## Tips

- Start with component-level visual tests — they are more maintainable than full-page tests.
- Use generous thresholds initially (0.05 ratio) and tighten as you gain confidence.
- Always mask known dynamic content from the start — chasing false positives wastes time.
- Run visual tests in a separate tagged suite (`@visual`) so they can be run independently.
- Review baseline updates in PR diffs — GitHub and other tools can show image diffs inline.
- Consider running visual tests only on one browser (Chromium) to reduce baseline management overhead.
- Disable animations globally in your test setup, not per-test — this prevents inconsistent results.
- Use `waitForLoadState('networkidle')` before every screenshot to ensure content is fully loaded.
