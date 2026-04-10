# cm-engineering-meta — quick wins + access + voice map

## Search before building

Before adding infrastructure, search in three layers:

1. **Tried-and-true** — patterns already in this repo / sibling services.
2. **New-and-popular** — current docs for your stack version.
3. **First-principles** — only when 1–2 don’t apply.

## AskUserQuestion format

When asking the human to choose:

- Short **context** (what you already know).
- Clear **question**.
- **RECOMMENDATION** (one option you’d pick and why).
- Lettered options **A / B / C** (not vague yes/no).

## Review readiness dashboard (ASCII)

Before ship, print a table:

```
| Gate        | Status | Notes |
|-------------|--------|-------|
| Tests       | ?      |       |
| Lint/Type   | ?      |       |
| Secrets     | ?      |       |
| Manual QA   | ?      |       |
```

## Completeness gap (code review)

Flag when an **80% solution** is chosen but the **100%** path costs **< 30 minutes** (tests, edge case, docs).

## Investigate Iron Law

- Do **not** patch without a **root cause** hypothesis.
- After **three** failed fix attempts, stop and question architecture or gather more data.

## Access controls (Goose-style)

- Maintain lists: **autonomous_ok** vs **confirm_required** skill groups (see `.cm/config.example.yaml`).
- Respect “stop suggesting skill X” in session notes.

## Provider abstraction

Prefer interfaces for LLM calls so **cm-second-opinion** can swap `OPENAI_API_KEY` / future providers without rewriting skills.

## Proactive skill suggestion

Infer stage from files touched and git state:

- Many `test/` edits → suggest **cm-test-gate**.
- `Dockerfile` / deploy scripts → **cm-safe-deploy** + **cm canary**.
- `rm` / migration scripts → **cm-guardian** + **cm-secret-shield**.

## Voice-friendly triggers (examples)

| Phrase (approx.) | Skill / command |
|------------------|-----------------|
| “Run a security check” | cm-secret-shield / cm-security-gate |
| “Test the website” | cm browse + cm qa-visual |
| “Code review this” | cm-code-review |
| “Deploy safely” | cm-safe-deploy |
| “Log what went wrong” | `cm retro --note "…"` |

Use Whisper / AquaVoice → paste transcript; map keywords to the table above.
