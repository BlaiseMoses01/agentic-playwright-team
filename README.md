# Agentic Playwright + Cucumber BDD

A boilerplate framework for AI-agent-driven test automation. A coordinated team of Claude Code agents takes BDD feature files from specification to working Playwright automation — end to end — with minimal human intervention.

Fork this repo, point it at your app, write your `.feature` files, and let the agents do the rest.

## Quick Start

### 1. Fork and clone

```bash
# Fork via GitHub UI, then:
git clone https://github.com/<your-username>/agentic-playwright-team.git
cd agentic-playwright-team
```

### 2. Install dependencies

```bash
npm install
npx playwright install --with-deps chromium
```

### 3. Configure your environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable           | Description                                    |
| ------------------ | ---------------------------------------------- |
| `TARGET`           | Root URL of your application under test        |
| `GITHUB_API_TOKEN` | GitHub personal access token (for PR creation) |
| `GITHUB_OWNER`     | Your GitHub username or org                    |
| `GITHUB_REPO`      | Your repository name                           |

### 4. Add test users

Add test user credentials to your `.env` file, one set of vars per role:

```bash
TEST_USER_ADMIN_EMAIL=admin@example.com
TEST_USER_ADMIN_PASSWORD=secret
TEST_USER_ADMIN_NAME=Admin User

TEST_USER_STANDARD_EMAIL=user@example.com
TEST_USER_STANDARD_PASSWORD=secret
TEST_USER_STANDARD_NAME=Standard User
```

In your step definitions, use the helper from `support/users.ts`:

```typescript
import { getTestUser } from "../support/users.js";

const admin = getTestUser("admin"); // { email, password, name }
const user = getTestUser("standard"); // { email, password, name }
```

### 5. Write your feature files

Add Gherkin `.feature` files to `features/ui/` and/or `features/api/`. See `features/example.feature` for the pattern.

### 6. Run the agent workflow

Open Claude Code in the repo and prompt:

> Automate the feature files in `features/ui/login.feature`. Branch name: `login`.

The agents will explore your app, write automation code, and open a PR for your review.

## How It Works

### The Agent Team

Orchestrated by a **Team Lead** agent coordinating three specialists:

| Agent                              | Role                                                                                                                 |   Writes Code?    |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- | :---------------: |
| **BDD Test Planner**               | Explores the live app guided by feature files. Documents page structures, locators, user flows, and edge cases.      |        No         |
| **Playwright Automation Engineer** | Writes step definitions, page objects, and supporting code following framework patterns.                             |        Yes        |
| **Senior Code Reviewer**           | Runs the test suite, reviews code quality, and either sends feedback back to the engineer or generates a PR summary. | No (reviews only) |

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
│   ├── api/               #   API-layer scenarios
│   ├── ui/                #   UI-layer scenarios
│   └── example.feature    #   Minimal placeholder showing the pattern
├── steps/                 # Cucumber step definitions (TypeScript)
├── pages/                 # Page Object Model classes (Playwright)
│   ├── base.page.ts       #   Generic base page with shared helpers
│   └── pageManager.page.ts #  POM factory — register your pages here
├── support/               # Cucumber hooks, world config, shared utilities
├── scripts/               # Shell helpers (branch creation, etc.)
├── results/               # Test output (JSON, HTML, JUnit — gitignored)
├── .env.example           # Environment template (target URL, users, GitHub token)
├── cucumber.mjs           # Cucumber-js configuration
├── playwright.config.ts   # Playwright configuration
├── .claude/agents/        # Agent definitions for the AI team
└── CLAUDE.md              # Orchestration instructions for the team lead
```

## Running Tests Manually

```bash
# Run all Cucumber scenarios
npm run cucumber

# Run only API-tagged scenarios
npm run cucumber:api

# Run only UI-tagged scenarios
npm run cucumber:ui

# Run specific tags
npm run cucumber:tags -- --tags "@your-tag"

# Run with full reporting (JSON + HTML + JUnit)
npm run cucumber:report

# Run Playwright specs directly
npm test
```

## Adding Your Own Pages and Steps

1. Create a page object in `pages/` extending `BasePage`
2. Register it in `pages/pageManager.page.ts` (see comments in that file)
3. Write step definitions in `steps/` that use the page manager from the Cucumber World
4. Tag your feature files and run with `npm run cucumber:tags -- --tags "@your-tag"`

## Tech Stack

- **[Playwright](https://playwright.dev/)** — browser automation
- **[Cucumber.js](https://github.com/cucumber/cucumber-js)** — BDD test runner with Gherkin syntax
- **[TypeScript](https://www.typescriptlang.org/)** — type-safe step definitions and page objects
- **[Claude Code](https://claude.ai/claude-code)** — AI agent orchestration
