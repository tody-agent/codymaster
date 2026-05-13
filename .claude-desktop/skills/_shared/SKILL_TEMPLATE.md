---
name: cm-<name>
description: "<one-line trigger sentence: when to use this skill>"
token_budget: 1500
compressed: true
deprecated: false
---

# cm-<name> — <short title>

## TL;DR
- **Use when**: <trigger condition, 1 line>
- **Output**: <what artifact/state changes>
- **Handoff**: reads `.cm/handoff/<prev>.json` (if any), writes `.cm/handoff/<this>.json` (if any)
- **Chain**: typically follows `cm-<prev>`, precedes `cm-<next>`
- **Budget**: 1500 tokens (loaded full only when needed)

## When to Use
<2-4 bullets describing concrete situations. Skip if TL;DR is sufficient.>

## Adaptive Depth

Read `.cm/project-tier.md` (written by `cm tier classify`) and pick a rendering depth:

- **LITE / STANDARD** → stop after TL;DR. Skip "Full Protocol" unless the task explicitly requires deep instructions.
- **PROFESSIONAL / ENTERPRISE** → load the full protocol below.

If the tier file is absent, default to STANDARD.

## Full Protocol
<Detailed instructions, examples, rules. Agent loads this only when TL;DR is insufficient or tier ≥ PROFESSIONAL.>

### Step 1: <name>
<...>

### Step 2: <name>
<...>

## Integration

| After this skill... | Use skill |
|---|---|
| <situation> | `cm-<next>` |

## Persona Dispatch (optional)

For complex tasks, dispatch via persona subagents in `agents/`:

| Need | Persona |
|------|---------|
| Clarify scope/intent | `pm` |
| Design / trade-offs | `architect` |
| Write code | `engineer` |
| Independent review | `reviewer` |
| Threat model / scan | `security` |

## Anti-Patterns
- ❌ <thing not to do>
- ❌ <thing not to do>

## The Bottom Line
**<one-sentence rule>**
