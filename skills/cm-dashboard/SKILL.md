---
name: cm-dashboard
description: Open visual Dashboard UI to track work status, with auto-sync from Claude Code, Claude Desktop, Cursor, Codex CLI, Aider, OpenCode, Windsurf, and any shell tool.
---

# Command: `/cm-dashboard`

When this command is called, the AI Assistant should:

1. **Launch Dashboard:** Run `cm dashboard` in the terminal.
2. **Query board state:** Call `GET http://localhost:6969/api/tasks` and render a quick summary.
3. **Inform the user:** The CodyMaster Mission Control Dashboard is live at `http://localhost:6969`.

Do NOT draw a static markdown table — always query the live API.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    cm-dashboard v3.4+                           │
│                                                                 │
│  ┌──────────────┐  PostToolUse hook                            │
│  │ Claude Code  │ ──────────────────► todo-bridge.js           │
│  └──────────────┘                         │                    │
│                                           │                    │
│  ┌──────────────┐  MCP stdio              │  POST              │
│  │Claude Desktop│ ──────────────────► mcp-bridge.js ──────┐   │
│  └──────────────┘                         │                │   │
│                                           │                ▼   │
│  ┌──────────────┐  MCP (same server)      │         ┌─────────┐│
│  │   Cursor /   │ ─────────────────────── ┘         │Dashboard││
│  │  Windsurf /  │                                   │  :6969  ││
│  │  Continue /  │                          ┌────────┤  API    ││
│  │  OpenCode    │                          │        └─────────┘│
│  └──────────────┘                          │                   │
│                                            │                   │
│  ┌──────────────┐  shell / cm-dash CLI     │                   │
│  │  Codex CLI / │ ────────────────────► cm-dash.js            │
│  │  Aider /     │                          │                   │
│  │  git hooks / │                          │                   │
│  │  any shell   │                          │                   │
│  └──────────────┘                          │                   │
│                                            │                   │
│  ┌──────────────┐  file watch (.ai-tasks)  │                   │
│  │ dashboard-   │ ─────────────────────────┘                   │
│  │ watcher.js   │  (passive — no per-tool config needed)        │
│  └──────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Three integration tiers:**
| Tier | How | Tools |
|------|-----|-------|
| **MCP** | Stdio MCP server | Claude Desktop, Cursor, Windsurf, Continue, OpenCode, Zed |
| **Hook** | PostToolUse hook | Claude Code |
| **Shell/File** | `cm-dash` CLI or file watcher | Codex CLI, Aider, any shell |

---

## Tier 1 — Claude Code (PostToolUse Hook)

Every `TodoWrite` call syncs automatically. Zero effort after setup.

### Step 1 — Install bridge

```bash
mkdir -p ~/.claude/scripts
cp <cody-master>/scripts/todo-bridge.js ~/.claude/scripts/todo-bridge.js
```

### Step 2 — Add hook to `~/.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "TodoWrite",
        "hooks": [{ "type": "command", "command": "node ~/.claude/scripts/todo-bridge.js" }]
      }
    ]
  }
}
```

### Step 3 — Start dashboard

```bash
cm dashboard
```

| TodoWrite status | Dashboard column |
|-----------------|-----------------|
| `pending`       | 🔴 Backlog       |
| `in_progress`   | 🟡 In Progress   |
| `completed`     | 🟢 Done          |

---

## Tier 2 — MCP Server (Claude Desktop · Cursor · Windsurf · Continue · OpenCode · Zed)

One MCP server, works with **any MCP-compatible client**. Same `mcp-bridge.js` for all.

### Step 1 — Install MCP bridge (once)

```bash
mkdir -p ~/.claude/scripts
cp <cody-master>/scripts/mcp-bridge.js ~/.claude/scripts/mcp-bridge.js
```

### Step 2A — Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cm-dashboard": {
      "command": "node",
      "args": ["/Users/<you>/.claude/scripts/mcp-bridge.js"]
    }
  }
}
```

Restart Claude Desktop. You'll have 3 new tools:

| Tool | Purpose |
|------|---------|
| `cm_sync_todos` | Sync todo list to dashboard |
| `cm_get_tasks`  | Read current board state |
| `cm_update_task`| Move a task between columns |

Add to your system prompt:
> After every TodoWrite, call `cm_sync_todos` with the current todo list.

---

### Step 2B — Cursor

Edit `~/.cursor/mcp.json` (or **Cursor → Settings → MCP**):

```json
{
  "mcpServers": {
    "cm-dashboard": {
      "command": "node",
      "args": ["/Users/<you>/.claude/scripts/mcp-bridge.js"]
    }
  }
}
```

Restart Cursor. The same 3 tools appear in Cursor's AI context.

Add to `.cursorrules` or your global rules:
```
When you update your todo list, call cm_sync_todos to keep the cm-dashboard in sync.
```

---

### Step 2C — Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "cm-dashboard": {
      "command": "node",
      "args": ["/Users/<you>/.claude/scripts/mcp-bridge.js"]
    }
  }
}
```

---

### Step 2D — Continue.dev

Edit `~/.continue/config.json`:

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "node",
          "args": ["/Users/<you>/.claude/scripts/mcp-bridge.js"]
        }
      }
    ]
  }
}
```

---

### Step 2E — OpenCode

Edit `~/.config/opencode/config.json` (or `opencode.json` in project root):

```json
{
  "mcp": {
    "cm-dashboard": {
      "command": "node",
      "args": ["/Users/<you>/.claude/scripts/mcp-bridge.js"]
    }
  }
}
```

---

### Step 2F — Zed

Edit `~/.config/zed/settings.json`:

```json
{
  "context_servers": {
    "cm-dashboard": {
      "command": {
        "path": "node",
        "args": ["/Users/<you>/.claude/scripts/mcp-bridge.js"]
      }
    }
  }
}
```

---

## Tier 3A — Codex CLI (Shell Wrapper)

Codex CLI has no native hook system. Use a shell wrapper function.

### Install `cm-dash`

```bash
chmod +x <cody-master>/scripts/cm-dash.js
ln -sf "$(pwd)/scripts/cm-dash.js" /usr/local/bin/cm-dash
```

### Add to `~/.zshrc` or `~/.bashrc`

```bash
# cm-dashboard integration for Codex CLI
codex() {
  local session="codex-$(date +%s)"
  export CM_AGENT="codex"

  # Sync "starting" task if a prompt was given
  if [[ -n "$*" ]]; then
    cm-dash sync --session "$session" \
                 --title "$*" \
                 --status in-progress \
                 --agent codex 2>/dev/null &
  fi

  # Run the real codex binary
  command codex "$@"
  local exit_code=$?

  # Sync completed/failed
  if [[ -n "$*" ]]; then
    local status="completed"
    [[ $exit_code -ne 0 ]] && status="cancelled"
    cm-dash sync --session "$session" \
                 --title "$*" \
                 --status "$status" \
                 --agent codex 2>/dev/null &
  fi

  return $exit_code
}
```

### Alternative — Codex writes `.ai-tasks.json`

Add to your Codex system prompt / AGENTS.md:
```
After each task update, write the current task list to .ai-tasks.json in this format:
{
  "agent": "codex",
  "tasks": [
    { "id": "1", "title": "task description", "status": "in_progress" }
  ]
}
The dashboard-watcher will pick this up automatically.
```

---

## Tier 3B — Aider

### Option A — Shell hook in `.aider.conf.yml`

Aider supports `--exec` for running commands. Add to `~/.aider.conf.yml`:

```yaml
# Run after each commit
auto-commits: true
commit-prompt: "feat: {message}"
```

Then add to `~/.zshrc`:
```bash
aider() {
  local session="aider-$(basename $(pwd))"
  CM_AGENT="aider" command aider "$@"
  # Sync .ai-tasks.json if it exists
  [[ -f .ai-tasks.json ]] && cm-dash file .ai-tasks.json 2>/dev/null &
}
```

### Option B — Aider writes `.ai-tasks.json` (recommended)

Add to `.aider.conf.yml` or your system prompt:
```
When starting work on a task, append to .ai-tasks.json:
{
  "agent": "aider",
  "tasks": [{ "title": "<task>", "status": "in_progress" }]
}
When done, update status to "completed".
```

The `dashboard-watcher.js` picks this up automatically without any extra config.

### Option C — Manual sync

```bash
# Before starting
cm-dash sync --title "Refactor auth module" --status in-progress --agent aider

# After done
cm-dash sync --title "Refactor auth module" --status done --agent aider
```

---

## Tier 3C — Passive File Watcher (any tool)

**Zero per-tool config.** Just run the watcher — it detects any supported file format.

### Start the watcher

```bash
# Watch current project
node <cody-master>/scripts/dashboard-watcher.js

# Watch multiple projects
node <cody-master>/scripts/dashboard-watcher.js --dirs ~/projects/app1,~/projects/app2

# Custom poll interval (ms)
node <cody-master>/scripts/dashboard-watcher.js --poll 2000
```

### Supported file formats

| File | Format |
|------|--------|
| `.ai-tasks.json` | Universal JSON (any tool can write this) |
| `TODO.md` | Markdown checkboxes `- [ ] task` / `- [x] done` |
| `AGENTS.md` | Task sections with checkboxes |

### `.ai-tasks.json` — Universal format

Any tool, script, or AI can write to this file:

```json
{
  "session": "optional-session-id",
  "project": "my-project",
  "agent":   "aider",
  "tasks": [
    { "id": "1", "title": "Fix auth bug",  "status": "in_progress", "priority": "high" },
    { "id": "2", "title": "Write tests",   "status": "pending",     "priority": "medium" },
    { "id": "3", "title": "Deploy to prod","status": "completed",   "priority": "low" }
  ]
}
```

Fields for `tasks[]`:

| Field | Required | Values |
|-------|----------|--------|
| `title` | ✅ | Any string |
| `status` | ✅ | `pending` / `in_progress` / `completed` / `done` / `wip` / `backlog` / `review` |
| `id` | — | Any unique string |
| `priority` | — | `low` / `medium` / `high` / `urgent` |

### Auto-start watcher on macOS (launchd)

Create `~/Library/LaunchAgents/com.codymaster.watcher.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.codymaster.dashboard-watcher</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/path/to/cody-master/scripts/dashboard-watcher.js</string>
    <string>--dirs</string>
    <string>/Users/<you>/projects</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/cm-watcher.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/cm-watcher.err</string>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/com.codymaster.watcher.plist
```

---

## `cm-dash` CLI Reference

Install:
```bash
chmod +x scripts/cm-dash.js
ln -sf "$(pwd)/scripts/cm-dash.js" /usr/local/bin/cm-dash
```

| Command | Description |
|---------|-------------|
| `cm-dash sync --title "X" --status S` | Sync one task |
| `cm-dash file .ai-tasks.json` | Sync all tasks from file |
| `cm-dash pipe` | Read .ai-tasks.json from stdin |
| `cm-dash board [--project P]` | Print ASCII kanban |
| `cm-dash get [--project P]` | Print tasks as JSON |
| `cm-dash move <id> <status>` | Transition a task |
| `cm-dash start` | Start the dashboard |
| `cm-dash status` | Check if running (exit 0/1) |

**Status values accepted everywhere:**

| Input | Column |
|-------|--------|
| `pending` / `todo` / `backlog` / `open` | 🔴 Backlog |
| `in_progress` / `in-progress` / `active` / `wip` | 🟡 In Progress |
| `review` / `testing` | 🔵 Review |
| `completed` / `done` / `closed` / `cancelled` | 🟢 Done |

---

## Git Hook Integration

Auto-sync tasks on every `git commit`:

```bash
# .git/hooks/post-commit  (chmod +x)
#!/bin/sh
# Sync .ai-tasks.json if present
if [ -f .ai-tasks.json ]; then
  cm-dash file .ai-tasks.json 2>/dev/null &
fi
```

Install globally (all repos):
```bash
git config --global core.hooksPath ~/.git-hooks
mkdir -p ~/.git-hooks
cat > ~/.git-hooks/post-commit << 'EOF'
#!/bin/sh
[ -f .ai-tasks.json ] && cm-dash file .ai-tasks.json 2>/dev/null &
EOF
chmod +x ~/.git-hooks/post-commit
```

---

## Dashboard API Reference

The dashboard runs at `http://localhost:6969`.

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/tasks/auto-sync` | Upsert task by `conversationId` |
| `GET`  | `/api/tasks`           | List all tasks |
| `PATCH`| `/api/tasks/:id`       | Update task fields |
| `DELETE`| `/api/tasks/:id`      | Delete a task |
| `GET`  | `/api/projects`        | List all projects |

Auto-sync payload:
```json
{
  "conversationId": "<session>:<todoId>",
  "title":       "Task title",
  "status":      "backlog | in-progress | review | done",
  "agent":       "aider | codex | cursor | claude-code | …",
  "priority":    "low | medium | high | urgent",
  "projectName": "MyProject"
}
```

---

## Quick Comparison

| Tool | Method | Config needed | Auto-sync |
|------|--------|--------------|-----------|
| Claude Code | PostToolUse hook | settings.json (once) | ✅ Automatic |
| Claude Desktop | MCP server | claude_desktop_config.json (once) | ✅ Via system prompt |
| Cursor | MCP server | mcp.json (once) | ✅ Via rules |
| Windsurf | MCP server | mcp_config.json (once) | ✅ Via rules |
| Continue.dev | MCP server | config.json (once) | ✅ Via rules |
| OpenCode | MCP server | config.json (once) | ✅ Via rules |
| Zed | MCP server | settings.json (once) | ✅ Via rules |
| Codex CLI | Shell wrapper | ~/.zshrc (once) | ✅ Per session |
| Aider | Shell / file | optional | ✅ Via .ai-tasks.json |
| Any shell | `cm-dash` CLI | none | ✅ On demand |
| Any tool | File watcher | none | ✅ Passive |
