# Skill install profiles (Antigravity / Windsurf / token budget)

Use with `install.sh`:

```bash
bash install.sh --gemini --profile core
bash install.sh --antigravity --profile core
bash install.sh --windsurf --profile core
```

- **core** — Orchestration, TDD, debugging, quality gates, deploy, secrets, identity, terminal (~21 skills). Recommended for global `~/.gemini/antigravity/skills`.
- **growth** — Ads tracking, CRO, content factory, forms, dashboard, etc. Add on top of core (re-run install to the same target) or install only into a workspace project folder.
- **design** — UX Master, design system, UI preview, JTBD, brainstorm.
- **knowledge** — Dockit, NotebookLM skill, deep search, code intelligence, project bootstrap, reactor.
- **full** — All skills (default when `--profile` is omitted). Same set as [full.txt](full.txt).

**Global vs workspace:** Keep **core** in user global skills; add **growth** / **design** / **knowledge** under the project (e.g. `.gemini/antigravity/skills` in repo) so every session does not load the full catalog.

**MCP:** Disable unused MCP servers in the IDE to avoid retry loops when a server errors; heavy external tools belong in optional profiles, not core.

**Maintainers:** When adding a new `skills/cm-*` folder, update [full.txt](full.txt) and add the skill to the appropriate optional profile (`growth`, `design`, or `knowledge`) if it is not part of `core`.
