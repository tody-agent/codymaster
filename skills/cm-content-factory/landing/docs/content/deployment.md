# Deployment Guide

Setting up CodyMaster v5 for your engineering team is straightforward. Follow this guide to initialize the Neural Spine architecture.

## 1. Prerequisites

Ensure your environment meets the following requirements:
- Node.js v18.0.0 or higher
- Git
- SQLite (for local OpenViking memory limits, pre-packaged)

## 2. Installation

Install the framework globally via npm to make the `cm` CLI available anywhere on your machine:

```bash
npm install -g @codymaster/cli@next
```

## 3. Initializing a Workspace

Navigate to your existing Next.js, React, or Python repository and initialize the OpenSpace environment:

```bash
cd my-enterprise-project
cm init
```

This will automatically:
1. Generate the `.agent/` folder structure to house specialized skills.
2. Spin up the **OpenViking** indexer, which will immediately begin mapping your project's Abstract Syntax Trees (AST) and caching semantic vectors.

## 4. Bootstrapping Agents

You can dispatch your first agent task utilizing the full memory and execution layer:

```bash
cm do "Refactor the user dashboard to utilize Tailwind CSS dark mode variants, ensuring all current unit tests still pass."
```

- Watch the terminal to see OpenViking extract relevant context without filling the token window with unnecessary `.json` configs.
- Watch OpenSpace dynamically spin up `npm run test` immediately after the code generation completes, self-correcting any errors before offering a Git commit.

## Continuous CI/CD (Founders Edition)

For teams on the Founders Edition, CodyMaster integrates directly into your GitHub Actions or GitLab CI pipelines. The agent intercepts failed PRs, pushes self-healing commits, and verifies visual integrity entirely autonomously. 
