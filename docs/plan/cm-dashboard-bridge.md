# Plan: cm-dashboard Task Bridge (Hybrid A+B)

## Context

The dashboard (`cm-dashboard`) is a Kanban board running on `localhost:6969` backed by `~/.codymaster/kanban.json`. It already has a `POST /api/tasks/auto-sync` endpoint that upserts tasks by `conversationId`. The gap: Claude Code's `TodoWrite` events never reach the dashboard. Claude Desktop has no hooks at all.

**Decision D005:** Hybrid A+B — PostToolUse hook for Claude Code + MCP server for Claude Desktop.
**Brainstorm reference:** `docs/brainstorm/cm-dashboard-task-bridge.md`

---

## Phase 1 — Claude Code Hooks Bridge

### Step 1.1 — Create `scripts/todo-bridge.js`

**What:** A Node.js script that Claude Code calls as a `PostToolUse` hook on every `TodoWrite`.

**Hook payload received on stdin:**
```json
{
  "session_id": "abc123",
  "cwd": "/Users/todyle/Builder/MyProject",
  "hook_event_name": "PostToolUse",
  "tool_name": "TodoWrite",
  "tool_input": {
    "todos": [
      { "id": "1", "content": "Build auth module", "status": "in_progress", "priority": "high" },
      { "id": "2", "content": "Write tests", "status": "pending", "priority": "medium" }
    ]
  }
}
```

**Status mapping (TodoWrite → dashboard column):**
```
pending     → backlog
in_progress → in-progress
completed   → done
```

**Logic:**
1. Read stdin → parse JSON
2. Exit silently if `tool_name !== 'TodoWrite'` or `tool_input.todos` is empty
3. For each todo:
   - `conversationId` = `session_id + ':' + todo.id`
   - `title` = `todo.content`
   - `status` = mapped column string
   - `agent` = `'claude-code'`
   - `projectName` = basename of `cwd`
4. POST to `http://localhost:6969/api/tasks/auto-sync` (fire-and-forget, silent on error)

**Install location:** `~/.claude/scripts/todo-bridge.js`
The SKILL.md will instruct users to copy it there during setup.

**File to create:** `scripts/todo-bridge.js`

---

### Step 1.2 — Document hook config in SKILL.md

**The settings.json block to add** (in `~/.claude/settings.json`):
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

---

## Phase 2 — MCP Server for Claude Desktop

### Step 2.1 — Create `src/mcp-bridge.ts`

**What:** A standalone MCP server that wraps the dashboard REST API and exposes 3 tools.

**Tools exposed:**

#### `cm_sync_todos`
Syncs the current TodoWrite list to the dashboard.
- Input: `{ todos: Array<{ id, content, status, priority }>, projectName?: string, sessionId?: string }`
- For each todo: POST `/api/tasks/auto-sync`
- Returns: `{ synced: number, projectName: string }`

#### `cm_get_tasks`
Returns the current Kanban board state.
- Input: `{ projectName?: string }`
- GET `/api/projects` → find matching project → GET `/api/tasks?projectId=...`
- Returns: tasks grouped by column

#### `cm_update_task`
Moves a single task to a new column.
- Input: `{ conversationId: string, status: 'pending' | 'in_progress' | 'completed' }`
- POST `/api/tasks/auto-sync` with the new status
- Returns: updated task

**Transport:** stdio (standard MCP stdio transport)

**Run command:** `node /path/to/dist/mcp-bridge.js`

**File to create:** `src/mcp-bridge.ts`

---

### Step 2.2 — Add build script to `package.json`

Add to `scripts`:
```json
"build:mcp": "tsc src/mcp-bridge.ts --outDir dist --module commonjs --target es2020 --esModuleInterop"
```

Or simpler — include `mcp-bridge.ts` in the existing tsc build so `dist/mcp-bridge.js` is generated automatically.

---

### Step 2.3 — Claude Desktop config snippet

Users add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "cm-dashboard": {
      "command": "node",
      "args": ["/Users/<user>/.claude/scripts/mcp-bridge.js"]
    }
  }
}
```

The SKILL.md will document this.

---

### Step 2.4 — Update `skills/cm-dashboard/SKILL.md`

Add two new sections:

**Section A — Claude Code auto-sync setup:**
```markdown
## Auto-Sync Setup (Claude Code)

1. Copy the bridge script:
   cp <cody-master>/scripts/todo-bridge.js ~/.claude/scripts/todo-bridge.js

2. Add to ~/.claude/settings.json:
   { "hooks": { "PostToolUse": [{ "matcher": "TodoWrite", "hooks": [{ "type": "command", "command": "node ~/.claude/scripts/todo-bridge.js" }] }] } }

3. Start the dashboard: cm dashboard

Every TodoWrite in Claude Code now syncs to the board automatically.
```

**Section B — Claude Desktop MCP setup:**
```markdown
## Claude Desktop MCP Setup

1. Copy: cp <cody-master>/dist/mcp-bridge.js ~/.claude/scripts/mcp-bridge.js

2. Add to claude_desktop_config.json:
   { "mcpServers": { "cm-dashboard": { "command": "node", "args": ["~/.claude/scripts/mcp-bridge.js"] } } }

3. Restart Claude Desktop. You now have:
   - cm_sync_todos — syncs your todo list to the board
   - cm_get_tasks  — reads current board state
   - cm_update_task — moves a task between columns
```

---

## Verification

### Phase 1 test:
```bash
# Simulate a TodoWrite hook call
echo '{"session_id":"test-123","cwd":"/Users/todyle/Builder/MyProject","tool_name":"TodoWrite","tool_input":{"todos":[{"id":"1","content":"Test task","status":"in_progress","priority":"high"}]}}' | node scripts/todo-bridge.js

# Check dashboard received it
curl http://localhost:6969/api/tasks | jq '.[] | select(.title == "Test task")'
```

### Phase 2 test:
- Launch MCP server: `node dist/mcp-bridge.js`
- Use MCP Inspector or Claude Desktop to call `cm_sync_todos`
- Verify tasks appear on dashboard

---

## File Checklist

| File | Action | Phase |
|------|--------|-------|
| `scripts/todo-bridge.js` | Create | 1 |
| `src/mcp-bridge.ts` | Create | 2 |
| `dist/mcp-bridge.js` | Build output | 2 |
| `skills/cm-dashboard/SKILL.md` | Update | 1+2 |
| `package.json` | Add mcp to tsconfig include | 2 |

---

## Constraints

- No breaking changes to existing dashboard API or UI
- Bridge script silent on errors (dashboard may not be running)
- Both scripts are self-contained — no new runtime dependencies
- `conversationId` format: `<session_id>:<todo_id>` ensures stable upsert identity
- Project auto-detection: use `basename(cwd)` as `projectName` (dashboard auto-creates if missing)
