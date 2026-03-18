# CodyMaster Showcase

> Step-by-step examples showing CodyMaster in action.  
> Each example includes the exact commands you'll use and what happens behind the scenes.

---

## Example 1: Build a Dashboard Feature

**Scenario:** You want to build a revenue analytics dashboard with charts, filters, and export.

### Step 1: Initialize Working Memory

```bash
$ cm continuity init

✅ Working memory initialized!
   Created: /Users/you/my-project/.cm/
   ├── CONTINUITY.md     (working memory)
   ├── config.yaml       (RARV settings)
   └── memory/
       ├── learnings.json (error patterns)
       └── decisions.json (architecture decisions)

💡 Protocol: Read CONTINUITY.md at session start, update at session end.
```

### Step 2: Plan with AI Agent

Open your AI agent (Antigravity, Claude Code, Cursor, etc.) and type:

```
@[/cm-planning] Build a revenue analytics dashboard with:
- Monthly revenue chart (bar + line)
- Customer filter by segment
- Export to CSV/PDF
- Responsive mobile layout
```

**What happens:**  
The agent reads `cm-planning` skill → brainstorms architecture → writes `implementation_plan.md` → asks for your approval.

### Step 3: Execute Autonomously

After approving the plan:

```
@[/cm-execution] Execute the approved plan using Mode D (RARV)
```

**Behind the scenes:**

```
🧠 ORIENT: Read CONTINUITY.md — no prior learnings
📋 REASON: Task 1/5 — "Setup chart component with D3.js"
🛡️ PRE-ACT: Goal aligned ✅
🧪 ACT: cm-tdd → write test for chart rendering → implement component
📝 REFLECT: Chart component complete, 4 tests passing
✅ VERIFY: Quality gate passed — 100% coverage

🧠 ORIENT: Read updated CONTINUITY.md — 1 task done
📋 REASON: Task 2/5 — "Build filter API endpoint"
...
```

### Step 4: Monitor on Dashboard

```bash
$ cm dashboard start

🚀 CodyMaster Dashboard v3 at http://localhost:6969
```

Open browser → see Kanban board with tasks moving from backlog → in-progress → done.

### Step 5: Check Judge Agent

```bash
$ curl -s http://localhost:6969/api/judge | python3 -m json.tool

{
    "task-1": { "action": "COMPLETE", "badge": "🏁" },
    "task-2": { "action": "CONTINUE", "badge": "🟢" },
    "task-3": { "action": "ESCALATE", "badge": "⚠️", "reason": "Stuck 12 min" }
}
```

### Step 6: Deploy

```
@[/cm-safe-deploy] Deploy to staging
```

The 8-gate pipeline runs automatically:
```
✅ Gate 1: Secrets check — clean
✅ Gate 2: Syntax validation — 0 errors
✅ Gate 3: Test gate — 24/24 passed
✅ Gate 4: Build — success
✅ Gate 5: Deploy to staging — live
✅ Gate 6: Smoke test — all endpoints responding
🚀 Staging URL: https://staging.your-app.com
```

---

## Example 2: Fix a Production Bug

**Scenario:** Users report "login button does nothing on mobile."

### Step 1: Investigate (Don't Guess!)

```
@[/cm-debugging] Users report login button unresponsive on mobile Safari
```

**The agent's investigation process:**

```
Phase 1: Reproduce
  → Open mobile viewport in browser
  → Confirm: click event not firing on iOS Safari

Phase 2: Narrow Down
  → Check event listeners → found: button uses 'mousedown' instead of 'click'
  → iOS Safari doesn't fire 'mousedown' on tap

Phase 3: Root Cause
  → Root cause: Non-standard event listener
  → File: src/components/LoginButton.tsx:47
  → Line: element.addEventListener('mousedown', handleLogin)

Phase 4: Evidence
  → MDN docs confirm: use 'click' or 'touchstart' for cross-browser
```

### Step 2: Fix with TDD

```
@[/cm-tdd] Fix the login button to work on mobile Safari
```

**TDD cycle:**

```
🔴 RED:   Write test — "login button fires on touch event"
          → Test fails (expected: event fires, actual: no event)

🟢 GREEN: Change 'mousedown' → 'click' in LoginButton.tsx
          → Test passes

🔄 REFACTOR: Clean up event handler, add JSDoc
          → All tests still pass
```

### Step 3: Capture Learning

The RARV cycle automatically captures this:

```yaml
# .cm/CONTINUITY.md → Mistakes & Learnings
- What failed: Login button unresponsive on iOS Safari
  Why: Used 'mousedown' event — not supported on iOS Safari touch
  Prevention: Always use 'click' event for buttons, never 'mousedown'
```

**Next time any agent works on button events, CONTINUITY.md warns them.**

### Step 4: Deploy the Fix

```
@[/cm-safe-deploy] Deploy hotfix to production
```

---

## Example 3: Working Memory in Action

**Scenario:** You work on a feature across 3 sessions over 2 days.

### Session 1 (Monday morning)

```bash
$ cm continuity status

🧠 Working Memory Status

  Project:     my-saas-app
  Phase:       idle
  Iteration:   0
  Goal:        [No active goal set]
```

You start working:

```
@[/cm-planning] Build multi-tenant billing system
```

End of session — CONTINUITY.md auto-updates:

```markdown
# Working Memory
Active Goal: Build multi-tenant billing system
Current Task: Schema design for tenants table
Just Completed:
  - Reviewed Stripe API docs
  - Drafted ER diagram for 3 tables

Mistakes & Learnings:
  - Stripe webhooks require idempotency keys — nearly missed this

Files Modified:
  - docs/billing-schema.md → Created ER diagram
```

### Session 2 (Monday afternoon)

Agent reads CONTINUITY.md at session start:

```
🧠 ORIENT: Goal = "multi-tenant billing"
           Active task = "Schema design"
           Learning: "Stripe needs idempotency keys"
           → Context fully restored in 200 tokens ✅
```

**Without working memory:** Agent would need 2000+ tokens of re-explanation.

### Session 3 (Tuesday)

```bash
$ cm continuity status

🧠 Working Memory Status

  Project:     my-saas-app
  Phase:       executing
  Iteration:   5
  Goal:        Build multi-tenant billing system

  ✅ Completed: 8  |  🚧 Blockers: 0
  📚 Learnings: 3  |  📋 Decisions: 2
  🕐 Updated:   14 hours ago
```

Agent picks up exactly where Session 2 left off.

---

## Example 4: Dynamic Agent Selection

**Scenario:** You created a task but aren't sure which AI agent should handle it.

```bash
# Ask CodyMaster which agent is best for TDD work
$ curl -s "http://localhost:6969/api/agents/suggest?skill=cm-tdd"

{
  "skill": "cm-tdd",
  "domain": "engineering",
  "agents": ["claude-code", "cursor", "antigravity"]
}
```

```bash
# For UX design work
$ curl -s "http://localhost:6969/api/agents/suggest?skill=cm-ux-master"

{
  "skill": "cm-ux-master",
  "domain": "product",
  "agents": ["antigravity", "claude-code", "cursor"]
}
```

**Domain → Agent Affinity:**

| Domain | Best | Good | Acceptable |
|--------|------|------|------------|
| 🔧 Engineering | Claude Code | Cursor | Antigravity |
| ⚙️ Operations | Claude Code | Antigravity | Cursor |
| 🎨 Product | Antigravity | Claude Code | Cursor |
| 📈 Growth | Antigravity | Claude Code | Cursor |
| 🎯 Orchestration | Antigravity | Claude Code | Cursor |

---

## Example 5: 6-Gate Quality Verification

**Scenario:** You're about to deploy and want full verification.

```
@[/cm-quality-gate] Run full 6-gate check before production deploy
```

**Gate execution flow:**

```
━━━ Gate 1: Static Analysis ━━━━━━━━━━━━━━━━━━━━━━━━
$ npx tsc --noEmit
✅ 0 type errors
$ npx eslint . --max-warnings=0
✅ 0 warnings

━━━ Gate 2: Test Coverage ━━━━━━━━━━━━━━━━━━━━━━━━━━
$ npm run test:gate
✅ 42 tests passed | 0 failed | 87.3% coverage

━━━ Gate 3: Blind Code Review ━━━━━━━━━━━━━━━━━━━━━━
$ git diff --staged > /tmp/review-diff.txt
🔍 Reviewing diff without implementation context...
⚠️  Found: Missing null check in api/billing.ts:23
⚠️  Found: SQL query not using parameterized input in api/users.ts:45
📋 Result: REQUEST_CHANGES (2 issues)

━━━ [FIX REQUIRED] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fixing 2 issues...
Re-running Gate 3...
✅ APPROVE — 0 issues after fix

━━━ Gate 4: Anti-Sycophancy ━━━━━━━━━━━━━━━━━━━━━━━━
(Gate 3 found issues, so this gate was already validated)
✅ CONFIRMED — No additional hidden issues

━━━ Gate 5: Security Scan ━━━━━━━━━━━━━━━━━━━━━━━━━━
Checking for secrets in source...
✅ No hardcoded secrets found
$ npm audit --production
✅ 0 vulnerabilities

━━━ Gate 6: i18n Integrity ━━━━━━━━━━━━━━━━━━━━━━━━━
Checking locale file parity...
✅ vi.json (234 keys) = en.json (234 keys) = th.json (234 keys)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 ALL 6 GATES PASSED — Safe to deploy!
```

---

## Example 6: Tracking Setup for Marketing

**Scenario:** Launch a new product page and set up conversion tracking.

```
@[/cm-ads-tracker] Setup tracking for our new SaaS landing page:
- Facebook Pixel ID: 123456789
- TikTok Pixel ID: ABC123
- Google Ads Conversion ID: AW-987654321
- Events: PageView, Lead (form submit), Purchase
```

**Output:** Complete tracking implementation document:

| Platform | Events | Method |
|----------|--------|--------|
| Meta/Facebook | PageView, Lead, Purchase | Pixel + CAPI |
| TikTok | PageView, SubmitForm, PlaceAnOrder | Pixel + Events API |
| Google Ads | page_view, generate_lead, purchase | Enhanced Conversions |
| GTM | All above via container | Tags + Triggers + Variables |

Plus: UTM conventions, attribution model, deduplication strategy.

---

## Example 7: Self-Enhancing Skill Discovery

**Scenario:** You need to set up Prisma ORM, but CodyMaster has no built-in Prisma skill.

### Step 1: Agent Detects the Gap

```
@[/cm-planning] Setup Prisma ORM with PostgreSQL for our user management
```

The agent realizes it doesn't have a Prisma-specific skill:

```
🧠 DETECT: "I need Prisma expertise but don't have a matching cm-* skill"
🔍 SEARCH: npx skills find "prisma"
```

### Step 2: Search & Recommend

```
🔍 Found 2 relevant skills on skills.sh:

1. "prisma-best-practices" by vercel-labs/agent-skills
   📊 12K installs | ⭐ Trusted source
   📝 Prisma schema design, migrations, type-safe queries

2. "database-schema-design" by vercel-labs/agent-skills
   📊 8K installs | ⭐ Trusted source
   📝 General DB schema patterns, normalization, indexing

→ Install both? (Y/n)
```

### Step 3: Install & Use

```bash
✅ Installed: prisma-best-practices (global)
✅ Installed: database-schema-design (global)
📋 Logged to .cm-skills-log.json

→ Now applying Prisma best practices to your project...
```

### Step 4: Skills Persist

Next project that needs Prisma → skills are already installed globally. No re-discovery needed.

```bash
$ npx skills list

Global skills:
  ✅ find-skills (vercel-labs/skills)
  ✅ prisma-best-practices (vercel-labs/agent-skills)
  ✅ database-schema-design (vercel-labs/agent-skills)
  ✅ web-design-guidelines (vercel-labs/agent-skills)
  ...
```

---

## Example 8: Universal Agent Bootstrap

**Scenario:** You're setting up a new SaaS project and your team uses Claude Code, Cursor, and Antigravity.

### Step 1: Bootstrap the Project

```
@[/cm-project-bootstrap] New SaaS project called "InvoiceFlow"
```

### Step 2: Agent Platform Selection (Phase 6.5)

```
🌐 AGENT PLATFORM SETUP
(Select all platforms your team uses)

[x] AGENTS.md (Open Standard)     — Always generated
[x] Claude Desktop / Claude Code   — CLAUDE.md
[x] Cursor                         — .cursor/rules/*.mdc
[ ] OpenClaw / MaxClaw
[ ] OpenFang
[ ] Manus
[ ] Kimi Claw
[x] Gemini / Antigravity           — Uses AGENTS.md directly
```

### Step 3: Auto-Generated Configs

```
✅ Generated from AGENTS.md:

📄 AGENTS.md              — Universal manifest (source of truth)
📄 CLAUDE.md               — Claude-specific context + safety rules
📁 .cursor/rules/
   ├── project.mdc         — Project overview with globs
   ├── coding-style.mdc    — Conventions + design tokens
   └── safety.mdc          — Never/Confirm/Always guardrails
📄 .project-agent-compat.json — Platform tracking

All files auto-generated. Never edit derived files directly.
```

### Step 4: Keep Configs in Sync

```bash
# After updating AGENTS.md, regenerate platform configs:
$ npm run agent:sync

✅ Regenerated CLAUDE.md from AGENTS.md
✅ Regenerated .cursor/rules/*.mdc from AGENTS.md
✅ Updated .project-agent-compat.json
```

**Result:** Every AI agent on the team reads the same project rules, guardrails, and conventions — regardless of which platform they prefer.

---

## CLI Quick Reference

```bash
# Dashboard
cm dashboard start           # Launch on default port 6969
cm dashboard start -p 8080   # Custom port

# Working Memory
cm continuity init            # Create .cm/ directory
cm continuity status          # View current state
cm ctx status                 # Alias for above
cm continuity learnings       # View error patterns
cm continuity decisions       # View architecture decisions
cm continuity reset           # Clear state (keeps learnings)

# Project Management
cm project new <name>         # Create new project
cm task add <title>           # Add task to backlog
cm task list                  # View all tasks
cm dispatch <task-id>         # Send task to AI agent

# Version
cm --version                  # 3.1.0
cm --help                     # Full command list
```
