---
name: cm-dashboard
description: Track and manage tasks across multiple AI coding agents (Codex, Google Antigravity, Cursor, Gemini CLI, Claude Code) through the Mission Control web UI at http://localhost:6969. Use when you need a visual kanban for multi-agent work, dispatching tasks, monitoring agent activity, or syncing task state from a CLI agent.
---

# cm-dashboard — Multi-Agent Mission Control

> Visual + API control plane for tasks dispatched to **Codex, Google Antigravity, Cursor, Gemini CLI, and Claude Code**. Runs locally at **http://localhost:6969**.

## When to use

- You are juggling work across multiple AI coding agents and need one source of truth.
- You want a kanban (`backlog → in-progress → review → done`) per project.
- You need to dispatch a task to a specific agent and capture its progress.
- A CLI agent (Codex, Gemini, etc.) needs to report its conversation lifecycle to a shared board.

## Supported agents

| ID             | Display name        | Skill prefix |
|----------------|---------------------|--------------|
| `codex`        | OpenAI Codex        | `/`          |
| `antigravity`  | Google Antigravity  | `@[/...]`    |
| `cursor`       | Cursor              | `@`          |
| `gemini-cli`   | Gemini CLI          | `@[/...]`    |
| `claude-code`  | Claude Code         | `/`          |

(Also: `windsurf`, `cline`, `copilot`, `manual`.)

## Quick start

```bash
# 1. Start the dashboard (auto-starts on first cm command, or run explicitly)
cm dashboard         # opens http://localhost:6969

# 2. Health-check
curl -s http://localhost:6969/api/projects | jq
```

## Core workflows

### A. Create + dispatch a task to an agent

```bash
# Create
TASK_ID=$(curl -s -X POST http://localhost:6969/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Refactor auth middleware","agent":"codex","skill":"cm-execution","priority":"high"}' \
  | jq -r .id)

# Dispatch (writes .agent-tasks/<id>-*.agent-task.md inside the project)
curl -s -X POST http://localhost:6969/api/tasks/$TASK_ID/dispatch | jq
```

The dispatcher emits a per-agent CLI command:
- `codex --task "<file>"`
- `antigravity -p "$(cat <file>)"`
- `cursor --task "<file>"`
- `gemini run --task "<file>"`
- `claude --task "<file>"`

### B. Move a task across columns

```bash
curl -s -X PUT http://localhost:6969/api/tasks/$TASK_ID/move \
  -H "Content-Type: application/json" \
  -d '{"column":"in-progress"}'   # backlog | in-progress | review | done
```

### C. Auto-sync from an agent conversation

Use this from a running Codex/Gemini/Cursor/Antigravity session to report status — upserts by `conversationId`.

```bash
curl -s -X POST http://localhost:6969/api/tasks/auto-sync \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId":"codex-2026-05-11-001",
    "title":"Refactor auth middleware",
    "status":"in-progress",
    "agent":"codex",
    "skill":"cm-execution"
  }'
```

Status values map to columns: `pending|todo` → backlog, `started|active|in-progress|idle` → in-progress, `review` → review, `completed|done` → done.

### D. Get agent suggestions for a skill

```bash
curl -s 'http://localhost:6969/api/agents/suggest?skill=cm-debugging' | jq
# → { skill, domain, agents: ["claude-code","codex","cursor","antigravity"] }
```

### E. Live activity & per-agent badges

The web UI shows:
- **Agent badges** with color + task count per agent (Codex teal, Antigravity green, Cursor blue, Gemini gold, Claude purple).
- **Active Agents** sidebar — currently working on `in-progress` tasks.
- **Activity feed** — task created/moved/dispatched/transitioned events in real time (WebSocket).

## API reference (most-used)

| Method | Path                                  | Purpose                              |
|--------|---------------------------------------|--------------------------------------|
| GET    | `/api/projects`                       | List projects with task counts       |
| POST   | `/api/projects`                       | Create project                       |
| GET    | `/api/tasks?projectId=…`              | List tasks (optionally per project)  |
| POST   | `/api/tasks`                          | Create task (`agent`, `skill`, …)    |
| POST   | `/api/tasks/sync`                     | Bulk import tasks from an agent      |
| POST   | `/api/tasks/auto-sync`                | Upsert by `conversationId`           |
| PUT    | `/api/tasks/:id/move`                 | Move to column                       |
| POST   | `/api/tasks/:id/dispatch`             | Write `.agent-tasks/*.md` for agent  |
| GET    | `/api/agents/suggest?skill=…`         | Best agents for a skill domain       |
| GET    | `/api/judge/suggestions?projectId=…`  | Auto-transition recommendations      |

Full surface: see [src/dashboard.ts](file:///Volumes/Data/Coder/codymaster/Cody_Master/src/dashboard.ts).

## Recommended per-agent usage

| Domain                              | Best fit              |
|-------------------------------------|-----------------------|
| Engineering / refactor / debugging  | Claude Code, Codex    |
| Long-context architecture & docs    | Antigravity, Gemini   |
| Inline edits / IDE-driven           | Cursor                |
| Quick CLI prompts / shell tasks     | Gemini CLI, Codex     |

## Troubleshooting

- **`{"error":"not found"}`** — endpoint typo; check the table above. The fallback returns 404 for any unknown `/api/*`.
- **Port 6969 already in use** — another dashboard is running. `lsof -i :6969` to find it.
- **`NO_AGENT` on dispatch** — task has no `agent` set; `PUT /api/tasks/:id` with `{"agent":"codex"}` first.
- **`NO_PROJECT_PATH`** — set the project's `path` so dispatch can write into `.agent-tasks/`.

## Files of authority

- [src/dashboard.ts](file:///Volumes/Data/Coder/codymaster/Cody_Master/src/dashboard.ts) — HTTP API
- [src/agent-dispatch.ts](file:///Volumes/Data/Coder/codymaster/Cody_Master/src/agent-dispatch.ts) — per-agent file + CLI generation
- [src/judge.ts](file:///Volumes/Data/Coder/codymaster/Cody_Master/src/judge.ts) — agent affinity per skill domain
- [public/dashboard/app.js](file:///Volumes/Data/Coder/codymaster/Cody_Master/public/dashboard/app.js) — UI badges and colors
