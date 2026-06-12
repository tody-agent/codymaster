# Vibe Coding Daily Loop

> The daily rhythm of working with CodyMaster: Orient → Pick skill → Execute → Remember → Gate → Ship. This guide teaches you the most efficient way to work with AI agents.

## Table of Contents

1. [What is Vibe Coding?](#what-is-vibe-coding)
2. [The Daily Loop](#the-daily-loop)
3. [Phase 1: Orient](#phase-1-orient)
4. [Phase 2: Pick Skill](#phase-2-pick-skill)
5. [Phase 3: Execute](#phase-3-execute)
6. [Phase 4: Remember](#phase-4-remember)
7. [Phase 5: Gate](#phase-5-gate)
8. [Phase 6: Ship](#phase-6-ship)
9. [Anti-Patterns](#anti-patterns)
10. [Token Budget Tips](#token-budget-tips)

---

## What is Vibe Coding?

**Vibe coding** = talking to an AI agent like a senior dev on your team — but only works when the agent has memory, guardrails, and the right skills loaded.

CodyMaster provides all three:
- **Memory** — Working memory (CONTINUITY.md) + NLI (plain English learnings)
- **Guardrails** — Quality gates, secret scanning, TDD enforcement
- **Skills** — 68+ specialized skills for different tasks

### Key Insight

> **2-3 focused skills → +18.6pp task improvement**
> **4+ skills → only +5.9pp improvement**

Don't overload your context. Let CodyMaster pick the right skills.

---

## The Daily Loop

```
Orient → Pick skill → Execute in slices → Remember → Gate → Ship
```

This loop takes 2-5 minutes per cycle. Repeat throughout the day.

---

## Phase 1: Orient (< 2 min)

**Goal:** Restore context from where you left off.

### Step 1: Read Working Memory

```bash
# Check what you were doing
cat .cm/CONTINUITY.md

# Or via MCP tool (if connected)
cm_resolve("cm://memory/working")
```

CONTINUITY.md holds:
- Active goal
- Current phase
- Last 3 decisions
- Next actions

This is your **200-token context reload** — no need to re-explain the codebase.

### Step 2: Check Pipeline Status

```bash
# See where any active pipeline left off
cm chain status

# Or check specific chain
cm chain status feature-auth
```

### Step 3: Initialize (if needed)

If `.cm/` is missing:

```bash
cm index skeleton       # generates .cm/skeleton.md (instant codebase map)
cm continuity init      # creates .cm/CONTINUITY.md
```

### Example Orient Session

```bash
$ cat .cm/CONTINUITY.md

# Active Goal
Add user authentication with login form and protected routes

# Current Phase
Phase 2: Implementation — Task 3/5 (login form component)

# Last 3 Decisions
1. Using next-intl for i18n (not react-i18next)
2. Shadcn UI components for consistency
3. JWT tokens stored in httpOnly cookies

# Next Actions
- Create LoginForm component
- Add form validation
- Connect to auth API
```

---

## Phase 2: Pick Skill

**Goal:** Select the right skill for your current task.

### Quick Reference

| What you're doing | Skill(s) to invoke |
|---|---|
| New feature from scratch | `cm-brainstorm-idea` → `cm-planning` → `cm-execution` |
| Bug fix | `cm-debugging` → `cm-tdd` |
| PR review | `cm-code-review` → `cm-quality-gate` |
| Content / copy | `cm-content-factory` → `cm-ads-tracker` |
| Refactor safely | `cm-refactoring-patterns` → `cm-tdd` |
| UI work | `cm-refactoring-ui` → `cm-ux-heuristics` |
| Any multi-step task | `cm-skill-chain` (auto-selects the right pipeline) |

### Auto-Selection

```bash
# Let CodyMaster pick the best skills
cm chain auto "fix the login timeout bug"

# Output:
# 🔗 Auto-selected chain: bug-fix
# Step 1: cm-debugging (relevance: 0.92)
# Step 2: cm-tdd (relevance: 0.87)
# Step 3: cm-quality-gate (relevance: 0.81)
```

### Manual Skill Loading

```bash
# Load a specific skill
/cm-debugging

# Or load multiple
/cm-debugging
/cm-tdd
```

### When to Use Which Skill

#### For Bugs
```bash
# Start with debugging (find root cause first)
/cm-debugging

# Then write regression test
/cm-tdd

# Finally verify fix
/cm-quality-gate
```

#### For New Features
```bash
# Start with brainstorming (if complex)
/cm-brainstorm-idea

# Write the plan
/cm-planning

# Execute
/cm-execution
```

#### For Code Review
```bash
# Review the code
/cm-code-review

# Run quality checks
/cm-quality-gate
```

---

## Phase 3: Execute

**Goal:** Work in thin slices. One behavior + one verification per turn.

### The Golden Rule

> **Keep each agent turn to one behavior + one verification**

### Good Slice Example

```
"Add the `selectTopSkills` function to skill-chain.ts.
It takes (taskTitle, chain, maxSkills=3), returns ChainStep[].
Mandatory steps always first. Optional steps ranked by BM25 overlap. Test it."
```

### Bad Slice Example

```
"Refactor the whole skill system to be smarter about context"
```

### Slice Size Guide

| Slice Type | When to Use | Example |
|-----------|-------------|---------|
| **Micro** | Simple changes | "Update button text to 'Submit'" |
| **Small** | Single function | "Add email validation to signup form" |
| **Medium** | Component | "Create LoginForm component with validation" |
| **Large** | Feature | "Implement complete auth flow" (split into smaller slices) |

### Execution Example

```bash
# Slice 1: Create component skeleton
"Create LoginForm component in src/components/auth/LoginForm.tsx
with email and password fields. No validation yet."

# Verify: Check component renders
npm run test:run -- LoginForm.test.tsx

# Slice 2: Add validation
"Add form validation to LoginForm:
- Email: required, valid format
- Password: required, min 8 chars"

# Verify: Check validation works
npm run test:run -- LoginForm.test.tsx

# Slice 3: Connect to API
"Connect LoginForm to /api/auth/login endpoint.
Handle success (redirect to dashboard) and error (show message)."

# Verify: Check integration
npm run test:run -- LoginForm.test.tsx
npm run test:run -- auth.test.ts
```

### Parallel Execution (3+ Tasks)

For independent tasks, use parallel execution:

```bash
# Mode E: TRIZ-Parallel (recommended for 3+ tasks)
/cm-execution --mode e

# This will:
# 1. Analyze file dependencies
# 2. Group independent tasks
# 3. Dispatch to parallel agents
# 4. Monitor for conflicts
# 5. Verify each agent's work
```

---

## Phase 4: Remember

**Goal:** Save important decisions in plain English for future sessions.

### When to Remember

After any important decision:
- Architecture choice
- Bug fix pattern
- Configuration decision
- Learning from mistake

### How to Remember

```bash
# Via MCP tool (recommended)
cm_natural("remember that we use insertLearning() not raw SQL for all memory writes")

# Via CLI
cm learnings add "use insertLearning() not raw SQL" --scope project

# Via chat (just say it)
"remember that rootDir in tsconfig is ./src — keep all TS source under src/"
```

### Memory Types

| Type | Scope | Example |
|------|-------|---------|
| **Project** | This project only | "Use Shadcn UI components" |
| **Global** | All projects | "Always use TypeScript strict mode" |
| **Session** | Current session only | "User prefers verbose output" |

### Retrieving Memories

```bash
# Search by keyword
cm_natural("what did we learn about TypeScript?")

# Browse all learnings
cm_natural("show me all project learnings")

# Via MCP
cm_query("auth token")  # FTS5 search
cm_resolve("cm://memory/learnings")  # Browse all
```

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

## Phase 5: Gate

**Goal:** Never leave a slice "probably working". Verify with evidence.

### Quality Gates

```bash
# Full quality gate (recommended before each commit)
npm run test:gate

# Faster subset (for quick checks)
npm run test:gate:kit

# Specific gates
npm run gate:secrets    # Secret scanning
npm run gate:lint       # Linting
npm run gate:tests      # Tests only
npm run gate:build      # Build check
```

### What Each Gate Checks

| Gate | What it Does | Fail Action |
|------|--------------|-------------|
| **Secrets** | Scans for API keys, passwords, tokens | Remove secrets, rotate keys |
| **Lint** | Code style, unused imports, complexity | Fix linting errors |
| **Tests** | Unit + integration tests pass | Fix failing tests |
| **Build** | TypeScript compiles, no errors | Fix type errors |
| **TypeCheck** | Strict TypeScript validation | Fix type issues |

### Gate Failure Protocol

```bash
# Gate fails
$ npm run test:gate:kit
❌ 2 tests failing

# DO NOT skip the gate. Fix now.
$ npm run test:run -- --watch

# Fix the tests
# Re-run gate
$ npm run test:gate:kit
✅ All gates passed

# NOW you can commit
```

### Pre-Commit Checklist

```bash
# Before every commit
1. npm run test:gate:kit     # Quick quality check
2. git add -p                # Review what's staged
3. git commit -m "feat: ..." # Meaningful commit message
```

---

## Phase 6: Ship

**Goal:** Get code to production safely.

### Ship Steps

```bash
# 1. Final quality gate
npm run test:gate

# 2. Review staged changes
git add -p

# 3. Commit with meaningful message
git commit -m "feat: add user authentication with login form"

# 4. Push to remote
git push origin feature/auth

# 5. Create PR (if using GitHub flow)
gh pr create --title "Add user authentication" --body "..."

# 6. After PR is approved and merged
git checkout main
git pull
npm run deploy
```

### Ship Checklist

```bash
# Before merging PR
□ All tests passing
□ Code reviewed by at least 1 person
□ No secrets in code
□ Build successful
□ Documentation updated (if needed)
□ i18n strings added (if needed)

# Before deploying to production
□ All checks passing on main
□ Staging deployment tested
□ Rollback plan documented
□ Monitoring configured
```

### Deploy Commands

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production

# Or via CodyMaster (with safety checks)
/cm-safe-deploy
```

---

## Anti-Patterns

| Pattern | Why it fails | Fix |
|---|---|---|
| **Giant prompt with full context** | Exceeds token budget, degrades quality | Use L0 index + `cm_budget_check` |
| **Load all 68 skills at once** | SkillsBench: -2.9pp with monolithic loading | Let `cm chain auto` pick top 3 |
| **Skip tests "it's just a one-liner"** | One-liners break CI too | `npm run test:gate` is < 30 sec |
| **Context-switch without saving** | Next session re-discovers everything | Update CONTINUITY.md before switching |
| **Accept AI output without verification** | "Performative agreement" → silent regressions | Run the gate, read the diff |
| **Commit secrets** | Secret in git = permanent exposure | `npm run gate:secrets` before every push |
| **Monolithic feature slice** | Hard to review, hard to debug | Max 3 tasks per batch in cm-execution |

### Example Anti-Pattern Fix

**Bad:**
```
"Refactor the entire authentication system to use OAuth2 with Google and GitHub providers, add MFA support, and implement session management with Redis"
```

**Good:**
```
Slice 1: "Add Google OAuth2 provider to auth system. Just the provider config and callback handler. No MFA yet."
Slice 2: "Add GitHub OAuth2 provider. Same pattern as Google."
Slice 3: "Add MFA support with TOTP. Integrate with existing auth flow."
```

---

## Token Budget Tips

### Check Before Big Tasks

```bash
# Check budget
cm_budget_check(category="implementation", estimated_tokens=8000)

# Use L0 summaries instead of full files
cm_resolve("cm://memory/learnings")       # L0: ~300 tokens
cm_resolve("cm://memory/learnings", 1)    # L1: ~800 tokens
cm_resolve("cm://memory/learnings", 2)    # L2: full SQLite query
```

### Optimize Context

```bash
# Before loading a skill
/cm-skill-index  # Load Layer 1 only (~100 tokens)

# When you need more detail
/cm-skill-index --layer 2  # Load Layer 2 (~300 tokens)

# Only load full skill when executing
/cm-tdd  # Load full skill (~1000 tokens)
```

### Token-Efficient Patterns

```bash
# Instead of reading entire files
cat src/long-file.ts

# Read specific sections
grep -n "function name" src/long-file.ts
# Then read only that section

# Use skeleton for overview
cat .cm/skeleton.md  # ~200 tokens for entire codebase map
```

---

## Benchmark Your Setup

### Measure Improvement

```bash
# Run all eval suites
cm bench

# Run specific suite
cm bench --suite tdd-regression --runs 5

# Save baseline
cm bench --output reports/baseline-$(date +%Y%m%d).json

# Compare before/after
cm bench --compare reports/before.json reports/after.json
```

### What to Measure

| Metric | Good Target | How to Improve |
|--------|-------------|----------------|
| **TDD regression rate** | < 5% | Write more tests, use cm-tdd |
| **Token cost per task** | < 10k tokens | Use L0 summaries, fewer skills |
| **Memory retrieval accuracy** | > 90% | Better tagging, more specific learnings |
| **Gate pass rate** | > 95% | Fix issues immediately, don't skip gates |

---

## Quick Reference Card

```bash
# Daily commands
cat .cm/CONTINUITY.md                   # Restore context
cm chain status                         # See active pipelines
cm chain auto "describe task"           # Start best-fit pipeline
npm run test:gate:kit                   # Quick quality check
cm_natural("remember that...")          # Save learning

# Before commit
git add -p                              # Review staged
npm run test:gate                       # Full quality gate

# After merge
npm run deploy                          # Deploy to production

# Measure
cm bench                                # Run eval suites
```

---

## Next Steps

- [New Feature Development](./04-feature-development.md) — Systematic feature building
- [Bug Fixing Workflow](./05-bug-fixing.md) — Systematic debugging
- [Parallel Execution Modes](./12-parallel-execution.md) — Advanced execution strategies
