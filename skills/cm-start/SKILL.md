---
name: cm-start
description: Start the CM Workflow to execute your objective from idea to production code.
---

# Command: `/cm-start [your objective]`

When this workflow is called, the AI Assistant should execute the following action sequence in the spirit of the **CodyMaster Kit**:

0. **Load Working Memory (cm-continuity):**
    - Read `.cm/CONTINUITY.md` → resume from where we left off
    - Read `.cm/memory/learnings.json` → avoid past mistakes (scope-filtered)
    - Read `.cm/memory/decisions.json` → respect existing architecture decisions
    - Update `CONTINUITY.md` → set Active Goal to the new objective

1. **Understand Requirements (Planning & JTBD):**
    - Read the objective provided in the `/cm-start` command.
    - Analyze requirements, ask clarifying questions if needed (apply `cm-planning`).
    - Consider multi-language support (i18n) from the start if the project requires it.

2. **Create Plan (Task Breakdown):**
    - Automatically create or update a plan file (such as `cm-tasks.json` or `task.md`) by breaking the objective into specific tasks.
    - Write `implementation_plan.md` for this objective.

3. **Execute (Implementation):**
    - Propose starting execution of the plan.
    - Suggest applying `cm-tdd` (Test-Driven Development) for each task. Write Red tests first, then write code to pass Green, finally Refactor.
    - Suggest applying `cm-execution` to write code.

4. **Verify (Verification):**
    - Suggest using `cm-quality-gate` or `cm-code-review` to check results upon completion.

5. **Complete:**
    - Update the progress file.
    - Update `.cm/CONTINUITY.md` → Just Completed, Next Actions, Files Modified.
    - Record any new learnings or decisions made during this workflow to `.cm/memory/`.
    - Notify the user that the task is complete or move on to the next task.

> **Note for AI:** If this is a brand new project, suggest running `cm-project-bootstrap` first. If the working environment has a risk of accidentally switching accounts/projects, remind about using `cm-identity-guard`.
