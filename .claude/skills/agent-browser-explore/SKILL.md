---
name: agent-browser-explore
description: guide for agentic browser exploration using vercel's agent browser
---

# Skill: Agentic Browser Exploration

## When to use

Use this skill when the user asks you to:

- Explore a website to gather test cases, user flows, or acceptance criteria
- Discover element locators (roles, test IDs, labels, selectors) for page objects
- Capture screenshots or snapshots as evidence of current UI state
- Audit a page's interactive elements, forms, navigation, or accessibility tree
- Compare two pages or states visually (diff)
- Investigate a bug or verify a fix in a live environment
- Gather information needed before writing Playwright tests

## Prerequisites

`agent-browser` must be installed. If not available, install it:

```bash
npm install -g agent-browser
agent-browser install --with-deps  # Linux: also installs system deps
```

## Headed vs Headless — ALWAYS ASK

**Before launching the browser, ALWAYS ask the user:**

> Do you want headed mode (visible browser window) or headless (no window)?

The ONLY exception is when running inside a background task, CI, or non-interactive context — default to headless in those cases.

Pass `--headed` for headed mode. Omit for headless (default).

## Core Workflow

### 1. Open the target URL

```bash
agent-browser open <url>              # headless (default)
agent-browser open <url> --headed     # headed — user can watch
```

### 2. Take a snapshot to discover elements

```bash
agent-browser snapshot -i             # interactive elements only (buttons, inputs, links)
agent-browser snapshot -i -c          # compact — removes empty structural nodes
agent-browser snapshot -i -c -d 5    # limit depth for large pages
agent-browser snapshot -s "#main"    # scope to a section
```

Snapshots return an accessibility tree with **refs** like `@e1`, `@e2`. Use these refs for all subsequent interactions — they are deterministic and fast.

### 3. Interact using refs

```bash
agent-browser click @e2
agent-browser fill @e3 "test@example.com"
agent-browser hover @e4
agent-browser get text @e1
agent-browser select @e5 "Option A"
agent-browser check @e6
```

### 4. Capture evidence

```bash
agent-browser screenshot                          # quick screenshot (auto-named temp file)
agent-browser screenshot ./evidence/page.png      # save to specific path
agent-browser screenshot --full                   # full-page screenshot
agent-browser screenshot --annotate               # numbered labels on interactive elements
```

### 5. Navigate and explore flows

```bash
agent-browser click @e4                           # follow a link
agent-browser snapshot -i                         # re-snapshot after navigation
agent-browser back                                # go back
agent-browser get url                             # check current URL
agent-browser get title                           # check page title
agent-browser wait --load networkidle             # wait for page to settle
```

### 6. Gather locator information

After snapshotting, extract locator strategies from the accessibility tree output:

- **Roles**: `button`, `link`, `textbox`, `heading`, `checkbox`, etc. — map to `getByRole()`
- **Accessible names**: the quoted name after the role — map to `getByRole('button', { name: '...' })`
- **Labels**: associated label text — map to `getByLabel()`
- **Test IDs**: if present in the DOM — verify with `agent-browser eval "document.querySelectorAll('[data-testid]').length"`

Use `agent-browser get html <selector>` or `agent-browser eval` to inspect raw DOM when the accessibility tree isn't enough.

### 7. Clean up

```bash
agent-browser close
```

Always close the browser when exploration is complete.

## Exploration Strategies

### Page audit (locator harvesting)

1. Open the page
2. Snapshot interactive elements: `snapshot -i -c`
3. For each section, record: role, name, suggested Playwright locator
4. Screenshot for visual reference
5. Report findings as a structured list

### User flow walkthrough

1. Open the starting page
2. Snapshot, identify the first action
3. Perform each step (click, fill, submit)
4. Re-snapshot after each navigation/state change
5. Screenshot key states (before submit, after success/error)
6. Record the sequence of actions and expected outcomes

### Visual evidence gathering

1. Open the page
2. `screenshot --annotate` — get numbered interactive elements
3. `screenshot --full` — capture full page
4. `diff snapshot` — compare before/after a change
5. Save screenshots to `./evidence/` or a user-specified directory

### Form analysis

1. Open the page with the form
2. `snapshot -i -c` to find all inputs
3. For each input: `get attr @eN type`, `get attr @eN name`, `get attr @eN required`
4. Try filling and submitting to discover validation behavior
5. Screenshot error states and success states

## Mapping Discoveries to Playwright Locators

When reporting findings, map each element to the project's preferred locator strategy (per CLAUDE.md):

| Snapshot output                        | Playwright locator                                    |
| -------------------------------------- | ----------------------------------------------------- |
| `button "Submit" [ref=e2]`             | `page.getByRole('button', { name: 'Submit' })`        |
| `textbox "Email" [ref=e3]`             | `page.getByRole('textbox', { name: 'Email' })`        |
| `link "Dashboard" [ref=e4]`            | `page.getByRole('link', { name: 'Dashboard' })`       |
| `checkbox "Remember me" [ref=e5]`      | `page.getByRole('checkbox', { name: 'Remember me' })` |
| Element with `data-testid="login-btn"` | `page.getByTestId('login-btn')`                       |
| Input with associated `<label>`        | `page.getByLabel('Password')`                         |

Prefer `getByRole()` > `getByTestId()` > `getByLabel()` > CSS selectors, per project conventions.

## Sessions

Use sessions to run isolated explorations in parallel or preserve state:

```bash
agent-browser --session explore1 open https://app.example.com/login
agent-browser --session explore2 open https://app.example.com/signup
```

## Tips

- Always re-snapshot after any action that changes the page (click, navigation, form submit) — refs become stale.
- Use `snapshot -i` (interactive only) to keep output manageable. Full snapshots on complex pages can be very large.
- Use `wait --load networkidle` after opening SPAs that load data asynchronously.
- Use `--json` flag when you need to parse output programmatically.
- Chain commands with `&&` when you don't need intermediate output: `agent-browser open url && agent-browser wait --load networkidle && agent-browser snapshot -i`
- Use `eval` for anything the snapshot can't tell you: `agent-browser eval "document.querySelectorAll('[data-testid]').map(e => e.dataset.testid)"`
- If a page requires auth, use `--headers '{"Authorization": "Bearer <token>"}'` with the `open` command, or use `state load` to restore a saved auth state.
