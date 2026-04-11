---
title: Vibe Coding Guide
description: Practical loop for shipping with CodyMaster v5.1 — Intelligent Skill Selection, NLI memory, skill chains, and quality gates. From idea to deploy without losing context.
keywords: vibe coding, ai workflow, codymaster, skill chain, mcp, goose, claude desktop
robots: index, follow
---

# Vibe Coding Guide

> **Vibe coding** = talking to an AI agent like a senior dev on your team — but only works when the agent has memory, guardrails, and the right skills loaded. CodyMaster provides all three.

## What changed in v5.1.0

Before diving into the loop, here is what v5.1.0 adds to the vibe coding experience:

| Feature | What it means for you |
|---|---|
| **Intelligent Skill Selection** | Chains auto-pick top-3 relevant skills per task — no more overloaded context |
| **`cm mcp-serve`** | One command to connect any MCP client (Goose, Claude Desktop, Cursor) |
| **`cm_natural`** | Tell the agent "remember that…" in plain English — it persists to SQLite |
| **`cm bench`** | Measure before/after improvement — not just vibes |

---

## The Daily Loop

```
Orient → Pick skill → Execute in slices → Remember → Gate → Ship
```

### 1. Orient (< 2 min)

Open any session with:

```bash
# Check what you were doing
cat .cm/CONTINUITY.md

# Or via MCP tool (if connected)
# cm_resolve("cm://memory/working")
```

CONTINUITY.md holds: active goal, current phase, last 3 decisions, and next actions. This is your 200-token context reload — no need to re-explain the codebase.

If `.cm/` is missing, initialize it:

```bash
cm index skeleton       # generates .cm/skeleton.md (instant codebase map)
cm continuity init      # creates .cm/CONTINUITY.md
```

---

### 2. Pick the Right Skill

CodyMaster has 68+ skills. You almost never need more than 2–3 at once.

**SkillsBench research finding:** 2–3 focused skills → **+18.6pp** task improvement. 4+ skills → only +5.9pp.

| What you're doing | Skill(s) to invoke |
|---|---|
| New feature from scratch | `cm-brainstorm-idea` → `cm-planning` → `cm-execution` |
| Bug fix | `cm-debugging` → `cm-tdd` |
| PR review | `cm-code-review` → `cm-quality-gate` |
| Content / copy | `cm-content-factory` → `cm-ads-tracker` |
| Refactor safely | `cm-refactoring-patterns` → `cm-tdd` |
| UI work | `cm-refactoring-ui` → `cm-ux-heuristics` |
| Any multi-step task | `cm-skill-chain` (auto-selects the right pipeline) |

**Shortcut:** just describe your task to `cm chain auto`:

```bash
cm chain auto "fix the login timeout bug"
# → auto-selects: debugging → tdd → quality-gate (top 3 by relevance score)
```

---

### 3. Execute in Thin Slices

The #1 vibe coding mistake: giant prompts. Keep each agent turn to **one behavior + one verification**.

**Good slice:**
```
"Add the `selectTopSkills` function to skill-chain.ts.
It takes (taskTitle, chain, maxSkills=3), returns ChainStep[].
Mandatory steps always first. Optional steps ranked by BM25 overlap. Test it."
```

**Bad slice:**
```
"Refactor the whole skill system to be smarter about context"
```

For 3+ independent tasks, use **Mode E TRIZ-Parallel** (`cm-execution`) to dispatch subagents concurrently — each gets its own scope, each self-validates.

---

### 4. Remember (NLI — plain English)

After any important decision, tell the agent in plain English:

```
remember that we use insertLearning() not raw SQL for all memory writes
remember that rootDir in tsconfig is ./src — keep all TS source under src/
important: never load more than 3 skills at once per task
```

The `cm_natural` MCP tool routes these to SQLite automatically. Future sessions retrieve them with:

```
what did we learn about TypeScript?
what did we learn about security?
```

You can also write directly:

```bash
# Via MCP tool
cm_memory_write(content="use insertLearning() not raw SQL", scope="project", importance="high")

# Via CLI (learnings JSON)
cm learnings add "use insertLearning() not raw SQL" --scope project
```

---

### 5. Gate Before Moving On

Never leave a slice "probably working":

```bash
npm run test:gate           # full quality gate
npm run test:gate:kit       # faster kit subset
npm run gate:secrets        # secret scan before push
```

If gate fails → fix now, not later. Technical debt compounds fast in vibe coding.

---

### 6. Ship

```bash
cm chain advance <exec-id> "summary of what was done"   # update context bus
git add -p                                               # review what's staged
git commit -m "feat: ..."
cm mcp-serve --print-config                             # check MCP clients are connected
```

---

## Connecting Your Agent Host (v5.1+)

### Claude Desktop

```bash
cm mcp-serve --print-config
# → copy the "Claude Desktop config" block into claude_desktop_config.json
```

### Goose

```bash
cm mcp-serve --print-config
# → copy the "Goose config" block into ~/.config/goose/config.yaml extensions
```

### Manual / any stdio MCP client

```bash
cm mcp-serve --project /path/to/your/repo
```

Once connected, the agent has access to all 15 MCP tools — memory, context bus, budget checks, skill resolution.

---

## Common Use Cases

### Fix a bug end-to-end

```bash
# 1. Start the bug-fix chain
cm chain start bug-fix "login timeout after 30s on slow connections"

# 2. Invoke debugging skill
# → reads CONTINUITY.md, loads .cm/skeleton.md
# → identifies root cause, proposes fix

# 3. Write the fix + tests (cm-tdd)
# → TDD: failing test first, then implementation

# 4. Quality gate
npm run test:gate

# 5. Advance chain
cm chain advance <id> "fixed: token refresh was not resetting the idle timer"

# 6. cm-quality-gate runs automatically as last step
```

---

### Ship a new feature

```bash
# 1. Brainstorm first (don't skip this)
# → @cm-brainstorm-idea: analyze current codebase, define problem, compare 3 options

# 2. Write the plan
# → @cm-planning: creates openspec/changes/[feature]/tasks.md + design.md

# 3. Execute
cm chain start feature-development "add payment retry flow"
# → Intelligent Skill Selection picks: planning + execution + quality-gate
# (brainstorm-idea is optional, scored low since plan already exists)

# 4. Each step: implement → test → advance
```

---

### Code review before merge

```bash
# Review the last N commits
cm chain start code-review "review payment retry feature before merge"

# Dispatch reviewer subagent:
# → reads diff, checks spec compliance, flags security issues
# → runs cm-quality-gate

# If clean → merge
git checkout main && git merge feature/payment-retry
```

---

### Context-switch without losing work

```bash
# Before switching:
# 1. Note what you were doing
cat .cm/CONTINUITY.md          # read current state

# 2. Save any learnings
# "remember that the retry logic needs exponential backoff, not fixed delay"

# 3. Gate
npm run test:gate

# When you come back:
cat .cm/CONTINUITY.md          # instantly restored — Active Goal, Next Actions
# → pick up where you left off at ~200 tokens, not 2,000
```

---

### Multi-session long project

Use `cm chain status <id>` to see pipeline progress across sessions:

```
🔗 Chain: feature-development | Status: in_progress
Step 1: planning         ✅ done  "tasks.md created, 12 tasks"
Step 2: tdd              ✅ done  "auth tests passing"
Step 3: execution        ⏳ active
Step 4: quality-gate     ⬜ pending
```

Context bus (`.cm/context-bus.json`) keeps step outputs available — `cm-execution` can read exactly which files `cm-planning` created instead of re-scanning the repo.

---

## Anti-Patterns

| Pattern | Why it fails | Fix |
|---|---|---|
| Giant prompt with full context | Exceeds token budget, degrades quality | Use L0 index + `cm_budget_check` |
| Load all 68 skills at once | SkillsBench: -2.9pp with monolithic loading | Let `cm chain auto` pick top 3 |
| Skip tests "it's just a one-liner" | One-liners break CI too | `npm run test:gate` is < 30 sec |
| Context-switch without saving | Next session re-discovers everything | Update CONTINUITY.md before switching |
| Accept AI output without verification | "Performative agreement" → silent regressions | Run the gate, read the diff |
| Commit secrets | Secret in git = permanent exposure | `npm run gate:secrets` before every push |
| Monolithic feature slice | Hard to review, hard to debug | Max 3 tasks per batch in cm-execution |

---

## Token Budget Tips

```bash
# Check budget before a big task
cm_budget_check(category="implementation", estimated_tokens=8000)

# Use L0 summaries instead of full files
cm_resolve("cm://memory/learnings")       # L0: ~300 tokens
cm_resolve("cm://memory/learnings", 1)    # L1: ~800 tokens
cm_resolve("cm://memory/learnings", 2)    # L2: full SQLite query

# Trim context bus after each chain step
cm chain advance <id> "summary"           # advance also trims stale bus entries
```

---

## Benchmark Your Setup (New in v5.1)

Don't assume CodyMaster is helping — measure it:

```bash
# Run all 3 eval suites: tdd-regression, token-efficiency, memory-retention
cm bench

# Run a specific suite
cm bench --suite tdd-regression --runs 5

# Save results
cm bench --output reports/baseline-$(date +%Y%m%d).json
```

Compare `with-codymaster` vs `baseline` columns to see your actual improvement. See [CodyBench methodology](../benchmark/README.md).

---

## Quick Reference Card

```bash
cm chain auto "describe task"           # start best-fit pipeline
cm chain status                         # see all active chains
cm chain advance <id> "summary"         # complete step, move forward
cm mcp-serve --print-config             # get config for Goose / Claude Desktop
cm bench                                # run A/B eval suites
cm dashboard start                      # open kanban at localhost:6969
cm index skeleton                       # regenerate .cm/skeleton.md
cat .cm/CONTINUITY.md                   # restore session context
npm run test:gate                       # quality gate (must pass before merge)
```

---

## Next Steps

- [Installation](./installation.md)
- [How It Works](./how-it-works.md)
- [Skills Library](../skills/index.md)
- [Goose Integration](../integrations/goose.md)
- [Use Cases](../resources/use-cases.md)
- [API Reference](../api/api-reference.md)
