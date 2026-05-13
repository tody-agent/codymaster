# Team Collaboration

> Shared context, dashboard, and multi-developer workflows. This guide teaches you how to collaborate effectively with your team using CodyMaster.

## Table of Contents

1. [Overview](#overview)
2. [Shared Context](#shared-context)
3. [Dashboard](#dashboard)
4. [Multi-Developer Workflows](#multi-developer-workflows)
5. [Code Review Collaboration](#code-review-collaboration)
6. [Knowledge Sharing](#knowledge-sharing)
7. [Best Practices](#best-practices)

---

## Overview

### Why Team Collaboration Matters

- **Shared context** — Everyone knows what's happening
- **Reduced conflicts** — Avoid stepping on each other's toes
- **Knowledge transfer** — Learn from each other
- **Consistent quality** — Same standards for everyone

### Collaboration Tools

| Tool | Purpose |
|------|---------|
| **Dashboard** | Visual project status |
| **Context Bus** | Pipeline state sharing |
| **CONTINUITY.md** | Working memory |
| **Learnings** | Accumulated knowledge |
| **Code Review** | Quality assurance |

---

## Shared Context

### CONTINUITY.md

```bash
# Read current context
cat .cm/CONTINUITY.md

# This shows:
# - Active goal
# - Current phase
# - Last 3 decisions
# - Next actions
```

### Context Bus

```bash
# View pipeline state
cat .cm/context-bus.json

# This shows:
# - Active chains
# - Step status
# - Outputs
# - Timestamps
```

### Learnings

```bash
# View all learnings
cm_natural("show me all project learnings")

# This shows:
# - Architecture decisions
# - Bug fix patterns
# - Best practices
```

---

## Dashboard

### Start Dashboard

```bash
# Start dashboard
/cm-dashboard

# This opens http://localhost:6969
```

### Dashboard Features

```
┌─────────────────────────────────────────┐
│           📊 DASHBOARD                  │
├─────────────────────────────────────────┤
│  Pipeline Progress │ Task Queue         │
│  ──────────────── │ ─────────────────   │
│  ████████░░ 80%   │ ☐ Task 1           │
│                   │ ✓ Task 2           │
│  Chain: feature-auth                   │
│  Step 3/5: in_progress                 │
├─────────────────────────────────────────┤
│  Token Tracker    │ Event Log           │
│  ──────────────── │ ─────────────────   │
│  $2.50 / $5.00   │ 10:30 Task started  │
│  ██████░░░░ 50%  │ 10:35 Task completed│
└─────────────────────────────────────────┘
```

### Dashboard Usage

```bash
# Open dashboard
/cm-dashboard

# Check specific chain
/cm-dashboard --chain feature-auth

# View token usage
/cm-dashboard --tokens
```

---

## Multi-Developer Workflows

### Workflow 1: Feature Branch

```bash
# Developer A: Start feature
git checkout -b feature/auth
/cm-start "Add user authentication"
/cm-dashboard

# Developer B: Start different feature
git checkout -b feature/payments
/cm-start "Add payment processing"
/cm-dashboard

# Both can work independently
# Dashboard shows both chains
```

### Workflow 2: Pair Programming

```bash
# Developer A: Lead
/cm-execution --mode f --task "Implement auth types"

# Developer B: Reviewer
/cm-code-review --scope "auth types"

# They discuss via:
# - Code comments
# - PR discussion
# - Chat
```

### Workflow 3: Handoff

```bash
# Developer A: End session
/cm-continuity update
cm_natural("remember that auth uses JWT with 15-minute expiry")
git push

# Developer B: Start session
git pull
cat .cm/CONTINUITY.md
cm_natural("what did we learn about auth?")
# → "auth uses JWT with 15-minute expiry"
```

### Workflow 4: Code Review

```bash
# Developer A: Create PR
gh pr create --title "feat: add auth"

# Developer B: Review
gh pr checkout [pr-number]
/cm-code-review

# Developer A: Address feedback
git checkout feature/auth
# ... make changes ...
git push

# Developer B: Approve
gh pr approve [pr-number]
```

---

## Code Review Collaboration

### Review Process

```bash
# 1. Developer A creates PR
gh pr create --title "feat: add auth"

# 2. Developer B reviews
/cm-code-review

# 3. Feedback is addressed
# 4. Re-review
/cm-code-review

# 5. Approve and merge
gh pr approve [pr-number]
gh pr merge [pr-number] --squash
```

### Review Checklist

```markdown
## Review Checklist

### Code Quality
- [ ] Code compiles/builds
- [ ] No lint errors
- [ ] No type errors
- [ ] Consistent code style

### Testing
- [ ] New code has tests
- [ ] Tests pass locally
- [ ] No test skips

### Security
- [ ] No secrets in code
- [ ] Input validated
- [ ] Auth checks present

### Documentation
- [ ] README updated (if needed)
- [ ] API docs updated (if needed)

### Performance
- [ ] No obvious performance issues
- [ ] Database queries optimized
```

### Review Communication

```bash
# Good review comments
✅ "This function could use rate limiting"
✅ "Consider adding error handling here"
✅ "Great implementation, tests are thorough"

# Bad review comments
❌ "This is wrong"
❌ "Fix this"
❌ "I don't like this"
```

---

## Knowledge Sharing

### Share Learnings

```bash
# Save important learning
cm_natural("remember that we use bcrypt for password hashing, not sha256")

# This is shared with all team members
# When they work on auth, they'll see this learning
```

### Share Architecture Decisions

```bash
# Document decision
cat >> docs/decisions/auth-architecture.md << 'EOF'
# Auth Architecture Decision

## Decision
Use JWT tokens stored in httpOnly cookies

## Context
- Need stateless authentication
- Must work with SSR
- Security is critical

## Consequences
- More complex than session-based
- Need refresh token mechanism
- Must handle token expiry
EOF

# Save learning
cm_natural("remember that auth uses JWT with httpOnly cookies for SSR support")
```

### Share Patterns

```bash
# Save pattern
cm_natural("pattern: when adding new API endpoint, always add rate limiting")

# Team members can retrieve
cm_natural("what patterns do we have for API endpoints?")
# → "when adding new API endpoint, always add rate limiting"
```

### Knowledge Base

```bash
# Generate knowledge base
/cm-dockit

# This creates:
# - Architecture documentation
# - API reference
# - User guides
# - SOPs

# Share via:
# - Git repository
# - Internal wiki
# - Documentation site
```

---

## Best Practices

### 1. Update CONTINUITY.md Regularly

```bash
# Before switching tasks
/cm-continuity update

# Before ending session
/cm-continuity update

# This ensures team has context
```

### 2. Save Important Learnings

```bash
# After making a decision
cm_natural("remember that we use next-intl for i18n")

# After fixing a bug
cm_natural("remember that token refresh must reset the idle timer")

# Team members will see these learnings
```

### 3. Use Dashboard

```bash
# Start each day with
/cm-dashboard

# This shows:
# - What others are working on
# - Pipeline status
# - Token usage
```

### 4. Communicate Clearly

```bash
# Good communication
✅ "I'm working on auth, will finish by EOD"
✅ "PR ready for review: feat/add-auth"
✅ "Found issue with login, investigating"

# Bad communication
❌ "Working on stuff"
❌ "PR up"
❌ "Something's wrong"
```

### 5. Review Thoroughly

```bash
# When reviewing
/cm-code-review

# Check:
# - Spec compliance
# - Code quality
# - Security
# - Tests
# - Documentation
```

### 6. Share Knowledge

```bash
# After solving a complex problem
cm_natural("remember that [complex solution]")

# After learning something new
cm_natural("learned that [new knowledge]")

# Team benefits from your experience
```

---

## Example: Team Collaboration

### Scenario: Team of 3 developers

#### Day 1

```bash
# Developer A: Start auth feature
git checkout -b feature/auth
/cm-start "Add user authentication"
/cm-dashboard
# Shows: feature/auth chain, step 1/5

# Developer B: Start payments feature
git checkout -b feature/payments
/cm-start "Add payment processing"
/cm-dashboard
# Shows: feature/payments chain, step 1/5

# Developer C: Fix bug
git checkout -b fix/login-timeout
/cm-start "Fix login timeout"
/cm-dashboard
# Shows: fix/login-timeout chain, step 1/3
```

#### Day 2

```bash
# Developer A: Continue auth
cat .cm/CONTINUITY.md
# Shows: Active Goal: Add user authentication
# Current Phase: Task 3/5
/cm-execution

# Developer B: Continue payments
cat .cm/CONTINUITY.md
# Shows: Active Goal: Add payment processing
# Current Phase: Task 2/5
/cm-execution

# Developer C: Fix bug, create PR
gh pr create --title "fix: login timeout"
/cm-code-review
```

#### Day 3

```bash
# Developer A: Create PR
gh pr create --title "feat: add auth"

# Developer B: Review auth PR
gh pr checkout [pr-number]
/cm-code-review
# Feedback: "Add rate limiting to login endpoint"

# Developer A: Address feedback
git checkout feature/auth
# ... add rate limiting ...
git push

# Developer C: Merge bug fix
gh pr merge [pr-number] --squash
```

#### Day 4

```bash
# Developer A: Auth PR approved, merge
gh pr merge [pr-number] --squash

# Developer B: Continue payments
/cm-execution

# Developer C: Start new task
/git checkout -b feature/dashboard
/cm-start "Add dashboard"
```

---

## Next Steps

- [MCP Integration](./14-mcp-integration.md) — Connect external tools
- [Knowledge Management](./16-knowledge-management.md) — Advanced knowledge system
- [Skill Chain Automation](./17-skill-chain-automation.md) — Automate workflows
