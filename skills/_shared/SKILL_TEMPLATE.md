---
name: cm-<name>
description: "<one-line trigger sentence: when to use this skill>"
token_budget: 1500
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

## Full Protocol
<Detailed instructions, examples, rules. Agent loads this only when TL;DR is insufficient.>

### Step 1: <name>
<...>

### Step 2: <name>
<...>

## Integration

| After this skill... | Use skill |
|---|---|
| <situation> | `cm-<next>` |

## Anti-Patterns
- ❌ <thing not to do>
- ❌ <thing not to do>

## The Bottom Line
**<one-sentence rule>**
