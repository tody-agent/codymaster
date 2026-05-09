# content-factory — extracted from CodyMaster on 2026-05-09

## Old → New

| CodyMaster | content-factory |
|---|---|
| `cm-content-factory` | `content-factory` |
| `cm-auto-publisher` | `auto-publisher` |
| `cm-notebooklm` | `notebooklm` |

## Slash command

- Old: `/cm:cm-content-factory`
- New: `/content-factory:content-factory`

## Push to its own repo

```bash
cd extracted-plugins/content-factory
git init
git add .
git commit -m "init: extracted from CodyMaster"
git remote add origin https://github.com/tody-agent/content-factory.git
git push -u origin main
```

## Coupling note

`cm-autopilot` (still in CodyMaster) historically imports the dispatcher
and dashboard scripts from `content-factory/scripts/`. After the split,
autopilot resolves the path via env var or known plugin install paths.

If you use cm-autopilot, install `content-factory` alongside it.
