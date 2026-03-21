---
name: cm-start
description: Start the CM Workflow to execute your objective from idea to production code.
---

# Command: `/cm-start [your objective]`

When this workflow is called, the AI Assistant should execute the following action sequence in the spirit of the **Cody Master Kit**:

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
    - Notify the user that the task is complete or move on to the next task.

> **Note for AI:** If this is a brand new project, suggest running `cm-project-bootstrap` first. If the working environment has a risk of accidentally switching accounts/projects, remind about using `cm-identity-guard`.
