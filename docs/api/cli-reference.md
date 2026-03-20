---
title: "CLI Reference"
description: "Complete CLI command reference for Cody Master."
keywords: ["CLI", "commands", "terminal", "cody master"]
robots: "index, follow"
---

# CLI Reference

> **Quick Reference**
> - **Command**: `cody` or `cm` or `codymaster`
> - **Version**: 3.2.0+
> - **Aliases**: All commands have short aliases

## Core Commands

### `cm dashboard [cmd]`

Alias: `cm dash`

Manage the dashboard server.

| Subcommand | Description |
|------------|-------------|
| `start` | Start dashboard (default if no subcommand) |
| `stop` | Stop running dashboard |
| `status` | Show dashboard status |
| `open` | Open dashboard in browser |
| `url` | Print dashboard URL |

```bash
cm dashboard start --port 3001
cm dash status
```

### `cm open`

Shortcut to open the dashboard in your browser.

### `cm init`

Initialize a Cody Master project in the current directory (creates `.cm/` directory).

### `cm status`

Show a summary of projects, tasks, deployments, and dashboard status.

---

## Task Commands

### `cm task <cmd>`

Alias: `cm t`

| Subcommand | Description |
|------------|-------------|
| `add <title>` | Create a new task |
| `list` / `ls` | List all tasks |
| `move <id> <column>` | Move task to column |
| `done <id>` | Mark task as done |
| `rm <id>` / `delete` | Delete a task |
| `dispatch <id>` | Dispatch task to AI agent |
| `stuck` | Show stuck tasks (>30min in progress) |

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `-p, --project <name>` | Project name or ID | First project |
| `-c, --column <col>` | Column: backlog/in-progress/review/done | backlog |
| `--priority <level>` | Priority: low/medium/high/urgent | medium |
| `--agent <agent>` | Agent name | — |
| `--skill <skill>` | Skill name | — |
| `--all` | Show all projects | false |
| `--force` | Force re-dispatch | false |

```bash
cm task add "Fix login bug" --priority high --agent antigravity --skill cm-debugging
cm task list
cm task move abc123 review
cm task done abc123
cm task dispatch abc123 --force
cm task stuck
```

---

## Project Commands

### `cm project <cmd>`

Alias: `cm p`

| Subcommand | Description |
|------------|-------------|
| `add <name>` | Create project |
| `list` / `ls` | List projects |
| `rm <id>` / `delete` | Delete project + tasks |

```bash
cm project add "My App" --path /path/to/project
cm project list
cm project rm my-app
```

---

## Deploy Commands

### `cm deploy <cmd>`

Alias: `cm d`

| Subcommand | Description |
|------------|-------------|
| `staging` | Record staging deployment |
| `production` / `prod` | Record production deployment |
| `list` / `ls` | List deployment history |

```bash
cm deploy staging -m "Fix login flow" --commit abc123 --branch main
cm deploy production -m "Release v2.1"
cm deploy list
```

### `cm rollback <id>`

Alias: `cm rb`

Roll back a deployment. The original is marked as `rolled_back`.

```bash
cm rollback abc123
```

---

## History & Changelog

### `cm history`

Alias: `cm h`

Show activity history.

```bash
cm history -n 50 --project "My App"
```

### `cm changelog <cmd>`

Alias: `cm cl`

| Subcommand | Description |
|------------|-------------|
| `add <version> <title> [changes...]` | Add changelog entry |
| `list` / `ls` | List entries |

```bash
cm changelog add "2.1.0" "Auth Overhaul" "Added OAuth" "Fixed sessions"
cm changelog list
```

---

## Skill Commands

### `cm skill <cmd>`

| Subcommand | Description |
|------------|-------------|
| `list` | List all available skills |
| `info <name>` | Show skill details |
| `domains` | List skill domains |

```bash
cm skill list
cm skill info cm-tdd
cm skill domains
```

### `cm install <skill>`

Install a skill for a specific platform.

```bash
cm install cm-tdd --platform gemini
cm install cm-debugging --platform claude
```

---

## Chain Commands

### `cm chain <cmd>`

| Subcommand | Description |
|------------|-------------|
| `list` | List available chains |
| `start <chain> <title>` | Start a chain execution |
| `status [id]` | Show chain progress |
| `auto <title>` | Auto-detect best chain |

```bash
cm chain list
cm chain start feature "Add user auth"
cm chain status abc123
cm chain auto "Fix the login bug"
```

---

## AI & Judge Commands

### `cm agents [skill]`

List compatible agents, or suggest the best agent for a skill.

```bash
cm agents
cm agents cm-tdd
```

### `cm judge [task-id]`

Evaluate task health. Without ID, evaluates all tasks.

```bash
cm judge
cm judge abc123
```

---

## Working Memory Commands

### `cm continuity [cmd]`

Alias: `cm ctx`

| Subcommand | Description |
|------------|-------------|
| `init` | Initialize `.cm/` directory |
| `status` | Show memory status (default) |
| `reset` | Reset working memory |
| `learnings` | Show captured learnings |
| `decisions` | Show architecture decisions |

```bash
cm continuity init --path /my/project
cm ctx status
cm ctx learnings
```

---

## System Commands

### `cm config`

Show configuration and data paths.

### `cm version`

Show version (also: `cm -v` or `cm --version`).

### `cm help`

Show help menu (also: running `cm` with no arguments).
