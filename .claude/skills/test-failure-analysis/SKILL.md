---
name: test-failure-analysis
description: guide for parsing Playwright/Cucumber test failures, analyzing traces, and producing structured failure reports
---

# Skill: Test Failure Analysis

## When to use

Use this skill when the user asks you to:

- Investigate why a Playwright or Cucumber test failed
- Parse test output logs to identify the root cause
- Read and interpret Playwright trace files
- Analyze failure screenshots from the `results/` directory
- Classify failures and produce structured reports
- Triage flaky tests or intermittent failures

## Failure Output Locations

Test artifacts are stored in predictable locations based on project config:

| Artifact              | Location                                                |
| --------------------- | ------------------------------------------------------- |
| Cucumber JSON results | `results/cucumber.json`                                 |
| Cucumber HTML report  | `results/cucumber.html`                                 |
| Cucumber JUnit XML    | `results/cucumber.xml`                                  |
| Failure screenshots   | Attached to Cucumber report (via `hooks.ts` After hook) |
| Playwright traces     | `test-results/` (when using Playwright Test runner)     |

## Step 1: Parse Test Output

When a test run fails, start by reading the console output or result files.

### From Cucumber JSON

```bash
cat results/cucumber.json | jq '.[].elements[].steps[] | select(.result.status != "passed") | {keyword, name, result}'
```

### From console output

Look for these patterns:

- `FAILED` or `Error` — the step that failed
- `TimeoutError` — element not found or page didn't load
- `locator.click: Error` — locator resolved to wrong/missing element
- `expect(received).toBe(expected)` — assertion mismatch
- `net::ERR_` — network-level failure

## Step 2: Analyze Screenshots

The project's `After` hook in `support/hooks.ts` captures a full-page screenshot on failure and attaches it to the Cucumber report. To analyze:

1. Open `results/cucumber.html` or extract the PNG from `results/cucumber.json` (base64-encoded under `embeddings`)
2. Look for: missing elements, unexpected modals/overlays, loading spinners still visible, error banners, wrong page state

## Step 3: Read Trace Files

Playwright traces capture a complete timeline of actions, network requests, and DOM snapshots.

### Trace configuration

In `playwright.config.ts`, traces are configured with `trace: 'retain-on-failure'`, meaning trace files are only saved when a test fails.

### Viewing traces

```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

Or use the online viewer: upload the trace zip to `trace.playwright.dev`.

### What to look for in traces

- **Actions timeline**: See each Playwright action with timestamps — identify where the failure occurred
- **Before/After snapshots**: DOM state before and after each action — spot unexpected state changes
- **Network tab**: Check for failed API calls (4xx, 5xx), slow responses, or missing requests
- **Console tab**: JavaScript errors, warnings, or debug logs from the app
- **Source tab**: The exact line of test code that failed

## Step 4: Classify the Failure

Every failure should be classified into one of these categories:

### 1. Locator Miss

**Symptoms**: `TimeoutError: locator.click`, element not found, `strict mode violation`
**Root cause**: The locator doesn't match any element, matches multiple elements, or the element hasn't rendered yet.
**Resolution**: Update the locator in the page object. Use more specific roles, text, or test IDs. Add `waitFor` if the element appears asynchronously.

### 2. Timing / Race Condition

**Symptoms**: Test passes sometimes, fails other times. `TimeoutError` on actions that usually work. Screenshots show partially loaded pages.
**Root cause**: The test proceeds before the page is ready. Async data loading, animations, or transitions haven't completed.
**Resolution**: Add explicit waits: `waitForLoadState('networkidle')`, `waitForSelector()`, or `expect().toBeVisible()` before interacting. Increase timeout for slow operations. Never use hard-coded `page.waitForTimeout()` as a fix.

### 3. Data Dependency

**Symptoms**: Test fails because expected data is missing, changed, or in wrong state. Assertions fail on specific values.
**Root cause**: Test depends on data from a previous test, seed data that wasn't loaded, or mutable shared state.
**Resolution**: Ensure test data setup in `Before` hooks. Use API calls to create required data. Isolate tests so they don't depend on execution order.

### 4. Application Bug

**Symptoms**: The test accurately describes expected behavior, but the app doesn't behave as specified. Screenshots confirm the app is showing wrong content or behavior.
**Root cause**: Actual defect in the application under test.
**Resolution**: File a bug report. Mark the test with `@known-bug` tag and add a comment referencing the issue. Do not "fix" the test to match broken behavior.

### 5. Environment Issue

**Symptoms**: Connection refused, DNS errors, SSL errors, blank pages, 502/503 responses. All or most tests fail.
**Root cause**: The target application is down, unreachable, or misconfigured. Local environment issues (browser not installed, missing deps).
**Resolution**: Verify the `TARGET` URL in `.env` is accessible. Check if the application is running. Verify browser dependencies with `npx playwright install --with-deps`.

## Step 5: Produce a Failure Report

Use this template for each failure:

```markdown
## Failure Report

**Test**: [Feature name] > [Scenario name]
**Step**: [Given/When/Then step that failed]
**Classification**: [Locator Miss | Timing | Data Dependency | App Bug | Environment]

### Error Message

[Exact error message from output]

### Evidence

- Screenshot: [path or description of what screenshot shows]
- Trace: [path to trace file, if available]
- Network: [any relevant failed requests]

### Root Cause Analysis

[1-3 sentences explaining why this failed]

### Recommended Fix

[Specific code change or action to resolve]

### Confidence

[High | Medium | Low] — [brief justification]
```

## Batch Analysis

When multiple tests fail, look for patterns:

1. **All tests fail** — likely environment issue. Check TARGET URL first.
2. **Tests for one feature fail** — likely a locator or page structure change. Check if the UI changed.
3. **Random subset fails** — likely timing issues. Look for missing waits.
4. **Tests fail only in CI** — likely headed/headless difference, screen size, or resource constraints.

## Tips

- Always read the error message first — it usually points directly to the problem.
- Check screenshots before diving into traces — a quick visual check often reveals the issue immediately.
- When a locator fails, use the `agent-browser-explore` skill to re-discover the correct locator on the live app.
- Compare the failing step's expected state with what the screenshot shows — this tells you whether it's a test problem or an app problem.
- For flaky tests, run the test 5-10 times to confirm flakiness: `for i in $(seq 1 10); do npm run cucumber:tags -- --tags "@flaky-tag"; done`
