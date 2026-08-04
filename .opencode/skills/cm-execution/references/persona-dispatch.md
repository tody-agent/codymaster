# Persona Dispatch

> Used by Mode B, Mode E, and Mode F.

## Role selection

| Task signal | Persona | File |
|---|---|---|
| design, architecture, trade-off | architect | `agents/architect.md` |
| implement, fix, refactor | engineer | `agents/engineer.md` |
| scope, intent, user story | pm | `agents/pm.md` |
| secret, auth, input validation, deploy | security | `agents/security.md` |

Mode B uses three lifecycle roles even when two roles share the reviewer persona:

| Lifecycle role | Responsibility | Session rule |
|---|---|---|
| implementer | implement, test, self-review | fresh per task; resume the same session for fixes |
| spec-reviewer | acceptance criteria, scope, interfaces | fresh and independent from implementer |
| quality-reviewer | correctness, clarity, maintainability, tests | fresh and independent from implementer; runs only after spec pass |

## Harness mapping

Use the platform's native subagent/persona type when it supports isolated sessions. Otherwise load the persona file as the inner system prompt. A label change inside one session is persona rotation, not reviewer independence.

For Codex, initial roles use separate `codex exec` sessions. Preserve the implementer's session ID only for a requested fix; never resume it for either reviewer. Pass the `codymaster-subagent-task@1` envelope as a direct argument or stdin, without shell interpolation.

Programmatic harness integrations import `orchestrateModeB` and `createAgentBackendModeBHarness` from `codymaster/mode-b`. The factory rejects backends that do not declare isolated, resumable session capability so the coordinator can take the documented fallback.

## Multi-persona tasks

- Mode B: chain implementer → spec reviewer → quality reviewer through the orchestrator.
- Mode E: assign one primary persona per independent task and retain conflict pre-flight.
- Mode F: rotate personas sequentially in one agent and state that reviews are not independent.
