---
title: "Installation & Setup"
description: "Step-by-step guide to install and configure Cody Master from scratch."
keywords: ["installation", "setup", "cody master"]
robots: "index, follow"
---

# Installation & Setup

> **Quick Reference**
> - **Time**: ~5 minutes
> - **Prerequisites**: Node.js 18+, npm
> - **Difficulty**: Beginner

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git | Any | `git --version` |

## Step 1: Install Cody Master

::: code-group

```bash [npm (recommended)]
npm install -g cody-master
```

```bash [From source]
git clone https://github.com/omisocial/cody-master.git
cd cody-master
npm install
npm run build
npm link  # Makes 'cm' command available globally
```

:::

**Verify installation:**

```bash
cm --version
# Expected: 3.2.0 or later
```

## Step 2: Initialize a Project

Navigate to your project directory and initialize:

```bash
cd /path/to/your/project
cm init
```

This creates the working memory directory:

```
.cm/
├── CONTINUITY.md      # Session state
├── config.yaml        # RARV settings
└── memory/
    ├── learnings.json  # Error patterns
    └── decisions.json  # Architecture decisions
```

## Step 3: Start the Dashboard

```bash
cm dashboard start
# or simply
cm open
```

The Kanban dashboard opens at `http://codymaster.localhost:48120`

## Step 4: Install Skills for Your AI Platform

```bash
# For Google Antigravity (Gemini)
cm install cm-tdd --platform gemini

# For Claude Code
cm install cm-tdd --platform claude

# For Cursor
cm install cm-tdd --platform cursor
```

## Step 5: Create Your First Task

::: code-group

```bash [CLI]
cm task add "Set up authentication" --priority high
```

```bash [Dashboard]
# Open http://codymaster.localhost:48120
# Click "+ Add Task" in the Backlog column
```

:::

## Step 6: Dispatch to an AI Agent

```bash
# Assign agent and skill first
cm task add "Fix login bug" --agent antigravity --skill cm-debugging --priority high

# Then dispatch
cm task dispatch <task-id>
```

## Verification

After setup, verify everything works:

```bash
# Check status
cm status

# Expected output:
# 📊 Status Overview
# Projects: 1
# Tasks: 1
# Dashboard: RUNNING at http://codymaster.localhost:48120
```

## Troubleshooting

<details>
<summary><strong>❌ "cm: command not found"</strong></summary>

Ensure the npm global bin is in your PATH:

```bash
export PATH="$(npm config get prefix)/bin:$PATH"
```

Add this to your `~/.zshrc` or `~/.bashrc`.

</details>

<details>
<summary><strong>❌ Dashboard port already in use</strong></summary>

```bash
# Use a different port
cm dashboard start --port 3001
```

</details>

<details>
<summary><strong>❌ "No projects found"</strong></summary>

```bash
# Create a project first
cm project add "My Project" --path /my/project
```

</details>

## Next Steps

- [Using Skills →](./skills-usage.md) — Learn how to invoke and customize skills
- [Dashboard Guide →](./dashboard.md) — Master the Kanban board
- [Skills Library →](../skills/) — Browse all 30+ available skills
