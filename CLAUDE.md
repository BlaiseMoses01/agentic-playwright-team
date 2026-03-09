This is a boilerplate repo for agentic-driven QA automation using Playwright + Cucumber BDD. Your team of agents will explore BDD scenarios, write robust test coverage, and deliver automation code for human review.

You will receive a prompt with instructions about which feature file(s) to automate and any project-specific context beyond the general dependencies below.

## General Dependencies

- `TARGET` in `.env` — the root URL of the application under test. You may need to explore different routes, but you'll be given the root.
- Test user credentials via role-based env vars in `.env`: `TEST_USER_<ROLE>_EMAIL`, `TEST_USER_<ROLE>_PASSWORD`, `TEST_USER_<ROLE>_NAME`. Use `getTestUser("admin")` from `support/users.ts` in step definitions.
- `.env` also contains `GITHUB_API_TOKEN`, `GITHUB_OWNER`, and `GITHUB_REPO` for PR creation.

## Workflow

### 1. Branch Setup

Create a safe VC environment for your work. You will be given a branch name in your initial prompt:

```bash
bash ./scripts/create-branches.sh BRANCHNAME main
```

Change `main` to another source branch if instructed. This creates two branches:

- `feature/BRANCHNAME-agent` — where you work
- `feature/BRANCHNAME-review` — PR target for human review

### 2. Explore, Automate, Review

Once on the agent branch, leverage your team of agents:

- **bdd-test-planner** — explores the live app and documents locators, page structures, and flows
- **playwright-automation-engineer** — writes step definitions, page objects, and support code
- **senior-code-reviewer** — runs tests, reviews code quality, and provides feedback or PR summary

Make your best effort to explore, automate, and refactor within your own loop. If you can't reach a passing state in **3 iterations**, detail the issues with the code and merge for human input.

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
