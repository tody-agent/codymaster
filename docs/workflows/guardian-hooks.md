---
title: Guardian — CLI usage and IDE hooks
description: Run cm guardian from Cursor or Codex before destructive shell commands; whitelist via .cm/config.yaml.
keywords: guardian, pre-tool hook, cursor, destructive commands
robots: index, follow
---

# Guardian hooks and safe prefixes

`cm guardian check` inspects a shell command string **before** you run it. It blocks common destructive patterns (`rm -rf /`, `git push --force`, `DROP TABLE`, pipes to `sh`, etc.) and can enforce **path freeze** roots for edits.

Config merges with defaults: copy `.cm/config.example.yaml` → `.cm/config.yaml` and edit `guardian.whitelist_prefixes` / `guardian.freeze_roots`.

## CLI examples

```bash
# Allowed (matches built-in safe prefixes such as npm run build)
cm guardian check -- npm run build

# Blocked — exits non-zero
cm guardian check -- "rm -rf /"
echo "exit=$?"   # expect 1

# Path check — only allow changes under given roots (comma-separated)
cm guardian path-check --file ./src/app.ts --roots src,lib
```

Violations append to `.cm/guardian.log`.

## Cursor — `beforeShellExecution` hook (concept)

Cursor can run a command before executing terminal/shell actions. Point it at `cm` (global) or `node /absolute/path/to/codymaster/dist/index.js`.

**Pattern:** invoke guardian with the proposed command as arguments. Exact hook file format depends on your Cursor version; typical shape:

```json
{
  "hooks": {
    "beforeShellExecution": [
      {
        "command": "cm",
        "args": ["guardian", "check", "--", "{{command}}"]
      }
    ]
  }
}
```

> Replace `{{command}}` with whatever placeholder your hook schema provides for the pending shell string. If the hook only passes the command as a single argument, you may need a thin wrapper script that builds `cm guardian check -- "$@"`.

**Behavior:** When guardian exits **1**, the hook should **block** execution; exit **0** allows the shell to proceed.

## Codex / other agents

Use the same idea: **pre-tool** or **pre-exec** step that runs:

```bash
cm guardian check -- "<proposed command>"
```

If your agent cannot chain hooks, run guardian **manually** before pasting risky commands from the model.

## Quick reference — often blocked vs allowed

| Intent | Example | Guardian |
|--------|---------|----------|
| Delete system | `rm -rf /` | Blocked |
| Force push | `git push --force` | Blocked |
| Safe build | `npm run build` | Allowed (prefix whitelist) |
| Tests | `npx vitest run` | Usually allowed if prefix matches |
| Custom safe command | `pnpm exec eslint .` | Add prefix in `.cm/config.yaml` under `guardian.whitelist_prefixes` |

## Related

- Skill: `skills/cm-guardian-runtime/SKILL.md`  
- Implementation: `src/guardian-core.ts`  
- [Engineering pipeline](./engineering-pipeline.md)
