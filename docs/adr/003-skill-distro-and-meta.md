---
title: 'ADR 003 — Skill pack layout and distro validation'
description: Minimal on-disk layout for shippable skill packs and CLI validation rules.
keywords: adr, skills, meta.json, cm distro validate
robots: index, follow
---

# ADR 003: Skill distro layout and validation

## Status

Accepted (validate-only CLI shipped; install/publish deferred)

## Context

Before adding `cm install` / marketplace flows, the repo needs a **stable, machine-checkable** layout for a skill folder:

- Agents and humans must find `SKILL.md` (or a buildable `SKILL.md.tmpl`).
- Optional `meta.json` should enforce **name** and **description** for discovery.

## Decision

**Required for validation to pass:**

- At least one of `SKILL.md` or `SKILL.md.tmpl` in the pack directory.

**If `meta.json` exists:**

- It must be a JSON object with non-empty string fields: `name`, `description`.

**CLI:** `cm distro validate <dir>` implemented in `src/distro-validate.ts` — warnings for tmpl without generated skill, optional meta when using tmpl only.

**Out of scope (future):** `cm distro create`, `cm install`, marketplace index format — see `skills/cm-ecosystem-roadmap/SKILL.md` and [roadmap v5](../roadmap-cm-v5.md).

## Consequences

- **Positive:** CI and local scripts can gate skill folders before merge.
- **Positive:** Same rules apply to in-repo `skills/*` and future external packs.
- **Negative:** Stricter packs may need a small `meta.json` addition — one-time cost.

## Related

- `npm run validate:skills` / `npm run check:skills`
- Skill: `skills/cm-design-studio/SKILL.md` (references this ADR)
