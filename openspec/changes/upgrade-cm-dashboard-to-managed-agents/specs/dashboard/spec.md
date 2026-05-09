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
- AND a final `AgentResult` is delivered with `status` in
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
where `actor_type in {member, agent}`.

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
