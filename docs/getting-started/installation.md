---

## title: Installation and Local Run
description: Install dependencies, build CodyMaster, run tests, and verify the CLI command surface locally.
keywords: codymaster install, cli setup, npm build, vitest
robots: index, follow

# Installation and Local Run

> [!TIP]
> **Quick path:** `npm ci` → `npm run build` → `npm run test:gate` → `node dist/index.js --help`. For pre-merge parity with CI, run `npm run test:gate:kit`.

## Prerequisites

- **Node.js** 20+ recommended
- **npm**
- **Git** (for cloning and typical workflows)
- Optional: **Playwright** browsers if you use browse/visual QA features (see engineering commands)

## Install from the repository

```bash
git clone https://github.com/tody-agent/codymaster.git
cd codymaster
npm ci
npm run build
```

## Global CLI (`cm`)

After build, you can invoke the CLI locally:

```bash
node dist/index.js --help
```

For a global install, use the published package or your preferred linking workflow (see project `README.md` and `install.sh` on the repo).

## Verify the toolchain

```bash
npm run test:gate
```

## CI-equivalent gate (recommended before PRs)

```bash
npm run test:gate:kit
```

This runs TypeScript build, skill validation (`scripts/validate-skills.mjs`), skill build check, and the full Vitest suite (`package.json`).

## Optional: documentation site

```bash
npx vitepress dev docs
```

Build static output:

```bash
npx vitepress build docs
```

## First-run checklist

1. `node dist/index.js --help` shows registered command groups (`src/cli/command-registry.ts`).
2. `cm dashboard start` (when installed) serves Mission Control at `http://localhost:6969` by default (`src/cli/commands/dashboard.ts`, `src/data.ts`).
3. Initialize project memory when you start serious agent work — see [Working memory](../operations/working-memory.md).

## See also

- [Introduction](./introduction.md)
- [How it works](./how-it-works.md)
- [CLI command reference](../cli/command-reference.md)
- [Testing and release gates](../quality/testing-and-release.md)

