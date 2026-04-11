---
title: Use Cases
description: Practical CodyMaster use cases — solo vibe coding, team agent ops, memory management, Goose integration, and benchmarking with v5.1.0.
keywords: codymaster use cases, ai workflow, team agents, vibe coding, goose, mcp
robots: index, follow
---

# Use Cases

## 1. Solo developer — "I lose context every session"

**Problem:** Every new session starts from scratch. You re-explain the codebase, re-discover decisions, redo work.

**Solution:** CodyMaster working memory restores context in ~200 tokens.

```bash
# Session start ritual (30 seconds)
cat .cm/CONTINUITY.md             # active goal, last 3 decisions, next actions
cm chain status                   # see where any active pipeline left off
```

**During the session — save decisions in plain English:**
```
remember that we use insertLearning() not raw SQL for all memory writes
remember that rootDir in tsconfig is ./src
important: exponential backoff on retry, not fixed delay
```

`cm_natural` (MCP) routes these to SQLite. Next session:
```
what did we learn about TypeScript?   → retrieves all TS-related learnings
```

**Result:** Session startup drops from 5 min re-reading code → 30 sec CONTINUITY.md scan.

---

## 2. Team — "We need visibility without another SaaS tool"

**Problem:** Shared context lives in Slack threads that disappear. No one knows what the agent did last week.

**Solution:** Local kanban + context bus + structured chain history.

```bash
# Shared board (no SaaS, runs locally or on a shared machine)
cm dashboard start               # Mission Control at http://localhost:6969

# Chain history is logged — anyone can review
cm chain history                 # all past chain runs with summaries

# Context bus persists across sessions
cat .cm/context-bus.json         # live pipeline state
```

**Agent discipline:** Every chain step writes to the bus on `chain advance`. Downstream agents read what upstream agents produced — no re-scanning the repo.

---

## 3. New feature — "Idea → ship without scope creep"

**Problem:** Features grow in scope mid-implementation. Tests are skipped. Quality gate is "I think it works".

**Solution:** Double-diamond process enforced by skill chain.

```bash
# Step 1: Qualify the problem (30-60 min — saves 3-5 days of rework)
# → @cm-brainstorm-idea: 9 Windows analysis, 3 options, scoring matrix

# Step 2: Write the plan
# → @cm-planning: openspec/changes/[feature]/tasks.md + design.md

# Step 3: Execute with Intelligent Skill Selection
cm chain start feature-development "add payment retry flow"
# → auto-picks top 3 steps: execution + tdd + quality-gate

# Step 4: TDD for each task — failing test first
# Step 5: Quality gate must pass before chain advances
npm run test:gate
```

**Key:** `cm-brainstorm-idea` forces you to compare options *before* coding. This is the most skipped step and the most valuable.

---

## 4. Bug fix — "Root cause, not symptoms"

**Problem:** Fix applied → same class of bug reappears two weeks later in a different file.

**Solution:** bug-fix chain with learning capture.

```bash
cm chain start bug-fix "login timeout after 30s on slow connections"
# → Step 1: cm-debugging (5 Whys, root cause, not symptoms)
# → Step 2: cm-tdd (regression test first, then fix)
# → Step 3: cm-quality-gate (full suite must pass)
```

After fix is confirmed:
```
remember that token refresh must reset the idle timer on every API response
```

This learning is retrieved automatically next time someone works on auth — preventing the same class of bug.

---

## 5. Code review — "Consistent reviews, not mood-based"

**Problem:** Review quality depends on reviewer energy. Security issues get missed. Spec drift goes unnoticed.

**Solution:** `cm-code-review` chain with spec compliance + security checks.

```bash
cm chain start code-review "review payment retry PR before merge"
# → Step 1: cm-code-review (spec compliance, logic, security)
# → Step 2: cm-quality-gate (tests, coverage)
# → Step 3: cm-safe-deploy (deployment safety checks)
```

Reviewer subagent checks:
- Does implementation match `openspec/changes/[feature]/tasks.md`?
- Any OWASP top-10 patterns? (XSS, path traversal, injection)
- Token budget within budget?
- Test coverage adequate?

**Red flag to watch:** "Performative agreement" — agent says "good catch, fixed" without verifying. Always run the gate after review.

---

## 6. Goose / Claude Desktop integration (new in v5.1)

**Problem:** Your agent host (Goose, Claude Desktop) doesn't know your project memory.

**Solution:** `cm mcp-serve` exposes all 15 memory + context tools over stdio.

```bash
# Get config snippet for your client
cm mcp-serve --print-config

# Goose: paste the YAML block into ~/.config/goose/config.yaml
# Claude Desktop: paste the JSON block into claude_desktop_config.json
```

Once connected, the agent can call:
- `cm_query("auth token")` — FTS5 search across all learnings
- `cm_resolve("cm://pipeline/current")` — read live chain state
- `cm_natural("remember that…")` — persist learnings in plain English
- `cm_budget_check(category, tokens)` — pre-flight before big tasks

See [Goose Integration Guide](../integrations/goose.md) for full setup.

---

## 7. Content / growth — "Ship assets without breaking the app"

**Problem:** Marketing velocity is blocked waiting for devs to review landing page changes.

**Solution:** content-launch chain with quality gate.

```bash
cm chain start content-launch "Q2 product launch campaign"
# → Step 1: cm-content-factory (StoryBrand, copy, SEO)
# → Step 2: cm-ads-tracker (UTM, conversion tracking)
# → Step 3: cm-cro-methodology (CRO analysis)

# Still gate if changes touch code paths
npm run test:gate:kit
```

---

## 8. Security-sensitive repo — "Agents + secrets = anxiety"

**Problem:** AI agents sometimes hallucinate file paths, write hardcoded credentials, or suggest patterns that introduce vulnerabilities.

**Solution:** Guardian hooks + secret scanning + security skills.

```bash
# Before every push
npm run gate:secrets              # scans for credential patterns

# Deploy only after dry run
npm run deploy:dry                # verify deploy config before applying
```

**Skills for security-sensitive work:**
- `cm-secret-shield` — credential detection, rotation workflows
- `cm-identity-guard` — auth/authz review
- `cm-security-gate` — pre-merge OWASP audit

**Execution security rules (enforced by cm-execution):**
- Frontend: escape before innerHTML, no eval, use textContent
- Backend Python: always `safe_resolve()` for paths, no `shell=True`
- Express/Node: body size limits, prototype pollution guards

---

## 9. Long initiative across weeks — "Context doesn't survive sprints"

**Problem:** A 3-week initiative loses coherence. Different sessions make conflicting decisions. Plans drift.

**Solution:** OpenSpec + context bus + CONTINUITY.md form a persistent spine.

```
Week 1: cm-brainstorm-idea → proposal.md
Week 2: cm-planning → tasks.md + design.md
Week 3+: cm-execution + daily chain advances
```

Every session:
1. `cat .cm/CONTINUITY.md` — see active goal + decisions
2. `cm chain status <id>` — see which steps are done
3. `cm_resolve("cm://pipeline/current")` — read what upstream steps produced

Decisions accumulate in SQLite. By week 3, the agent has context that no human reviewer could manually reconstruct.

---

## 10. Measuring improvement — "Are skills actually helping?"

**Problem:** You suspect CodyMaster is helping, but you have no data.

**Solution:** CodyBench — A/B eval with and without CodyMaster.

```bash
# Run all 3 suites: tdd-regression, token-efficiency, memory-retention
cm bench

# Save a baseline before a big change
cm bench --output reports/before-v5.json

# After changes
cm bench --output reports/after-v5.json

# Compare: with-codymaster vs baseline columns
```

Results show: does TDD regression rate drop? Do token costs decrease? Does memory retrieval accuracy improve?

See [CodyBench methodology](../benchmark/README.md) for how suites are scored.

---

## See also

- [Vibe Coding Guide](../getting-started/vibe-coding-guide.md)
- [Skills Library](../skills/index.md)
- [Goose Integration](../integrations/goose.md)
- [API Reference](../api/api-reference.md)
- [Showcase](./showcase.md)
