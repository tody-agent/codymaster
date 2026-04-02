# Design: CodyMaster Smart Spine — MCP-Native Context Layer

## Context & Motivation

CodyMaster v4.4.5 has 65 skills and a 3-tier memory system (CONTINUITY.md + learnings.json + decisions.json) that works well for single-session workflows. But the architecture has 3 critical gaps:

1. **No inter-skill coordination** — skills communicate only via CONTINUITY.md as a "shared whiteboard". No event bus, no async dispatch between skills.
2. **No progressive loading for non-skill resources** — learnings.json (7 entries, will grow), skeleton.md (20KB), and decisions.json are loaded in full every time. No L0 index summaries.
3. **Token budget is implicit** — rotation limits (max 10 learnings in CONTINUITY, max 50 archived) but no per-category budget enforcement.

## Technical Approach

Build the "Smart Spine" in 3 phases, each shippable independently:

```
Phase 1: L0 Indexes + Context Bus + Token Budget (file-based, zero deps)
Phase 2: MCP Context Server + SQLite/FTS5 (replaces flat files, unified API)
Phase 3: Session Compression + Viking Backend Option (future)
```

### Architecture Diagram

```
                    ┌─────────────────────────────────────────────┐
                    │         MCP Context Server (Phase 2)        │
                    │         src/mcp-context-server.ts           │
                    │  Port 6969 (merged with dashboard)          │
                    ├─────────────────────────────────────────────┤
                    │                                             │
                    │  MCP Tools:                                 │
                    │  ├── cm_query(scope, query)     → FTS5      │
                    │  ├── cm_resolve(uri, depth)     → URI       │
                    │  ├── cm_bus_read()              → Bus       │
                    │  ├── cm_bus_write(event, data)  → Bus       │
                    │  ├── cm_budget_check(category)  → Budget    │
                    │  ├── cm_memory_decay()          → TTL       │
                    │  └── cm_index_refresh(target)   → Indexer   │
                    │                                             │
                    ├──────────┬──────────┬──────────┬────────────┤
                    │ Context  │  URI     │  Token   │  File      │
                    │ DB       │  Resolver│  Budget  │  Watcher   │
                    │ (SQLite) │          │  Manager │  (chokidar)│
                    └────┬─────┴────┬─────┴────┬─────┴─────┬──────┘
                         │          │          │           │
              ┌──────────┴──┐  ┌────┴────┐  ┌──┴───┐  ┌───┴────┐
              │  Tables:    │  │ cm://   │  │ .cm/ │  │ src/   │
              │  learnings  │  │ memory/ │  │ token│  │ **/*.ts│
              │  decisions  │  │ skills/ │  │ -bud │  │ watch  │
              │  skill_out  │  │ resrc/  │  │ get  │  │ events │
              │  indexes    │  │ pipe/   │  │ .json│  │        │
              │  (FTS5)     │  │         │  │      │  │        │
              └─────────────┘  └─────────┘  └──────┘  └────────┘
```

### Backward Compatibility Strategy

**Critical constraint:** All 57 SKILL.md files and 21 skills sharing the Load/Update protocol MUST continue working.

Strategy: **Dual-mode operation**
- Phase 1 is purely additive — new files (.cm/context-bus.json, .cm/learnings-index.md, .cm/token-budget.json) that don't break existing workflows
- Phase 2 introduces MCP tools as an ALTERNATIVE to file reads — skills can use either
- `continuity.ts` keeps all existing exports. New functions are ADDITIONS, not replacements
- SQLite DB syncs bidirectionally with JSON files during transition period

---

## Phase 1: L0 Indexes + Context Bus + Token Budget

### 1.1 L0 Index Generator (`src/l0-indexer.ts`)

**Purpose:** Generate compact summaries (~100-500 tokens) from full resources (~2000-5000 tokens).

**New file:** `src/l0-indexer.ts`

```typescript
// Key exports:
export function generateLearningsIndex(projectPath: string): string
  // Reads .cm/memory/learnings.json
  // Outputs .cm/learnings-index.md:
  //   # Learnings Index (7 entries)
  //   - L001: i18n batch extraction skipped locales [scope:module, TTL:60d]
  //   - L002: Landing hero text positioning [scope:component, TTL:30d]
  //   ...

export function generateSkeletonIndex(projectPath: string): string
  // Reads .cm/skeleton.md (20KB)
  // Outputs .cm/skeleton-index.md (~500 tokens):
  //   # Skeleton Index
  //   ## Entry Points: dist/index.js, src/index.ts
  //   ## Modules: continuity, skill-chain, dashboard, judge, parallel-dispatch, ui/
  //   ## Config: package.json, tsconfig.json, .cm/config.yaml
  //   ## Tests: test/*.test.ts (vitest)

export function generateContinuityAbstract(projectPath: string): string
  // Reads .cm/CONTINUITY.md
  // Returns 2-3 line abstract prepended to file
```

**Integration point:** Called from `ensureCmDir()` after init, and from `writeContinuityMd()` after state update.

**Token savings estimate:**
- Learnings: 2500 tokens → 100 tokens (L0 index) = **96% reduction**
- Skeleton: 5000 tokens → 500 tokens (L0 index) = **90% reduction**
- CONTINUITY abstract: 500 tokens → 50 tokens = **90% reduction**

### 1.2 Context Bus (`src/context-bus.ts`)

**Purpose:** Shared state between skill chain steps. Replaces implicit file-path conventions.

**New file:** `src/context-bus.ts`

```typescript
export interface ContextBus {
  version: '1.0';
  session_id: string;
  pipeline: string;             // chain id: 'feature-development'
  current_step: string;         // skill name: 'cm-planning'
  started_at: string;
  updated_at: string;
  shared_context: {
    [skill: string]: {          // keyed by skill that produced it
      output_path?: string;     // file path to output artifact
      summary?: string;         // 1-line summary of what was done
      affected_files?: string[];
      metadata?: Record<string, unknown>;
    };
  };
  resource_state: {
    skeleton_generated: string | null;    // ISO timestamp or null
    learnings_indexed: string | null;
    codegraph_indexed: string | null;
    qmd_synced: string | null;
  };
}

export function readBus(projectPath: string): ContextBus | null
export function writeBus(projectPath: string, bus: ContextBus): void
export function updateBusStep(projectPath: string, skill: string, output: SkillOutput): void
export function initBus(projectPath: string, chainId: string, sessionId: string): ContextBus
```

**File location:** `.cm/context-bus.json`

**Integration points:**
- `skill-chain.ts` → `createChainExecution()` calls `initBus()`
- `skill-chain.ts` → `advanceChain()` calls `updateBusStep()`
- Each skill's SKILL.md → instructions updated to read bus at start, write output at end

### 1.3 Token Budget Manager (`src/token-budget.ts`)

**Purpose:** Per-category token allocation with soft/hard enforcement.

**New file:** `src/token-budget.ts`

```typescript
export interface TokenBudget {
  model_context_window: number;     // default: 200000
  allocations: {
    system_prompt: number;          // 5000 (2.5%)
    skill_index_L0: number;         // 2500 (1.25%)
    skill_active_full: number;      // 5000 (2.5%)
    memory_working: number;         // 500 (0.25%) — CONTINUITY abstract
    memory_learnings: number;       // 650 (0.3%) — L0 index + scope-filtered
    codebase_skeleton: number;      // 1500 (0.75%) — module-level
    context_retrieval: number;      // 10000 (5%) — search results
    conversation_history: number;   // 30000 (15%)
    generation_budget: number;      // 144850 (72.4%)
  };
  enforcement: 'soft' | 'hard';    // Phase 1 = soft, Phase 2 = hard
}

export function loadBudget(projectPath: string): TokenBudget
export function checkBudget(category: string, tokenCount: number): { allowed: boolean; remaining: number; suggestion?: string }
export function estimateTokens(text: string): number  // Simple: chars / 4
```

**File location:** `.cm/token-budget.json`

**Integration point:** `continuity.ts` → `readContinuityState()` checks budget. If learnings exceed budget, auto-switch to L0 index.

### 1.4 CLI Commands (additions to `src/index.ts`)

```typescript
// New subcommands under 'continuity':
program.command('continuity index')     // Regenerate all L0 indexes
program.command('continuity budget')    // Show token budget status
program.command('continuity bus')       // Show context bus state
```

---

## Phase 2: MCP Context Server + SQLite

### 2.1 SQLite Storage Layer (`src/context-db.ts`)

**New dependency:** `better-sqlite3` (zero-config, no native compilation on most platforms)

**Schema:**

```sql
-- Learnings with FTS5
CREATE TABLE learnings (
  id TEXT PRIMARY KEY,
  what_failed TEXT NOT NULL,
  why_failed TEXT NOT NULL,
  how_to_prevent TEXT NOT NULL,
  scope TEXT DEFAULT 'global',
  ttl INTEGER DEFAULT 60,
  reinforce_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  agent TEXT,
  task_id TEXT,
  module TEXT
);
CREATE VIRTUAL TABLE learnings_fts USING fts5(what_failed, why_failed, how_to_prevent, content=learnings, content_rowid=rowid);

-- Decisions with FTS5
CREATE TABLE decisions (
  id TEXT PRIMARY KEY,
  decision TEXT NOT NULL,
  rationale TEXT NOT NULL,
  scope TEXT DEFAULT 'global',
  status TEXT DEFAULT 'active',
  superseded_by TEXT,
  created_at TEXT NOT NULL,
  agent TEXT
);
CREATE VIRTUAL TABLE decisions_fts USING fts5(decision, rationale, content=decisions, content_rowid=rowid);

-- Skill outputs (context bus persistent store)
CREATE TABLE skill_outputs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  chain_id TEXT,
  skill TEXT NOT NULL,
  output_path TEXT,
  summary TEXT,
  affected_files TEXT,  -- JSON array
  metadata TEXT,        -- JSON object
  created_at TEXT NOT NULL
);

-- L0/L1 cached indexes
CREATE TABLE indexes (
  resource TEXT PRIMARY KEY,  -- 'learnings', 'skeleton', 'continuity'
  level TEXT NOT NULL,        -- 'L0', 'L1', 'L2'
  content TEXT NOT NULL,
  token_count INTEGER,
  generated_at TEXT NOT NULL,
  source_hash TEXT            -- detect staleness
);

-- Token consumption per session
CREATE TABLE token_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  category TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  timestamp TEXT NOT NULL
);
```

**DB location:** `.cm/context.db` (per-project, gitignored)

**Migration:** `src/migrate-json-to-sqlite.ts` — one-time script reads learnings.json + decisions.json → inserts into SQLite. Original JSON files kept as backup.

### 2.2 MCP Context Server (`src/mcp-context-server.ts`)

**Approach:** Extend existing `mcp-bridge.js` pattern (stdio-based MCP) into full TypeScript MCP server.

**Merging strategy:** The MCP context server runs as part of the dashboard process (port 6969). Dashboard already has Express. MCP stdio bridge remains separate for Claude Desktop — but both share the same SQLite backend.

**7 MCP Tools:**

| Tool | Input | Output | Description |
|------|-------|--------|-------------|
| `cm_query` | `{scope: 'learnings'\|'decisions'\|'all', query: string, limit?: number}` | Ranked results with snippets | FTS5 search across memory |
| `cm_resolve` | `{uri: string, depth?: 'L0'\|'L1'\|'L2'}` | Content at requested depth | Resolve cm:// URI |
| `cm_bus_read` | `{}` | Current context bus state | Read pipeline state |
| `cm_bus_write` | `{skill: string, output: SkillOutput}` | Updated bus | Publish skill completion |
| `cm_budget_check` | `{category?: string}` | Budget status per category | Check token budget |
| `cm_memory_decay` | `{dry_run?: boolean}` | Decayed/archived entries | Trigger TTL cleanup |
| `cm_index_refresh` | `{target: 'learnings'\|'skeleton'\|'all'}` | Refreshed indexes | Regenerate L0 |

### 2.3 URI Resolver (`src/uri-resolver.ts`)

```typescript
export function resolve(uri: string, depth: 'L0' | 'L1' | 'L2' = 'L1'): ResolvedContent

// URI patterns:
// cm://memory/working          → CONTINUITY abstract (L0) or full (L2)
// cm://memory/learnings        → learnings index (L0) or FTS5 results (L1) or full JSON (L2)
// cm://memory/learnings/L005   → specific learning by ID
// cm://memory/decisions        → decisions index (L0) or full (L2)
// cm://skills/{name}           → SKILL.md at depth
// cm://skills/{name}/L0        → index entry (~50 tokens)
// cm://resources/skeleton      → skeleton-index.md (L0) or full (L2)
// cm://pipeline/current        → context bus state
// cm://pipeline/{session}/     → historical pipeline data
```

### 2.4 File Watcher (`src/file-watcher.ts`)

Integrated into MCP server process. Uses `chokidar` (add as dependency).

```typescript
// Watch patterns:
// src/**/*.{ts,js,py}  → debounce 5s → regenerate skeleton L0
// .cm/memory/*.json    → debounce 2s → regenerate learnings L0, sync to SQLite
// skills/**/SKILL.md   → debounce 5s → refresh skill index cache
```

---

## Phase 3: Advanced Features (Future)

### 3.1 Session Compression
- New CLI: `cm commit --session <id>`
- Archives current session conversation
- LLM-extracts new learnings and decisions
- Compresses CONTINUITY.md to abstract-only

### 3.2 OpenViking Backend Swap
- `src/context-db.ts` gets `StorageBackend` interface
- SQLite implementation = default
- Viking implementation = optional, activated via config
- No changes to MCP tools or URI resolver

### 3.3 Skill Auto-Coordination
- MCP event notifications (server-sent events or polling)
- `cm_bus_subscribe(event)` for inter-skill triggers

---

## Files Created/Modified Summary

### Phase 1 (New files)
| File | Purpose | Lines (est) |
|------|---------|-------------|
| `src/l0-indexer.ts` | L0 summary generator | ~200 |
| `src/context-bus.ts` | Context bus read/write | ~150 |
| `src/token-budget.ts` | Token budget manager | ~120 |
| `.cm/token-budget.json` | Default budget config | ~25 |

### Phase 1 (Modified files)
| File | Change |
|------|--------|
| `src/continuity.ts` | Import l0-indexer, call after writes. Budget check on reads. |
| `src/skill-chain.ts` | Import context-bus, init/update bus on chain operations. |
| `src/index.ts` | Add `continuity index`, `continuity budget`, `continuity bus` commands. |

### Phase 2 (New files)
| File | Purpose | Lines (est) |
|------|---------|-------------|
| `src/context-db.ts` | SQLite schema + CRUD | ~400 |
| `src/mcp-context-server.ts` | MCP stdio server with 7 tools | ~500 |
| `src/uri-resolver.ts` | cm:// URI resolution | ~200 |
| `src/file-watcher.ts` | chokidar-based auto-indexer | ~100 |
| `src/migrate-json-to-sqlite.ts` | One-time migration script | ~100 |

### Phase 2 (Modified files)
| File | Change |
|------|--------|
| `package.json` | Add `better-sqlite3`, `chokidar` deps |
| `src/dashboard.ts` | Share SQLite DB instance with MCP server |
| `scripts/mcp-bridge.js` | Updated to use shared SQLite backend |

---

## Phase 3.3 — StorageBackend Interface (OpenViking Swap Path)

### Context

`context-db.ts` currently exposes raw SQLite functions called directly by `mcp-context-server.ts`, `uri-resolver.ts`, and `migrate-json-to-sqlite.ts`. Swapping to OpenViking (or any other storage engine) would require editing every callsite. This phase introduces a backend abstraction layer that makes the swap a config change.

### Strategy: Parallel Interface (no breaking changes)

Keep `context-db.ts` unchanged. Add a new `src/storage-backend.ts` that:
1. Defines the `StorageBackend` interface
2. Implements `SqliteBackend` as a thin wrapper around existing `context-db.ts` functions
3. Provides a `VikingBackend` stub (throws `NotImplementedError` with helpful messages)
4. Exports a `getBackend(projectPath)` factory that reads `.cm/config.yaml → storage.backend`

Existing callers continue to work. New callers (e.g. future skills, tests) use `getBackend()` for polymorphism.

### Interface Design

```typescript
// src/storage-backend.ts

export interface StorageBackend {
  // Lifecycle
  initialize(): void           // creates tables / connects / validates schema
  close(): void

  // Learnings
  insertLearning(learning: DbLearning): void
  getLearningById(id: string): DbLearning | null
  queryLearnings(query: string, scope?: string, limit?: number): DbLearning[]

  // Decisions
  insertDecision(decision: DbDecision): void
  queryDecisions(query: string, limit?: number): DbDecision[]

  // Index cache
  upsertIndex(resource: string, level: string, content: string, sourceHash?: string): void
  getIndex(resource: string, level: string): DbIndex | null

  // Skill outputs
  writeSkillOutput(output: DbSkillOutput): void
  getSkillOutputs(sessionId: string): DbSkillOutput[]
}

// Factory — reads .cm/config.yaml → storage.backend
export function getBackend(projectPath: string): StorageBackend
```

### SqliteBackend (thin wrapper)

Delegates every method to the existing `context-db.ts` functions. No logic duplication — just a class wrapper.

```typescript
class SqliteBackend implements StorageBackend {
  constructor(private projectPath: string) {}
  initialize() { openDb(getDbPath(this.projectPath)); }
  close()       { closeDb(getDbPath(this.projectPath)); }

  insertLearning(l)            { insertLearning(getDbPath(this.projectPath), l); }
  getLearningById(id)          { return getLearningById(getDbPath(this.projectPath), id); }
  queryLearnings(q, scope?, n) { return queryLearnings(getDbPath(this.projectPath), q, scope, n); }
  // ... same pattern for all methods
}
```

### VikingBackend (stub)

```typescript
class VikingBackend implements StorageBackend {
  initialize() {
    throw new Error(
      'VikingBackend: not implemented. Install @openviking/client and implement src/backends/viking-backend.ts.\n' +
      'See: https://github.com/openviking/openviking'
    );
  }
  // All methods throw same error
}
```

### Config Switch

**`.cm/config.yaml`** (add `storage` section to default template):

```yaml
storage:
  backend: sqlite              # sqlite | viking
  # viking:
  #   host: localhost
  #   port: 7474
  #   db: codymaster
```

**Factory logic:**

```typescript
export function getBackend(projectPath: string): StorageBackend {
  const config = loadConfig(projectPath);   // reads .cm/config.yaml
  const backend = config?.storage?.backend ?? 'sqlite';

  if (backend === 'viking') return new VikingBackend(projectPath);
  return new SqliteBackend(projectPath);    // default
}
```

### Files

| File | Action | Purpose |
|---|---|---|
| `src/storage-backend.ts` | CREATE | Interface + factory + SqliteBackend + VikingBackend |
| `src/continuity.ts` | MODIFY | Add `storage:` section to `generateDefaultConfig()` |
| `test/storage-backend.test.ts` | CREATE | Interface contract tests (SqliteBackend), factory config tests |

`context-db.ts` — **NOT modified.** Callers — **NOT changed.** Zero blast radius.

### Verification

- `getBackend(projectPath)` returns `SqliteBackend` by default
- `getBackend` returns `VikingBackend` when config says `storage.backend: viking`
- `VikingBackend.initialize()` throws descriptive error
- `SqliteBackend` passes same round-trip tests as context-db.ts
- Adding new backend in future = implement interface, register in factory

---

## Verification Plan

### Phase 1
- Unit test: L0 indexer produces valid markdown, token count within budget
- Unit test: Context bus init/read/write roundtrip
- Unit test: Token budget check returns correct allow/deny
- Integration test: `cm continuity index` generates all 3 L0 files
- Integration test: Skill chain creates and updates bus during execution

### Phase 2
- Unit test: SQLite schema creation, FTS5 queries return ranked results
- Unit test: URI resolver maps all documented patterns correctly
- Unit test: MCP tools return valid JSON-RPC responses
- Integration test: Migration script preserves all learnings + decisions
- Integration test: File watcher triggers L0 refresh on source change
- E2E test: Agent queries `cm_query("auth error")` and gets relevant learnings
