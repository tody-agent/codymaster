# Mode B — Subagent-Driven Development

> Use when: plan has independent tasks, you want to stay in this session, quality matters more than raw speed.

## Process
1. **Read plan** from `openspec/changes/[initiative-name]/tasks.md` and extract all tasks with full text.
2. **Per task:**
   - Dispatch an **implementer** subagent with full task text.
   - Answer subagent questions if any.
   - Subagent implements, tests, self-reviews, and reports back.
   - Dispatch **spec reviewer** to confirm spec match.
   - Dispatch **code quality reviewer** to confirm quality.
   - If issues appear: implementer fixes → re-review → repeat, max 2 cycles.
3. **After all tasks** → final review via `cm-code-review`.

## Prompt Template (Implementer)
```markdown
Implement [TASK_NAME]:

[Full task text from plan]

Context: [Where this fits in the project]

Rules:
- Follow TDD (cm-tdd)
- Self-review before reporting
- Ask questions if unclear

Return: Summary of what you did + test results
```

## Persona
Read `references/persona-dispatch.md` to choose engineer / reviewer / security / architect voices.

## Red Flags
- Never start on `main` or `master` without consent.
- Never skip spec review or quality review.
- Never dispatch parallel implementers in Mode B. Use Mode E for that.
- Never accept "close enough" on spec compliance.

## Common Mistakes
| Mistake | Fix |
|---|---|
| Implementer also reviews own code | Always dispatch separate reviewer |
| Prompt is vague | Paste the full task text and context |
| Re-review loop exceeds 2 cycles | Escalate: that is a planning problem |
