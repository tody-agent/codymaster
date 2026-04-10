---

## title: CLI Command Reference
description: Current CodyMaster command groups and where they are registered and implemented in source code.
keywords: codymaster commands, cm cli, command registry
robots: index, follow

# CLI Command Reference

> [!TIP]
> **Docs map:** this page lists command *groups*. For HTTP/MCP surfaces, see [API reference](../api/api-reference.md).

> [!TIP]
> **Quick reference:** The command registry in `src/cli/command-registry.ts` is the canonical list of active command groups.

## Registered Command Groups

- `agent`, `brain`
- `dashboard`
- `project`, `deploy`, `rollback`, `history`, `changelog`
- `chain`
- `status`, `config`, `open`
- `task`
- `browse`, `guardian`, `sprint`, `second-opinion`, `qa-visual`, `canary`, `conductor`, `retro`, `suggest`
- `design-studio`
- `distro`

## Command Module Mapping

- `src/cli/commands/agent.ts`
- `src/cli/commands/dashboard.ts`
- `src/cli/commands/project.ts`
- `src/cli/commands/skill-chain.ts`
- `src/cli/commands/system.ts`
- `src/cli/commands/task.ts`
- `src/cli/commands/engineering.ts`
- `src/cli/commands/design-studio.ts`
- `src/cli/commands/distro.ts`

## Practical Verification

```bash
npm run build
node dist/index.js --help
```

Use this output when checking docs against runtime behavior.

See also:

- [Installation and Local Run](../getting-started/installation.md)
- [Engineering Pipeline](../workflows/engineering-pipeline.md)
- [Testing and Release Gates](../quality/testing-and-release.md)

