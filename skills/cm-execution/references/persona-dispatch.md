# Persona Dispatch

> Used by Mode B, Mode E, and Mode F.

Pick persona by task signal:

| Task signal | Persona | File |
|---|---|---|
| design, architecture, trade-off | architect | `agents/architect.md` |
| implement, fix, refactor | engineer | `agents/engineer.md` |
| review, audit, verify | reviewer | `agents/reviewer.md` |
| secret, auth, input validation, deploy | security | `agents/security.md` |
| scope, intent, user story | pm | `agents/pm.md` |

## How to pass persona
- For subagents: use the platform's persona/subagent type when available.
- Otherwise: load the persona file as the system prompt for the inner call.

## Multi-persona tasks
Some tasks need two voices:
- In Mode F: run them as sequential rounds.
- In Mode B/E: chain them, usually architect first and security reviewer second.
