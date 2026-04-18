---

## title: Installation and Local Run

description: Install dependencies, build CodyMaster, run tests, and verify the CLI command surface locally.
keywords: codymaster install, cli setup, npm build, vitest
robots: index, follow

# Installation and Local Run

> [!TIP]
> **Quick path:** `npm ci` → `npm run build` → `npm run test:gate` → `node dist/index.js --help`. For pre-merge parity with CI, run `npm run test:gate:kit`.

## Install in AI Agents (Recommended)

CodyMaster uses **Native Plugin Extensions** for zero-friction installation directly into your AI working environment.

### Claude Desktop / Claude Cowork
1. Open **Settings → Plugins**
2. Click **"Add marketplace"** and enter: `tody-agent/codymaster`
3. Click **"Sync"**

### Claude Code CLI
```bash
claude plugin marketplace add tody-agent/codymaster
claude plugin install cm@codymaster --scope user
```

### Cursor
In the Agent Chat, type:
```text
/add-plugin cody-master
```

### Gemini CLI / Google Antigravity
```bash
gemini extensions install https://github.com/tody-agent/codymaster
```
> **Tip:** Add `@~/.gemini/antigravity/skills/cm-skill-index/SKILL.md` to your `GEMINI.md` to save tokens.

### OpenCode / OpenClaw / Codex
Tell your agent:
```text
Fetch and follow instructions from https://raw.githubusercontent.com/tody-agent/codymaster/main/.opencode/INSTALL.md
```

---

## Install from the repository (For Developers)

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

For a global install, use the published package or your preferred linking workflow (see project `README.md` on the repo).

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

