---
title: "Data Flow"
description: "How data flows through Cody Master — the RARV execution cycle, skill chain pipelines, and state transitions."
keywords: ["data flow", "RARV", "skill chain", "cody master"]
robots: "index, follow"
---

# Data Flow

> **Quick Reference**
> - **Execution Model**: RARV (Reason → Act → Reflect → Verify)
> - **State Machine**: backlog → in-progress → review → done
> - **Storage**: JSON file (`cm-tasks.json`) + `.cm/` directory
> - **Pipeline**: Skill Chain Engine

## RARV Execution Cycle

Every task in Cody Master follows the RARV cycle — a 4-phase execution loop that prevents AI agents from rushing to incomplete solutions.

```mermaid
graph LR
    R1["1️⃣ REASON<br/>Read CONTINUITY.md<br/>Analyze task requirements<br/>Select skill and approach"]
    A1["2️⃣ ACT<br/>Execute selected skill<br/>Write code / make changes<br/>Log progress"]
    RF["3️⃣ REFLECT<br/>Self-review output<br/>Check against requirements<br/>Record learnings"]
    V1["4️⃣ VERIFY<br/>Run test gates<br/>Evidence-based validation<br/>Pass quality checks"]

    R1 --> A1
    A1 --> RF
    RF --> V1
    V1 -->|"Pass ✅"| DONE["✅ Done"]
    V1 -->|"Fail ❌"| R1
```

### Phase Details

| Phase | What happens | Key skill |
|-------|-------------|-----------|
| **REASON** | Read working memory, understand context, pick the right approach | `cm-continuity`, `cm-planning` |
| **ACT** | Execute the plan — write code, fix bugs, create docs | `cm-tdd`, `cm-execution`, `cm-debugging` |
| **REFLECT** | Self-review — did the output match expectations? Record errors. | `cm-code-review`, `cm-continuity` |
| **VERIFY** | Run tests, validate, gather evidence | `cm-quality-gate`, `cm-test-gate` |

## Task State Machine

Tasks flow through a kanban board with validated transitions:

```mermaid
stateDiagram-v2
    [*] --> backlog
    backlog --> in_progress : Start work
    in_progress --> review : Submit for review
    in_progress --> done : Direct completion
    in_progress --> backlog : Return to backlog
    review --> done : Approved
    review --> in_progress : Needs changes
    done --> backlog : Reopen
    done --> [*]
```

### Valid Transitions

| From | To | Trigger |
|------|----|---------|
| `backlog` | `in-progress` | Developer/agent starts work |
| `in-progress` | `review` | Work completed, needs review |
| `in-progress` | `done` | Work completed and verified |
| `in-progress` | `backlog` | Deprioritized or blocked |
| `review` | `done` | Review approved |
| `review` | `in-progress` | Review found issues |
| `done` | `backlog` | Task needs rework |

:::tip Validation
Invalid transitions are **rejected by the API**. For example, you cannot move a task directly from `backlog` to `done` — it must pass through `in-progress` first.
:::

## Skill Chain Pipeline

Complex workflows are composed as multi-step skill chains. The Chain Engine manages progress through sequential skills:

```mermaid
sequenceDiagram
    participant D as Developer
    participant CLI as CLI/Dashboard
    participant CE as Chain Engine
    participant S1 as Step 1: cm-planning
    participant S2 as Step 2: cm-tdd
    participant S3 as Step 3: cm-execution
    participant S4 as Step 4: cm-quality-gate

    D->>CLI: cm chain start feature "Add auth"
    CLI->>CE: createChainExecution()
    CE->>S1: getCurrentSkill() → cm-planning
    Note over S1: Create implementation plan

    D->>CLI: cm chain advance [id]
    CLI->>CE: advanceChain()
    CE->>S2: getCurrentSkill() → cm-tdd
    Note over S2: Write tests first

    D->>CLI: cm chain advance [id]
    CLI->>CE: advanceChain()
    CE->>S3: getCurrentSkill() → cm-execution
    Note over S3: Implement code

    D->>CLI: cm chain advance [id]
    CLI->>CE: advanceChain()
    CE->>S4: getCurrentSkill() → cm-quality-gate
    Note over S4: Final verification
    CE-->>D: ✅ Chain completed
```

## Judge Agent Decision Flow

The Judge Agent continuously monitors task health and recommends action:

```mermaid
flowchart TD
    START["Evaluate Task"]
    START --> CHECK_STUCK{"Updated > 30min ago?"}
    CHECK_STUCK -->|Yes| STUCK["⚠️ Mark as STUCK"]
    CHECK_STUCK -->|No| CHECK_SKILL{"Has skill assigned?"}

    STUCK --> SUGGEST_ACTION["Suggest: move to review/backlog"]

    CHECK_SKILL -->|Yes| MAP_DOMAIN["Map to domain"]
    CHECK_SKILL -->|No| SUGGEST_SKILL["Suggest best skill"]

    MAP_DOMAIN --> SUGGEST_AGENT["Recommend best agent"]
    SUGGEST_SKILL --> SUGGEST_AGENT

    SUGGEST_AGENT --> REPORT["Return evaluation"]
```

## Data Storage Schema

All data is stored in a single JSON file (`cm-tasks.json`):

```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "My Project",
      "path": "/path/to/project",
      "agents": ["antigravity", "claude"],
      "createdAt": "ISO-timestamp"
    }
  ],
  "tasks": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "title": "Add authentication",
      "column": "in-progress",
      "priority": "high",
      "agent": "antigravity",
      "skill": "cm-tdd",
      "order": 0,
      "createdAt": "ISO-timestamp",
      "updatedAt": "ISO-timestamp",
      "dispatchStatus": "dispatched"
    }
  ],
  "deployments": [...],
  "changelog": [...],
  "activities": [...],
  "chainExecutions": [...]
}
```

### Working Memory Files (`.cm/` directory)

```
.cm/
├── CONTINUITY.md      # Active session state
├── config.yaml        # RARV cycle settings
└── memory/
    ├── learnings.json  # Captured error patterns
    └── decisions.json  # Architecture decisions
```

## Related

- [Architecture →](./architecture.md)
- [API Reference →](./api/)
- [How It Works →](./how-it-work.md)
