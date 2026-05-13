# Memory & Context Management

> Working memory, NLI, and cross-session context persistence. This guide teaches you how to maintain context across sessions with CodyMaster.

## Table of Contents

1. [Overview](#overview)
2. [Working Memory (CONTINUITY.md)](#working-memory-continuitymd)
3. [NLI (Natural Language Interface)](#nli-natural-language-interface)
4. [Context Bus](#context-bus)
5. [Memory Types](#memory-types)
6. [Best Practices](#best-practices)
7. [Advanced Patterns](#advanced-patterns)

---

## Overview

### Why Memory Matters

- **Context persistence** — Remember decisions across sessions
- **Knowledge accumulation** — Learn from past mistakes
- **Team coordination** — Share context with team members
- **Reduced tokens** — Don't re-explain the codebase

### Memory System

```
┌─────────────────────────────────────────┐
│           🧠 MEMORY SYSTEM              │
├─────────────────────────────────────────┤
│  CONTINUITY.md  →  Working Memory       │
│  SQLite         →  NLI Learnings        │
│  context-bus    →  Pipeline State       │
│  .cm/           →  Project State        │
└─────────────────────────────────────────┘
```

---

## Working Memory (CONTINUITY.md)

### What is CONTINUITY.md?

A lightweight file that holds:
- Active goal
- Current phase
- Last 3 decisions
- Next actions

**Size:** ~200 tokens (instant context reload)

### Initialize

```bash
# Create CONTINUITY.md
cm continuity init

# This creates:
# .cm/CONTINUITY.md
```

### Structure

```markdown
# CONTINUITY.md

## Active Goal
Add user authentication with login form and protected routes

## Current Phase
Phase 2: Implementation — Task 3/5 (login form component)

## Last 3 Decisions
1. Using next-intl for i18n (not react-i18next)
2. Shadcn UI components for consistency
3. JWT tokens stored in httpOnly cookies

## Next Actions
- Create LoginForm component
- Add form validation
- Connect to auth API
```

### Read at Session Start

```bash
# Restore context
cat .cm/CONTINUITY.md

# Or via MCP
cm_resolve("cm://memory/working")
```

### Update at Session End

```bash
# Update working memory
/cm-continuity update

# Or manually edit
cat > .cm/CONTINUITY.md << 'EOF'
# CONTINUITY.md

## Active Goal
Add user authentication with login form and protected routes

## Current Phase
Phase 2: Implementation — Task 4/5 (protected routes middleware)

## Last 3 Decisions
1. Using next-intl for i18n (not react-i18next)
2. Shadcn UI components for consistency
3. JWT tokens stored in httpOnly cookies
4. LoginForm component created with validation

## Next Actions
- Add protected routes middleware
- Test auth flow
- Deploy to staging
EOF
```

### Update at Task Completion

```bash
# After completing a task
/cm-continuity update --task "LoginForm component"

# This automatically:
# 1. Reads current state
# 2. Updates "Last 3 Decisions"
# 3. Updates "Next Actions"
# 4. Writes back to file
```

---

## NLI (Natural Language Interface)

### What is NLI?

Natural Language Interface allows you to save and retrieve learnings in plain English.

### Save Learnings

```bash
# Via MCP tool (recommended)
cm_natural("remember that we use insertLearning() not raw SQL for all memory writes")

# Via CLI
cm learnings add "use insertLearning() not raw SQL" --scope project

# Via chat (just say it)
"remember that rootDir in tsconfig is ./src — keep all TS source under src/"
"important: exponential backoff on retry, not fixed delay"
```

### Retrieve Learnings

```bash
# Search by keyword
cm_natural("what did we learn about TypeScript?")

# Browse all learnings
cm_natural("show me all project learnings")

# Via MCP
cm_query("auth token")  # FTS5 search
cm_resolve("cm://memory/learnings")  # Browse all
```

### Memory Types

| Type | Scope | Example |
|------|-------|---------|
| **Project** | This project only | "Use Shadcn UI components" |
| **Global** | All projects | "Always use TypeScript strict mode" |
| **Session** | Current session only | "User prefers verbose output" |

### Example Memory Session

```bash
# After fixing a bug
$ cm_natural("remember that token refresh must reset the idle timer on every API response")

# Next session (different developer)
$ cm_natural("what did we learn about auth?")
# → "token refresh must reset the idle timer on every API response"

# This prevents the same class of bug from recurring
```

---

## Context Bus

### What is the Context Bus?

A JSON file that tracks pipeline state across sessions.

### Structure

```json
{
  "chains": [
    {
      "id": "feature-auth",
      "type": "feature-development",
      "status": "in_progress",
      "steps": [
        {
          "skill": "cm-planning",
          "status": "done",
          "output": "openspec/changes/auth/tasks.md",
          "completed_at": "2024-01-15T10:00:00Z"
        },
        {
          "skill": "cm-execution",
          "status": "in_progress",
          "output": null,
          "started_at": "2024-01-15T11:00:00Z"
        }
      ],
      "created_at": "2024-01-15T09:00:00Z",
      "updated_at": "2024-01-15T11:30:00Z"
    }
  ],
  "current_chain": "feature-auth"
}
```

### Read Context Bus

```bash
# View current state
cat .cm/context-bus.json

# Or via MCP
cm_resolve("cm://pipeline/current")
```

### Advance Chain

```bash
# Complete a step
cm chain advance feature-auth "completed login API"

# This updates:
# - Step status to "done"
# - Step output
# - Completed timestamp
# - Current chain state
```

### Check Chain Status

```bash
# View all chains
cm chain status

# View specific chain
cm chain status feature-auth
```

---

## Memory Types

### 1. Working Memory (CONTINUITY.md)

**Purpose:** Current session context
**Size:** ~200 tokens
**Update:** Every session
**Read:** Session start

### 2. Learnings (SQLite)

**Purpose:** Accumulated knowledge
**Size:** Unlimited
**Update:** After important decisions
**Read:** When needed

### 3. Context Bus (JSON)

**Purpose:** Pipeline state
**Size:** ~1KB per chain
**Update:** After each step
**Read:** Session start

### 4. Project State (.cm/)

**Purpose:** Project configuration
**Size:** Varies
**Update:** When config changes
**Read:** Session start

### 5. Memory Layers

| Layer | Path | Purpose |
|-------|------|---------|
| **Semantic** | `memory/semantic/` | Long-term patterns, style, SEO rules |
| **Episodic** | `memory/episodic/` | Per-session experiences + outcomes |
| **Working** | `memory/working/` | Current session context |

---

## Best Practices

### 1. Update CONTINUITY.md at Session End

```bash
# Before closing session
/cm-continuity update

# This ensures next session has context
```

### 2. Save Important Learnings

```bash
# After making a decision
cm_natural("remember that we use bcrypt for password hashing, not sha256")

# After fixing a bug
cm_natural("remember that token refresh must reset the idle timer")
```

### 3. Use Specific Keywords

```bash
# Bad (too vague)
cm_natural("remember this")

# Good (specific)
cm_natural("remember that login uses bcrypt with 12 rounds")
```

### 4. Check Context Before Starting

```bash
# Before starting work
cat .cm/CONTINUITY.md
cm chain status

# This prevents re-discovering context
```

### 5. Clean Up Old Chains

```bash
# Archive completed chains
cm chain archive feature-auth

# This keeps context bus clean
```

### 6. Use Memory for Patterns

```bash
# Save patterns
cm_natural("pattern: when adding new API endpoint, always add rate limiting")

# Retrieve patterns
cm_natural("what patterns do we have for API endpoints?")
```

---

## Advanced Patterns

### Pattern 1: Session Handoff

```bash
# Developer A ends session
/cm-continuity update
cm_natural("remember that auth uses JWT with 15-minute expiry")

# Developer B starts session
cat .cm/CONTINUITY.md
cm_natural("what did we learn about auth?")
# → "auth uses JWT with 15-minute expiry"
```

### Pattern 2: Bug Prevention

```bash
# After fixing a bug
cm_natural("important: never use sha256 for password hashing, always use bcrypt")

# Next time someone works on auth
cm_natural("what did we learn about password hashing?")
# → "never use sha256 for password hashing, always use bcrypt"
```

### Pattern 3: Architecture Decisions

```bash
# After deciding on architecture
cm_natural("remember that we use next-intl for i18n, not react-i18next")

# When onboarding new developer
cm_natural("what i18n library do we use?")
# → "we use next-intl for i18n"
```

### Pattern 4: Performance Learnings

```bash
# After optimizing
cm_natural("remember that database queries must be indexed, we had N+1 query issue")

# When working on database
cm_natural("what did we learn about database performance?")
# → "database queries must be indexed, we had N+1 query issue"
```

### Pattern 5: Security Learnings

```bash
# After security incident
cm_natural("important: always validate input on backend, never trust frontend")

# When working on security
cm_natural("what security patterns do we have?")
# → "always validate input on backend, never trust frontend"
```

---

## Example: Complete Memory Workflow

### Session 1: Developer A

```bash
# Start session
cat .cm/CONTINUITY.md
# Active Goal: Add user authentication
# Current Phase: Phase 2: Implementation — Task 1/5

# Work
/cm-execution
# ... implement auth types ...

# Update memory
cm_natural("remember that auth types are in src/types/auth.ts")

# End session
/cm-continuity update
# Updated CONTINUITY.md with progress
```

### Session 2: Developer B

```bash
# Start session
cat .cm/CONTINUITY.md
# Active Goal: Add user authentication
# Current Phase: Phase 2: Implementation — Task 2/5
# Last 3 Decisions: 1. Auth types created

# Check learnings
cm_natural("what did we learn about auth?")
# → "auth types are in src/types/auth.ts"

# Continue work
/cm-execution
# ... implement login API ...

# Update memory
cm_natural("remember that login endpoint needs rate limiting")

# End session
/cm-continuity update
```

### Session 3: Developer A (again)

```bash
# Start session
cat .cm/CONTINUITY.md
# Active Goal: Add user authentication
# Current Phase: Phase 2: Implementation — Task 3/5
# Last 3 Decisions: 1. Auth types created, 2. Login API implemented

# Check learnings
cm_natural("what did we learn about auth?")
# → "auth types are in src/types/auth.ts"
# → "login endpoint needs rate limiting"

# Continue work
/cm-execution
# ... implement login form ...
```

---

## Next Steps

- [Team Collaboration](./13-team-collaboration.md) — Share memory with team
- [Knowledge Management](./16-knowledge-management.md) — Advanced knowledge system
- [Parallel Execution Modes](./12-parallel-execution.md) — Context in parallel execution
