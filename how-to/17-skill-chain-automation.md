# Skill Chain Automation

> Compose skills into automated multi-step pipelines. This guide teaches you how to create and use skill chains in CodyMaster.

## Table of Contents

1. [Overview](#overview)
2. [Built-in Chains](#built-in-chains)
3. [Creating Custom Chains](#creating-custom-chains)
4. [Chain Execution](#chain-execution)
5. [Chain Status](#chain-status)
6. [Best Practices](#best-practices)

---

## Overview

### What are Skill Chains?

Skill chains compose multiple skills into automated pipelines. One task triggers multi-skill workflows with progress tracking and auto-detection.

### Why Use Skill Chains?

- **Automate workflows** — No manual skill switching
- **Ensure quality** — Skills execute in correct order
- **Track progress** — Know where you are in the pipeline
- **Reuse patterns** — Save and share chain configurations

### Chain Architecture

```
Task → Chain Selection → Skill Execution → Progress Tracking
  │         │                  │                  │
  │         ▼                  ▼                  ▼
  │    Auto-detect        Execute skill      Update status
  │    relevant skills    with TDD           Report progress
  │                                               │
  └───────────────────────────────────────────────┘
                    Feedback Loop
```

---

## Built-in Chains

### Available Chains

| Chain | Skills | Use Case |
|-------|--------|----------|
| **bug-fix** | debugging → tdd → quality-gate | Fix production bugs |
| **feature-development** | planning → execution → quality-gate | Build new features |
| **code-review** | code-review → quality-gate → safe-deploy | Review and deploy |
| **content-launch** | content-factory → ads-tracker → cro-methodology | Marketing content |
| **refactor** | clean-code → tdd → quality-gate | Code refactoring |

### Use Built-in Chain

```bash
# Start a chain
cm chain start bug-fix "login timeout after 30s on slow connections"

# This will:
# 1. Auto-select relevant skills
# 2. Execute skills in order
# 3. Track progress
# 4. Report completion
```

### Chain Selection

```bash
# Auto-select chain
cm chain auto "fix the login timeout bug"

# Output:
# 🔗 Auto-selected chain: bug-fix
# Step 1: cm-debugging (relevance: 0.92)
# Step 2: cm-tdd (relevance: 0.87)
# Step 3: cm-quality-gate (relevance: 0.81)
```

---

## Creating Custom Chains

### Chain Definition

```json
// .cm/chains/custom-chain.json
{
  "name": "custom-feature",
  "description": "Custom feature development chain",
  "steps": [
    {
      "skill": "cm-brainstorm-idea",
      "description": "Strategic analysis",
      "optional": true
    },
    {
      "skill": "cm-planning",
      "description": "Write implementation plan"
    },
    {
      "skill": "cm-execution",
      "description": "Execute plan",
      "mode": "e"
    },
    {
      "skill": "cm-code-review",
      "description": "Review code"
    },
    {
      "skill": "cm-quality-gate",
      "description": "Verify quality"
    },
    {
      "skill": "cm-safe-deploy",
      "description": "Deploy safely"
    }
  ]
}
```

### Register Chain

```bash
# Register custom chain
cm chain register .cm/chains/custom-chain.json

# Verify registration
cm chain list
```

### Use Custom Chain

```bash
# Start custom chain
cm chain start custom-feature "add payment processing"

# This will:
# 1. Use your custom chain
# 2. Execute skills in order
# 3. Track progress
```

---

## Chain Execution

### Start Chain

```bash
# Start a chain
cm chain start bug-fix "fix login timeout"

# Output:
# 🔗 Chain: bug-fix | Status: in_progress
# Step 1: cm-debugging ⏳ active
# Step 2: cm-tdd ⬜ pending
# Step 3: cm-quality-gate ⬜ pending
```

### Advance Chain

```bash
# Complete a step
cm chain advance bug-fix "identified root cause: timeout too short"

# Output:
# 🔗 Chain: bug-fix | Status: in_progress
# Step 1: cm-debugging ✅ done
# Step 2: cm-tdd ⏳ active
# Step 3: cm-quality-gate ⬜ pending
```

### Chain Progress

```bash
# Check progress
cm chain status bug-fix

# Output:
# 🔗 Chain: bug-fix | Status: in_progress
# Step 1: cm-debugging ✅ done "identified root cause"
# Step 2: cm-tdd ⏳ active "writing regression test"
# Step 3: cm-quality-gate ⬜ pending
```

### Complete Chain

```bash
# Complete the chain
cm chain complete bug-fix "fixed: increased timeout to 30s"

# Output:
# 🔗 Chain: bug-fix | Status: completed ✅
# Step 1: cm-debugging ✅ done
# Step 2: cm-tdd ✅ done
# Step 3: cm-quality-gate ✅ done
#
# 🎉 Chain completed successfully!
```

---

## Chain Status

### View All Chains

```bash
# View all chains
cm chain status

# Output:
# 🔗 Active Chains:
# - bug-fix: in_progress (2/3 steps done)
# - feature-dev: pending (0/5 steps done)
#
# ✅ Completed Chains:
# - code-review: completed (3/3 steps done)
```

### View Specific Chain

```bash
# View specific chain
cm chain status bug-fix

# Output:
# 🔗 Chain: bug-fix | Status: in_progress
# Created: 2024-01-15T10:00:00Z
# Updated: 2024-01-15T11:30:00Z
#
# Steps:
# 1. cm-debugging ✅ done
#    Output: identified root cause: timeout too short
#    Duration: 15 min
#
# 2. cm-tdd ⏳ active
#    Started: 2024-01-15T11:00:00Z
#    Duration: 30 min (in progress)
#
# 3. cm-quality-gate ⬜ pending
```

### Chain History

```bash
# View chain history
cm chain history

# Output:
# 📜 Chain History:
# - bug-fix (2024-01-15): completed ✅
# - feature-auth (2024-01-14): completed ✅
# - code-review (2024-01-13): completed ✅
```

---

## Best Practices

### 1. Start with Built-in Chains

```bash
# Use built-in chains first
cm chain start bug-fix "fix login timeout"

# They're tested and optimized
```

### 2. Customize When Needed

```bash
# Create custom chain for your workflow
cm chain register .cm/chains/my-chain.json

# Use it
cm chain start my-chain "my task"
```

### 3. Track Progress

```bash
# Check status regularly
cm chain status

# This helps you know where you are
```

### 4. Advance After Each Step

```bash
# After completing a step
cm chain advance chain-name "completed step description"

# This updates the status
```

### 5. Complete Chains

```bash
# When done
cm chain complete chain-name "final summary"

# This marks the chain as completed
```

### 6. Archive Old Chains

```bash
# Archive completed chains
cm chain archive bug-fix

# This keeps the history clean
```

---

## Example: Complete Skill Chain

### Scenario: Fix production bug

#### Step 1: Start Chain

```bash
cm chain start bug-fix "login timeout after 30s on slow connections"

# Output:
# 🔗 Chain: bug-fix | Status: in_progress
# Step 1: cm-debugging ⏳ active
```

#### Step 2: Execute Step 1

```bash
# Debugging
/cm-debugging

# Identified root cause
cm chain advance bug-fix "root cause: timeout set to 5s, needs 30s"

# Output:
# Step 1: cm-debugging ✅ done
# Step 2: cm-tdd ⏳ active
```

#### Step 3: Execute Step 2

```bash
# Write regression test
/cm-tdd

# Test written and passing
cm chain advance bug-fix "regression test written"

# Output:
# Step 2: cm-tdd ✅ done
# Step 3: cm-quality-gate ⏳ active
```

#### Step 4: Execute Step 3

```bash
# Run quality gate
npm run test:gate

# All gates passed
cm chain advance bug-fix "quality gate passed"

# Output:
# Step 3: cm-quality-gate ✅ done
# 🔗 Chain: bug-fix | Status: completed ✅
```

#### Step 5: Complete Chain

```bash
cm chain complete bug-fix "fixed: increased timeout to 30s, added regression test"

# Output:
# 🎉 Chain completed successfully!
# 📊 Summary:
# - 3/3 steps completed
# - Total time: 45 min
# - Quality gate: PASSED
```

---

## Next Steps

- [Vibe Coding Daily Loop](./03-vibe-coding-loop.md) — Daily rhythm
- [Parallel Execution Modes](./12-parallel-execution.md) — Advanced execution
- [Team Collaboration](./13-team-collaboration.md) — Share chains with team
