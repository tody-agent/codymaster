---
title: Dashboard (Mission Control)
description: Start, stop, and use the CodyMaster dashboard server — default port, PID file, and how it relates to kanban data.
keywords: codymaster dashboard, mission control, express dashboard
robots: index, follow
---

# Dashboard (Mission Control)

## What it is

The dashboard is an **Express** app started via `cm dashboard` (aliases `dash`). It serves the Mission Control UI and APIs backed by the same JSON store as CLI project commands (`src/dashboard.ts`, `src/data.ts`).

## Commands

From `src/cli/commands/dashboard.ts`:


| Command               | Purpose                                       |
| --------------------- | --------------------------------------------- |
| `cm dashboard start`  | Launch server (default if subcommand omitted) |
| `cm dashboard stop`   | Stop using PID file                           |
| `cm dashboard status` | Show running / stopped                        |
| `cm dashboard open`   | Open browser                                  |
| `cm dashboard url`    | Print base URL                                |


## Default port and files

- **Default port:** `6969` (`DEFAULT_PORT` in `src/data.ts`).
- **PID file:** `~/.codymaster/dashboard.pid` (`PID_FILE` in `src/data.ts`).
- **Data file:** `~/.codymaster/kanban.json` — projects, tasks, deployments, changelog, chain executions.

## Custom port

```bash
cm dashboard start -p 7070
```

## Troubleshooting

- If status says running but the page fails, check for stale PID files (the CLI attempts cleanup — see `src/cli/commands/dashboard.ts`).
- Ensure nothing else is bound to the chosen port.

## See also

- [Data flow](../architecture/data-flow.md)  
- [CLI command reference](../cli/command-reference.md)

