This is a boilerplate repo for agentic-driven QA automation using Playwright + Cucumber BDD. Your team of agents will explore BDD scenarios, write robust test coverage, and deliver automation code for human review.

You will receive a prompt with instructions about which feature file(s) to automate and any project-specific context beyond the general dependencies below.

## General Dependencies

- `TARGET` in `.env` — the root URL of the application under test. You may need to explore different routes, but you'll be given the root.
- `API_BASE_URL` in `.env` — the base URL for direct API testing (may differ from `TARGET`).
- `AUTOMATION_MODE` in `.env` — `gated` (default, human approval at key checkpoints) or `autonomous` (fully automated pipeline).
- Test user credentials via role-based env vars in `.env`: `TEST_USER_<ROLE>_EMAIL`, `TEST_USER_<ROLE>_PASSWORD`, `TEST_USER_<ROLE>_NAME`. Use `getTestUser("admin")` from `support/users.ts` in step definitions.
- `.env` also contains `GITHUB_API_TOKEN`, `GITHUB_OWNER`, and `GITHUB_REPO` for PR creation.
- `TRACE_ON_FAILURE` and `SCREENSHOT_ON_FAILURE` control diagnostic capture (default `true`).

## Agent Team

### Core Agents (original)

| Agent                              | Role                                                                  |
| ---------------------------------- | --------------------------------------------------------------------- |
| **bdd-test-planner**               | Explores the live app, documents locators, page structures, and flows |
| **playwright-automation-engineer** | Writes step definitions, page objects, and support code               |
| **senior-code-reviewer**           | Runs tests, reviews code quality, provides feedback or PR summary     |

### Specialist Agents (expanded)

| Agent                         | Role                                                                    |
| ----------------------------- | ----------------------------------------------------------------------- |
| **bdd-scenario-writer**       | Writes and refines `.feature` files from requirements or user stories   |
| **test-data-architect**       | Designs test fixtures, factory functions, and data lifecycle management |
| **locator-stability-auditor** | Audits locator strategies for resilience; flags brittle selectors       |
| **test-failure-analyst**      | Diagnoses test failures, classifies root causes, recommends fixes       |
| **api-test-specialist**       | Writes API-level tests, validates contracts, seeds data via endpoints   |

## Entry Points

### With feature files provided

Skip directly to **Explore, Automate, Review**. The Planner, API Specialist, and Data Architect can work from feature files simultaneously.

### Without feature files

Start with the **BDD Scenario Writer** to generate `.feature` files from requirements or user stories. Once scenarios are approved (or auto-approved in autonomous mode), proceed to exploration.

## Automation Modes

### Human-Gated Mode (`AUTOMATION_MODE=gated`)

- BDD scenarios require human approval before automation begins
- PR review is manual — the Senior Code Reviewer prepares a summary but a human merges
- Use this for new projects, complex domains, or when building initial trust in the pipeline

### Fully Autonomous Mode (`AUTOMATION_MODE=autonomous`)

- Scenarios are auto-approved after the BDD Scenario Writer completes
- The review loop runs fully: write, test, diagnose, fix, audit, PR
- Use this for mature projects with stable patterns and high confidence in the agent team

## Workflow

```
                         +---------------------+
                         |  Requirements /      |
                         |  User Stories         |
                         +---------+-----------+
                                   |
                    feature files? |
                         +---------+---------+
                         | NO                | YES
                         v                   v
                +--------+-------+   +------+--------+
                | BDD Scenario   |   |               |
                | Writer         |   |  (skip)       |
                +--------+-------+   +------+--------+
                         |                   |
                         +--------+----------+
                                  |
                    +-------------+-------------+
                    |             |              |
                    v             v              v
             +------+----+ +-----+------+ +-----+------+
             | Test      | | BDD Test   | | API Test   |
             | Data      | | Planner    | | Specialist |
             | Architect | | (explore)  | | (explore)  |
             +------+----+ +-----+------+ +-----+------+
                    |             |              |
                    +-------------+-------------+
                                  |
                                  v
                    +-------------+-------------+
                    | Playwright Automation     |
                    | Engineer (implement)      |
                    +-------------+-------------+
                                  |
                                  v
                    +-------------+-------------+
                    | Run Tests                 |
                    +---+------------------+----+
                        |                  |
                   PASS |             FAIL |
                        |                  v
                        |    +-------------+----------+
                        |    | Test Failure Analyst    |
                        |    | (diagnose + recommend)  |
                        |    +-------------+----------+
                        |                  |
                        |                  v
                        |         back to Engineer
                        |         (max 3 iterations)
                        |
                        v
              +---------+---------+
              |                   |
              v                   v
     +--------+-------+  +-------+--------+
     | Senior Code    |  | Locator        |
     | Reviewer       |  | Stability      |
     |                |  | Auditor        |
     +--------+-------+  +-------+--------+
              |                   |
              +--------+----------+
                       |
                       v
              +--------+--------+
              | Pull Request    |
              +-----------------+
```

### 1. Branch Setup

Create a safe VC environment for your work. You will be given a branch name in your initial prompt:

```bash
bash ./scripts/create-branches.sh BRANCHNAME main
```

Change `main` to another source branch if instructed. This creates two branches:

- `feature/BRANCHNAME-agent` — where you work
- `feature/BRANCHNAME-review` — PR target for human review

### 2. Explore, Automate, Review

Once on the agent branch, leverage your team of agents following the workflow diagram above.

**Parallel exploration phase**: The Planner, API Specialist, and Data Architect work simultaneously from feature files. Each produces a structured exploration report (see `results/exploration-report-schema.md`).

**Implementation phase**: The Playwright Automation Engineer consumes exploration reports and writes step definitions, page objects, and support code.

**Failure analysis loop**: When tests fail, the Test Failure Analyst diagnoses root causes before sending back to the Engineer. Maximum **3 iterations** — if tests still fail, detail the issues and merge for human input.

**Review phase**: The Senior Code Reviewer and Locator Stability Auditor work in parallel. The reviewer checks code quality while the auditor validates locator resilience.

Run scenarios using tag filters to avoid running unrelated tests:

```bash
npm run cucumber:tags -- --tags "@ui and @your-tag or @another-tag"
```

### 3. Deliver via Pull Request

Create a PR from `feature/BRANCHNAME-agent` into `feature/BRANCHNAME-review` with a concise description of:

- Changes made
- Coverage added
- Any persistent issues for human follow-up

Use the GitHub API to create the PR, substituting env variables from `.env`:

```bash
curl -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_API_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/pulls \
  -d '{"title":"PR title","body":"PR description","head":"feature/BRANCHNAME-agent","base":"feature/BRANCHNAME-review"}'
```

## Project Structure

```
support/
  config.ts          - Base URL and environment config
  users.ts           - Test user credential management
  hooks.ts           - Cucumber lifecycle hooks (Before/After)
  world.ts           - Cucumber World with Playwright context
  fixtures/          - Test data builders and fixture management
    index.ts         - TestDataBuilder interface, FixtureManager class
  api/               - API client for direct endpoint testing
    client.ts        - ApiClient class with GET/POST/PUT/DELETE

pages/
  base.page.ts       - Base page object with common utilities
  pageManager.page.ts - Lazy-loaded page object registry

results/
  exploration-report-schema.md - Structured format for agent exploration output
```
