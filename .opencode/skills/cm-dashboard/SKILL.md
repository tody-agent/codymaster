---
name: cm-dashboard
description: "Agent control plane — real-time kanban board for managing AI agent tasks, dispatching work, and monitoring progress via WebSocket."
token_budget: 2000
compressed: true
deprecated: false
---

# Skill: cm-dashboard

# Dashboard — Agent Control Plane

## TL;DR
- Real-time kanban board for managing AI agent tasks
- WebSocket live updates, SQLite storage, agent lifecycle
- Use when: managing multi-agent workflows, tracking task progress, dispatching agents

## When to Use

**Always:**

- Starting/stopping the dashboard server
- Dispatching tasks to AI agents
- Monitoring agent progress in real-time
- Managing projects and task boards
- Debugging agent execution issues

**Skip:**

- Quick terminal summary (use `cm-status`)
- Single-task execution (use `cm-execution`)
- Planning only (use `cm-planning`)

## Commands

### Lifecycle

| Command | Description |
|---------|-------------|
| `cm dashboard start` | Launch Express server (default port 6969) |
| `cm dashboard stop` | Stop the server |
| `cm dashboard status` | Check if running |
| `cm dashboard open` | Open in browser |
| `cm dashboard url` | Print URL |

### Agent Dispatch

Tasks assigned to agents are dispatched via `POST /api/tasks/:id/dispatch`.

**Supported agent types:**
- `claude-code`
- `codex`
- `cursor`
- `gemini-cli`
- `copilot`
- `antigravity`
- `opencode`

Each agent is spawned as a child process with NDJSON streaming for real-time output capture.

### Real-time Monitoring

- WebSocket at `/ws` for live task updates
- Events: `task.created`, `task.updated`, `task.message`, `task.completed`, `task.failed`
- Project-scoped subscriptions via `subscribe` message

## Task State Machine

```
backlog → queued → claimed → running → done
                                  → failed
                                  → cancelled
                                  → timeout
```

**Transitions:**
- `backlog → queued`: Task added to execution queue
- `queued → claimed`: Agent picks up task
- `claimed → running`: Agent begins execution
- `running → done`: Task completed successfully
- `running → failed`: Task errored or timed out
- `any → cancelled`: User cancels task

## Configuration

| Setting | Default | Override |
|---------|---------|---------|
| Port | 6969 | `--port` flag |
| Data store (v1) | `~/.codymaster/kanban.json` | — |
| Data store (v2) | SQLite | `CM_EXECUTOR_V2=1` |
| PID file | `~/.codymaster/dashboard.pid` | — |

## MCP Bridge

| Tool | Purpose |
|------|---------|
| `cm_sync_todos` | Sync TodoWrite array to dashboard |
| `cm_get_tasks` | Read board state |
| `cm_update_task` | Move task via auto-sync |

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks` | GET | List all tasks |
| `/api/tasks` | POST | Create task |
| `/api/tasks/:id` | PATCH | Update task |
| `/api/tasks/:id` | DELETE | Delete task |
| `/api/tasks/:id/dispatch` | POST | Dispatch to agent |
| `/api/projects` | GET | List projects |
| `/ws` | WS | WebSocket live updates |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port in use | Check `cm dashboard status`, kill stale process |
| Data corruption | Delete `~/.codymaster/kanban.json` to reset |
| WebSocket not connecting | Check firewall, ensure server is running |
| Agent not spawning | Verify agent CLI is installed and in PATH |
| Task stuck in `running` | Check agent process, may need manual `timeout` |
| Dashboard slow | Check SQLite size, consider pruning old tasks |

## Integration

| Skill | Relationship |
|-------|-------------|
| `cm-planning` | Plans tasks that appear on the board |
| `cm-execution` | Executes tasks dispatched from the board |
| `cm-status` | Quick terminal summary of board state |
| `cm-skill-chain` | Chain executions tracked on the board |
| `cm-continuity` | Persists agent context across sessions |
| `cm-quality-gate` | Blocks dispatch until tests pass |

## File Structure

```
~/.codymaster/
├── kanban.json          # v1 task storage
├── dashboard.pid        # server PID
└── dashboard/
    ├── db.sqlite        # v2 SQLite storage
    └── logs/            # agent execution logs
```

## Security Notes

- Dashboard binds to `localhost` only by default
- No authentication on local instances
- Agent processes inherit user environment
- Never expose to public network without auth middleware
