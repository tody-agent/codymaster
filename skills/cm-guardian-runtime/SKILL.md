---
name: cm-guardian-runtime
description: "Use when you need to check if a destructive command is blocked or run guardian freeze checks."
---
# cm-guardian-runtime — destructive command & freeze checks

## Commands

```bash
cm guardian check -- git push --force origin main    # exits 1 if blocked
cm guardian path-check --file ./src/app.ts --roots src,lib
```

## Behaviour

- Regex set for `rm -rf`, `DROP TABLE`, `git push --force`, `git reset --hard`, pipes to shell, etc.
- Prefix whitelist includes `npm run build`, `npm test`, `npx vitest`.
- Violations append to `.cm/guardian.log`.

## Investigate / debug mode

When using **cm-debugging** or root-cause work, treat **freeze roots** as mandatory: only edit inside allowed directories until the hypothesis is proven.

## Config

See `.cm/config.example.yaml` → `guardian:`. Hook patterns (Cursor / Codex): [docs/workflows/guardian-hooks.md](../../docs/workflows/guardian-hooks.md) (repo root).
