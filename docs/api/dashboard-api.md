---
title: "Dashboard REST API"
description: "Complete REST API reference for the Cody Master dashboard server."
keywords: ["REST API", "dashboard", "cody master"]
robots: "index, follow"
---

# Dashboard REST API

> **Quick Reference**
> - **Base URL**: `http://codymaster.localhost:48120`
> - **Format**: JSON
> - **Auth**: None (local only)

## Project API

### GET /api/projects

List all projects with enriched data.

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "My Project",
    "path": "/path/to/project",
    "agents": ["antigravity"],
    "createdAt": "2026-03-20T10:00:00Z",
    "taskCount": 5,
    "doneCount": 2,
    "activeAgents": ["antigravity"]
  }
]
```

### POST /api/projects

Create a new project.

**Request:**

```json
{
  "name": "My Project",
  "path": "/path/to/project",
  "agents": ["antigravity", "claude"]
}
```

### PUT /api/projects/:id

Update a project's name, path, or agents.

### DELETE /api/projects/:id

Delete a project and all its tasks.

---

## Task API

### GET /api/tasks

List tasks. Optional query: `?projectId=uuid`

### POST /api/tasks

Create a new task.

**Request:**

```json
{
  "title": "Fix login bug",
  "description": "Users can't login with Google OAuth",
  "column": "backlog",
  "priority": "high",
  "projectId": "uuid",
  "agent": "antigravity",
  "skill": "cm-debugging"
}
```

### POST /api/tasks/sync

Bulk-import tasks from an external source.

**Request:**

```json
{
  "projectId": "uuid",
  "projectName": "My Project",
  "agent": "antigravity",
  "skill": "cm-execution",
  "tasks": [
    { "title": "Task 1", "priority": "high" },
    { "title": "Task 2", "column": "in-progress" }
  ]
}
```

### PUT /api/tasks/:id

Update task properties (title, description, priority, agent, skill).

### PUT /api/tasks/:id/move

Move task to a different column with ordering.

**Request:**

```json
{
  "column": "in-progress",
  "order": 0
}
```

### POST /api/tasks/:id/transition

Validated state transition with reason tracking.

**Request:**

```json
{
  "column": "review",
  "reason": "Code complete, needs review"
}
```

**Error (invalid transition):**

```json
{
  "error": "Invalid transition: backlog → done. Allowed: in-progress",
  "errorCode": "INVALID_TRANSITION",
  "allowed": ["in-progress"]
}
```

### POST /api/tasks/bulk-transition

Transition multiple tasks at once.

**Request:**

```json
{
  "taskIds": ["uuid1", "uuid2"],
  "column": "done",
  "reason": "Sprint complete"
}
```

### GET /api/tasks/stuck

Get tasks stuck in `in-progress` beyond threshold.

**Query:** `?threshold=1800000` (ms, default 30 minutes)

### POST /api/tasks/:id/dispatch

Dispatch a task to an AI agent. Validates preconditions and generates dispatch files.

**Response (success):**

```json
{
  "success": true,
  "task": { ... },
  "filePath": "/path/to/dispatch-file.md",
  "prompt": "Task prompt text",
  "cliCommand": "cm task dispatch <id>"
}
```

### DELETE /api/tasks/:id

Delete a task.

---

## Judge API

### GET /api/judge

Evaluate all tasks' health. Optional: `?projectId=uuid`

### GET /api/judge/:taskId

Evaluate a single task.

### GET /api/judge/suggestions

Get transition suggestions for all tasks.

### GET /api/agents/suggest

Suggest best agents for a skill. Query: `?skill=cm-tdd`

### GET /api/agents/suggest/:taskId

Suggest agents for a specific task.

---

## Working Memory API

### GET /api/continuity

Get working memory status for all projects.

### GET /api/continuity/:projectId

Get detailed memory for a project.

### POST /api/continuity/:projectId

Update working memory state.

### POST /api/continuity/:projectId/init

Initialize working memory for a project.

### GET /api/learnings/:projectId

List all captured learnings.

### POST /api/learnings/:projectId

Add a new learning.

**Request:**

```json
{
  "whatFailed": "Used wrong API endpoint",
  "whyFailed": "Documentation was outdated",
  "howToPrevent": "Always verify against OpenAPI spec",
  "agent": "antigravity",
  "taskId": "uuid"
}
```

### GET /api/decisions/:projectId

List all architecture decisions.

### POST /api/decisions/:projectId

Record a new decision.

**Request:**

```json
{
  "decision": "Use Supabase for auth",
  "rationale": "RLS, real-time, PostgreSQL",
  "agent": "antigravity"
}
```

---

## Deployment API

### GET /api/deployments

List deployments. Optional: `?projectId=uuid`

### POST /api/deployments

Record a new deployment.

**Request:**

```json
{
  "projectId": "uuid",
  "env": "staging",
  "commit": "abc123",
  "branch": "main",
  "agent": "antigravity",
  "message": "Fix login flow"
}
```

### PUT /api/deployments/:id/status

Update deployment status.

### POST /api/deployments/:id/rollback

Roll back a deployment.

---

## Chain API

### GET /api/chains

List available skill chains.

### GET /api/chains/:id

Get chain details.

### GET /api/chains/suggest/:title

Auto-match a title to the best chain.

### GET /api/chain-executions

List chain executions. Optional: `?status=running&projectId=uuid`

### POST /api/chain-executions

Start a new chain execution.

**Request:**

```json
{
  "chainId": "feature",
  "taskTitle": "Add user authentication",
  "projectId": "uuid",
  "agent": "antigravity"
}
```

### PUT /api/chain-executions/:id/advance

Advance to the next chain step.

### PUT /api/chain-executions/:id/skip

Skip the current step.

### PUT /api/chain-executions/:id/abort

Abort a chain execution.

---

## Activity & Changelog API

### GET /api/activities

List activities. Optional: `?projectId=uuid&limit=50`

### GET /api/changelog

List changelog entries. Optional: `?projectId=uuid`

### POST /api/changelog

Add a changelog entry.

**Request:**

```json
{
  "projectId": "uuid",
  "version": "2.1.0",
  "title": "Authentication Overhaul",
  "changes": ["Added OAuth support", "Fixed session handling"],
  "agent": "antigravity"
}
```
