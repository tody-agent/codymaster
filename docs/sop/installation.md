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
claude plugin marketplace add tody-agent/codymaster
```

### Step 2: Install All 34 Skills

One command installs everything:

```bash
claude plugin install cm@codymaster
```

All 34 skills ship as a single plugin:

| Domain | Skills |
|--------|--------|
| 🔧 Engineering | cm-tdd, cm-debugging, cm-quality-gate, cm-test-gate, cm-code-review |
| ⚙️ Operations | cm-safe-deploy, cm-identity-guard, cm-git-worktrees, cm-terminal, cm-secret-shield, cm-safe-i18n |
| 🎨 Product | cm-planning, cm-brainstorm-idea, cm-ux-master, cm-ui-preview, cm-dockit, cm-readit, cm-project-bootstrap, cm-jtbd |
| 📈 Growth | cm-content-factory, cm-ads-tracker, cro-methodology |
| 🎯 Orchestration | cm-execution, cm-continuity, cm-skill-chain, cm-skill-index, cm-skill-mastery, cm-deep-search, cm-how-it-work |
| 🖥️ Workflow | cm-start, cm-dashboard, cm-status |

### Step 3: Verify

```bash
claude plugin list
```

You should see `cm` listed as installed.

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
gemini extensions update codymaster
```

---

## Method 3: Cursor

In Cursor Agent chat, run:
```
/add-plugin cm
```

Or search for `codymaster` in the Cursor plugin marketplace.

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
/cm:demo
```

Then use any command by name:

| Command | What it does |
|---------|-------------|
| `/cm:plan` | Brainstorm + architecture + task plan |
| `/cm:build` | TDD implementation (red → green → refactor) |
| `/cm:debug` | 4-phase root cause analysis |
| `/cm:review` | Code review + quality gate |
| `/cm:deploy` | Safe multi-gate deployment |
| `/cm:ux` | UX design + prototyping |
| `/cm:content` | AI content factory |
| `/cm:bootstrap` | New project setup |

Skills also activate **automatically** when relevant — just describe what you want and the right skill engages.

## Updating

```bash
# Claude Code
claude plugin update cm@codymaster

# Gemini CLI
gemini extensions update codymaster
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
- [Skills Library →](../skills/) — Browse all 34+ available skills
- [Dashboard Guide →](./dashboard.md) — Task tracking with the Kanban board
