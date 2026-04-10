# cm-design-studio

> Local design-variant workspace: checklist, named variants, and a handoff stub—no external MCP required.

## When to use

- You want **2–3 UI/UX variants** documented before coding.
- You need a **repeatable handoff** from design choice to implementation agents.
- You prefer **files under `.cm/`** over ad-hoc chat-only decisions.

## Steps

1. From the repo root: `cm design-studio init`
2. Edit `.cm/design-studio/CHECKLIST.md` and `VARIANTS.md` (name options A/B/C).
3. Pick a variant; complete `.cm/design-studio/HANDOFF.md` (screens, tokens, prompt stub).
4. Run implementation skills (e.g. `cm-execution`, `cm-tdd`) **using the HANDOFF prompt stub** as the single source of truth.

Optional: `cm design-studio status` — list artifact files.

## Output

- `.cm/design-studio/README.md` — happy path
- `.cm/design-studio/CHECKLIST.md`
- `.cm/design-studio/VARIANTS.md`
- `.cm/design-studio/HANDOFF.md`

## Related

- ADR 003 (`docs/adr/003-skill-distro-and-meta.md`) for pack layout when publishing skills.
- `cm suggest` may recommend other skills based on git + sprint state.
