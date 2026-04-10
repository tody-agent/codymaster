# cm-conductor-worktrees — parallel worktrees

## CLI

```bash
cm conductor add --at ../my-feature-wt --branch feat/my-feature --base main
cm conductor list
```

## Practice

- One **branch + worktree** per parallel agent/session.
- Reconcile with `git merge` / PR; avoid two agents editing the same files without coordination.

## ELI16 (3+ sessions)

When running **three or more** parallel sessions, re-ground each session with:

- Current branch name + worktree path.
- Last artifact from `cm sprint status` or `.cm/context-bus.json`.

## Future

Dashboard UI for active sprints is **not** in CLI yet — use `cm dashboard` / Hamster UI where available.
