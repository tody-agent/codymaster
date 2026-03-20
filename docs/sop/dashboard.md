---
title: "Dashboard & Kanban"
description: "How to use the Cody Master Kanban dashboard for task management, project tracking, and deployment history."
keywords: ["dashboard", "kanban", "task management", "cody master"]
robots: "index, follow"
---

# Dashboard & Kanban

> **Quick Reference**
> - **URL**: `http://codymaster.localhost:48120`
> - **Type**: Single Page Application (SPA)
> - **Features**: Kanban board, deploy tracking, activity log, judge suggestions

## Starting the Dashboard

```bash
# Start
cm dashboard start

# Open in browser
cm open

# Check status
cm dashboard status

# Stop
cm dashboard stop
```

## Kanban Board

The dashboard presents a **4-column Kanban board**:

| Column | Meaning | Color |
|--------|---------|-------|
| **Backlog** | Tasks waiting to be started | ⚪ Gray |
| **In Progress** | Currently being worked on | 🔵 Blue |
| **Review** | Awaiting review or QA | 🟡 Yellow |
| **Done** | Completed and verified | 🟢 Green |

### Task Management

**Adding Tasks:**

```bash
# Via CLI
cm task add "Fix auth bug" --priority high --agent antigravity --skill cm-debugging

# Via Dashboard
# Click "+ Add Task" button in any column
```

**Moving Tasks:**

```bash
# Via CLI
cm task move <task-id> in-progress
cm task move <task-id> review
cm task done <task-id>

# Via Dashboard
# Drag cards between columns
```

**Dispatching to AI Agents:**

```bash
# Via CLI
cm task dispatch <task-id>

# Via Dashboard
# Click the "Dispatch" button on a task card
```

### Task Properties

| Property | Values | Description |
|----------|--------|-------------|
| Title | Free text | Task description |
| Priority | `low` · `medium` · `high` · `urgent` | Determines processing order |
| Agent | `antigravity` · `claude` · `cursor` · etc | Which AI agent handles this |
| Skill | `cm-tdd` · `cm-debugging` · etc | Which skill protocol to follow |
| Column | `backlog` · `in-progress` · `review` · `done` | Current state |

## Project Management

### Creating Projects

```bash
# Via CLI
cm project add "My Web App" --path /path/to/project

# Via Dashboard API
POST /api/projects { "name": "My Web App", "path": "/path/to/project" }
```

### Project Dashboard

Each project shows:
- **Task count** — total and by column
- **Active agents** — which AI agents are assigned
- **Completion percentage** — visual progress bar
- **Recent activity** — last 5 actions

## Deployment Tracking

Track deployments across staging and production:

```bash
# Record a staging deploy
cm deploy staging -m "Fix login flow"

# Record a production deploy
cm deploy production -m "Release v2.1"

# View deployment history
cm deploy list

# Rollback a deployment
cm rollback <deploy-id>
```

### Deploy Statuses

| Status | Icon | Meaning |
|--------|------|---------|
| `pending` | 🟡 | Deploying |
| `running` | 🔵 | In progress |
| `success` | 🟢 | Successfully deployed |
| `failed` | 🔴 | Deploy failed |
| `rolled_back` | 🟣 | Rolled back |

## Judge Agent

The Judge Agent provides automated task health evaluation:

```bash
# Evaluate all tasks
cm judge

# Check for stuck tasks
cm task stuck
```

### Judge Suggestions

The Judge monitors all in-progress tasks and:
- ⚠️ Flags tasks **stuck** for >30 minutes
- 🤖 Suggests the **best agent** for each skill
- 📊 Recommends **state transitions** (e.g., "move to review")

## Activity History

```bash
# View recent activity
cm history

# View last 50 activities for a project
cm history -n 50 --project "My Project"
```

Activity types: task_created, task_moved, task_done, deploy_staging, deploy_production, rollback, chain_started, chain_completed

## Auto-Refresh

The dashboard includes an auto-refresh feature with a configurable interval. Look for the sync indicator in the sidebar — it shows when data was last loaded and allows toggling auto-refresh on/off.

## Next Steps

- [Working Memory →](./working-memory.md) — Context persistence
- [API Reference →](../api/) — REST API documentation
- [Skills Library →](../skills/) — Browse available automation
