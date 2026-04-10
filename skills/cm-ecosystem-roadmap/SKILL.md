# cm-ecosystem-roadmap — marketplace & distros

**In CLI today:** `cm distro validate <dir>` checks skill folder layout; see **ADR 003** (`docs/adr/003-skill-distro-and-meta.md`) for `meta.json` + tmpl rules.

**Backlog** (community scale-out):

- **`cm marketplace`** — starred skills, semver, dependency graph.
- **`cm install`** / **`cm distro create`** — preset skill packs + branding (SaaS, e-commerce, mobile, agency).
- **Publish** — npm and/or git tags as distribution channels.

Reuse **meta.json** + `SKILL.md.tmpl` from `scripts/build-skills.mjs` for reproducible skill packages.
