# Migration: CodyMaster Plugin Split (2026-05-09)

CodyMaster v6.1 narrows its focus to **programming/dev tools**. Growth, CRO, content, and knowledge-sync skills moved to two new companion plugins.

## Why

- CM was mixing dev workflows with marketing/content tooling — confusing scope.
- Splitting reduces token footprint for users who only want one domain.
- Each plugin can now evolve independently with clearer ownership.

## Old → New mapping

### → `growth-marketing` plugin

| Old (CM) | New |
|---|---|
| `cm-booking-calendar` | `booking-calendar` |
| `cm-growth-hacking` | `growth-hacking` |
| `cm-google-form` | `google-form` |
| `cm-ads-tracker` | `ads-tracker` |
| `cm-cro-methodology` | `cro-methodology` |
| `cm-readit` | `readit` |
| `cm-jtbd` | `jtbd` |

### → `content-factory` plugin

| Old (CM) | New |
|---|---|
| `cm-content-factory` | `content-factory` |
| `cm-auto-publisher` | `auto-publisher` |
| `cm-notebooklm` | `notebooklm` |

## Action required

**This is a breaking change.** No backward-compatibility aliases ship with CM.

1. Install the companion plugin you need:
   ```bash
   /plugin install growth-marketing@growth-marketing
   /plugin install content-factory@content-factory
   ```
   (Or add the marketplace from each plugin's GitHub repo.)

2. Update any project-level references:
   - `.cm/config.yaml` — remove old skill names from profiles
   - `AGENTS.md` / `CLAUDE.md` — update mentions
   - Custom skill chains — replace `cm-X` with `X`

3. Slash commands change form:
   - Old: `/cm:cm-booking-calendar`
   - New: `/growth-marketing:booking-calendar`

## Known issue: cm-autopilot ↔ content-factory coupling

`cm-autopilot` historically reused `cm-content-factory`'s dispatcher and dashboard scripts. After the split, autopilot now resolves the content-factory script path via:

1. `$CONTENT_FACTORY_SCRIPTS` env var (override)
2. `extracted-plugins/content-factory/skills/content-factory/scripts` (dev/monorepo)
3. `~/.claude/plugins/cache/content-factory/skills/content-factory/scripts` (installed)

If you use cm-autopilot, install `content-factory` as well or set the env var.

## Repository plan

Both new plugins currently live in `extracted-plugins/` for staging. They will be pushed to dedicated GitHub repos:

- `tody-agent/growth-marketing`
- `tody-agent/content-factory`

Once published, they will be removed from this repo.
