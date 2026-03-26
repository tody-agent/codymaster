---
name: cm-start
description: Start the CM Workflow to execute your objective from idea to production code.
---

# Command: `/cm-start [your objective]`

> **Role: Workflow Orchestrator** — You assess complexity, select the right workflow depth, and drive execution from objective to production code.

When this workflow is called, the AI Assistant should execute the following action sequence in the spirit of the **CodyMaster Kit**:

0. **Load Working Memory:**
    Per `_shared/helpers.md#Load-Working-Memory`
    - Update `CONTINUITY.md` → set Active Goal to the new objective

0.5. **Skill Coverage Check (Adaptive Discovery):**
    - Scan the objective for technologies, frameworks, or patterns mentioned
    - Cross-reference with `cm-skill-index` Layer 1 triggers
    - If gap detected → trigger Discovery Loop from `cm-skill-mastery` Part C:
      `npx skills find "{keyword}"` → review → ask user → install if approved
    - Log any discovered skills to `.cm-skills-log.json`

0.7. **Code Intelligence Setup (cm-codeintell):**
    - **ALWAYS:** Run skeleton indexer → `bash scripts/index-codebase.sh` → `.cm/skeleton.md`
    - Read `.cm/skeleton.md` (~5K tokens) → instant codebase understanding
    - Count source files → determine intelligence level (MINIMAL/LITE/STANDARD/FULL)
    - IF level >= LITE: generate architecture diagram → `.cm/architecture.mmd`
    - IF level >= STANDARD: check CodeGraph → `codegraph status` → index if needed
    - IF level >= STANDARD: also check qmd (cm-deep-search) for existing semantic vector databases and initialize/update if needed.
    - Log intelligence level to `CONTINUITY.md`

1. **Understand Requirements (Planning & JTBD):**
    - Read the objective provided in the `/cm-start` command.
    - Analyze requirements, ask clarifying questions if needed (apply `cm-planning`).
    - Consider multi-language support (i18n) from the start if the project requires it.

2. **Detect Project Level:**
    Per `_shared/helpers.md#Project-Level-Detection`
    - Analyze the objective to determine L0/L1/L2/L3 complexity
    - Present detected level and recommended skill chain to the user
    - Let user confirm or override the level

3. **Execute Based on Level:**

    **L0 (Micro):** Code + Test only
    - Skip planning. Apply `cm-tdd` directly → `cm-quality-gate`

    **L1 (Small):** Planning lite → Code → Deploy
    - Apply `cm-planning` (lightweight implementation plan)
    - Apply `cm-tdd` + `cm-execution` → `cm-quality-gate`

    **L2 (Medium):** Full analysis flow
    - Apply `cm-brainstorm-idea` if problem is ambiguous
    - Apply `cm-planning` (full implementation plan with task breakdown)
    - Create `cm-tasks.json` → launch RARV autonomous execution
    - Apply `cm-quality-gate` → `cm-safe-deploy`

    **L3 (Large):** Full + PRD + Architecture + Sprint
    - Apply `cm-brainstorm-idea` (mandatory)
    - Apply `cm-planning` with FR/NFR requirement tracing
    - Sprint planning → `cm-tasks.json` with sprints
    - Apply `cm-execution` (Mode E: TRIZ-Parallel for speed)
    - Apply `cm-quality-gate` → `cm-safe-deploy`

3. **Track Progress:**
    - Create or update `cm-tasks.json` by breaking the objective into specific tasks
    - Suggest `/cm-dashboard` for visual tracking
    - Suggest `/cm-status` for quick terminal summary

4. **Complete:**
    Per `_shared/helpers.md#Update-Continuity`
    - Record any new learnings or decisions made during this workflow

> **Note for AI:** If this is a brand new project, suggest running `cm-project-bootstrap` first. If the working environment has a risk of accidentally switching accounts/projects, remind about `cm-identity-guard` (Per `_shared/helpers.md#Identity-Check`).
