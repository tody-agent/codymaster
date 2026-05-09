# Implementation Checklist

## Wave 1 — Hardening Quick-wins (Day 1, no flag)

- [x] 1.1 Replace catch-all GET fallback with API-aware 404 middleware
      in `src/dashboard.ts` (JSON 404 for /api/*, index.html for others)
- [x] 1.2 Fix `auto-sync` STATUS_TO_COLUMN: map `cancelled` to
      `cancelled` column, not `done` (dashboard.ts:174)
- [x] 1.3 Add `async-mutex` dependency; wrap loadData/saveData in
      mutex lock in src/data.ts; cover all REST handlers
- [x] 1.4 Add Vitest cases: concurrent task creation (100 parallel
      POST /api/tasks), cancelled != done stat check
- [x] 1.5 Delete `.opencode/skills/cm-dashboard/SKILL.md` tombstone;
      create new comprehensive skill from scratch covering:
      - Dashboard lifecycle (start|stop|status|open|tail)
      - Agent dispatch via control plane
      - WebSocket real-time monitoring
      - Task state machine (backlog->queued->claimed->running->done/failed/cancelled/timeout)
      - Per-task workdir and session resume
      - MCP bridge integration
      - Troubleshooting guide
- [x] 1.6 Verify: `npm run test:gate:kit` passes

## Wave 2 — Realtime + Storage (Week 1, CM_EXECUTOR_V2=1)

### 2A: AgentBackend Interface (foundation for Wave 3)
- [x] 2.1 Create `src/agent/backend.ts` with AgentBackend interface,
      AgentSession, AgentMessage union, AgentResult, FailureReason types
- [x] 2.2 Create `src/agent/spawn-helper.ts` with NDJSON reader,
      64KB stderr ring buffer, inactivity watchdog, pgid capture

### 2B: EventBus + WebSocket
- [x] 2.3 Add `ws` dependency
- [x] 2.4 Create `src/realtime/event-bus.ts` (typed EventEmitter + topics)
- [x] 2.5 Create `src/realtime/ws-hub.ts` with project-scoped
      subscribe/unsubscribe, heartbeat (15s), backpressure (drop oldest)
- [x] 2.6 Mount /ws server on existing Express HTTP server in dashboard.ts

### 2C: SQLite Migration
- [x] 2.7 Create `src/storage/sqlite.ts` with WAL mode, foreign keys ON,
      busy_timeout 5000 (pattern: reuse from context-db.ts)
- [x] 2.8 Write migration: `src/storage/migrations/001_init.sql`
- [x] 2.9 Implement repos: taskRepo, projectRepo, activityRepo,
      messageRepo with prepared statements
- [x] 2.10 Implement TaskService / ProjectService with transactional
      mutations and event emission to EventBus
- [ ] 2.11 Migration script: read data.json once, write to SQLite,
      rename to data.json.bak
- [ ] 2.12 Feature flag CM_EXECUTOR_V2=1 selects SQLite path;
      default off until Wave 3 ships
- [ ] 2.13 Update `cm doctor` to print storage backend in use

### 2D: Refactor + Frontend
- [x] 2.14 Refactor REST handlers to emit EventBus events on mutations
- [x] 2.15 Update public/dashboard/app.js: connect /ws, consume
      task.* events, fall back to 15s polling on disconnect
- [x] 2.16 Add `cm dashboard tail` CLI command (pretty-prints WS events)
- [ ] 2.17 Verify: WS connects within 1s, 100 concurrent writes -> 100 rows

## Wave 3 — Agent Lifecycle (Week 2-3, all 7 providers)

### 3A: Provider Implementations
- [ ] 3.1 Implement `src/agent/claude.ts` (canonical, NDJSON)
- [ ] 3.2 Implement `src/agent/codex.ts`
- [ ] 3.3 Implement `src/agent/cursor.ts`
- [ ] 3.4 Implement `src/agent/gemini.ts`
- [ ] 3.5 Implement `src/agent/copilot.ts`
- [ ] 3.6 Implement `src/agent/antigravity.ts`
- [ ] 3.7 Implement `src/agent/opencode.ts`
- [ ] 3.8 Implement `src/agent/factory.ts` (switch by name)
- [ ] 3.9 Implement `src/agent/version.ts` (detectVersion + checkMinVersion)
- [ ] 3.10 Contract tests with recorded NDJSON fixtures

### 3B: Executor + Lifecycle
- [ ] 3.11 Implement `src/executor/workdir.ts`: prepare, reuse, .gc_meta.json
- [ ] 3.12 Implement `src/executor/meta-skill.ts`: writes CLAUDE.md / AGENTS.md / GEMINI.md
- [ ] 3.13 Implement `src/executor/runner.ts`: claim -> spawn -> stream -> pin -> finalize
- [ ] 3.14 Implement POST /api/tasks/:id/dispatch (real exec)
- [ ] 3.15 Implement POST /api/tasks/:id/cancel with pgid kill
- [ ] 3.16 Implement resume fallback (one-shot retry)
- [ ] 3.17 Implement GC loop: TTL 24h done/cancelled, 72h orphans
- [ ] 3.18 Implement structured failure_reason mapping per backend
- [ ] 3.19 Frontend: streaming messages in task drawer, cancel button, resume chip
- [ ] 3.20 Verify: real spawn works, messages stream, cancel kills within 5s

## Wave 4 — Hardening + Docs (Week 3)

- [ ] 4.1 JSON-schema validation on POST/PUT bodies (ajv)
- [ ] 4.2 Helmet-equivalent headers (consolidate existing)
- [ ] 4.3 Request log middleware (pino-http) with task_id binding
- [ ] 4.4 Prometheus /metrics endpoint
- [ ] 4.5 Docs: architecture, runbooks, migration guide
- [ ] 4.6 Migration guide for JSON storage users
- [ ] 4.7 Remove CM_EXECUTOR_V2 flag in v7.0

## Acceptance Criteria

- [ ] 6.1 `cm dashboard` boots, board reflects SQLite state, WS connects within 1s
- [ ] 6.2 Task assigned to `claude` triggers real spawn; messages stream in real time
- [ ] 6.3 Cancel kills underlying process within 5s on macOS, Linux, Windows
- [ ] 6.4 Kill dashboard mid-task and restart resumes same pinned_session_id
- [ ] 6.5 100 concurrent POST /api/tasks -> 100 rows with no lost writes
- [ ] 6.6 GET /api/notarealroute returns JSON 404, not HTML
- [ ] 6.7 Cancelled task excluded from done stats
