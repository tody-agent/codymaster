---
name: cm-how-it-work
description: "Complete guide to vibe coding with the Cody Master skill kit — from idea to deploy. Covers the full workflow, skills used at each phase, and common use cases. Read this first if you are new; reference it whenever you're unsure which skill to invoke."
---

# Cody Master Kit — The Ultimate Vibe Coding Guide

## Overview

The **Cody Master (CM)** kit transforms ideas into production code through 13 specialized, optimized skills. This workflow ensures the highest quality, absolute security, and maximum execution speed.

```
💡 Idea → 🔍 Analysis → 📐 Design → 🧪 Test-first (TDD) → 💻 Code → ✅ Verify → 🚀 Deploy → 🔄 Iterate
```

---

## Workflow

### Phase 0: Identity & Safety 🔒
> **Rule #1:** Always verify identity before performing any action that could change the project state.

- **Skill:** `cm-identity-guard`
- **When:** At the start of a work session, before git push, deploy, or database operations.
- **Action:** Run `node check-identity.js` (or similar script) to verify GitHub/Cloudflare/Supabase accounts.

---

### Phase 0.5: Strategic Analysis 🔍
> **For complex initiatives and enhancements on existing products.**

- **Skill:** `cm-brainstorm-idea`
- **When:** When the task is complex and requires multi-dimensional analysis (tech, product, design, business) before planning.
- **Action:**
    1. Scan codebase and interview user (Design Thinking: Empathize).
    2. Analyze with 9 Windows (TRIZ) to see the full picture across past/present/future.
    3. Propose 2-3 options, evaluate multi-dimensionally, recommend the best option.
- **Output:** `brainstorm-output.md` — qualified problem + recommended option → passes to `cm-planning`.

---

### Phase 1: Planning & Design 📐
> **Understand the 'Job to be Done' (JTBD) and architecture before writing code.**

- **Skill:** `cm-planning` (Combines brainstorming + writing-plans)
- **Action:**
    1. Brainstorm requirements and analyze i18n.
    2. Propose architecture and tech stack.
    3. Write detailed `implementation_plan.md`.
- **Output:** Design documentation and execution plan approved by user.

---

### Phase 2: Implementation (TDD & Execution) 💻
> **Turn the plan into actual source code safely.**

- **Skills:**
    - `cm-tdd`: Red-Green-Refactor cycle. No production code without a failing test first.
    - `cm-execution`: Execute plans intelligently (Manual, Parallel, or Subagent mode).
    - `cm-project-bootstrap`: For new projects — setup repo, i18n, SEO, and deploy pipeline from Day 0.
    - `cm-git-worktrees`: Isolate different work items to avoid state mixing.

---

### Phase 3: Quality Control & Verification ✅
> **Prove with evidence, not words.**

- **Skills:**
    - `cm-quality-gate`: Setup test infrastructure (`test:gate`) and verify output before claiming "done".
    - `cm-debugging`: When tests fail, use systematic investigation framework to find root cause.
    - `cm-code-review`: Professional request and feedback review process.

---

### Phase 4: Safe Deployment 🚀
> **Ship code without fear of incidents.**

- **Skills:**
    - `cm-safe-deploy`: Run 8-gate pipeline (Secret → Syntax → Test → Build → Deploy → Smoke).
    - `cm-safe-i18n`: Translate and synchronize languages consistently across the entire project.
    - `cm-terminal`: Monitor all terminal commands to detect errors immediately.

---

## Cody Master Kit — 14 Skills Summary

| # | Skill | Primary Function |
|---|-------|-----------------|
| 1 | `cm-project-bootstrap` | Initialize project with 10-phase standard setup. |
| 2 | `cm-brainstorm-idea` | Strategic analysis: 9 Windows + Double Diamond → 2-3 options. |
| 3 | `cm-planning` | Explore ideas and create execution plans. |
| 4 | `cm-execution` | Run implementation plan (Manual/Parallel/Subagent). |
| 5 | `cm-tdd` | Strict Test-Driven Development workflow. |
| 6 | `cm-quality-gate` | Setup test files + Verification before claim/deploy. |
| 7 | `cm-code-review` | Manage PR lifecycle and feedback. |
| 8 | `cm-safe-deploy` | 8-gate automated deployment pipeline. |
| 9 | `cm-safe-i18n` | Safe multi-language management and translation. |
| 10 | `cm-debugging` | Systematic error investigation (Root cause first). |
| 11 | `cm-terminal` | Safe terminal command execution protocol. |
| 12 | `cm-git-worktrees` | Isolate code environments by task. |
| 13 | `cm-skill-mastery` | Find, install, and create new skills. |
| 14 | `cm-identity-guard` | Protect project from wrong account/project deploys. |

## 🚀 Autonomous Workflow System

The kit supports autonomous mode by applying the **Reason → Act → Reflect → Verify (RARV)** loop.

### How to Use the Workflow:
1. **`/cm-start [objective]`**: Start work. The system will automatically create `cm-tasks.json`, break down tasks, launch the tracking interface, and autonomously use CM skills to complete them.
2. **`/cm-dashboard`**: Open the visual tracking Dashboard in browser (shows Kanban board, reasoning log, and progress).
3. **`/cm-status`**: View quick progress summary in Terminal.

---

## 💡 Activation Guide by Use Cases

There are 2 ways to use Cody Master: **Fully autonomous (Via Workflows)** or **Manual skill activation (Via Prompting)**.

### 1. Build New Feature / New Project (Autonomous)
> Best way to delegate complete work packages.
- **Command:** `/cm-start "Build user management feature with list screen and CRUD form"`
- **Implicit flow:** Planning → create Task JSON → sub-agents continuously run `cm-tdd` and `cm-quality-gate` for each task until done.

### 2. Fix Production Bug (Manual)
> Bugs need close supervision and AI should not blindly change too much code.
- **Step 1:** Activate `cm-debugging` to find Root Cause.
- **Step 2:** Activate `cm-tdd` to write test reproducing the bug and fix it.
- **Step 3:** Activate `cm-safe-deploy` to ship code safely.

### 3. Setup New Project From Scratch
> Establish a solid foundation to avoid technical debt later.
- **Command:** "Use `cm-identity-guard` to ensure correct account, then run `cm-project-bootstrap` to setup a new Next.js project."

### 4. Batch Multi-Language Translation
> Tedious work that's error-prone if AI loses focus.
- **Command:** "Use `cm-safe-i18n` to extract all hardcoded text in `/components` directory to `vi.json` and `en.json` files."

---

## 8 Golden Rules

1. **Identity First:** Verify account (`cm-identity-guard`) before push/deploy.
2. **Design Before Code:** Always have an approved plan before typing.
3. **i18n Day 0:** Always consider multi-language from the brainstorm step.
4. **Test Before Code:** RED → GREEN → REFACTOR. No exceptions.
5. **Evidence Over Claims:** Only trust terminal/test results output, not AI "saying" it's done.
6. **Deploy via Gates:** 8 gates must pass sequentially. Any gate fails = STOP.
7. **Safe Secrets:** Never commit secrets. Use `.dev.vars` or manage via Cloudflare.
8. **Parallel Power:** Use parallel execution for i18n or multi-bug fixes.
