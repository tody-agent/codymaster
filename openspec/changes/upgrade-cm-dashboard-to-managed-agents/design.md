# Design: Managed-Agents Control Plane for cm-dashboard

## Context

The current `cm-dashboard` (src/dashboard.ts, 868 lines) is a task tracker,
not a control plane. It uses JSON file storage (`~/.codymaster/kanban.json`)
with no locking, no WebSocket, no agent process lifecycle. Dispatch writes a
markdown file and returns a CLI command — nothing closes the loop.

Multica (multica-ai/multica) has solved this with a clean Backend interface,
daemon with bounded poll + WebSocket, per-task workdirs, and session pinning.
This change ports those patterns to TypeScript.

## Technical Approach: Progressive (Option C)

Ship in 4 waves, each independently shippable behind `CM_EXECUTOR_V2` flag:

### Wave 1 — Hardening Quick-wins (Day 1, no flag)
3 targeted fixes + new skill definition. Zero risk.

- **API-only 404**: Replace `app.get('/{*path}', sendFile)` with middleware
  that returns JSON 404 for `/api/*` and index.html for non-API paths.
- **Fix cancelled mapping**: `STATUS_TO_COLUMN['cancelled'] = 'cancelled'`
  (currently maps to `'done'` — confirmed at dashboard.ts:174)
- **Mutex on JSON**: Wrap `loadData/saveData` in `async-mutex` until SQLite
  lands. Eliminates data-loss race on concurrent writes.
- **New cm-dashboard skill**: Delete tombstone SKILL.md, write comprehensive
  skill covering control plane capabilities.

### Wave 2 — Realtime + Storage (Week 1, CM_EXECUTOR_V2=1)

#### EventBus (src/realtime/event-bus.ts)
Typed EventEmitter with topics: `task.*`, `activity.*`, `agent.*`.
Bridges REST mutations → WebSocket broadcasts.

#### WebSocket Hub (src/realtime/ws-hub.ts)
`ws` library mounted on existing Express HTTP server at `/ws`.
Project-scoped subscribe/unsubscribe. Heartbeat every 15s.
Reconnect-friendly: client falls back to 5s polling on disconnect.

#### SQLite Migration (src/storage/)
`better-sqlite3` (already a dep) with WAL mode, foreign keys ON,
busy_timeout 5000. Schema from research/multica.md design.md.
Repos: taskRepo, projectRepo, activityRepo, messageRepo.
Service layer: TaskService, ProjectService — transactional mutations + events.

One-shot migration: `data.json` → SQLite, rename to `data.json.bak`.

#### Frontend WS Consumption (public/dashboard/app.js)
Connect to `/ws` on load. Consume `task.*` events for real-time board updates.
Fall back to 5s polling if WS disconnects. Resume WS on reconnect.

### Wave 3 — Agent Lifecycle (Week 2-3, all 7 providers)

#### AgentBackend Interface (src/agent/backend.ts)
Single contract: `AgentBackend.execute(prompt, opts) → AgentSession`.
AgentSession: `AsyncIterable<AgentMessage>` + `Promise<AgentResult>`.
Types: AgentMessage (text|thinking|tool-use|tool-result|status|log|error),
AgentResult (completed|failed|cancelled|timeout|aborted).

#### Spawn Helper (src/agent/spawn-helper.ts)
`child_process.spawn` with NDJSON parsing, 64KB stderr ring buffer,
inactivity watchdog, pgid capture, process-group cancellation.

#### 7 Provider Implementations
One file each: claude.ts, codex.ts, cursor.ts, gemini.ts, copilot.ts,
antigravity.ts, opencode.ts. Factory in factory.ts (switch by name).

#### Per-Task Workdir (src/executor/workdir.ts)
`~/.cm/workspaces/{project_short}/{task_short}/{workdir,output,logs}/`
+ `.gc_meta.json`. GC loop: 24h done/cancelled, 72h orphans.

#### Session Pinning + Resume
On sessionId emission → write to `tasks.pinned_session_id`.
Next dispatch passes `resumeSessionId`. One-shot fallback on failure.

#### Cancellation
`POST /api/tasks/:id/cancel` → pgid kill (Unix: SIGTERM+SIGKILL,
Windows: taskkill /T /F). 5s grace period.

### Wave 4 — Hardening + Docs (Week 3)

- JSON-schema validation (ajv) on POST/PUT bodies
- Structured request logging (pino-http)
- Prometheus /metrics endpoint
- Docs: architecture, runbooks, migration guide
- Remove CM_EXECUTOR_V2 flag in v7.0

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage | SQLite via better-sqlite3 | Already a dep, used in context-db.ts, WAL mode proven |
| WebSocket | ws library | Zero-dep, native, matches Multica pattern |
| Feature flag | CM_EXECUTOR_V2 env var | Allows rollback to JSON path |
| Provider count | All 7 from start | User requirement; one file per provider |
| Frontend | Continue vanilla JS | No build step; WebSocket is native browser API |
| Process groups | detached:true + pgid | Required for cancellation |

## Verification

- Wave 1: Vitest for race-free concurrent creation, API 404 returns JSON
- Wave 2: WS connects within 1s, 100 concurrent writes → 100 rows
- Wave 3: Cancel kills process within 5s, resume after crash works
- Wave 4: Full acceptance suite (6.1–6.7 from spec.md)
