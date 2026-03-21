---
title: "Installation & Setup"
description: "Step-by-step guide to install Cody Master on Claude Code and other AI platforms."
keywords: ["installation", "setup", "cody master", "claude code plugin"]
robots: "index, follow"
---

# Installation & Setup

> **Quick Reference**
> - **Time**: ~2 minutes
> - **Prerequisites**: Claude Code CLI (or another supported AI platform)
> - **Difficulty**: Beginner

## Method 1: Claude Code (Recommended)

Cody Master installs as a Claude Code plugin bundle — no npm, no separate server, nothing to maintain.

### Step 1: Add the Marketplace

Open your terminal and run:

```bash
claude plugin marketplace add tody-agent/cody-master
```

### Step 2: Install All 33+ Skills

One command installs everything:

```bash
claude plugin install cody-master@cody-master
```

All skills are included in a single plugin:

| Domain | Skills |
|--------|--------|
| Engineering | cm-tdd, cm-debugging, cm-quality-gate, cm-test-gate, cm-code-review |
| Operations | cm-safe-deploy, cm-identity-guard, cm-git-worktrees, cm-terminal, cm-secret-shield, cm-safe-i18n |
| Product | cm-planning, cm-brainstorm-idea, cm-ux-master, cm-ui-preview, cm-dockit, cm-readit, cm-project-bootstrap, jobs-to-be-done |
| Growth | cm-content-factory, cm-ads-tracker, cro-methodology |
| Orchestration | cm-execution, cm-continuity, cm-deep-search, cm-skill-chain, cm-skill-mastery, cm-how-it-work |

### Step 3: Verify

```bash
claude plugin list
```

You should see `cody-master` listed as installed.

### One-Liner Alternative

If you prefer to see all commands at once without navigating menus:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/tody-agent/codymaster/main/install.sh) --claude
```

---

## Method 2: Gemini CLI

```bash
gemini extensions install https://github.com/tody-agent/codymaster
```

To update later:
```bash
gemini extensions update cody-master
```

---

## Method 3: Cursor

In Cursor Agent chat, run:
```
/add-plugin cody-master
```

Or search for `cody-master` in the Cursor plugin marketplace.

---

## Method 4: Codex

Tell Codex:
```
Fetch and follow instructions from https://raw.githubusercontent.com/tody-agent/codymaster/main/.codex/INSTALL.md
```

---

## Method 5: Manual / Any Platform

Clone the repo and copy skills directly:

```bash
# Clone once
git clone https://github.com/tody-agent/codymaster.git ~/.cody-master

# Copy to your platform's skills directory
cp -r ~/.cody-master/skills/* ~/.gemini/antigravity/skills/    # Gemini
cp -r ~/.cody-master/skills/* .gemini/skills/                  # Project-local
cp -r ~/.cody-master/skills/* .cursor/skills/                  # Cursor
cp -r ~/.cody-master/skills/* .codex/skills/                   # Codex
cp -r ~/.cody-master/skills/* .opencode/skills/                # OpenCode
```

---

## First Steps After Installation

Run the interactive onboarding tour — it takes ~2 minutes and shows every skill:

```
/cody-master:demo
```

Then use any command by name:

| Command | What it does |
|---------|-------------|
| `/cody-master:plan` | Brainstorm + architecture + task plan |
| `/cody-master:build` | TDD implementation (red → green → refactor) |
| `/cody-master:debug` | 4-phase root cause analysis |
| `/cody-master:review` | Code review + quality gate |
| `/cody-master:deploy` | Safe multi-gate deployment |
| `/cody-master:ux` | UX design + prototyping |
| `/cody-master:content` | AI content factory |
| `/cody-master:bootstrap` | New project setup |

Skills also activate **automatically** when relevant — just describe what you want and the right skill engages.

## Updating

```bash
# Claude Code
claude plugin update cody-master@cody-master

# Gemini CLI
gemini extensions update cody-master
```

## Troubleshooting

<details>
<summary><strong>❌ "Plugin not found" or marketplace error</strong></summary>

Make sure your Claude Code CLI is up to date:

```bash
claude --version
# Should be 1.0 or later
```

Then retry:
```bash
claude plugin marketplace add tody-agent/codymaster
```

</details>

<details>
<summary><strong>❌ Skill not activating</strong></summary>

Try invoking explicitly:
```
Use the cm-planning skill for this task
```

Check that the plugin is installed:
```bash
claude plugin list
```

</details>

<details>
<summary><strong>❌ curl installer not working</strong></summary>

Download and inspect the script manually:
```bash
curl -fsSL https://raw.githubusercontent.com/tody-agent/codymaster/main/install.sh -o install.sh
bash install.sh --claude
```

</details>

## Next Steps

- [Using Skills →](./skills-usage.md) — Learn how to invoke and customize skills
- [Skills Library →](../skills/) — Browse all 33+ available skills
- [Dashboard Guide →](./dashboard.md) — Task tracking with the Kanban board
