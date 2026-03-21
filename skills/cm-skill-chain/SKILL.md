---
name: cm-skill-chain
description: Skill Chain Engine — compose skills into automated pipelines. One task triggers multi-skill workflows with progress tracking, auto-detection, and step management.
---

# Skill Chain Engine

> **TRIZ #40 Composite Materials** — Skills compose into pipelines.
> One command → full workflow → automated step progression.

## When to Use

ALWAYS trigger for: chain, pipeline, workflow, multi-step, end-to-end,
"run the whole thing", "full process", "feature pipeline", "bug fix flow",
"from scratch to deploy", "brainstorm to ship", "skill chain", "full pipeline"

## Quick Reference

| Command | Description |
|---------|-------------|
| `cody chain list` | Show all available chains |
| `cody chain info <id>` | Show chain pipeline details |
| `cody chain auto "task"` | Auto-detect best chain & start |
| `cody chain start <id> "task"` | Start specific chain |
| `cody chain status [exec-id]` | Show progress |
| `cody chain advance <exec-id>` | Complete current step, move to next |
| `cody chain skip <exec-id>` | Skip current step |
| `cody chain abort <exec-id>` | Cancel chain |
| `cody chain history` | View past chain runs |

## Naming Convention

Step names use short-form identifiers — the `cm-` prefix is stripped by convention.
Full skill names: `cm-brainstorm-idea`, `cm-planning`, `cm-tdd`, `cm-execution`, `cm-quality-gate`,
`cm-safe-deploy`, `cm-debugging`, `cm-content-factory`, `cm-ads-tracker`, `cm-project-bootstrap`,
`cm-code-review`. Exception: `cro-methodology` has no `cm-` prefix.

## Built-in Chains

### 🚀 feature-development (6 steps)
`brainstorm-idea → planning → tdd → execution → quality-gate → safe-deploy`

### 🐛 bug-fix (3 steps)
`debugging → tdd → quality-gate`

### 📝 content-launch (3 steps)
`content-factory → ads-tracker → cro-methodology`

### 🏗️ new-project (6 steps)
`project-bootstrap → planning → tdd → execution → quality-gate → safe-deploy`

### 🔍 cm-code-review (3 steps)
`cm-code-review → quality-gate → safe-deploy`

## Workflow

1. **Start**: Use `chain auto` for auto-detection or `chain start` for specific chains
2. **Execute**: Work through each skill step, using `@[/skill-name]` to invoke
3. **Advance**: When step is done, run `chain advance <id> "summary"`
4. **Repeat**: Continue until all steps complete
5. **Track**: Use `chain status` to monitor progress anytime

## Integration with Other Skills

- **cm-judge**: Automatically suggests `CHAIN_NEXT` action for chain-linked tasks
- **cm-continuity**: Chain progress persists across sessions via kanban data
- **Dashboard API**: Full REST API at `/api/chains` and `/api/chain-executions`

## For AI Agents

When dispatching tasks that match a chain pattern:

```
1. Check if task matches a chain: suggestChain(taskTitle)
2. If match found, suggest to user: "This task matches the X chain pipeline"
3. If user agrees, start the chain and invoke skills in order
4. After completing each skill, advance the chain
```
