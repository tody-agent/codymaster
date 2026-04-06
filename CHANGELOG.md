# Changelog

All notable changes to this project will be documented in this file.

Categories: 🚀 **Improvements** | 🐛 **Bug Fixes** | 🔒 **Security**

## [4.7.0] - 2026-04-02

### 🚀 Improvements — Zero-Touch Installation & Advanced Pipeline

- **Zero-Touch CLI Installation** — `install.sh` and `scripts/postinstall.js` overhauled to automatically activate the `cm` CLI. The script supports `--auto` for non-interactive `npm install -g codymaster`, while NPM seamlessly executes `npm link` or global install.
- **OpenViking Core Feature** — Integrated OpenViking installation via `pip/pip3` natively into the installation process. Both `bash install.sh --all` and `npm i codymaster` will now automatically set up the OpenViking daemon, unlocking true semantic vector graph memory out-of-the-box.
- **Skill Chain Auto-Dispatch** — Inspired by OpenSpace orchestrations, `cm-skill-chain` received a massive upgrade. Re-introduced the missing `auto` command enabling intelligent task detection, auto-selection of tools, and 100% automated handoffs between multi-agent sequences without human intervention.
- **Systematic Auto-healing** — Enhancements to `postinstall.js` for automatic fallbacks across different OS privileges and execution environments.

## [4.6.0] - 2026-04-02

### 🚀 Improvements — OpenViking Backend (Real Implementation)

- **`VikingBackend` — real implementation** — `src/backends/viking-backend.ts` implements all 11 `StorageBackend` methods by calling the [OpenViking REST API](https://github.com/volcengine/OpenViking) (default: `http://localhost:1933`). Replaces the placeholder stub from v4.5.5.
- **`VikingHttpClient`** — New `src/backends/viking-http-client.ts`: thin fetch-based HTTP client wrapping OpenViking's `/write`, `/read`, `/ls`, `/search`, `/abstract`, `/overview`, `/health`, `/mkdir` endpoints. Zero new npm dependencies (uses Node.js built-in `fetch`).
- **URI layout in OpenViking workspace:** `learnings/<id>.json`, `decisions/<id>.json`, `indexes/<resource>/<level>.md`, `skill-outputs/<sessionId>/<id>.json`.
- **Semantic vector search** — `queryLearnings()` and `queryDecisions()` now call OpenViking's `/search` endpoint, which uses embedding-based vector similarity. Finds related memories even when query terms don't match exactly (e.g. "async timeout" matches "network latency spike").
- **Auto L0/L1 via engine** — `getL0Abstract()` and `getL1Overview()` call OpenViking's `/abstract` and `/overview` endpoints. No manual `cm continuity index` needed with Viking backend.
- **Viking-native extras** on `VikingBackend`: `searchAll(query)`, `getL0Abstract(resource)`, `getL1Overview(resource)` — accessible by casting `getBackend()` result.
- **Config extended** — `storage.viking` block now fully parsed: `host`, `port`, `workspace`, `timeout`. Config template updated in `cm continuity init`.
- **Graceful degradation** — Write methods are fire-and-forget (no throw when server unreachable). Read methods return `null`/`[]` on error.
- **Docs updated** — `context-backbone-v5.md` (System 7 section), `skills/_shared/helpers.md` (Vector search note in Step 3), `skills/cm-continuity/SKILL.md` (Setup + Tier 3), `skills/cm-start/SKILL.md` (Load Working Memory + Complete steps).
- **Test suite** — `test/viking-backend.test.ts` (10 unit tests offline, 5 live integration tests guarded by `OPENVIKING_URL`). **192 passed · 26 skipped · 0 failed** (17 test files).

## [4.5.5] - 2026-04-02

### 🚀 Improvements — StorageBackend Interface (OpenViking Swap Path)

- **`StorageBackend` interface** — New `src/storage-backend.ts` defines an 11-method abstraction over CodyMaster's persistent memory store. Swapping storage engines is now a config change, not a code rewrite.
- **`SqliteBackend`** — Thin wrapper around `context-db.ts`. Zero logic duplication; all existing callers untouched. New callers use `getBackend(projectPath)` for polymorphism.
- **`VikingBackend` stub** — All methods throw a descriptive `NotImplementedError` with step-by-step install instructions for `@openviking/client`. Explicit swap path documented.
- **`getBackend(projectPath)` factory** — Reads `.cm/config.yaml → storage.backend` (`sqlite` | `viking`). Defaults to `sqlite` when config is absent or malformed.
- **Config template updated** — `cm continuity init` now writes a `storage:` section to `.cm/config.yaml` with the backend switch commented out.
- **Zero breaking changes** — `context-db.ts` and all existing callers unchanged. StorageBackend is additive.
- **Test suite expanded** — `test/storage-backend.test.ts` (23 tests): factory defaults, config-driven dispatch, SqliteBackend full roundtrip, VikingBackend error messages. Total: **178 passed · 16 skipped · 0 failed**.

## [4.5.0] - 2026-03-31

### 🚀 Improvements — Context Backbone v5 (Smart Spine)

- **SQLite + FTS5 Storage Layer** — Learnings and decisions migrated from flat JSON to a WAL-mode SQLite database (`.cm/context.db`) with full-text search via FTS5 virtual tables. BM25-ranked `cm_query` replaces linear JSON scans. FTS5 indexes are kept in sync automatically via `AFTER INSERT`/`AFTER DELETE` triggers.
- **L0 / L1 / L2 Progressive Loading** — Every memory resource is now available at three granularities. L0 compact indexes (`learnings-index.md`, `skeleton-index.md`) reduce context cost by up to 96% for the common "just give me a summary" case. L0 is pre-generated on every `addLearning()` write and refreshable on demand.
- **cm:// URI Scheme** — Unified content addressing for all CodyMaster resources. Skills reference context by URI (`cm://memory/learnings`, `cm://skills/cm-tdd/L0`, `cm://pipeline/current`) and the resolver handles depth selection, caching, and fallbacks transparently.
- **MCP Context Server** — Standalone stdio MCP server (`src/mcp-context-server.ts`) exposing 7 tools to Claude Desktop and any MCP-compatible client:
  - `cm_query` — FTS5 search across learnings + decisions with scope filter
  - `cm_resolve` — resolve any `cm://` URI at L0/L1/L2
  - `cm_bus_read` / `cm_bus_write` — read/publish to the context bus
  - `cm_budget_check` — pre-flight token budget check by category
  - `cm_memory_decay` — TTL-based archival with `dry_run` option
  - `cm_index_refresh` — regenerate L0 indexes on demand
- **Token Budget Enforcement** — 200k-token window pre-allocated by category in `.cm/token-budget.json`. Budget checked at load time; overages return a remediation suggestion. Configurable per-project.
- **Context Bus** — `.cm/context-bus.json` tracks skill chain state across steps. Each skill publishes its output; downstream skills read what upstream steps produced via `cm://pipeline/current`. Integrated into `createChainExecution()` and `advanceChain()`.
- **File Watcher** — `src/file-watcher.ts` (chokidar) watches `.cm/memory/*.json` and auto-regenerates the L0 learnings index on change with 300ms debounce.
- **JSON → SQLite Migration** — One-time migration utility (`src/migrate-json-to-sqlite.ts`) reads existing `learnings.json` / `decisions.json`, inserts into SQLite, and creates `.backup` files. Handles both camelCase and snake_case legacy field names.
- **New CLI commands** — `cm continuity index` (regenerate L0 indexes), `cm continuity budget` (show token allocation table), `cm continuity bus` (pretty-print context bus), `cm continuity mcp` (print Claude Desktop config snippet).
- **Test suite expanded** — 4 new test files covering SQLite CRUD + FTS5 relevance, context bus roundtrip, token budget enforcement, and L0 index generation. Test count: 78 → 92 (all passing).

## [4.4.5] - 2026-03-30

### 🔒 Security

- **Security Checkpoints Upgraded** — Deployed unified security updates across `cm-security-gate`, `cm-quality-gate`, `cm-safe-deploy`, and `cm-test-gate`.

## [4.4.4] - 2026-03-29

### 🐛 Bug Fixes

- **Version Bump** — Minor bug fixes and dependency updates.

## [4.4.3] - 2026-03-29

### 🚀 Improvements — The Self-Healing Update

- **68+ Skill Milestone** — CodyMaster arsenal grows from 60+ to 68+ battle-tested skills with 8 new capabilities.
- **🧬 Self-Healing AI Pipeline** — Skills now monitor, score, and auto-repair themselves:
  - `cm-skill-health` — Real-time quality monitoring with SQLite-backed metrics dashboard (invocations, success rate, token usage, health scores).
  - `cm-skill-evolution` — 3-mode evolution engine (FIX/DERIVED/CAPTURED) with version DAG and lineage tracking. Auto-patches degraded skills.
  - `cm-skill-search` — BM25 + health-score ranking for intelligent skill discovery.
  - `cm-skill-share` — Export/import skills across teams and machines with version integrity.
- **🚀 Growth Hacking Engine** — `cm-growth-hacking` generates complete conversion systems (Bottom Sheet + Calendar CTA + Tracking) with industry auto-detection.
- **cm-auto-publisher** — Publishing automation bridge: AI agents → Content Factory Router → any Astro site.
- **cm-clean-code** — TRIZ-powered code hygiene gate: dead code detection, duplicate elimination, naming analysis.
- **cm-reactor** — Strategic codebase re-direction when requirements change or tech debt blocks progress.
- **Documentation Overhaul** — README (all 6 languages), CHANGELOG, and new Self-Healing AI deep-dive doc updated.

## [4.4.2] - 2026-03-29

### 🚀 Improvements

- **cm-brainstorm-idea Phase 4.5 (UI Preview)** — Now integrates with `cm-ui-preview` to automatically generate visual mockups (via Google Stitch or Pencil MCP) *after* recommending an approach but *before* detailed planning begins. Provides instant visual validation of ideas.
- **OpenSpec Protocol Upgrade** — Enhanced integration with Fission-AI OpenSpec format (`openspec/changes/[initiative]/proposal.md`) for seamless context handoffs to downstream skills (`cm-planning` & `cm-execution`).
- **Skill Evolution Engine** — Successfully executed automated self-healing mechanisms (Mode: FIX) for `cm-tdd` and `cm-debugging` after health monitor alerts.


## [4.3.0] - 2026-03-27

### 🚀 Improvements

- **Unified 5-Tier Memory Architecture** — Upgraded CodyMaster's internal memory pipeline from 3-tier to a complete 5-tier system (including Tier 4: Document Memory and Tier 5: Structural Code Memory).
- **cm-notebooklm** — New "Knowledge Kitchen" workflow enabling seamless 2-way sync with Google NotebookLM for project-specific cloud AI memory.
- **cm-content-factory** — Unified Content Hub implementation integrating NotebookLM with the Content Factory for automated marketing asset generation.
- **cm-brainstorm-idea** — Strategic analysis gate for evaluating complex initiatives using Design Thinking + 9 Windows (TRIZ).
- **Multi-lingual 3D Brain Visualization** — New interactive 3D brain landing page (`brain-3d.html`) implemented with full i18n support.
- **Credits extraction** — Extracted standalone credits landing page for a cleaner UI interface.
- +35-skill arsenal achieved with enhanced token optimization and UX heuristics.

## [4.2.0] - 2026-03-24

### 🔒 Security

- **DOM XSS Remediation** — Sanitized all `innerHTML` injections across 6 JS files (`kit.js`, `skills-page.js`, `demo-page.js`, `docs-page.js`, `story-page.js`, `index.html`) with `escapeHtml()` + `escapeAttr()`
- **sanitize.js** — New shared utility providing `escapeHtml()`, `escapeHtmlWithBreaks()`, `escapeAttr()` loaded in 23 HTML pages
- **safe_path.py** — New Python utility for path traversal prevention with `safe_resolve()`, `safe_join()`, `safe_open()`
- **Snyk Code SAST** — 0 medium+ findings after full remediation scan
- **Security rules in skill kit** — 5 skills updated with security learnings:
  - `cm-execution`: Frontend DOM + Python + Node security rules
  - `cm-quality-gate`: Layer 8 XSS scan + Gate 6 Snyk Code integration
  - `cm-planning`: Security checklist in scope definition
  - `cm-tdd`: Security TDD examples (XSS, path traversal tests)
  - `cm-code-review`: Part D Security Review Checklist

### 🚀 Improvements

- **CLI Terminal UI Redesign** — New premium terminal interface with onboarding, theme system, and hamster mascot
- **Security Assessment** — Full audit of Agent Trust Hub API (`ai.gendigital.com`)

### 🐛 Bug Fixes

- Fixed unescaped i18n data in persona cards, skill cards, JTBD canvas, FAQ, and IDE instructions
- Fixed `docs-page.js` ~40 unescaped values across 5 render functions

---

### 🚀 Improvements

- Documentation Changelog Integration — automated changelog generation added to VitePress docs
- Setup NPM Publishing — configured package for npmjs.com publishing
- CLI Interface Redesign — premium mobile-optimized ASCII art banner
- Parallel Coding Page — added visual comparison and full i18n support
- Open Source Docs — added section acknowledging referenced GitHub repositories

### 🐛 Bug Fixes

- Security Vulnerability Remediation — resolved Snyk Code findings including DOM XSS and Path Traversal
- Fixed 401 Unauthorized authentication error for `/cm:cm-start` command

---

## [4.1.0] - 2026-03-23

### 🚀 Improvements

- Token Optimization Phase 1 — `GEMINI.md` reduced from 32 `@` imports to 3 essential skills, saving 92% tokens per turn (~100K → ~8K)
- Token Optimization Phase 2 — Top 5 largest skills slimmed by 72-84% (105K bytes saved total):
  - `cm-project-bootstrap` 40K → 6.6K, `cm-ux-master` 27K → 5.6K, `cm-safe-deploy` 23K → 4.1K, `cro-methodology` 22K → 4.9K, `cm-ads-tracker` 19K → 5.3K
- Progressive Disclosure Templates — 10 template files extracted to `templates/` directories for on-demand loading via `view_file`, eliminating accuracy trade-offs from slimming
- Vibe Coding landing page (`vibe-coding.html`) — guide for non-developers
- Parallel Coding landing page (`parallel-coding.html`) — side-by-side comparison with/without CodyMaster

---

## [4.0.0] - 2026-03-23

### 🚀 Improvements

- Project Level System (L0-L3) — auto-detects complexity and scales workflow depth
- Shared Helpers Pattern — `skills/_shared/helpers.md` with 6 reusable sections (~750-1000 tokens saved per skill)
- Role Labels — 6 key skills now carry explicit roles (Lead Developer, Strategic Analyst, Product Manager, QA Lead, Test Engineer, Release Engineer)
- Gate Scoring — `cm-quality-gate` now outputs numeric scores per gate (≥80 PASS, 60-79 WARN, <60 FAIL)
- Requirement Tracing — FR/NFR IDs in `cm-planning` for L2+ projects
- Outputs Convention — standardized `.cm/outputs/` directory structure
- Skill Gap Detector — auto-detects missing skills during planning and execution
- Release Pipeline — automatic version bumping and changelog generation in `cm-safe-deploy`

### 🐛 Bug Fixes

- Remove `skill-creator-ultra` from skill index, CLI, FAQ, and i18n files (replaced by on-demand `cm-skill-mastery` guidance)

---

## [3.4.0] - 2026-03-23

### 🚀 Improvements

- Multi-country upgrade for VN, TH, PH
- Smart Import Engine with configurable scoring rules
- Design system extraction with Harvester v5
- 34-skill CodyMaster kit with auto-chaining
- Safe Deploy Pipeline v2 with 9-gate sequential pipeline
- DocKit changelog support for closed-loop releases
- i18n framework with 4-language support (vi, en, th, ph)

### 🐛 Bug Fixes

- Fix FAQ card spacing on mobile layout
- Fix i18n key parity for Thai language files
- Fix employee period score calculation edge cases
