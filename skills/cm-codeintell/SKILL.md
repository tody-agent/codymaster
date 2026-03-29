---
name: cm-codeintell
description: "Unified code intelligence — Skeleton Index (zero-dep, <4s) + AST knowledge graph (CodeGraph) + architecture diagrams (Mermaid) + smart context builder. Pre-indexes code structure so AI agents understand any codebase instantly. 95% token compression for onboarding. 30% fewer tokens for deep analysis."
---

# Code Intelligence — Structural Understanding for AI Agents

> **Stop scanning. Start querying.** Skeleton Index (<4s, zero deps) + AST graph + architecture diagrams = instant code understanding.
> Inspired by [CodeGraph](https://github.com/colbymchenry/codegraph) + [GitDiagram](https://github.com/ahmedkhaleel2004/gitdiagram).
> TRIZ-optimized: 10 inventive principles applied.

## When to Use

**ALWAYS for medium-to-large projects.** This is infrastructure, not an action skill.

- **Auto-triggered by:** `cm-start` Step 0.7 (project init) — **ALWAYS runs Layer 0**
- **Manually triggered for:** "understand this codebase", "what calls X?", "what breaks if I change Y?"
- **Skip when:** NEVER — Layer 0 (Skeleton) works on any project size

### Detection Thresholds (Auto-Trigger)

```
TRIGGER if ANY of these are true:
  → Project has >50 source files
  → User wants to refactor or re-code an existing project
  → User says "understand the codebase" / "what does this do?"
  → cm-execution encounters >3 grep/glob calls for one task
  → cm-debugging needs callers/callees to trace a bug
```

---

## Architecture: 4 Layers

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           cm-codeintell                                 │
├──────────────────┬──────────────────┬──────────────────┬────────────────┤
│  LAYER 0         │  LAYER 1         │  LAYER 2         │  LAYER 3       │
│  Skeleton Index  │  Code Graph      │  Architecture    │  Smart Context │
│  (Instant)       │  (Structure)     │  Diagram (Visual)│  (Synthesis)   │
├──────────────────┼──────────────────┼──────────────────┼────────────────┤
│ grep/find/awk    │ tree-sitter AST  │ File tree + LLM  │ All layers +   │
│ → skeleton.md    │ → SQLite graph   │ → Mermaid.js     │ qmd → focused  │
│ (~5K tokens)     │ → MCP server     │ → .cm/ storage   │ context packet │
├──────────────────┼──────────────────┼──────────────────┼────────────────┤
│ ZERO deps        │ codegraph_*      │ Auto-generated   │ Feeds: exec,   │
│ <4 seconds       │ MCP tools        │ at project init  │ plan, debug    │
│ ANY project size │ 50+ files        │ 20+ files        │ All consumers  │
└──────────────────┴──────────────────┴──────────────────┴────────────────┘
```

### TRIZ Principles Applied

| # | Principle | How Applied |
|---|-----------|-------------|
| **#1** Segmentation | 4 independent layers — each usable alone |
| **#2** Taking Out | Extract only signatures, discard function bodies |
| **#5** Merging | CodeGraph + GitDiagram + Skeleton → one unified skill |
| **#10** Prior Action | Pre-index at project init, not at query time |
| **#13** Inversion | Code summarizes ITSELF to agent (push, not pull) |
| **#15** Dynamicity | Adaptive: skeleton (<20) vs graph (>50) vs full (>200) |
| **#25** Self-Service | Auto-detect project size → auto-select intelligence level |
| **#28** Mechanics Substitution | Replace file reading (slow) with pattern matching (fast) |
| **#35** Parameter Changes | Unit: file content → function signature → 95% compression |
| **#40** Composite | One skill = skeleton + graph + diagrams + context builder |

---

## Layer 0: Skeleton Index (Instant — Zero Dependencies)

> **Purpose:** Lightning-fast grep-based extraction of function signatures, class definitions, exports, and module boundaries. Produces a compact `.cm/skeleton.md` that gives the agent instant understanding of any codebase.

### How It Works

```
1. SCAN     → find all source files (14 languages supported)
2. EXTRACT  → grep for function/class/export signatures only
3. GROUP    → organize by directory (module boundaries)
4. CAP      → limit per-dir (15 files) + total (600 lines)
5. OUTPUT   → .cm/skeleton.md (~5K tokens for 600-file project)
```

### Usage

```bash
# Run from project root
bash scripts/index-codebase.sh

# Custom paths
bash scripts/index-codebase.sh /path/to/project /path/to/output.md
```

### What It Extracts (Per Language)

| Language | Patterns Extracted |
|----------|-------------------|
| TypeScript/JavaScript | `export`, `function`, `class`, `interface`, `type`, `enum`, `const =`, routes |
| Python | `def`, `async def`, `class`, `@app.route`, `from...import` |
| Go | `func`, `type...struct`, `type...interface`, `package` |
| Rust | `pub fn`, `struct`, `enum`, `impl`, `trait`, `mod` |
| Java/Kotlin | `class`, `interface`, `fun`, `data class`, `package` |
| PHP | `function`, `class`, `interface`, `trait`, `namespace` |
| Ruby | `def`, `class`, `module` |
| C/C++ | function declarations, `struct`, `class`, `typedef`, `#define` |
| Swift | `func`, `class`, `struct`, `protocol`, `extension` |

### Output Format

```markdown
# 🦴 Skeleton Index: my-project

| Meta | Value |
|------|-------|
| Source Files | 127 |
| Languages | typescript(89) python(38) |
| Framework | next.js+cloudflare |

## Entry Points
- `src/index.ts`
- `app/layout.tsx`

## Directory Structure
(compact tree, depth 2)

## Code Skeleton
### `src/auth/`
**AuthService.ts**
‍‍‍
3:export class AuthService
5:export async function login(email, password)
12:export function validateToken(token)
‍‍‍

### `src/api/`
**routes.ts**
‍‍‍
8:export const router
15:router.get('/users'
22:router.post('/auth'
‍‍‍
```

### Compression Stats

```
┌──────────────────┬────────────┬────────────────┬──────────────┐
│ Project Size     │ Raw Tokens │ Skeleton Tokens│ Compression  │
├──────────────────┼────────────┼────────────────┼──────────────┤
│ 50 files (small) │ ~20,000    │ ~1,500         │ 92.5%        │
│ 200 files (med)  │ ~80,000    │ ~3,000         │ 96.3%        │
│ 600 files (large)│ ~240,000   │ ~5,000         │ 97.9%        │
└──────────────────┴────────────┴────────────────┴──────────────┘
```

### Agent Protocol

```
AT SESSION START:
  1. Check if .cm/skeleton.md exists
  2. IF exists → read it (~5K tokens) → instant codebase understanding
  3. IF not exists → run: bash scripts/index-codebase.sh
  4. Use skeleton to:
     → Know what functions exist and where
     → Understand module boundaries
     → Navigate to the right file for any task
     → Skip grep/list_dir when exploring

WHEN TO RE-GENERATE:
  → After major refactoring (>20 files changed)
  → After branch switch
  → When skeleton is >24h old
  → User requests: "re-index the codebase"
```

---

## Layer 1: Code Graph (Structure)

> **Purpose:** Pre-indexed AST-based knowledge graph. Functions, classes, imports, call relationships — all queryable instantly.

### Setup

```bash
# Install CodeGraph (one-time)
npx @colbymchenry/codegraph

# Initialize for current project
codegraph init .

# Index the codebase (tree-sitter AST extraction)
codegraph index .
```

### MCP Server Setup

Add to your MCP config (`.mcp.json`, `claude_desktop_config.json`, etc.):

```json
{
  "mcpServers": {
    "codegraph": {
      "command": "codegraph",
      "args": ["serve"]
    }
  }
}
```

### Key MCP Tools

| Tool | What It Does | Replaces |
|------|-------------|----------|
| `codegraph_context(task)` | Build focused context for a task | Multiple grep + view_file calls |
| `codegraph_search(query)` | Find symbols by name or meaning | `grep -r "pattern"` |
| `codegraph_callers(symbol)` | What calls this function? | Manual file-by-file search |
| `codegraph_callees(symbol)` | What does this function call? | Reading entire function + tracing |
| `codegraph_impact(symbol)` | What breaks if I change this? | Nothing (CM couldn't do this) |
| `codegraph_files(path)` | Project structure with metadata | `list_dir` recursive + `view_file` |
| `codegraph_node(symbol)` | Full details of one symbol | `view_file` + manual parsing |

### When Agents Use These Tools

```
INSTEAD OF:                          USE:
─────────────────────────────────    ─────────────────────────
grep -r "UserService" src/           codegraph_search("UserService")
list_dir + view_file × 10           codegraph_context("implement auth")
"What calls validatePayment?"       codegraph_callers("validatePayment")
"What if I change this class?"      codegraph_impact("UserService", depth=2)
list_dir src/ --recursive            codegraph_files("src/", format="tree")
```

### Keeping Index Fresh

```
AUTO-SYNC (built-in):
  → CodeGraph hooks auto-sync when files change (if hooks installed)

MANUAL SYNC (if hooks not installed):
  → codegraph sync .

WHEN TO RE-INDEX:
  → After major refactoring (>20 files changed)
  → After branch switch
  → When codegraph_status reports stale index

AI RULE: Before starting any task, check:
  → codegraph status .
  → If stale → codegraph sync . → then proceed
```

---

## Layer 2: Architecture Diagram (Visual)

> **Purpose:** Auto-generated Mermaid.js architecture diagram from project structure. See the big picture at a glance.

### Generation Process

```
1. EXTRACT  → Read file tree structure (codegraph_files or list_dir)
2. ANALYZE  → Identify key directories, patterns, entry points
3. GENERATE → Produce Mermaid.js diagram showing:
              - Major modules/directories
              - Key relationships (imports, API boundaries)
              - Entry points (main, routes, handlers)
              - Data flow direction
4. STORE    → Save to .cm/architecture.mmd
5. RENDER   → Display inline or via Pencil MCP
```

### Diagram Template

When generating the architecture diagram, use this Mermaid structure:

```markdown
## Architecture Diagram

​```mermaid
graph TD
    subgraph "Frontend"
        A[pages/] --> B[components/]
        B --> C[hooks/]
        C --> D[utils/]
    end

    subgraph "Backend"
        E[routes/] --> F[controllers/]
        F --> G[services/]
        G --> H[models/]
    end

    subgraph "Infrastructure"
        I[config/]
        J[middleware/]
        K[database/]
    end

    A -->|API calls| E
    G --> K
    J --> E
​```
```

### When to Generate

```
AUTO-GENERATE at:
  → cm-start Step 0.5 (project init)
  → cm-brainstorm-idea Phase 1a (codebase scan)
  → First time running cm-codeintell on a project

RE-GENERATE when:
  → Major architectural change (new module, new service)
  → User requests: "update the architecture diagram"
  → >30 files added/removed since last generation

STORE at:
  → .cm/architecture.mmd (Mermaid source)
  → Include in proposal.md when relevant
```

### Integration with Pencil MCP

If Pencil MCP is available, render the diagram visually:

```
1. Generate Mermaid code → .cm/architecture.mmd
2. If pencil MCP available → render as visual node
3. If not → display Mermaid code inline (agents can parse it)
```

---

## Layer 3: Smart Context Builder (Synthesis)

> **Purpose:** Combine graph data + diagram + text search into a focused context packet for any task.

### Context Building Protocol

When any CM skill needs to understand the codebase for a specific task:

```
1. QUERY GRAPH     → codegraph_context(task, maxNodes=20)
                     Returns: entry points, related symbols, code snippets

2. CHECK DIAGRAM   → Read .cm/architecture.mmd
                     Identify which module/layer the task affects

3. SEARCH DOCS     → IF qmd available: qmd query "task description"
                     Returns: relevant documentation, past decisions

4. COMPOSE PACKET  → Merge results into a structured context:
                     {
                       "task": "...",
                       "affected_modules": ["..."],
                       "entry_points": ["..."],
                       "related_symbols": ["..."],
                       "impact_radius": ["..."],
                       "relevant_docs": ["..."],
                       "architecture_context": "..."
                     }

5. FEED DOWNSTREAM → Pass context packet to requesting skill
```

### Adaptive Intelligence Levels

```
┌──────────────┬────────────┬─────────────────────────────────────────────────┐
│ Project Size │ Level      │ What Activates                                  │
├──────────────┼────────────┼─────────────────────────────────────────────────┤
│ ANY size     │ SKELETON   │ Skeleton Index always runs (Layer 0)             │
│ <20 files    │ MINIMAL    │ Skeleton only (no graph, no diagram)             │
│ 20-50 files  │ LITE       │ Skeleton + architecture diagram                  │
│ 50-200 files │ STANDARD   │ Skeleton + CodeGraph + diagram                   │
│ >200 files   │ FULL       │ Skeleton + CodeGraph + diagram + qmd             │
└──────────────┴────────────┴─────────────────────────────────────────────────┘

Skeleton Index ALWAYS runs — it's the foundation for all levels.
Detection is automatic at cm-start Step 0.7.
User can override: "Use FULL intelligence mode"
```

---

## Integration with CodyMaster Skills

### cm-start (Step 0.5 — enhanced)

```
EXISTING Step 0.5: Skill Coverage Check
NEW addition:

  0.5b. Code Intelligence Setup:
    1. Count source files → determine intelligence level
    2. IF level >= LITE:
       → Auto-generate architecture diagram → .cm/architecture.mmd
    3. IF level >= STANDARD:
       → Check if CodeGraph installed: codegraph status
       → IF not installed → suggest: "npx @colbymchenry/codegraph"
       → IF installed but not indexed → codegraph init . && codegraph index .
       → IF indexed → codegraph sync . (ensure fresh)
    4. IF level >= FULL:
       → Also check qmd (cm-deep-search detection)
    5. Log intelligence level to CONTINUITY.md
```

### cm-execution (Pre-flight — enhanced)

```
EXISTING Pre-flight: Skill Coverage Audit
NEW addition:

  Pre-flight Step 2: Code Context Loading
    IF codegraph available:
      → For each task in current batch:
        → context = codegraph_context(task.description, maxNodes=15)
        → Inject context into agent prompt
      → For tasks modifying shared code:
        → impact = codegraph_impact(symbol, depth=2)
        → If impact.affected > 10 files → WARN: "High impact change"

    Result: Agents start with pre-loaded context instead of exploring
```

### cm-planning (Impact Analysis — new)

```
NEW addition to Phase A:

  Before writing implementation plan:
    1. For each proposed change:
       → codegraph_impact(affected_symbol) → list affected files
    2. If total impact > 20 files:
       → Flag as HIGH RISK in plan
       → Recommend cm-tdd coverage for all impacted callers
    3. Include impact summary in OpenSpec `design.md`
```

### cm-debugging (Trace Analysis — enhanced)

```
EXISTING Phase 2: Hypothesis Formation
NEW enhancement:

  IF codegraph available:
    1. From error stack trace → extract function name
    2. codegraph_callers(function) → who calls this?
    3. codegraph_callees(function) → what does it call?
    4. codegraph_impact(function) → what else is affected?
    5. Use call chain to narrow hypotheses

  Result: Root cause found in 1-2 queries instead of 5-10 grep calls
```

### cm-brainstorm-idea (Phase 1a — enhanced)

```
EXISTING Phase 1a: Codebase Scan
NEW enhancement:

  1. Read .cm/architecture.mmd for instant overview
  2. IF codegraph available:
     → codegraph_files(".", format="tree", includeMetadata=true)
     → Summary: X symbols, Y edges, Z files
  3. Present architecture diagram to user in Discovery output
  4. Use graph to identify:
     → Most connected modules (highest coupling)
     → Isolated modules (candidates for parallel work)
     → Dead code (unreferenced symbols)
```

---

## File Storage

```
.cm/
├── skeleton.md               # Skeleton Index output (Layer 0)
├── architecture.mmd          # Mermaid architecture diagram
├── codegraph-meta.json       # Graph metadata (last indexed, stats)
├── CONTINUITY.md             # (existing) — updated with intelligence level
├── learnings.json            # (existing)
└── decisions.json            # (existing)

.codegraph/                   # CodeGraph's own directory (auto-created)
├── codegraph.db              # SQLite graph database
└── config.json               # CodeGraph configuration
```

### codegraph-meta.json Format

```json
{
  "intelligenceLevel": "STANDARD",
  "lastIndexed": "2026-03-25T22:25:00+07:00",
  "stats": {
    "sourceFiles": 127,
    "symbols": 387,
    "edges": 1204,
    "languages": ["typescript", "javascript"]
  },
  "diagramGenerated": "2026-03-25T22:25:30+07:00",
  "codegraphVersion": "1.0.0"
}
```

---

## Lifecycle Position

```
cm-project-bootstrap → cm-codeintell (auto) → cm-brainstorm-idea → cm-planning → cm-execution
      (create)          (index + diagram)         (analyze)           (plan)        (implement)
                              ↑                                         ↓
                         cm-debugging ←──── cm-quality-gate ←──── cm-tdd
                        (trace callers)     (verify)            (test first)
```

### Memory System (Updated)

```
Tier 1: SENSORY        → Temporary session variables
Tier 2: WORKING        → CONTINUITY.md (~500 words)
Tier 3: LONG-TERM      → learnings.json, decisions.json
Tier 4: SEMANTIC TEXT   → qmd (BM25 + vector over docs/text)
Tier 5: STRUCTURAL     → CodeGraph (AST symbols + call graph)  ← NEW
```

---

## Integration Table

| Skill | Relationship |
|-------|-------------|
| `cm-start` | TRIGGERED AT: Step 0.5 — auto-detect, auto-setup |
| `cm-execution` | CONSUMER: pre-flight context loading + impact warnings |
| `cm-planning` | CONSUMER: impact analysis for change proposals |
| `cm-debugging` | CONSUMER: caller/callee tracing for root cause |
| `cm-brainstorm-idea` | CONSUMER: architecture diagram + graph summary |
| `cm-deep-search` | COMPLEMENT: qmd = text search, codegraph = structural |
| `cm-continuity` | STORES: intelligence level + graph metadata |
| `cm-tdd` | CONSUMER: know all callers before refactoring |
| `cm-safe-deploy` | CONSUMER: impact analysis as pre-deploy gate |
| `cm-dockit` | CONSUMER: auto-generate architecture docs from graph |

---

## Rules

```
✅ DO:
- Auto-detect project size and select appropriate intelligence level
- Keep graph index fresh (sync before major tasks)
- Use codegraph_context INSTEAD of grep/glob for code exploration
- Generate architecture diagram at project init
- Store metadata in .cm/codegraph-meta.json
- Feed context to downstream skills (execution, planning, debugging)

❌ DON'T:
- Force CodeGraph on tiny projects (<20 files)
- Skip freshness checks (stale index worse than no index)
- Use codegraph as REPLACEMENT for qmd (they complement each other)
- Assume codegraph is installed — always check first
- Generate diagrams without validating Mermaid syntax
- Store sensitive code in architecture diagrams
```

---

## Requirements

```
Layer 0 (Skeleton Index):
  - ZERO dependencies (grep, find, awk — standard POSIX)
  - Works on any OS (macOS, Linux, WSL)
  - <4 seconds for 600-file projects

Layer 1 (CodeGraph):
  - Node.js 18+ (for tree-sitter binaries)
  - npx @colbymchenry/codegraph (one-time install)
  - ~50MB disk for SQLite + embeddings per project

Layer 2 (Diagrams):
  - No additional dependencies (uses agent's LLM)
  - Mermaid.js knowledge (built into agent)

Layer 3 (Smart Context):
  - Layer 0 required (always available)
  - Layers 1 + 2 optional upgrades
  - Optional: qmd for text search complement
```

## The Bottom Line

**Skeleton Index = instant understanding. Code graph = deep meaning. Architecture diagrams = big picture. Together = AI that truly understands your code.**
