# CodyMaster Output Convention

All skill outputs should be saved in `.cm/outputs/` for consistency.

## Structure

```
.cm/outputs/
├── brainstorms/    ← cm-brainstorm-idea output
├── plans/          ← cm-planning implementation plans
├── reviews/        ← cm-code-review output
└── deploys/        ← cm-safe-deploy logs and reports
```

## Naming

`{date}-{slug}.md` — e.g., `2026-03-23-user-auth-plan.md`

## Rules

- If `.cm/outputs/` doesn't exist, create it automatically
- Always use slug-case for filenames
- Brainstorm outputs go in `brainstorms/`, not project root
- Deploy logs go in `deploys/`, not terminal-only
