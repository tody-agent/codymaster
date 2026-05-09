
# OpenSpec: Cải tiến CodyMaster để tối ưu Token

Dưới đây là bộ OpenSpec hoàn chỉnh gồm **1 capability spec mới** (`token-optimization`) và **4 change proposals liên kết** theo thứ tự phụ thuộc. Cấu trúc thư mục đề xuất đặt trong repo `codymaster/openspec/`.

```
codymaster/openspec/
├── project.md
├── specs/
│   └── token-optimization/
│       └── spec.md
└── changes/
    ├── add-rtk-bridge/                    # Change 1 (foundation)
    ├── add-native-output-compressor/      # Change 2 (depends on 1)
    ├── optimize-skill-memory-loading/     # Change 3 (parallel to 2)
    └── add-token-telemetry-and-bench/     # Change 4 (depends on 1,2,3)
```

---

## `openspec/project.md`

```markdown
# Project Context: CodyMaster Token Optimization

## Overview
CodyMaster is a multi-platform AI coding plugin (Claude Code, Cursor, Gemini,
Antigravity, ...) written in TypeScript/Node, distributed via npm. It provides
60+ skills, a 5-tier memory system (Sensory / Working / Long-term / Semantic /
Structural), an MCP context server, and a Smart Brain Router with progressive
L0/L1/L2 loading.

## Goal of this initiative
Reduce end-to-end token consumption per AI coding session by 60-80% without
degrading skill quality, by:

1. Filtering Bash command output BEFORE it enters the LLM context.
2. Compressing skill/memory context loaded INTO the LLM.
3. Measuring everything so regressions are caught early.

## Tech Stack
- Runtime: Node.js >=18, TypeScript
- Storage: SQLite + FTS5 (better-sqlite3)
- MCP: @modelcontextprotocol/sdk
- Distribution: npm (`codymaster` package), `cm` CLI
- Optional native dependency: RTK (Rust binary) — shells out via child_process

## Conventions
- Skills live in `skills/cm-<name>/SKILL.md`
- Source in `src/`, compiled to `dist/`
- Token-related code under `src/token/` (new namespace introduced by this work)
- Tests use vitest; CI runs `npm run test:gate:kit`
- All new MCP tools documented in `docs/api/api-reference.md`
- All token savings claims must be backed by `cm bench --token` output

## Non-Goals
- Replacing or forking RTK (we integrate, not duplicate)
- Changing the public Skill format
- Cloud telemetry (all measurement is local-first, opt-in)
```

---

## `openspec/specs/token-optimization/spec.md`

```markdown
# Token Optimization Specification

## Purpose
Define the contract by which CodyMaster keeps the LLM context budget under
control across Bash output, skill loading, memory recall, and advisory reports.
This spec is the source of truth all four implementation changes deliver
against.

## Requirements

### Requirement: Bash Output Compression
The system SHALL compress the output of shell commands invoked by skills
before that output enters the LLM context, achieving at least 60% average
token reduction across the supported command set (git, test runners, linters,
docker, kubectl, package managers, file listing, log readers).

#### Scenario: Compression via RTK when available
- GIVEN RTK binary is on PATH
- WHEN a skill executes `git status`
- THEN CodyMaster routes the command through `rtk git status`
- AND the LLM receives the RTK-compressed output
- AND the savings are recorded with `savings_source = "rtk"`

#### Scenario: Compression via native filter when RTK is absent
- GIVEN RTK is not installed
- WHEN a skill executes `git status`
- THEN CodyMaster runs the command directly and applies its native
  TypeScript filter for `git status`
- AND the LLM receives the native-compressed output
- AND the savings are recorded with `savings_source = "native"`

#### Scenario: Full output preserved on failure
- GIVEN a command fails (non-zero exit) and tee mode is `failures` or `always`
- WHEN compression is applied
- THEN the full unfiltered output is written to
  `~/.cm/tee/<timestamp>_<cmd>.log`
- AND the compressed output references that path
- AND the LLM can request expansion via `cm_run_compact_expand`

#### Scenario: User opt-out per command
- GIVEN `~/.cm/config.toml` lists `curl` in `[output].exclude_commands`
- WHEN a skill executes `curl https://...`
- THEN no compression is applied
- AND raw output is returned

### Requirement: Progressive Skill Loading
The system MUST load each skill at the lowest tier sufficient for the task,
where L0 is metadata-only (<= 200 tokens), L1 is interface (<= 800 tokens),
and L2 is the full SKILL.md.

#### Scenario: Default to L0 in chains
- GIVEN a skill chain is dispatched
- WHEN the Smart Brain Router classifies the task
- THEN every skill in the chain starts at L0
- AND L1/L2 expansion happens only on explicit request from the executing
  skill or when classifier confidence < 0.6

#### Scenario: Top-K skill selection
- GIVEN a chain with N >= 4 candidate skills
- WHEN `selectTopSkills` runs
- THEN at most 3 skills are loaded at L1+ for that chain step
- AND remaining skills stay at L0

### Requirement: Shared Guidance Deduplication
The system SHOULD deduplicate guidance text shared across multiple SKILL.md
files by referencing a single canonical document via the `cm://` URI scheme.

#### Scenario: Shared TDD guidance
- GIVEN multiple skills reference the same TDD guidance block
- WHEN those skills are loaded together in a chain
- THEN the guidance text is included exactly once in the final prompt
- AND other skills reference it via `cm://shared/tdd-guidance`

### Requirement: Lazy Advisory Reports
The system MUST return summary form by default for advisory MCP tools
(`cm_advisory_report`, `cm_advisory_metrics`, `cm_advisory_handoff`).

#### Scenario: Default summary form
- GIVEN the LLM calls `cm_advisory_report`
- WHEN no `detail` flag is set
- THEN the response is at most 800 tokens
- AND contains a section count, a 1-paragraph summary, and a list of
  expandable subsection IDs

#### Scenario: On-demand expansion
- GIVEN the LLM has a summary advisory response
- WHEN it calls `cm_advisory_expand` with a subsection ID
- THEN the full content of that subsection is returned
- AND the expansion is logged

### Requirement: Memory Compaction
The system MUST keep working memory loaded at session resume below 5,000
tokens.

#### Scenario: Resume after 30 days
- GIVEN `learnings.json` contains entries older than 30 days
- WHEN `cm` boots
- THEN expired/decayed entries are summarised in-place
- AND duplicate learnings are merged
- AND the resulting working memory blob loaded by `cm-continuity` is
  <= 5,000 tokens

### Requirement: Token Telemetry
The system MUST record token usage for every LLM-bound output produced by
CodyMaster (compressed or not) into a local SQLite table, opt-in by default.

#### Scenario: Recording a compressed run
- GIVEN telemetry is enabled
- WHEN any compressor produces output
- THEN a row is inserted into `token_usage(timestamp, skill_id, chain_id,
  raw_tokens, sent_tokens, savings_source)`

#### Scenario: User can disable telemetry
- GIVEN the user runs `cm telemetry disable`
- WHEN any subsequent compression occurs
- THEN no row is written to `token_usage`
- AND existing rows can be deleted via `cm telemetry forget`

### Requirement: Reproducible Benchmark
The system MUST provide `cm bench --token` that runs a fixed reference
workflow and reports total tokens sent to the LLM in three modes: vanilla,
native, native+RTK.

#### Scenario: CI guard against regression
- GIVEN a previous benchmark baseline is stored in `bench/baseline.json`
- WHEN `cm bench --token --gate` runs in CI
- THEN the build fails if total tokens for any mode exceed baseline by >5%
- AND succeeds otherwise
```

---

## Change 1 — `openspec/changes/add-rtk-bridge/`

### `proposal.md`

```markdown
# Proposal: Add RTK Bridge

## Why
RTK (Rust Token Killer) already compresses Bash output by 60-90%. Reproducing
that surface area in TypeScript is months of work and a maintenance burden.
The fastest, lowest-risk win is to detect RTK on the user's machine and route
shell commands through it transparently. CodyMaster owns skill orchestration;
RTK owns output filtering. They compose cleanly.

## What Changes
- Add `src/token/rtk-bridge.ts` that:
  - Detects the `rtk` binary on PATH (cached per-process).
  - Rewrites Bash invocations issued by skills (`git status` ->
    `rtk git status`, etc.) using RTK's command catalogue.
  - Falls back to raw execution when RTK is missing.
- Extend the `cm install` wizard with an opt-in step:
  "Install RTK for an additional 60-90% Bash output savings? [Y/n]"
  - On macOS/Linux/WSL: shells out to `brew install rtk` or `cargo install`.
  - On native Windows: prints a manual instruction and falls back to native
    filters (delivered by Change 2).
  - After install, runs `rtk init -g --hook-only --auto-patch` so the AI
    agent's PreToolUse hook handles rewrites at the platform layer too.
- Extend `cm doctor` to report RTK presence, version, and 24h savings via
  `rtk gain --format json`.
- Extend `cm dashboard` with a "Bash Output Savings" tile reading from the
  same source.
- Update default SKILL.md examples to show `rtk <command>` patterns so the
  LLM picks up the convention.

## Impact
- New module: `src/token/rtk-bridge.ts`
- Modified: `src/install/`, `src/cli/command-registry.ts`,
  `src/dashboard.ts`, `skills/**/SKILL.md` (mechanical replace)
- New optional system dependency: `rtk` binary (not bundled)
- No breaking changes: behaviour without RTK is identical to today
```

### `design.md`

```markdown
# Design: RTK Bridge

## Architecture

```

Skill                    Bridge                       Shell

│                        │                           │

│ exec(“git status”) ───►│                           │

│                        │ which rtk?  yes           │

│                        │ rewrite ─► “rtk git status”

│                        │ ───────────────────────► spawn

│                        │                           │

│                        │◄────── compressed stdout ─│

│◄── compressed text ────│                           │

│                        │ record(raw,sent,“rtk”)    │

```

## Decisions

### Decision: Detect once per process, not per call
Cache the result of `which rtk` for the lifetime of `cm` to avoid 12k spawns
in a long session. Invalidate on `cm doctor` and on `cm install` rerun.

### Decision: Whitelist, not blacklist
Maintain `RTK_KNOWN_COMMANDS` as a static list mirroring RTK's catalogue.
Only rewrite a command if it matches. Unknown commands pass through raw.
This is safer than guessing.

### Decision: Hook installation is opt-in and idempotent
We never edit the user's `~/.config/claude/settings.json` without consent.
`rtk init -g --auto-patch` is only invoked after explicit user "Y" in the
wizard. The wizard remembers the answer in `~/.cm/install-state.json` so
subsequent `cm install` runs do not re-prompt.

### Decision: SKILL.md rewrite is mechanical, not semantic
Replace exact-match command examples in fenced code blocks. We do not
attempt to rewrite freeform prose. Add a comment at top of each modified
file: `<!-- token-optimization: examples use rtk when available -->`.

## Failure Modes
- **RTK installed but broken**: bridge catches non-zero from `rtk --version`
  and disables itself for the session, falls back to raw exec.
- **User has wrong rtk** (the Rust Type Kit collision warned about in RTK's
  README): bridge runs `rtk gain` once on init; if it errors, treats RTK as
  absent.
- **Hook conflict** (user already has a PreToolUse hook): `rtk init` refuses
  to overwrite without `--force`. We surface that error verbatim.

## Out of Scope
- Native compression: delivered by Change 2.
- Telemetry table: delivered by Change 4 (this change writes to an
  in-memory ring buffer until the table exists).
```

### `tasks.md`

```markdown
# Tasks

## 1. Bridge module
- [ ] 1.1 Create `src/token/rtk-bridge.ts` with `detectRtk()`,
      `rewriteCommand(cmd)`, `runWithRtk(cmd, opts)`.
- [ ] 1.2 Define `RTK_KNOWN_COMMANDS` (mirror of RTK catalogue, generated
      from a one-time `rtk --list-commands` capture; document refresh
      procedure).
- [ ] 1.3 Wire bridge into the MCP shell-execution path used by skills.
- [ ] 1.4 Add an in-memory ring buffer for savings stats (replaced in
      Change 4 by SQLite).

## 2. Installer integration
- [ ] 2.1 Add the RTK opt-in step to `cm install` wizard in
      `src/install/`.
- [ ] 2.2 Implement platform-aware install: brew, cargo, manual hint.
- [ ] 2.3 Run `rtk init -g --auto-patch` after successful binary install,
      conditional on user consent.
- [ ] 2.4 Persist user choice in `~/.cm/install-state.json`.

## 3. CLI surfaces
- [ ] 3.1 Extend `cm doctor` to print RTK status and 24h savings.
- [ ] 3.2 Add Dashboard tile pulling `rtk gain --format json`.

## 4. Skill examples
- [ ] 4.1 Mechanical pass over `skills/**/SKILL.md` replacing common
      command examples.
- [ ] 4.2 Add the file-level marker comment.

## 5. Tests
- [ ] 5.1 Unit: `rewriteCommand` covers all 100+ RTK commands.
- [ ] 5.2 Unit: bridge falls back gracefully when `rtk` is missing,
      broken, or wrong-rtk.
- [ ] 5.3 Integration: skill chain produces RTK-routed output when bridge
      is enabled, raw output otherwise.
- [ ] 5.4 E2E: `cm doctor` reflects install state correctly across the
      three platforms.

## 6. Docs
- [ ] 6.1 Update `docs/integrations/rtk.md` (new file).
- [ ] 6.2 Note the opt-in install in README.
```

### `specs/token-optimization/spec.md` (delta)

```markdown
# Delta for token-optimization

## ADDED Requirements

### Requirement: RTK Detection and Routing
The system MUST detect the RTK binary on PATH and, when present, route
known shell commands through it.

#### Scenario: First-run detection
- GIVEN `cm` boots for the first time in a process
- WHEN `detectRtk()` runs
- THEN it caches the result for the process lifetime
- AND records the rtk version in `cm doctor` output

#### Scenario: Whitelist rewrite
- GIVEN RTK is detected
- WHEN a skill runs a command in `RTK_KNOWN_COMMANDS`
- THEN the command is rewritten with the `rtk` prefix
- AND executed via the bridge

#### Scenario: Unknown command passthrough
- GIVEN RTK is detected
- WHEN a skill runs a command NOT in `RTK_KNOWN_COMMANDS`
- THEN the command runs raw with no RTK involvement
```

---

## Change 2 — `openspec/changes/add-native-output-compressor/`

### `proposal.md`

```markdown
# Proposal: Add Native Output Compressor

## Why
RTK requires a Rust binary and only fully supports Linux/macOS/WSL. Native
Windows users, locked-down CI runners, and devs who refuse external
binaries get zero savings under Change 1 alone. CodyMaster needs a
TypeScript-only fallback that delivers the same surface area, even at
slightly lower compression ratios.

## What Changes
- Add `src/token/output-compressor/` with submodules:
  - `git-filter.ts`        — status/log/diff/push/commit
  - `test-filter.ts`        — jest, vitest, pytest, cargo test, go test
  - `lint-filter.ts`        — eslint, tsc, ruff, clippy
  - `log-filter.ts`         — deduplicate repeated log lines with counts
  - `tree-filter.ts`        — `ls`/`find` token-optimised tree output
  - `index.ts`              — registry mapping command -> filter
- Add MCP tool `cm_run_compact(command, cwd, opts)` that:
  - Tries the RTK bridge first (Change 1)
  - Falls back to the native filter
  - Falls back to raw if no filter matches
  - Returns `{ output, raw_tokens, sent_tokens, savings_pct, full_log_path }`
- Add MCP tool `cm_run_compact_expand(full_log_path, range)` for the LLM
  to retrieve raw output when needed.
- Add tee writer to `~/.cm/tee/` honoring config `[tee] mode = "failures"
  | "always" | "never"`.
- Add config section `[output]` to `~/.cm/config.toml` with
  `exclude_commands = []`.

## Impact
- New: `src/token/output-compressor/`, two MCP tools.
- Modified: `src/mcp-context-server.ts` (register tools),
  `src/cm-config.ts` (new section), `docs/api/api-reference.md`.
- No breaking changes; tools are additive.
```

### `design.md`

```markdown
# Design: Native Output Compressor

## Filter strategy
Each filter follows RTK's four pillars: filter noise, group similar items,
truncate long sections, deduplicate repeats. We do NOT attempt to match
RTK's percentages exactly; the goal is "good enough on its own, transparent
hand-off when RTK is also present."

## Filter contract
```ts
export interface OutputFilter {
  matches(cmd: string, args: string[]): boolean;
  compress(stdout: string, stderr: string, exitCode: number): {
    output: string;
    notes?: string[];      // warnings, e.g. "truncated at 200 lines"
  };
}
```

Filters are pure functions of strings — no IO, no state — so they are

trivially testable with snapshot tests.

## Decisions

### Decision: Parse structured formats when available

* Jest/Vitest: use `--json` reporter and parse instead of regex on text.
* pytest: `--json-report` if installed, otherwise regex.
* Go test: NDJSON via `go test -json`.
* ESLint: JSON formatter.

  This makes filters robust across versions.

### Decision: Tee on every failure

RTK’s success comes from giving the LLM a way to recover full output when

the compressed view is insufficient. We mirror that. Mode default is

`failures`. Files are pruned by `cm` boot if older than 7 days.

### Decision: Compose with RTK, do not duplicate

`cm_run_compact` checks the bridge first. If the bridge runs RTK, the

native filter is bypassed for that command. We do not double-compress.

## Token estimation

Use `gpt-tokenizer` (already a CodyMaster dependency or new) to count

both raw and compressed tokens. If unavailable, fall back to

`Math.ceil(text.length / 4)` and mark `tokens_estimated = true` in the

telemetry row (Change 4).

## Out of Scope

* Compression for non-shell tools (Read/Grep/Glob built-ins). Those are

  agent-controlled and outside our reach.
* Streaming compression. We compress on completion only.

```

### `tasks.md`

```markdown
# Tasks

## 1. Filter framework
- [ ] 1.1 Define `OutputFilter` interface and registry.
- [ ] 1.2 Add token-counting helper.

## 2. Filters (one task per filter, snapshot tested)
- [ ] 2.1 git-filter (status, log, diff, push, commit, pull)
- [ ] 2.2 test-filter (jest, vitest, pytest, cargo test, go test)
- [ ] 2.3 lint-filter (eslint, tsc, ruff, clippy, biome)
- [ ] 2.4 log-filter (generic dedup with count suffix)
- [ ] 2.5 tree-filter (ls, find)
- [ ] 2.6 docker-filter (ps, images, logs)

## 3. MCP tools
- [ ] 3.1 Implement `cm_run_compact`.
- [ ] 3.2 Implement `cm_run_compact_expand`.
- [ ] 3.3 Register tools and document.

## 4. Tee subsystem
- [ ] 4.1 Implement tee writer with mode awareness.
- [ ] 4.2 Implement boot-time prune.

## 5. Config
- [ ] 5.1 Extend `~/.cm/config.toml` schema.
- [ ] 5.2 Add `cm config output.exclude_commands add <cmd>`.

## 6. Tests
- [ ] 6.1 Snapshot tests per filter using realistic captured outputs in
      `tests/fixtures/`.
- [ ] 6.2 Compression ratio assertions: each filter MUST achieve >=50%
      reduction on its fixture.
- [ ] 6.3 Tee recovery integration test.
```

### `specs/token-optimization/spec.md` (delta)

```markdown
# Delta for token-optimization

## ADDED Requirements

### Requirement: Native Filter Coverage
The system MUST provide a native TypeScript filter for each of these
command families: git, jest/vitest/pytest/cargo test/go test, eslint/tsc,
docker, generic log dedup, ls/find.

#### Scenario: Filter for jest
- GIVEN `npx jest` produces 200 lines including 2 failures
- WHEN `cm_run_compact` is called
- THEN the response contains only the failing tests and a summary count
- AND `savings_pct >= 50`

### Requirement: Tee Recovery
The system MUST persist full unfiltered output to disk according to tee
mode and expose it via `cm_run_compact_expand`.

#### Scenario: Failure tee
- GIVEN tee mode is `failures` (default)
- WHEN a command exits non-zero
- THEN the full output is written to `~/.cm/tee/<ts>_<cmd>.log`
- AND the path is included in the compressed response
```

---

## Change 3 — `openspec/changes/optimize-skill-memory-loading/`

### `proposal.md`

```markdown
# Proposal: Optimise Skill and Memory Loading

## Why
Smart Brain Router with L0/L1/L2 already exists, but in practice many
chains still load multiple SKILL.md files at L2 and re-emit duplicated
guidance. Advisory MCP responses can hit 5-10k tokens. Working memory at
session resume can balloon as `learnings.json` grows.

These leaks happen on the prompt side, not the output side, so RTK does
not help. We need internal compaction.

## What Changes
- Enforce L0-first loading in the dispatcher: chains start at L0 unless
  classifier confidence is below a threshold (configurable, default 0.6).
- Cap simultaneous L1+ skills per chain step at 3 via `selectTopSkills`.
- Audit all `skills/**/SKILL.md` and extract recurring guidance blocks
  into `cm://shared/<topic>` documents:
  - `cm://shared/tdd-guidance`
  - `cm://shared/security-baseline`
  - `cm://shared/git-workflow`
  - `cm://shared/output-compression-rules` (new — references the bridge)
- Convert the three advisory MCP tools to default-summary form, with a
  paired `cm_advisory_expand(subsection_id)` tool.
- Add a boot-time learnings compactor:
  - Merge duplicate learnings (same `topic` + cosine similarity > 0.85
    of summary text using local embeddings if `qmd` is present, else
    Jaccard on token sets).
  - Apply Ebbinghaus decay to score; entries below threshold are
    summarised as a single "older lessons" rollup.

## Impact
- Modified: `src/smart-brain-router.ts`, `src/skill-chain.ts`,
  `src/advisory-*.ts`, `src/learnings.ts`, `src/uri-resolver.ts`.
- New: `skills/_shared/<topic>.md` (referenced by `cm://`).
- Many SKILL.md files modified to reference shared blocks.
- No breaking change to skill authors: existing inline guidance still
  works, sharing is an optimisation.
```

### `design.md`

```markdown
# Design: Skill and Memory Loading Optimisation

## L0-first dispatch

```

classify(task)  -> { tier_hint, confidence }

│

if confidence >= 0.6

│

└─► load tier_hint

else

└─► load L0, expand later

```

Each skill records its average tokens-per-tier so the router can predict
the budget impact before committing.

## selectTopSkills cap
Already exists; we tighten the contract. `MAX_LOADED = 3` per chain
step. SkillsBench evidence (cited in CodyMaster README, +18.6pp at 2-3
focused skills vs >=4) supports this.

## Shared guidance via cm://
Resolver already supports `cm://`. We extend the prompt assembler so
that, when multiple skills reference the same `cm://shared/...` URI,
the body is included exactly once with a header
`# Shared guidance: <topic>` and other skills receive the URI string
in lieu of inlining.

## Lazy advisory
Each advisory tool gets two response shapes:
- summary: `{ summary, sections: [{id, title, token_estimate}] }`
- expanded: `{ section_id, content }`
The summary form MUST be <=800 tokens. We enforce this in tests.

## Learnings compactor

### Decision: Run on boot, not write
Boot is fine because it's a single pass once per `cm` session. Running
on every write adds latency and races. Boot-time also means we can
report "compacted N lessons" in the welcome banner.

### Decision: Two compaction paths
- With `qmd` (semantic): vector similarity for merge candidates.
- Without `qmd` (heuristic): Jaccard similarity of stemmed tokens.
Either path produces the same output schema. Lossy summarisation is
conservative — a merged entry keeps the best-scored full text and
appends `(merged: <count>)` to the title.

## Out of Scope
- Re-architecting the 5-tier memory model.
- Replacing OpenViking remnants (already deprecated upstream).
- LLM-driven summarisation of learnings (would add tokens of its own;
  revisit later).
```

### `tasks.md`

```markdown
# Tasks

## 1. L0-first dispatch
- [ ] 1.1 Add confidence threshold to `tier-classify.ts`.
- [ ] 1.2 Modify `smart-brain-router.ts` to default to L0 below threshold.
- [ ] 1.3 Add per-skill tier-token tracking (writes to `token_usage`
      table from Change 4 if present, else local cache).

## 2. Top-K cap
- [ ] 2.1 Enforce MAX_LOADED=3 in `selectTopSkills`.
- [ ] 2.2 Surface the cap in `cm chain --explain`.

## 3. Shared guidance
- [ ] 3.1 Audit SKILL.md for recurring blocks.
- [ ] 3.2 Create `skills/_shared/*.md`.
- [ ] 3.3 Update `uri-resolver.ts` and prompt assembler to dedupe.
- [ ] 3.4 Migrate skills to reference shared URIs.

## 4. Lazy advisory
- [ ] 4.1 Refactor `advisory-report.ts`, `advisory-handoff.ts`,
      execution metrics to summary-by-default.
- [ ] 4.2 Implement `cm_advisory_expand`.
- [ ] 4.3 Token-budget assertion in tests (<=800 tokens summary).

## 5. Learnings compactor
- [ ] 5.1 Implement Jaccard merge path.
- [ ] 5.2 Implement qmd-backed merge path.
- [ ] 5.3 Wire into `cm` boot.
- [ ] 5.4 Show "compacted N lessons" in the hamster welcome banner.

## 6. Tests
- [ ] 6.1 Token-budget snapshot tests for sample chains.
- [ ] 6.2 Resume scenario: 90-day-old learnings.json compacts to
      <=5,000 tokens working memory.
- [ ] 6.3 Advisory summary <=800 tokens.
```

### `specs/token-optimization/spec.md` (delta)

```markdown
# Delta for token-optimization

## MODIFIED Requirements

### Requirement: Progressive Skill Loading
The system MUST load each skill at the lowest tier sufficient for the
task. The dispatcher MUST default to L0 unless the task classifier
confidence is >= 0.6 for a higher tier. At most 3 skills per chain
step MAY be loaded above L0.
(Previously: tier was chosen statically per skill.)

## ADDED Requirements

### Requirement: Shared Guidance Resolution
The prompt assembler MUST inline each `cm://shared/<topic>` body
exactly once per assembled prompt regardless of how many skills
reference it.
```

---

## Change 4 — `openspec/changes/add-token-telemetry-and-bench/`

### `proposal.md`

```markdown
# Proposal: Add Token Telemetry and Reproducible Benchmark

## Why
Without numbers, optimisation is theatre. We need a single pane of
glass that says "this session saved X tokens, here is which layer
saved them, and here is the trend." We also need a CI gate so future
changes cannot silently regress.

This change unifies measurement across all sources introduced by
Changes 1-3 (RTK bridge, native compressor, L0 router, dedup,
learnings compactor) and exposes them via `cm gain` and
`cm bench --token`.

## What Changes
- Add SQLite migration creating
  `token_usage(timestamp, skill_id, chain_id, command, raw_tokens,
  sent_tokens, savings_source, tokens_estimated)`.
- Add `cm gain` (mirrors RTK's UX): summary, --graph, --history,
  --daily, --format json.
- Add `cm discover`: scans the last N days for commands that ran
  raw (no compression) and suggests filters or RTK install.
- Add `cm bench --token`: runs a fixed reference workflow under
  three modes (vanilla, native, native+RTK) and reports tokens.
- Add `cm bench --token --gate`: CI mode that fails the build on
  >5% regression vs `bench/baseline.json`.
- Hook `cm-skill-evolution` to read the table: skills with
  consistently high `raw_tokens` and low compression eligibility
  get flagged for a `cm-<skill>-compact` derived skill.

## Impact
- New: `src/token/telemetry.ts`, `src/token/bench.ts`,
  migrations, `bench/` fixtures and baseline.
- Modified: bridge (Change 1) and compressor (Change 2) write rows.
- Modified: `cm-skill-evolution` consumes the new table.
- Opt-in: telemetry disabled by default; first run of `cm gain`
  prompts to enable. `RTK_TELEMETRY_DISABLED`-style env var
  honoured (`CM_TELEMETRY_DISABLED=1`).
```

### `design.md`

```markdown
# Design: Telemetry and Benchmark

## Schema

```sql
CREATE TABLE IF NOT EXISTS token_usage (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp       INTEGER NOT NULL,
  skill_id        TEXT,
  chain_id        TEXT,
  command         TEXT,
  raw_tokens      INTEGER NOT NULL,
  sent_tokens     INTEGER NOT NULL,
  savings_source  TEXT NOT NULL CHECK (savings_source IN
                    ('rtk','native','l0_router','dedup',
                     'tee_recovery','none')),
  tokens_estimated INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_token_usage_ts ON token_usage(timestamp);
CREATE INDEX idx_token_usage_source ON token_usage(savings_source);
```

## Privacy

* Default OFF. Consent prompt on first `cm gain`.
* All data stays local. No HTTP. We mirror RTK’s posture.
* `command` field stores the *first 3 words* with arguments stripped,

  matching RTK’s privacy stance.

## Benchmark workflow

```
bench/
├── workflow.yml      # Declarative: list of commands to run
├── fixtures/         # Pre-generated outputs to feed filters
│   ├── git-status.txt
│   ├── jest-fail.json
│   └── ...
└── baseline.json     # Current best per mode
```

`cm bench --token` runs the workflow synthetically (using fixtures,

not real shell calls) so it is deterministic and CI-safe. Each filter

processes its fixture; counts go into a report.

## CI gate logic

```
for mode in [vanilla, native, native_plus_rtk]:
    delta = (current[mode] - baseline[mode]) / baseline[mode]
    if delta > 0.05:
        fail("Regression in {mode}: +{delta:.1%}")
```

A bump to baseline requires an explicit `cm bench --token --update-baseline`

which is gated behind a maintainer-only CI step.

## skill-evolution integration

The Evolver’s analyzer adds a new signal:

`high_raw_tokens` = avg raw_tokens > 5_000 over last 50 invocations

AND no filter matched. When present, evolution proposes a

`cm-<skill>-compact` DERIVED skill with explicit `cm_run_compact`

usage in its body.

## Out of Scope

* Multi-machine sync of telemetry. Local only.
* Comparing absolute USD savings — too dependent on model pricing.

```

### `tasks.md`

```markdown
# Tasks

## 1. Storage
- [ ] 1.1 Add migration for `token_usage` table.
- [ ] 1.2 Wire writes from RTK bridge (Change 1).
- [ ] 1.3 Wire writes from native compressor (Change 2).
- [ ] 1.4 Wire writes from L0 router and dedup paths (Change 3).

## 2. CLI
- [ ] 2.1 Implement `cm gain` (summary, --graph, --history, --daily,
      --format json).
- [ ] 2.2 Implement `cm discover`.
- [ ] 2.3 Implement consent prompt on first `cm gain`.
- [ ] 2.4 Implement `cm telemetry status|enable|disable|forget`.

## 3. Benchmark
- [ ] 3.1 Author `bench/workflow.yml` and capture fixtures.
- [ ] 3.2 Implement `cm bench --token`.
- [ ] 3.3 Implement `--gate` mode with 5% threshold.
- [ ] 3.4 Add CI workflow that runs the gate on every PR.
- [ ] 3.5 Document `--update-baseline` review process.

## 4. Skill evolution hook
- [ ] 4.1 Add `high_raw_tokens` signal to analyzer.
- [ ] 4.2 Add DERIVED-mode skill template `cm-<skill>-compact`.

## 5. Tests
- [ ] 5.1 Unit: telemetry write/read happy path.
- [ ] 5.2 Unit: gate fails on synthetic regression.
- [ ] 5.3 Integration: full benchmark runs in <30s on CI.

## 6. Docs
- [ ] 6.1 New: `docs/token-optimization/measurement.md`.
- [ ] 6.2 Update README with `cm gain` example output.
```

### `specs/token-optimization/spec.md` (delta)

```markdown
# Delta for token-optimization

## ADDED Requirements

### Requirement: Telemetry Writes from All Layers
Every component that compresses or short-circuits LLM-bound output
(RTK bridge, native compressor, L0 router, dedup, advisory summary)
MUST write a row to `token_usage` when telemetry is enabled.

#### Scenario: L0 short-circuit recorded
- GIVEN telemetry is enabled
- WHEN the router serves a chain step at L0
- THEN one row is inserted with
  `savings_source = 'l0_router'` and `command = NULL`

### Requirement: Benchmark Gate
The CI pipeline MUST fail when `cm bench --token --gate` reports a
greater than 5% regression in any mode versus `bench/baseline.json`.
```

---

## Dependency graph between the four changes

```
              ┌──────────────────────────────┐
              │  add-rtk-bridge (Change 1)   │  foundation
              └──────────────┬───────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ add-native-output-compressor │ │ optimize-skill-memory-loading│
│         (Change 2)           │ │         (Change 3)           │
└──────────────┬───────────────┘ └──────────────┬───────────────┘
               │                                │
               └────────────────┬───────────────┘
                                ▼
              ┌──────────────────────────────────┐
              │ add-token-telemetry-and-bench    │
              │            (Change 4)            │
              └──────────────────────────────────┘
```

Change 1 establishes the bridge contract and ring buffer. Change 2 and Change 3 can run in parallel once Change 1 lands; both write through the same compression pipeline interface. Change 4 unifies measurement across all three and adds the CI gate, so it lands last. Each change is self-contained, individually shippable, and individually rollback-able.

## Sequencing recommendation

Sprint 1 ships Change 1 alone — biggest user-visible win, zero new code paths in skills. Sprint 2-3 ships Change 2 and Change 3 in parallel by separate sub-teams. Sprint 4 ships Change 4, which hardens everything with measurement and prevents future regressions.

Bạn muốn mình mở rộng phần nào tiếp theo — viết template `bench/workflow.yml` chi tiết, vẽ ra interface TypeScript cho `OutputFilter` registry, hay phác thảo cụ thể `RTK_KNOWN_COMMANDS` mapping?
