# Agentic Playwright + Cucumber BDD

An AI-agent-driven test automation framework that uses a coordinated team of Claude Code agents to take BDD feature files from specification to working Playwright automation — end to end — with minimal human intervention.

## How It Works

You give the system a set of Cucumber `.feature` files and a branch name. A team of specialized AI agents takes over from there: exploring the target application, writing Playwright automation code, reviewing it, and delivering a pull request for human sign-off.

### The Agent Team

The workflow is orchestrated by a **Team Lead** agent that coordinates three specialists:

| Agent | Role | Writes Code? |
|-------|------|:------------:|
| **BDD Test Planner** | Explores the live target app guided by the feature files. Documents page structures, locators, user flows, and edge cases into a structured exploration report. | No |
| **Playwright Automation Engineer** | Consumes the exploration report and writes production-quality step definitions, page objects, and any supporting code following the existing framework patterns. | Yes |
| **Senior Code Reviewer** | Runs the test suite, performs a full code quality review (correctness, security, performance, maintainability), and either sends actionable feedback back to the engineer or generates a PR summary. | No (reviews only) |

### Workflow

```
Prompt (feature files + branch name)
        │
        ▼
┌─────────────────────┐
│  1. Branch Creation  │  create-branches.sh makes two branches:
│                      │    feature/<name>-agent  (agent works here)
│                      │    feature/<name>-review (PR target)
└────────┬────────────┘
         ▼
┌─────────────────────┐
│  2. BDD Test Planner │  Opens the target app in a headless browser,
│     (Exploration)    │  walks through every scenario, and documents
│                      │  locators, flows, assertions, and edge cases.
└────────┬────────────┘
         ▼
┌─────────────────────┐
│  3. Playwright       │  Reads the exploration report + existing
│     Automation       │  framework code, then writes/updates:
│     Engineer         │    • Step definitions  (steps/)
│                      │    • Page objects       (pages/)
│                      │    • Support/hooks      (support/)
└────────┬────────────┘
         ▼
┌─────────────────────┐
│  4. Senior Code      │  Runs tests, reviews code quality,
│     Reviewer         │  and returns feedback or a PR summary.
└────────┬────────────┘
         │
    ┌────┴────┐
    │ Issues? │──yes──▶ Back to step 3 (up to 3 iterations)
    └────┬────┘
         │ no
         ▼
┌─────────────────────┐
│  5. Pull Request     │  PR from feature/<name>-agent
│                      │  into feature/<name>-review
│                      │  with a detailed summary for human review.
└─────────────────────┘
```

If the agents can't reach a fully passing state within **3 feedback loops**, they merge what they have and document all remaining issues in the PR description so a human engineer can pick it up.

## Project Structure

```
.
├── features/              # Cucumber/Gherkin feature files
│   ├── api/               #   API-layer scenarios (auth, cart, orders, etc.)
│   └── ui/                #   UI-layer scenarios (login, checkout, products, etc.)
├── steps/                 # Cucumber step definitions (TypeScript)
├── pages/                 # Page Object Model classes (Playwright)
├── support/               # Cucumber hooks, world config, shared utilities
├── scripts/               # Shell helpers (branch creation, etc.)
├── results/               # Test output (JSON, HTML, JUnit — gitignored)
├── users.json             # Test user credentials
├── cucumber.mjs           # Cucumber-js configuration
├── playwright.config.ts   # Playwright configuration
├── .claude/agents/        # Agent definitions for the AI team
└── CLAUDE.md              # Orchestration instructions for the team lead
```

## Prerequisites

- **Node.js** (v18+)
- **Claude Code** CLI with access to Claude Opus / Sonnet models
- A deployed target application (URL goes in `.env`)

## Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps chromium

# Configure your target
# Create a .env with: TARGET=https://your-app-url.com
```

## Usage

### Running the Agent Workflow

Invoke the team lead via Claude Code with a prompt like:

> Automate the feature files in `features/ui/auth.feature` and `features/ui/cart.feature`. Branch name: `auth-cart`.

The agent will:
1. Run `bash ./scripts/create-branches.sh auth-cart main`
2. Explore, automate, review, and iterate
3. Open a PR from `feature/auth-cart-agent` into `feature/auth-cart-review`

### Running Tests Manually

```bash
# Run all Cucumber scenarios
npm run cucumber

# Run only API-tagged scenarios
npm run cucumber:api

# Run only UI-tagged scenarios
npm run cucumber:ui

# Run with full reporting (JSON + HTML + JUnit)
npm run cucumber:report

# Run Playwright specs directly
npm test
```

## Configuration

| File | Purpose |
|------|---------|
| `.env` | `TARGET` — root URL of the application under test |
| `users.json` | Test user accounts (email, password, name) |
| `cucumber.mjs` | Cucumber-js paths, imports, and format options |
| `playwright.config.ts` | Playwright browser settings, timeouts, reporters |

## Tech Stack

- **[Playwright](https://playwright.dev/)** — browser automation
- **[Cucumber.js](https://github.com/cucumber/cucumber-js)** — BDD test runner with Gherkin syntax
- **[TypeScript](https://www.typescriptlang.org/)** — type-safe step definitions and page objects
- **[agent-browser](https://github.com/vercel-labs/agent-browser)** — headless browser CLI used by the exploration agent
- **[Claude Code](https://claude.ai/claude-code)** — AI agent orchestration
