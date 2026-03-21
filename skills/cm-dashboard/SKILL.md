---
description: Open visual Dashboard to track work status (Simulated Kanban board)
---

# Command: `/cm-dashboard`

When this command is called, the AI Assistant should:

1. **Check status:** Find and read the `task.md` (or `cm-tasks.json`) file in the current project directory (or artifacts directory).
2. **Visual display:** Aggregate tasks and render them as a Kanban board (Markdown table) with 3 columns:
   - **🔴 TO DO** (Not started)
   - **🟡 IN PROGRESS** (In progress)
   - **🟢 DONE** (Completed)
3. **Flow report:** Briefly summarize which Mode the Agent is in (PLANNING, EXECUTION, or VERIFICATION) and what the Next Step is.
