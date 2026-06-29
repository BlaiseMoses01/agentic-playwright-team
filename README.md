# Agentic Playwright BDD Framework

A boilerplate framework for AI-agent-driven test automation in Playwright. A coordinated team of Claude Code agents takes BDD feature files from specification to working Playwright automation — end to end — with minimal human intervention.

## Tech Stack

- **[Playwright](https://playwright.dev/)** — browser automation library and test framework
- **[playwright-bdd](https://github.com/vitalets/playwright-bdd)** — Gherkin/BDD layer that compiles feature files into Playwright specs, this allows human readability and the encapsulation of BDD stepdef style test architecture without the need of a translation layer like in Cucumber setups
- **[TypeScript](https://www.typescriptlang.org/)** — type-safe step definitions, fixtures, and supporting logic
- **[Claude Code](https://www.anthropic.com/claude-code)** — AI orchestrator and loop architecture provider. I use Claude's composables and programmatic support gaurdrails to build a core agent loop for this project.
- **[Playwright Test MCP](https://github.com/microsoft/playwright-mcp)** — Playwright's specialized browser-automation MCP server that ships with their agent team, I repurposed it in my custom agent pipeline because of some of the tools enabled some interesting optimization patterns over the generic Playwright MCP.

## Overview

This is an agent-enabled playwright regression testing template repo meant for quickly spinning up automated testing for web applications. It enables
scalable, intelligent agentic coding for test scenarios with gaurdrails and architecture to address the common pitfalls of agentic QA, based on my experience as an SDET as well as an AI Engineer. It is built around Claude Code as an orchestrator, but many of the patterns and tooling in this repo should work agnostic of AI coding tool provider.

## Design & Strategy

After months of iterating on different incarnations of this design both professionally and personally , the stack of this template is strategically picked to create professional, scalable test architecture following best practice while still being context and thus cost effective for AI tooling. The design consists of :

## Why it works

## Usage & Demo
