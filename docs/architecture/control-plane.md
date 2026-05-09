# Control Plane Architecture

## Overview
The cm-dashboard is a real-time agent control plane that manages AI coding agent lifecycle.

## Components

### AgentBackend Interface (src/agent/backend.ts)
- Single contract for all agent providers
- execute(prompt, opts) → AgentSession
- AgentMessage union: text | thinking | tool-use | tool-result | status | log | error
- AgentResult: completed | failed | cancelled | timeout | aborted

### Agent Providers (src/agent/)
- claude.ts — Claude Code CLI (NDJSON streaming)
- codex.ts — Codex CLI (full-auto mode)
- cursor.ts — Cursor CLI (text output)
- gemini.ts — Gemini CLI
- copilot.ts — GitHub Copilot CLI
- antigravity.ts — Antigravity CLI
- opencode.ts — OpenCode CLI
- factory.ts — getBackend(name) factory

### Realtime Layer (src/realtime/)
- event-bus.ts — Typed EventEmitter for task/activity/agent events
- ws-hub.ts — WebSocket server at /ws, project-scoped subscriptions

### Storage Layer (src/storage/)
- sqlite.ts — WAL mode, foreign keys ON, busy_timeout 5000
- repos/ — projectRepo, taskRepo, activityRepo, messageRepo
- services/ — TaskService, ProjectService with event emission

### Executor (src/executor/)
- runner.ts — claim → spawn → stream → pin sessionId → finalize
- workdir.ts — Per-task isolated workdirs with GC
- cancel.ts — Process group cancellation (Unix pgid / Windows taskkill)
- gc.ts — TTL 24h done/cancelled, 72h orphans

## Data Flow
1. REST API → TaskService → SQLite + EventBus
2. EventBus → WebSocket Hub → Browser
3. Dispatch → AgentBackend → spawn-helper → child process
4. Agent output → NDJSON → EventBus → WebSocket → Browser

## State Machine
backlog → queued → claimed → running → done
                                  → failed
                                  → cancelled
                                  → timeout
