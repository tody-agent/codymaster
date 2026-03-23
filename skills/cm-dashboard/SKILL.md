---
name: cm-dashboard
description: Open visual Dashboard UI to track work status, with auto-sync from Claude Code and Claude Desktop
---

# Command: `/cm-dashboard`

When this command is called, the AI Assistant should run the `cm dashboard` terminal command to launch the full visual Web Dashboard!

Do NOT draw a markdown table anymore. The system has evolved!

1. **Launch the Dashboard:** Run `cm dashboard` in the terminal using the `run_command` tool.
2. **Inform the user:** Tell the user that the CodyMaster Mission Control Dashboard has been launched on its local server port (usually http://localhost:6969) for them to visually track their Active Agents, Projects, Kanban Board, Deploys, and Brain Network.

---

## Auto-Sync Setup (Claude Code)

Wire Claude Code's `PostToolUse` hook so every `TodoWrite` automatically syncs to the dashboard. No manual card creation needed.

### Step 1 — Install the bridge script

```bash
mkdir -p ~/.claude/scripts
cp <path-to-cody-master>/scripts/todo-bridge.js ~/.claude/scripts/todo-bridge.js
```

### Step 2 — Add the hook to `~/.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "TodoWrite",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/scripts/todo-bridge.js"
          }
        ]
      }
    ]
  }
}
```

### Step 3 — Start the dashboard

```bash
cm dashboard
```

**That's it.** Every time Claude Code calls `TodoWrite`, the tasks automatically appear on the Kanban board:

| TodoWrite status | Dashboard column |
|-----------------|-----------------|
| `pending`       | Backlog          |
| `in_progress`   | In Progress      |
| `completed`     | Done             |

The project is auto-detected from the current working directory (basename of `cwd`). If the project doesn't exist on the dashboard, it's created automatically.

---

## Auto-Sync Setup (Claude Desktop)

Claude Desktop has no hooks system, so we use an MCP server instead. The AI calls `cm_sync_todos` after each `TodoWrite`.

### Step 1 — Install the MCP bridge

```bash
mkdir -p ~/.claude/scripts
cp <path-to-cody-master>/scripts/mcp-bridge.js ~/.claude/scripts/mcp-bridge.js
```

### Step 2 — Add to Claude Desktop config

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cm-dashboard": {
      "command": "node",
      "args": ["/Users/<your-username>/.claude/scripts/mcp-bridge.js"]
    }
  }
}
```

### Step 3 — Restart Claude Desktop

After restart, you have 3 new tools available:

| Tool | Purpose |
|------|---------|
| `cm_sync_todos` | Sync current todo list to the dashboard |
| `cm_get_tasks`  | Read current board state |
| `cm_update_task` | Move a single task to a new status |

### Step 4 — Instruct the AI (system prompt or in-chat)

Add this to your Claude Desktop system prompt or say it once per session:

> After every TodoWrite, call `cm_sync_todos` with the current todo list to keep the cm-dashboard in sync.

---

## Dashboard API Reference

The dashboard runs at `http://localhost:6969`. Key endpoints:

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/tasks/auto-sync` | Upsert task by conversationId |
| `GET`  | `/api/tasks`           | List all tasks |
| `GET`  | `/api/projects`        | List all projects |

The `auto-sync` payload:
```json
{
  "conversationId": "<session>:<todoId>",
  "title": "Task title",
  "status": "backlog | in-progress | done",
  "agent": "claude-code",
  "priority": "high | medium | low",
  "projectName": "MyProject"
}
```
