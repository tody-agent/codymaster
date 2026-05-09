# OpenSpec Change: `upgrade-cm-dashboard-to-managed-agents`

Dưới đây là bộ artifact OpenSpec hoàn chỉnh, sẵn sàng đặt vào `openspec/changes/upgrade-cm-dashboard-to-managed-agents/`.

## File 1: `proposal.md`

```markdown
# Proposal: Upgrade cm-dashboard to a Managed-Agents Control Plane

## Intent

The current `cm-dashboard` (src/dashboard.ts) is unusable as an agent
orchestration surface: it is a single Express server backed by a JSON
file, with no WebSocket layer, no real process supervision for agent
CLIs, no per-task workdir, no resumable sessions, and an unsafe HTML
fallback route that masks 404s on every `/api/*` typo. Tasks are
"dispatched" only by writing a markdown prompt to disk — nothing closes
the loop, so the board never reflects real agent progress.

Multica (multica-ai/multica) has already solved this exact class of
problems with a clean keystone abstraction (the `Backend` interface),
a daemon with bounded poll + WebSocket wakeup, per-task workdirs with
native config injection (`CLAUDE.md` / `AGENTS.md` / `GEMINI.md`),
mid-flight session pinning, and a polymorphic actor schema that lets
agents be first-class teammates.

This change ports those patterns into CodyMaster (TypeScript, no Go
dependency added) so that cm-dashboard becomes a real control plane:
agents are spawned, streamed, cancelled, resumed, and observed end to
end. The 60+ existing CodyMaster skills and the Smart Spine memory
stack remain untouched and are layered on top of the new lifecycle.

## Scope

In scope:
- A unified `AgentBackend` interface and per-CLI implementations
  (Claude Code, Codex, Cursor, Gemini, Copilot, Antigravity, OpenCode).
- Real process supervision: spawn, NDJSON stream, stderr ring buffer,
  inactivity timeout, process-group cancellation.
- WebSocket realtime channel for the dashboard UI and an event bus.
- SQLite (better-sqlite3, WAL) replacing the flat JSON file with a
  one-shot migration; JSON kept as backup for one release.
- Per-task workdir under `~/.cm/workspaces/...` with `.gc_meta.json`
  and a GC loop.
- Resumable sessions via `pinned_session_id`, with one-shot fallback
  on resume failure.
- Status taxonomy unification (`completed | failed | cancelled |
  timeout | aborted`), separating cancelled from done.
- Concurrency limit per agent and per dashboard.
- Hardening: API-only 404, structured failure_reason enum, schema
  validation on write, transactional mutations.

Out of scope:
- Multi-tenant cloud deployment of cm-dashboard (stays local-first).
- Replacing the Smart Spine / FTS5 memory subsystem.
- Rewriting CodyMaster skills or the MCP server.
- Adding new CLI providers beyond the seven listed above (one file
  per future provider; pattern documented).

## Approach

Adopt Multica's keystone abstraction in idiomatic TypeScript:
one `AgentBackend` interface, one file per CLI, one factory. Wrap
`child_process.spawn` with NDJSON parsing and a 64KB stderr ring
buffer. Add an `EventBus` (EventEmitter + topics) and a `ws` server
that mirrors Multica's `/ws` channel for the UI; defer the
`/agent/ws` daemon-wakeup channel until cm-dashboard splits into
server + daemon (Phase E, future change).

Storage moves to SQLite with a transactional service layer
(`handler → service → repo`). All task mutations route through
`TaskService`, which emits domain events that listeners persist as
activity rows and broadcast over WebSocket.

Migration is staged in five sub-phases (A–E) shipped behind a feature
flag `CM_EXECUTOR_V2=1`. Phase A delivers the interface + spawn,
Phase B the WS, Phase C the SQLite migration, Phase D the lifecycle
(workdir, resume, cancel, GC), Phase E hardening + docs. Each phase
keeps the existing JSON+REST path working so users can roll back.
```

## File 2: `design.md`

```markdown
# Design: Managed-Agents Control Plane for cm-dashboard

## Architectural Decisions

### AD-1: Wrap, don't build, the agent loop

The single decision that makes this tractable: cm-dashboard is a
control plane, not an agent runtime. We never call an LLM directly.
Every agent is an external CLI invoked via `child_process.spawn`.
This mirrors Multica's keystone choice and keeps CodyMaster
vendor-neutral (Claude, Codex, Cursor, Gemini, Copilot, Antigravity,
OpenCode all work with one interface).

### AD-2: One interface, one file per provider

`src/agent/backend.ts` defines the only contract. `src/agent/<name>.ts`
implements it. A factory in `src/agent/factory.ts` is a switch.
Adding a CLI = one file, no schema migration, no UI change.

### AD-3: SQLite (WAL) over JSON file

The current `loadData/saveData` pattern races on every concurrent
write. SQLite via `better-sqlite3` is synchronous (no async surprises),
ships as a single binary with prebuilt N-API artifacts on all major
platforms, supports WAL for concurrent readers, and matches
CodyMaster's existing FTS5-based Smart Spine. A migration script
imports the legacy JSON once on first boot of v2.

### AD-4: Polymorphic actor pattern

Borrowed from Multica: every actor field (assignee, comment author,
inbox recipient) carries `(actor_type, actor_id)` where actor_type ∈
{`member`, `agent`}. This allows agents to participate in every
endpoint without a parallel API surface.

### AD-5: Per-task isolated workdir

`~/.cm/workspaces/{project_short}/{task_short}/{workdir,output,logs}/`
plus `.gc_meta.json` containing `{taskId, projectId, completedAt}`.
GC loop reaps `done|cancelled` workdirs older than `CM_GC_TTL`
(default 24h) and orphans (no `.gc_meta.json`) older than
`CM_GC_ORPHAN_TTL` (default 72h).

### AD-6: Mid-flight session pinning

The instant a backend emits a `sessionId` in any stream message, the
service writes it to `tasks.pinned_session_id` (single SQL statement,
no await on event loop). This is crash-safe: if the dashboard process
dies mid-task, the next dispatch can resume.

### AD-7: Status taxonomy

Result statuses are an enum, not a free string. The mapping is:

| Result    | Column   | Meaning                                       |
|-----------|----------|-----------------------------------------------|
| completed | done     | Agent exited 0 with usable output             |
| failed    | failed   | Agent exited non-zero or emitted error        |
| timeout   | failed   | Inactivity or hard timeout                    |
| cancelled | cancelled| User-initiated cancel before completion       |
| aborted   | failed   | System abort (parent died, signal)            |

Critically, `cancelled` is NOT mapped to `done` (current bug in
`auto-sync` STATUS_TO_COLUMN map).

### AD-8: API-only 404

Replace `app.get('/{*path}', sendFile)` with middleware that returns
JSON 404 for `/api/*` and only falls back to `index.html` for
non-API paths. Eliminates the silent "API returns HTML" failure.

## Component Diagram

```

┌─────────────────────────────────────────────┐

│ Browser (public/dashboard/app.js)           │

└──────┬─────────────────────────────────┬────┘

│ HTTP (REST)                     │ WebSocket /ws

▼                                 ▼

┌─────────────────────────────────────────────┐

│ Express + ws (src/dashboard.ts)             │

│  ┌──────────────┐  ┌───────────────┐        │

│  │ HTTP handler │→ │ TaskService   │        │

│  └──────────────┘  └─────┬─────────┘        │

│                          │ emit             │

│                    ┌─────▼─────┐            │

│                    │ EventBus  │── listen──→│

│                    └─────┬─────┘   activity │

│                          │           +WS    │

│                    ┌─────▼─────────┐        │

│                    │ Executor      │        │

│                    │ (semaphore)   │        │

│                    └─────┬─────────┘        │

└──────────────────────────┼──────────────────┘

│ AgentBackend.execute

┌────────────┴───────────────┐

▼                            ▼

┌─────────────┐               ┌──────────────┐

│ SQLite      │               │ child_process│

│ (WAL, sqlc) │               │ claude/codex │

└─────────────┘               │ cursor/…   │

└──────────────┘

```

## The AgentBackend Interface (TypeScript)

```ts
// src/agent/backend.ts
export interface ExecOptions {
  cwd: string;
  model?: string;
  systemPrompt?: string;
  maxTurns?: number;
  timeoutMs?: number;
  semanticInactivityMs?: number;   // kill if no message for N ms
  resumeSessionId?: string;
  customArgs?: string[];
  customEnv?: Record<string, string>;
  mcpConfig?: unknown;             // serialized to a temp file
}

export interface AgentSession {
  messages: AsyncIterable<AgentMessage>;
  result: Promise<AgentResult>;
  cancel(reason?: string): Promise<void>;
}

export type AgentMessage =
  | { type: 'text';        content: string;   sessionId?: string }
  | { type: 'thinking';    content: string }
  | { type: 'tool-use';    tool: string; callId: string; input: unknown; attempt: number; parentCallId?: string }
  | { type: 'tool-result'; callId: string; output: string; isError?: boolean }
  | { type: 'status';      status: string }
  | { type: 'log';         level: 'debug'|'info'|'warn'|'error'; content: string }
  | { type: 'error';       content: string };

export type AgentResultStatus =
  'completed' | 'failed' | 'cancelled' | 'timeout' | 'aborted';

export interface AgentResult {
  status: AgentResultStatus;
  output: string;
  error?: string;
  failureReason?: FailureReason;
  durationMs: number;
  sessionId?: string;
  usage?: Record<string, TokenUsage>;
}

export type FailureReason =
  | 'agent_crash' | 'timeout' | 'cancelled_by_user'
  | 'prompt_too_large' | 'tool_loop' | 'policy_violation'
  | 'auth' | 'unknown';

export interface AgentBackend {
  name: string;
  detectVersion(): Promise<string>;
  execute(prompt: string, opts: ExecOptions): Promise<AgentSession>;
}
```

## Core Schema (SQLite)

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT,
  agents TEXT,                       -- JSON array
  created_at TEXT NOT NULL
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  -- Polymorphic actor (AD-4)
  assignee_type TEXT CHECK(assignee_type IN ('member','agent')),
  assignee_id   TEXT,
  -- Lifecycle states
  status TEXT NOT NULL CHECK(status IN
    ('backlog','queued','claimed','running','review','done',
     'failed','cancelled','timeout')),
  priority TEXT CHECK(priority IN ('low','medium','high','urgent')),
  ord INTEGER NOT NULL DEFAULT 0,
  -- Resume + workdir
  pinned_session_id TEXT,
  prior_session_id TEXT,
  prior_workdir TEXT,
  current_workdir TEXT,
  -- Failure
  failure_reason TEXT,
  error_message TEXT,
  -- Auto-sync
  conversation_id TEXT UNIQUE,
  -- Timing
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT
);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_conversation   ON tasks(conversation_id);

CREATE TABLE task_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,             -- JSON
  created_at TEXT NOT NULL
);
CREATE INDEX idx_task_messages_task ON task_messages(task_id, id);

CREATE TABLE running_processes (
  task_id TEXT PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
  pid INTEGER NOT NULL,
  pgid INTEGER,
  started_at TEXT NOT NULL,
  host TEXT NOT NULL
);

CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  project_id TEXT,
  task_id TEXT,
  actor_type TEXT,
  actor_id TEXT,
  meta TEXT,                         -- JSON
  created_at TEXT NOT NULL
);
```

## Lifecycle State Machine

```
backlog ─► queued ─► claimed ─► running ─┬─► done
   ▲          │          │               ├─► failed
   │          │          │               ├─► cancelled
   │          │          │               └─► timeout
   │          │          ▼
   │          │       (resume next dispatch reuses workdir)
   └──────────┴── any state can return to backlog manually
```

Allowed transitions are enforced server-side

(`VALID_TRANSITIONS` table) and the API rejects anything else with

`errorCode: 'INVALID_TRANSITION'`.

## Resume Algorithm

```
on dispatch(task):
  opts.resumeSessionId = task.pinned_session_id ?? ''
  opts.cwd = task.prior_workdir
              ? reuse(task.prior_workdir)
              : prepare(newWorkdir)

  session = backend.execute(prompt, opts)

  for await msg of session.messages:
    if msg.sessionId and !task.pinned_session_id:
      sql.update(task.id, pinned_session_id = msg.sessionId)
    persist(msg) ; broadcastWS(msg)

  result = await session.result
  if result.status == 'failed' and opts.resumeSessionId
       and !result.sessionId:
    # one-shot resume fallback (Multica §9.3)
    return dispatch_with_fresh_session(task)
```

## WebSocket Protocol

Channel: `/ws` (JWT or local-token auth).

Server → client events:

* `task.created`, `task.updated`, `task.transitioned`, `task.deleted`
* `task.message` (one per AgentMessage)
* `task.completed`, `task.failed`, `task.cancelled`
* `activity.added`
* `agent.heartbeat` (every 15s, list of running task ids)

Client → server: subscribe/unsubscribe by `projectId`.

The frontend prefers WS; on disconnect it falls back to 5s polling

of `/api/tasks` until WS reconnects.

## Cancellation

`POST /api/tasks/:id/cancel` looks up `running_processes.pgid` and

issues, on Unix, `process.kill(-pgid, 'SIGTERM')` then SIGKILL after

5s grace; on Windows, `taskkill /PID <pid> /T /F`. Each backend’s

spawn options set `detached: true` to obtain a process group.

## Concurrency

A semaphore (`p-limit(maxConcurrent)`) per `assignee_id` (per agent)

plus a global cap. Defaults: per-agent 3, global 20. Configurable

via `~/.cm/config.json`.

## Hardening Quick-wins (ship first)

These three land on day 1, ahead of Phase A:

1. Replace the catch-all GET fallback with API-aware 404 middleware.
2. Split STATUS_TO_COLUMN so `cancelled` ≠ `done`.
3. Wrap every `loadData/saveData` pair in a single async mutex

   (`async-mutex`) until SQLite lands. Stops the data-loss race

   without a schema change.

## Risks

* **Native module fragility (better-sqlite3)** — mitigated by

  shipping prebuilt binaries via `prebuild-install`. CI matrix

  covers macOS arm64/x64, Linux x64/arm64, Windows x64.
* **Provider drift** — agent CLI JSON formats change. The

  per-backend file isolates blast radius; a contract test per

  backend (recorded NDJSON fixtures) catches regressions in CI.
* **Existing JSON users** — migration runs once on first start of

  v2; original JSON kept at `data.json.bak` for one release.
* **Process-group on Windows** — Node has no native pgid; we use

  `taskkill /T` which kills the tree, equivalent in practice.

```

## File 3: `tasks.md`

```markdown
# Tasks

## 0. Hardening Quick-wins (Day 1, no flag)
- [ ] 0.1 Replace `app.get('/{*path}', sendFile)` with API-aware
        404 middleware in `src/dashboard.ts`
- [ ] 0.2 Fix `auto-sync` STATUS_TO_COLUMN: map `cancelled` to
        `cancelled` column (add column to enum), not `done`
- [ ] 0.3 Add `async-mutex` around `loadData/saveData` until
        SQLite lands; cover all REST handlers
- [ ] 0.4 Add Vitest cases for race-free concurrent task creation

## 1. Phase A — AgentBackend interface + spawn
- [ ] 1.1 Create `src/agent/backend.ts` with `AgentBackend`,
        `AgentSession`, `AgentMessage`, `AgentResult` types
- [ ] 1.2 Implement `src/agent/spawn-helper.ts` with NDJSON reader,
        64KB stderr ring buffer, inactivity watchdog, pgid capture
- [ ] 1.3 Implement `src/agent/claude.ts` (canonical, NDJSON
        `--output-format stream-json`)
- [ ] 1.4 Implement `src/agent/codex.ts`, `cursor.ts`, `gemini.ts`,
        `copilot.ts`, `antigravity.ts`, `opencode.ts`
- [ ] 1.5 Implement `src/agent/factory.ts` (switch by name)
- [ ] 1.6 Implement `src/agent/version.ts` with `detectVersion`
        and `checkMinVersion` per provider
- [ ] 1.7 Contract tests with recorded NDJSON fixtures
        (`tests/agent/fixtures/*.ndjson`) for each backend

## 2. Phase B — Realtime layer
- [ ] 2.1 Add `ws` dependency; mount `/ws` server on the same HTTP
        server as Express
- [ ] 2.2 Implement `src/realtime/event-bus.ts` (typed
        EventEmitter + topics)
- [ ] 2.3 Implement `src/realtime/ws-hub.ts` with project-scoped
        subscribe / unsubscribe, heartbeat, reconnect-friendly
        backpressure (drop oldest on per-client buffer overflow)
- [ ] 2.4 Refactor handlers to call `TaskService` which emits
        `task.*` events; listeners persist activity + broadcast
- [ ] 2.5 Update `public/dashboard/app.js` to consume `/ws` first
        and poll only on disconnect
- [ ] 2.6 Add a `cm dashboard tail` CLI that pretty-prints WS
        events for debugging

## 3. Phase C — SQLite migration
- [ ] 3.1 Add `better-sqlite3` with prebuilt binaries in CI
- [ ] 3.2 Create `src/storage/sqlite.ts` with WAL mode, foreign
        keys ON, busy_timeout 5000
- [ ] 3.3 Write migrations under `src/storage/migrations/`
        (001_init.sql with the schema in design.md)
- [ ] 3.4 Implement repos (`taskRepo`, `projectRepo`,
        `activityRepo`, `messageRepo`) with prepared statements
- [ ] 3.5 Implement `TaskService` / `ProjectService` with
        transactional mutations and event emission
- [ ] 3.6 Migration script: read `data.json` once, write to SQLite,
        rename to `data.json.bak`
- [ ] 3.7 Feature flag `CM_EXECUTOR_V2=1` selects SQLite path;
        default off until Phase D ships
- [ ] 3.8 Update `cm doctor` to print storage backend in use

## 4. Phase D — Lifecycle, workdir, resume, cancel
- [ ] 4.1 Implement `src/executor/workdir.ts`: `prepare(taskId)`,
        `reuse(path)`, writes `.gc_meta.json`
- [ ] 4.2 Implement `src/executor/meta-skill.ts`: writes
        `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` per provider with
        identity, CLI catalog, and workflow blocks
- [ ] 4.3 Implement `src/executor/runner.ts`: claim → spawn →
        stream → pin sessionId → finalize, with semaphore
- [ ] 4.4 Implement `POST /api/tasks/:id/dispatch` (real exec, not
        file-write); update `agent-dispatch.ts` deprecation note
- [ ] 4.5 Implement `POST /api/tasks/:id/cancel` with pgid kill
        (Unix) and `taskkill /T /F` (Windows)
- [ ] 4.6 Implement resume fallback (one-shot retry with empty
        resumeSessionId)
- [ ] 4.7 Implement GC loop (`gcLoop`): TTL 24h done/cancelled,
        72h orphans, runs every 1h
- [ ] 4.8 Implement structured `failure_reason` mapping in each
        backend's result classifier
- [ ] 4.9 Frontend: render streaming messages in task drawer;
        cancel button; resume indicator chip

## 5. Phase E — Hardening + docs
- [ ] 5.1 JSON-schema validation on every POST/PUT body using
        `ajv` and shared schemas in `src/schemas/`
- [ ] 5.2 Helmet-equivalent headers (already partial in dashboard;
        consolidate)
- [ ] 5.3 Request log middleware (`pino-http`) with task_id binding
- [ ] 5.4 Prometheus `/metrics` endpoint: `cm_tasks_running`,
        `cm_dispatch_duration_seconds`, `cm_backend_errors_total`
- [ ] 5.5 Docs: `docs/architecture/control-plane.md`,
        `docs/runbooks/dashboard-debug.md`,
        update `cm-dashboard` SKILL.md
- [ ] 5.6 Migration guide for users on JSON storage
- [ ] 5.7 Remove `CM_EXECUTOR_V2` flag and delete legacy JSON path
        in v7.0 (next breaking release)

## 6. Acceptance
- [ ] 6.1 `cm dashboard` boots, opens browser, board reflects
        SQLite state, WS connects within 1s
- [ ] 6.2 Creating a task assigned to `claude` triggers a real
        spawn; messages stream into the task drawer in real time
- [ ] 6.3 Pressing Cancel kills the underlying process within 5s
        on macOS, Linux, and Windows
- [ ] 6.4 Killing the dashboard mid-task and restarting resumes
        the same `pinned_session_id` on next dispatch
- [ ] 6.5 100 concurrent `POST /api/tasks` requests result in 100
        rows with no lost writes (regression test for race)
- [ ] 6.6 `GET /api/notarealroute` returns JSON 404, not HTML
- [ ] 6.7 A `cancelled` task does not appear under "done" stats
```

## File 4: `specs/dashboard/spec.md` (delta)

```markdown
# Delta for Dashboard

## ADDED Requirements

### Requirement: Unified Agent Backend Interface
The system MUST expose every supported coding-agent CLI through a
single `AgentBackend` TypeScript interface with a streaming
`execute(prompt, opts)` method that returns an `AgentSession`
containing an async-iterable of typed messages and a single
terminal `AgentResult`.

#### Scenario: Adding a new provider is one file
- GIVEN the AgentBackend interface and factory exist
- WHEN a contributor adds `src/agent/<newcli>.ts` implementing the
  interface and registers it in the factory switch
- THEN no other file in the repository is modified
- AND tasks can be assigned to the new provider through the
  existing dispatch endpoint

#### Scenario: Streaming taxonomy is uniform
- GIVEN any supported provider
- WHEN the backend processes a prompt
- THEN every emitted message conforms to the `AgentMessage` union
  (`text | thinking | tool-use | tool-result | status | log | error`)
- AND a final `AgentResult` is delivered with `status` ∈
  `{completed, failed, cancelled, timeout, aborted}`

### Requirement: Real Process Supervision
The dispatch endpoint MUST spawn the chosen agent CLI as a child
process, capture stdout as NDJSON, retain the last 64 KiB of
stderr in a bounded ring buffer, enforce an inactivity timeout,
and obtain a process group identifier suitable for cancellation.

#### Scenario: Native crash surfaces a useful error
- GIVEN an agent CLI that aborts with a SIGABRT
- WHEN the executor finalizes the task
- THEN `AgentResult.error` includes the tail of stderr
- AND `failure_reason` is set to `agent_crash`

#### Scenario: Inactivity timeout
- GIVEN a running task with `semanticInactivityMs = 600000`
- WHEN no AgentMessage is emitted for 10 minutes
- THEN the executor sends SIGTERM, waits 5 s, sends SIGKILL
- AND `AgentResult.status = 'timeout'`,
      `failure_reason = 'timeout'`

### Requirement: WebSocket Realtime Channel
The dashboard server MUST expose a `/ws` WebSocket endpoint that
streams `task.*`, `activity.added`, and `agent.heartbeat` events
to subscribed clients, scoped by `projectId`.

#### Scenario: Stream task progress
- GIVEN a client subscribed to `projectId = P`
- WHEN a task in P transitions or emits an AgentMessage
- THEN the client receives the corresponding event within 250 ms

#### Scenario: Reconnect with poll fallback
- GIVEN a client whose WebSocket has disconnected
- WHEN the disconnect persists for more than 3 s
- THEN the client polls `GET /api/tasks?projectId=P` every 5 s
- AND resumes WebSocket consumption immediately on reconnect

### Requirement: Resumable Sessions
The system MUST persist `pinned_session_id` for a task as soon as
its agent backend emits a `sessionId`, and MUST pass that value as
`resumeSessionId` on the next dispatch of the same task.

#### Scenario: Crash-safe resume
- GIVEN a task that emitted a sessionId before the dashboard
  process was killed
- WHEN the dashboard restarts and the task is dispatched again
- THEN the backend is invoked with `resumeSessionId = <pinned id>`
- AND the existing per-task workdir is reused

#### Scenario: One-shot fallback on resume failure
- GIVEN a dispatch with non-empty `resumeSessionId`
- WHEN the backend reports `status = failed` and emits no
  `sessionId`
- THEN the executor retries exactly once with `resumeSessionId = ''`

### Requirement: Per-Task Isolated Workdir
Each task execution MUST run in
`~/.cm/workspaces/{project_short}/{task_short}/{workdir,output,logs}/`
with a `.gc_meta.json` file recording `taskId`, `projectId`, and
`completedAt`.

#### Scenario: Concurrent tasks do not collide
- GIVEN two tasks of the same project dispatched simultaneously
- WHEN both backends start writing files
- THEN each writes only into its own `workdir/`

#### Scenario: GC reaps completed workdirs
- GIVEN a task whose status is `done` and whose `finished_at`
  is older than `CM_GC_TTL` (default 24h)
- WHEN the GC loop runs
- THEN the workdir directory is removed
- AND an `activity` of type `gc.workdir_removed` is recorded

### Requirement: Cancellation
The system MUST expose `POST /api/tasks/:id/cancel` that terminates
the process group of the running agent within 5 s.

#### Scenario: Cancel on Unix
- GIVEN a running task with a recorded `pgid`
- WHEN cancel is requested
- THEN the system sends `SIGTERM` to the negative pgid, waits 5 s,
  then `SIGKILL`
- AND the task transitions to `cancelled`, not `done`

#### Scenario: Cancel on Windows
- GIVEN a running task on Windows
- WHEN cancel is requested
- THEN `taskkill /PID <pid> /T /F` is invoked
- AND the task transitions to `cancelled`

### Requirement: Concurrency Limit
The executor MUST enforce a per-agent semaphore (default 3) and a
global semaphore (default 20). Excess dispatches remain in
`queued` until a slot frees.

#### Scenario: Burst dispatch is bounded
- GIVEN 50 task dispatches assigned to the same agent in 1 s
- WHEN the executor processes them
- THEN at most 3 spawn at any instant
- AND the remaining tasks have status `queued` until claimed

### Requirement: Polymorphic Actor Schema
Every actor reference (task assignee, comment author, activity
actor, inbox recipient) MUST be a pair `(actor_type, actor_id)`
where `actor_type ∈ {member, agent}`.

#### Scenario: Agent appears as first-class teammate
- GIVEN an agent A with a profile
- WHEN the API returns a task assigned to A
- THEN `assignee_type = 'agent'` and `assignee_id` is A's id
- AND the same endpoints serve the response without parallel
  agent-only routes

### Requirement: API-only 404
Requests to paths under `/api/*` MUST receive a JSON `404` with
`{ error: 'not found' }` when no handler matches; only non-API
paths fall back to `index.html`.

#### Scenario: Typo on API path
- GIVEN a client requests `GET /api/taks`
- WHEN no route matches
- THEN the response status is 404
- AND the body is `{"error":"not found"}` with
  `Content-Type: application/json`

## MODIFIED Requirements

### Requirement: Task Status Taxonomy
A task's `status` MUST be one of `backlog | queued | claimed |
running | review | done | failed | cancelled | timeout`.
Cancelled tasks MUST NOT be counted as done in any stat,
report, or auto-sync mapping.
(Previously: tasks had only `backlog | in-progress | review |
done`, and `auto-sync` mapped `cancelled` onto `done`.)

#### Scenario: auto-sync separates cancelled from done
- GIVEN an inbound auto-sync with `status = 'cancelled'`
- WHEN the task is upserted
- THEN its column is `cancelled`, not `done`
- AND completion-rate metrics exclude it

### Requirement: Storage Backend
The dashboard MUST use SQLite (WAL mode, foreign keys ON,
`busy_timeout = 5000`) as its primary store, with all mutations
wrapped in transactions and routed through a service layer.
(Previously: a single JSON file written via `loadData/saveData`
without locking.)

#### Scenario: 100 concurrent task creations succeed
- GIVEN 100 concurrent `POST /api/tasks` requests
- WHEN all complete
- THEN the database contains exactly 100 task rows
- AND no `SQLITE_BUSY` errors are returned to clients

#### Scenario: One-shot migration from JSON
- GIVEN an existing `data.json` from a prior version
- WHEN the dashboard starts in v2 for the first time
- THEN every project, task, deployment, and activity is imported
- AND the original file is renamed to `data.json.bak`

### Requirement: Task Dispatch
`POST /api/tasks/:id/dispatch` MUST execute the assigned agent in
real time and stream messages back over WebSocket. The endpoint
returns once the task has been claimed (status = `claimed`),
not when it has finished.
(Previously: dispatch only wrote a markdown prompt file and
returned a CLI command for the user to run manually.)

#### Scenario: Dispatch is fire-and-stream
- GIVEN a backlog task with assignee = a Claude agent
- WHEN dispatch is called
- THEN the response is `202` with `{taskId, status: 'claimed'}`
  within 500 ms
- AND subsequent `task.message` WS events stream until completion

## REMOVED Requirements

### Requirement: HTML Fallback for All Routes
(Removed. Replaced by "API-only 404" above. The catch-all
`app.get('/{*path}', sendFile)` is deleted because it masks
client-side typos by returning HTML to a JSON consumer.)

### Requirement: File-write Dispatch
(Removed. The previous behaviour of writing
`{taskId}-{slug}.md` and returning a CLI command instead of
spawning the agent is replaced by "Real Process Supervision"
and "Task Dispatch" above. The legacy code path in
`src/agent-dispatch.ts` is deleted in v7.0.)
```

---

### Cách dùng bộ artifact này

Lưu bốn file vào `openspec/changes/upgrade-cm-dashboard-to-managed-agents/` với cấu trúc:

```
openspec/changes/upgrade-cm-dashboard-to-managed-agents/
├── proposal.md
├── design.md
├── tasks.md
└── specs/
    └── dashboard/
        └── spec.md
```

Sau đó chạy `openspec validate upgrade-cm-dashboard-to-managed-agents` để kiểm tra format, rồi `/opsx:apply` (hoặc tương đương trong AI tool của bạn) để bắt đầu implement theo `tasks.md`. Khi hoàn thành, `/opsx:archive` sẽ merge delta spec vào `openspec/specs/dashboard/spec.md`.

Hai gợi ý nhỏ trước khi apply: (1) phase 0 (hardening quick-wins) đáng làm trước cả khi merge proposal, vì chúng là patch độc lập, không có rủi ro; (2) nếu repo CodyMaster chưa có domain `dashboard` trong `openspec/specs/`, lần archive đầu tiên sẽ tạo mới — đây là kỳ vọng đúng, không phải lỗi. Cho tôi biết nếu bạn muốn tôi tách thêm change riêng cho phần “skill chain ↔ Multica bridge” hoặc viết một change nhỏ chỉ cho phase 0.
