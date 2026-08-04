# Changelog

All notable changes to this project will be documented in this file.

Categories: 🚀 **Improvements** | 🐛 **Bug Fixes** | 🔒 **Security**

---

## [Unreleased]

### 🚀 Improvements
- **Disciplined plan-to-verification workflow** — rich plan steps must stay inside their task file scope and preserve RED → GREEN order; Mode B now requires distinct implementer, spec-reviewer, and quality-reviewer sessions.
- **Portable workflow benchmark** — `cm bench --suite workflow-integration --runs 1` now uses packaged artifacts and a compiled default config while keeping reports in the caller's project directory.
- **Cross-platform autonomy policy** — the canonical policy is distributed to all 14 supported platforms through a focused sync/check command that does not rewrite unrelated skill artifacts.

### 🧪 Tests
- Added regressions for out-of-scope plan steps, incomplete/reversed TDD cycles, reviewer-session reuse, missing/drifted policy copies, and packed-package benchmark execution.

---

## [7.5.1] - 2026-06-15

> Security patch. Fixes the verified high-confidence findings from the Sentinel/Jules review and adds defense-in-depth. No behavior change for normal use.

### 🔒 Security
- **Dashboard DOM XSS** — escape `phase`, `phaseClass`, `projectName`, and learning/decision `agent` fields before `innerHTML` interpolation (`public/dashboard/app.js`); validate `Current Phase` against the known enum in `src/continuity.ts` so untrusted `CONTINUITY.md` content cannot smuggle markup.
- **Unauthenticated dashboard API + WebSocket** — add a per-launch bearer token (`src/middleware/dashboard-auth.ts`), require it on `/api/*`, fail-closed on the WS handshake (`src/realtime/ws-hub.ts`), and enforce a loopback Host-header allowlist to defeat DNS-rebinding. The dashboard now opens with a token-bearing URL; the frontend attaches it and scrubs it from the visible URL.
- **Hardcoded default browse token** — replace the `dev-token-change-me` fallback with `getBrowseToken()`, which resolves explicit/env/config tokens or generates and persists a random token to `.cm/browse_token` (mode 0600), shared by the daemon and client subcommands (`src/cli/commands/engineering.ts`). Added a bind-aware loopback Host guard to the browse daemon (`src/browse-server.ts`).

### 🧪 Tests
- Added `test/security-hardening.test.ts` (host guard, token auth, phase coercion) and `test/skill-chain.test.ts` (`abortChain` coverage). Full gate: 456 passed / 0 failed.

---

## [7.5.0] - 2026-06-12

> Builds on top of 7.0.3. Adds the Anti-Slop Design Layer, Zero-Token Skill Discovery, the Self-Evolving Brain hooks/monitors, OpenViking de-scope, the Advisory Loop, and a host-native-browser-first browse strategy.

### 🚀 Improvements — Anti-Slop Design Layer (taste-skill inspired)
- Added `anti-slop` BM25 domain to `cm-ux-master` (`data/anti-slop.csv`, ~36 AI-tell rules: em-dash ban, AI purple glow, generic names, fake-precise numbers, startup-slop verbs, three equal-column cards, fake `<div>` screenshots, and more). Searchable via `python3 scripts/search.py "<concern>" --domain anti-slop`.
- Introduced **Design Dials** (`DESIGN_VARIANCE` / `MOTION_INTENSITY` / `VISUAL_DENSITY`, 1-10) with a functional baseline `4/3/6`, surfaced in `generate_design_system()` output and the `DESIGN.md` template.
- Added **Style Mode** selector (`functional` default + `minimalist-editorial`, `brutalist`, `soft-premium`, `marketing-expressive`); marketing/expressive aesthetics are now opt-in instead of refused, while still enforcing the anti-slop layer.
- Added **Brief Inference** (Step 0 "read the room") to the cm-ux-master execution workflow.
- Added canonical **motion patterns** to `data/animation.csv` (GSAP sticky-stack, horizontal-pan, scroll-listener ban, reduced-motion gating, "motion claimed = motion shown").
- Added programmatic `AntiSlopTest` (DT-SLP-001) to `validation_engine.py` that scans rendered source for AI tells.
- Propagated dials + anti-slop constraints into the shared `DESIGN_STANDARD_TEMPLATE.md`.

### 🚀 Improvements — Host-Native Browser First
- `cm-browse` now prefers the host-native browser and demotes the `cm-browse` Playwright daemon to a fallback; added `skills/_shared/browser-strategy.md` documenting the engine selection chain.

### 🚀 Improvements — Zero-Token Skill Discovery
- Removed LLM token waste on skill search by porting deterministic tech-stack parsing natively into `src/indexer/skills.ts`.
- Introduced `cm index skills` CLI command to compile `.cm/project-skills.md` locally.
- Updated Fission framework (`cm-project-bootstrap`, `cm-skill-index`, `AGENTS.md`) to prioritize zero-token local indexes over massive community directory sweeps.

### 🚀 Improvements — Self-Evolving Brain hooks & monitors
- Added plugin `hooks/hooks.json` (working-memory load, secret guard, continuity save) and `monitors/monitors.json` (quality monitor), backed by `bin/cm-guard-secrets`, `bin/cm-save-continuity`, and `bin/cm-quality-monitor`, registered in `plugin.json`.
- Smart Brain Router, Skill Execution Cache, per-tier adaptive token budgeting, the Evolution Engine (Skill Evolver), and the Learning Promoter for autonomous skill repair/derivation/capture.

### 🚀 Improvements — OpenViking De-scope
- Removed OpenViking auto-installation and the remaining runtime backend; legacy `storage.backend: viking` configs now warn and fall back to SQLite.

### 🚀 Improvements — Advisory Loop Productization
- Added `cm advisory report`, `cm advisory metrics`, and `cm advisory handoff`, plus the matching `cm_advisory_*` MCP tools, so operators can inspect execution analyses and generate structured recovery notes for `cm-skill-health` / `cm-skill-evolution`.

---

## [7.0.3] - 2026-05-13

### 🚀 Improvements — Codex Runtime + Token-Efficient Handoffs

Focused compatibility and cleanup release. Align CodyMaster with the current Codex CLI, reduce agent handoff noise, and remove dead references to deprecated skills across docs, profiles, and runtime hints.

### 🚀 Improvements — Skill Token Auditing + Progressive Disclosure

Added first-class skill token footprint auditing and used it to refactor the heaviest always-on skills into lazy-loaded `references/` packs.

**Skill Token Auditing:**
- Added `cm token skill <skillName>` under the existing `cm token` namespace
- New `--project`, `--json`, and `--baseline` options for repo-scoped reports, machine-readable output, and before/after comparisons
- New `src/skill-token-report.ts` analyzer for `SKILL.md`, direct `references/`, `progressive_min`, `progressive_max`, and baseline deltas
- Added `test/skill-token-report.test.ts` and `test/brain-token-skill.test.ts`

**Progressive Disclosure Refactors:**
- Split `skills/cm-execution/` into a short router `SKILL.md` plus mode-specific references
- Split `skills/cm-codeintell/` by intelligence layer: skeleton, codegraph, architecture, context builder, integration workflows
- Split `skills/cm-safe-deploy/` by deploy path: individual gates, setup, and rollback
- Split `skills/cm-continuity/` by concern: session protocol, template, memory model, MCP bridge, URI scheme, storage, audit
- Split `skills/cm-tdd/` by workflow/support: red-green-refactor, test quality, rationalizations, bugfix example, stuck/debugging
- Preserved existing skill names, compressed frontmatter style, and distribution compatibility with flat `references/`

**Measured Token Wins (`progressive_min`):**
- `cm-execution`: `3990 → 963` tokens
- `cm-codeintell`: `4981 → 685` tokens
- `cm-safe-deploy`: `4268 → 780` tokens
- `cm-continuity`: `4157 → 652` tokens
- `cm-tdd`: `2953 → 554` tokens

**Codex Compatibility:**
- Updated `src/agent/codex.ts` to use `codex exec --json`
- Added proper `codex exec resume` support for resumed sessions
- Parse real Codex JSONL events (`thread.started`, `item.completed`, `turn.completed`)
- Preserve `sessionId` and token `usage` from Codex runtime output

**Token Efficiency + Runtime Reuse:**
- Refactored `src/agent-dispatch.ts` to emit compact structured JSON task envelopes instead of verbose Markdown task files
- Fixed generated CLI handoff commands for Codex and Claude Code to match current CLIs
- Wired `SkillExecutionCache` into `src/skill-chain.ts` for real cached skill-chain reuse during execution
- Wired successful execution write-back into `src/execution-analyzer.ts`
- Added `compressMaybe()` helper in `src/utils/output-compress.ts` for safer runtime log compression

**Docs, Profiles, and Naming Cleanup:**
- Synced skill install manifests in `skills/profiles/{core,design,growth,full}.txt` and `skills/profiles/top35.json`
- Updated skill library docs under `docs/skills/` to remove broken links to deleted/deprecated skill folders
- Cleaned workflow and operations docs to point at current skills like `cm-safe-deploy`, `cm-design-system`, `cm-quality-gate`, `cm-execution`, and `cm-skill-index`
- Reduced deprecation-heavy copywriting in user-facing docs so new users see the current path first
- Kept migration-specific references only where they still serve version-upgrade guidance (`docs/migration-v2.md`) or advisory protocol compatibility

**Tests Added:**
- `test/codex-backend.test.ts`
- `test/agent-dispatch.test.ts`
- `test/skill-chain-cache.test.ts`
- `test/skill-token-report.test.ts`
- `test/brain-token-skill.test.ts`

**Verification:**
- `npm run test:gate:kit`
- Result: 54 test files passed, 422 tests passed

---

## [7.0.0] - 2026-05-11

### 🚀 Improvements — Browse Hybrid Bridge

Major browser automation upgrade. Combines agent-browser (Rust/CDP) with Playwright via adapter pattern for AI-native browser control, a11y snapshots, structured error collection, and video recording.

**Browse Hybrid Bridge:**
- New `src/browse/adapters/types.ts` — BrowserAdapter interface + types (A11ySnapshot, BrowserError, EngineInfo)
- New `src/browse/adapters/playwright-adapter.ts` — Playwright implementation with a11y tree support
- New `src/browse/adapters/agent-browser-adapter.ts` — agent-browser CLI wrapper (Rust/CDP)
- New `src/browse/adapter-factory.ts` — Auto-detect engine + fallback chain (agent-browser → Playwright)
- New `src/browse/error-collector.ts` — Structured error classification (js-error, network-fail, console-error, crash, timeout)
- New `src/browse/event-log.ts` — Upgraded ring buffer with filtering, export, 1000 max entries
- New `src/browse/index.ts` — Barrel export for browse module

**Refactored BrowseDaemon:**
- Refactored `src/browse-server.ts` — Adapter pattern, new endpoints, backward compatible
- New endpoints: `GET /errors`, `GET /a11y-snapshot`, `GET /engine`, `GET /events`, `POST /record/start`, `POST /record/stop`
- EventLog replaces RingBuffer for structured event tracking

**New CLI Commands:**
- `cm browse start --engine <auto|agent-browser|playwright>` — Engine selection
- `cm browse doctor` — Check engine availability
- `cm browse errors [--type <t>] [--severity <s>]` — List collected errors
- `cm browse snapshot` — A11y tree with `@eN` refs
- `cm browse engine` — Current engine info + capabilities
- `cm browse record start|stop` — Video recording control

**Skill Integration:**
- Updated `cm-browse` SKILL.md — Hybrid Bridge documentation
- Updated `cm-skill-index` — Added cm-browse to Engineering Swarm
- Updated `cm-quality-gate` — Added cm-browse integration
- Updated `cm-debugging` — Added cm-browse for error collection
- Updated `cm-safe-deploy` — Added cm-browse for post-deploy smoke
- Updated `cm-mcp-engineering` — Updated cm_qa tool description
- Updated `AGENTS.md` — Added browse module to Authority table

**Files Created:**
- `src/browse/adapters/types.ts`
- `src/browse/adapters/playwright-adapter.ts`
- `src/browse/adapters/agent-browser-adapter.ts`
- `src/browse/adapter-factory.ts`
- `src/browse/error-collector.ts`
- `src/browse/event-log.ts`
- `src/browse/index.ts`

**Files Modified:**
- `src/browse-server.ts` — Adapter pattern refactor
- `src/cli/commands/engineering.ts` — New browse commands + --engine flag

---

## [6.1.0] - 2026-05-11

### 🚀 Improvements — Workflow Pipeline Fix + Unified CLI

Fix broken skill pipeline across all 14 AI coding platforms. Restore seamless start → brainstorm → planning → execution → QA → deploy workflow. Add unified CLI commands for easier management.

**Multi-Platform Skill Sync:**
- Updated `scripts/build-skills.mjs` to sync ALL 50 `cm-*` skills + `_shared/` to ALL 14 platforms
- Platforms: Claude Code, Claude Desktop, Cursor, Windsurf, Antigravity, Codex, OpenCode, Cline, Kiro, Copilot, Aider, Continue, Amazon Q, Amp
- Added `npm run sync:all` command for one-click sync
- `_shared/helpers.md` now accessible from all platforms

**TDD Enforcement Gate:**
- New `src/execution/tdd-gate.ts` — blocks execution without tests
- Enforces RED phase: test must fail before implementation
- Added `test/tdd-gate.test.ts` — 10 tests pass
- Updated `cm-execution` and `cm-tdd` SKILL.md with enforcement docs

**Changelog Automation:**
- New `scripts/update-changelog.sh` — auto-update from git commits
- Follows conventional commits format (feat, fix, security, improve)
- Added `npm run changelog` and `npm run changelog:dry` commands

**Gemini CLI Integration:**
- New `src/cli/commands/parallel.ts` — `cm parallel` command
- Execute tasks in parallel using Gemini CLI
- Supports `--count`, `--context`, `--model` options
- Graceful fallback when Gemini CLI not installed

**Unified CLI Commands:**
- New `cm update` — unified update command
  - `cm update --sync` — sync skills to all platforms
  - `cm update --changelog` — update changelog
  - `cm update --check` — check for available updates
  - `cm update --full` — full update (sync + changelog)
- New `cm upgrade` — upgrade CodyMaster package + sync
- Enhanced `cm install --sync` — auto-sync after install
- Enhanced `cm doctor --sync-check` — check sync status
- Added npm scripts: `update`, `update:sync`, `update:changelog`, `upgrade`

**Files Created:**
- `src/execution/tdd-gate.ts`
- `test/tdd-gate.test.ts`
- `scripts/update-changelog.sh`
- `src/cli/commands/parallel.ts`
- `src/cli/commands/update.ts`

**Files Modified:**
- `scripts/build-skills.mjs` — 14 platforms + _shared/ sync
- `src/cli/command-registry.ts` — Register parallel + update commands
- `src/cli/commands/install.ts` — Add --sync flag, enhance doctor
- `package.json` — Add sync:all, changelog, update, upgrade scripts
- `.opencode/skills/cm-execution/SKILL.md` — Document TDD gate
- `.opencode/skills/cm-tdd/SKILL.md` — Reference TDD gate

**Test Results:** 49 files, 406 tests pass

---

## [6.0.0] - 2026-05-10

### 🚀 Major Release — "The Disciplined Brain"

Đây là bản nâng cấp lớn nhất kể từ v4.5. Ba trụ cột thay đổi chính: **kỷ luật hành vi AI** (Karpathy Principles), **hạ tầng Dashboard Managed Agents** hoàn toàn mới, và **chuẩn hóa tài liệu toàn diện**.

---

### 🧘 Karpathy Behavioral Discipline — Nhúng kỷ luật vào từng kỹ năng

Lấy cảm hứng từ [quan sát của Andrej Karpathy](https://x.com/karpathy/status/2015883857489522876) về các lỗi phổ biến khi LLM viết code, CodyMaster nhúng 4 quy tắc hành vi cứng trực tiếp vào 6 kỹ năng cốt lõi — AI tự có kỷ luật mà không cần nhắc nhở.

**4 quy tắc Karpathy được thực thi:**

| Quy tắc | Kỹ năng thực thi |
|---------|-----------------|
| **Think Before Coding** — nêu giả định, làm rõ mơ hồ, phản biện trước khi viết | `cm-planning` |
| **Simplicity First** — code tối thiểu, không trừu tượng hóa suy đoán | `cm-clean-code`, `cm-tdd` |
| **Surgical Changes** — mọi dòng sửa đều có lý do rõ ràng từ task | `cm-execution`, `cm-code-review` |
| **Goal-Driven Execution** — tiêu chí thành công có thể xác minh trước khi code | `cm-tdd`, `cm-quality-gate` |

**Files cập nhật:**
- `skills/cm-planning/SKILL.md` — thêm "Think Before Coding" gate ở bước đầu
- `skills/cm-tdd/SKILL.md` — nhúng "Simplicity First" + "Goal-Driven" vào quy trình viết test
- `skills/cm-clean-code/SKILL.md` — thêm "Simplicity First" audit checklist
- `skills/cm-execution/SKILL.md` — nhúng "Surgical Changes" trước mọi thao tác sửa file
- `skills/cm-code-review/SKILL.md` — thêm Karpathy Review Layer vào checklist
- `skills/cm-quality-gate/SKILL.md` — thêm "Goal-Driven" verification gate
- `AGENTS.md` — ghi rõ 4 nguyên tắc Karpathy làm behavioral contract toàn dự án

---

### 🏗️ Dashboard Managed Agents — Hạ tầng hoàn toàn mới

Nâng cấp kiến trúc toàn diện cho `cm-dashboard`, tách biệt rõ ràng các lớp: Agent, Storage, Realtime.

**Modules mới (`src/`):**

- **`src/agent/`** — Lớp quản lý agent
  - `backend.ts` — Agent backend abstraction layer
  - `claude.ts` — Claude Code agent integration
  - `codex.ts` — OpenAI Codex agent integration
  - `spawn-helper.ts` — Cross-platform agent process spawner

- **`src/realtime/`** — Lớp realtime
  - `event-bus.ts` — In-process typed event bus cho agent lifecycle events
  - `ws-hub.ts` — WebSocket hub để push live updates lên Dashboard UI

- **`src/storage/`** — Lớp lưu trữ chuẩn hóa
  - `sqlite.ts` — SQLite connection factory + WAL mode
  - `index.ts` — Unified storage API
  - `repos/activity-repo.ts` — Activity log CRUD
  - `repos/message-repo.ts` — Agent message thread storage
  - `repos/project-repo.ts` — Project metadata repository
  - `repos/task-repo.ts` — Task lifecycle repository
  - `services/project-service.ts` — Project business logic
  - `services/task-service.ts` — Task state machine
  - `migrations/001_init.sql` — Schema khởi tạo toàn bộ bảng

- **`src/dashboard.ts`**, **`src/data.ts`** — Cập nhật để consume lớp storage mới
- **`src/cli/commands/dashboard.ts`** — Wired up managed agent lifecycle
- **`dist/`** — Toàn bộ dist artifact rebuild tương ứng

**OpenSpec kèm theo:**
- `openspec/changes/upgrade-cm-dashboard-to-managed-agents/design.md`
- `openspec/changes/upgrade-cm-dashboard-to-managed-agents/specs/dashboard/spec.md`
- `openspec/changes/upgrade-cm-dashboard-to-managed-agents/tasks.md`

**Test:**
- `test/dashboard.test.ts` — Test suite đầy đủ cho dashboard managed agents

---

### 📦 Extracted Plugins — Content Factory & Growth Marketing

Tách 2 plugin lớn thành các package độc lập với đầy đủ metadata và migration guide.

**`extracted-plugins/content-factory/`:**
- `.claude-plugin/marketplace.json` + `plugin.json`
- `AGENTS.md` — Behavioral contract cho content agent
- `MIGRATION.md` — Hướng dẫn upgrade từ inline skills
- Skills: `auto-publisher`, `content-factory`, `notebooklm` (cập nhật đồng bộ)

**`extracted-plugins/growth-marketing/`:**
- `.claude-plugin/marketplace.json` + `plugin.json`
- `AGENTS.md` — Behavioral contract cho growth agent
- `MIGRATION.md` — Hướng dẫn upgrade từ inline skills
- Skills: `ads-tracker`, `booking-calendar`, `cro-methodology`, `google-form`, `growth-hacking`, `jtbd`, `readit` (cập nhật đồng bộ)

---

### 🗂️ Unified Install Engine — npm-first, 14 nền tảng

Wizard `cm` mới: phát hiện tự động mọi AI tool đang cài, multi-select platform, pick profile, cài một lần.

```bash
npm install -g codymaster && cm
```

**CLI mới:**
```
cm install <platform>            # cài hoặc refresh một nền tảng
cm install --all --profile core  # cài vào mọi nền tảng phát hiện được
cm doctor                        # kiểm tra trạng thái cài đặt
cm install --list                # liệt kê tất cả platform id
```

**14 nền tảng hỗ trợ:** Claude Code, Claude Desktop, Cursor, Windsurf, Cline, Aider, Continue, Kiro, Amazon Q, Amp, Copilot, OpenCode, Codex, Antigravity/Gemini CLI.

---

### 📁 Archive & Research — Dọn dẹp repo

- `Archive/` — Di chuyển tất cả file legacy/deprecated vào đây thay vì xóa:
  - `deprecated-docs/translations/` — Các README ngôn ngữ cũ (hi, ko, ru, zh)
  - `experiments/gemini/` — Gemini extension thử nghiệm
  - `legacy-agent-system/` — cm-video-factory, xss-html-injection skills cũ
  - `legacy-editors/` — codex + opencode INSTALL.md cũ
  - `legacy-plugins/cursor-plugin/` — cursor plugin cũ
- `research/` — Tài liệu nghiên cứu nội bộ (`multica.md`, `rtk.md`)
- `MIGRATION.md` — Hướng dẫn migration tổng thể từ v5.x → v6.0

---

### 📚 Documentation & README — Chuẩn hóa toàn diện

**README.md (English):**
- Phiên bản v6.0.0
- Thêm phần **Karpathy Behavioral Discipline** với bảng 4 quy tắc
- Cập nhật install section: unified `npm install -g codymaster && cm`
- Cập nhật bảng so sánh, skill arsenal, và CLI commands
- **Xóa 4 ngôn ngữ thừa** (zh, ru, ko, hi) — chỉ giữ EN + VI
- Language bar: `[English](README.md) | [Tiếng Việt](README-vi.md)`

**README-vi.md (Vietnamese):**
- Viết lại hoàn toàn từ đầu, đồng bộ 100% với README.md EN v6.0.0
- Thêm phần Karpathy, unified install wizard, Growth Hacking Engine
- Cập nhật version badge → v6.0.0
- Bảng so sánh cập nhật: "npm i -g codymaster" thay vì "git pull"
- Cập nhật `.opencode/skills/cm-dashboard/SKILL.md`

---

### 🔧 Skill Profiles

- `skills/profiles/design.txt` — Cập nhật danh sách kỹ năng
- `skills/profiles/full.txt` — Thêm kỹ năng mới từ extracted plugins
- `skills/profiles/growth.txt` — Đồng bộ với growth-marketing plugin
- `skills/profiles/knowledge.txt` — Cập nhật knowledge pack
- `skills/profiles/top35.json` — Cập nhật metadata và scoring

---

### 📦 Package

- `package.json` — Bump version + dependency updates
- `package-lock.json` — Lock file cập nhật
- `.claude-plugin/marketplace.json` + `plugin.json` — Metadata plugin cập nhật
- `.claude/settings.local.json` — Cập nhật local settings
- `skills/cm-autopilot/scripts/autopilot.py` — Minor fixes

---

## [5.1.0] - 2026-04-11

### 🚀 Improvements — SkillsBench Intelligence + Ecosystem Reach

- **Intelligent Skill Selection (`selectTopSkills`)** — `src/skill-chain.ts` now applies SkillsBench research findings at runtime. Each chain execution dynamically selects the top-3 most relevant skills for the current task (scored by BM25 token overlap + mandatory-step priority bonus). Result: 2-3 focused skills → **+18.6pp** improvement vs 4+ loaded statically (+5.9pp). Chains with >3 mandatory steps still execute fully with a performance advisory logged to stderr. New exported functions: `scoreStepRelevance()`, `selectTopSkills()`.

- **`cm mcp-serve` command** — New `src/cli/commands/mcp-serve.ts` registers `cm mcp-serve [--project <path>] [--print-config]`. Spawns `dist/mcp-context-server.js` over stdio with SIGINT/SIGTERM forwarding. `--print-config` prints ready-to-paste JSON config for **Goose** and **Claude Desktop**, enabling one-command ecosystem integration. Goose extension config: `{ "type": "stdio", "cmd": "npx", "args": ["codymaster", "mcp-serve"] }`.

- **CodyBench v0.1** — New `cm bench` command backed by `src/codybench/` scaffolding. Three eval suites with A/B comparison (with vs without CodyMaster): `tdd-regression` (bug catch rate), `token-efficiency` (savings vs documented 78% claim), `memory-retention` (SQLite recall hit rate). Runner: `claude-code`. Judge: automated (mean/min/max/stddev). Results written to `codybench/reports/`. Methodology mirrors Goose's transparent benchmark publication strategy.

- **NLI Memory Interface (`cm_memory_write` + `cm_natural`)** — MCP server now exposes **15 tools** (up from 13). `cm_memory_write` persists a learning to SQLite with auto-detected category (arch_decision / bug_fix / user_pref / code_pattern / context), configurable scope (session/project/global), TTL, and importance. `cm_natural` is a natural language router: "remember that…" → write, "forget about…" → decay, "what did we learn about…" → FTS5 query. Zero new npm dependencies; pattern matching via regex.

- **Goose integration guide** — `docs/integrations/goose.md` — step-by-step tutorial: install CodyMaster → `cm mcp-serve --print-config` → paste YAML config into Goose → test with `cm_natural`. Tool reference table included.

- **GitHub community templates** — `.github/ISSUE_TEMPLATE/` now includes `good-first-skill.md` (with SkillsBench 12-point quality checklist), `benchmark-needed.md` (CodyBench eval request), `skill-improvement.md` (rubric-based improvement proposal).

- **Version bump** — `package.json` version: `5.0.0` → `5.1.0`. CLI command count: 18 → 20 (`mcp-serve`, `bench`). MCP tool count: 13 → 15.

## [4.8.0] - 2026-04-10

### 🚀 Improvements — Documentation site & README accuracy

- **VitePress documentation** — Rebuilt `docs/` as a browsable site with sidebar IA (Getting Started, Architecture, Operations, Skills Library, API, Resources). Config: `docs/.vitepress/config.mts`. Local preview: `npm run docs:dev`; production build: `npm run docs:build`.
- **Skills index** — Documented all **56** bundled `skills/cm-*/SKILL.md` packs with category pages under `docs/skills/`.
- **API hub** — Added `docs/api/api-reference.md` (CLI + dashboard + browse daemon + MCP tools) aligned to `src/mcp-context-server.ts` (**13** MCP tools).
- **README refresh (all languages)** — Version badges bumped to **4.8.0**; broken `docs/` links replaced; CLI examples updated to match `src/cli/command-registry.ts` (no fictional `cm continuity` / `cm list` commands). License callouts aligned to **ISC** (`package.json`).
- **npm scripts** — `docs:dev`, `docs:build`, `docs:preview` for maintainers.

## [4.7.0] - 2026-04-02

### 🚀 Improvements — Zero-Touch Installation & Advanced Pipeline

- **Zero-Touch CLI Installation** — `install.sh` and `scripts/postinstall.js` overhauled to automatically activate the `cm` CLI. The script supports `--auto` for non-interactive `npm install -g codymaster`, while NPM seamlessly executes `npm link` or global install.
- **OpenViking Core Feature** — Integrated OpenViking installation via `pip/pip3` natively into the installation process. Both `bash install.sh --all` and `npm i codymaster` will now automatically set up the OpenViking daemon, unlocking true semantic vector graph memory out-of-the-box.
- **Skill Chain Auto-Dispatch** — Inspired by OpenSpace orchestrations, `cm-skill-chain` received a massive upgrade. Re-introduced the missing `auto` command enabling intelligent task detection, auto-selection of tools, and 100% automated handoffs between multi-agent sequences without human intervention.
- **Systematic Auto-healing** — Enhancements to `postinstall.js` for automatic fallbacks across different OS privileges and execution environments.

## [4.6.0] - 2026-04-02

### 🚀 Improvements — OpenViking Backend (Real Implementation)

- `**VikingBackend` — real implementation** — `src/backends/viking-backend.ts` implements all 11 `StorageBackend` methods by calling the [OpenViking REST API](https://github.com/volcengine/OpenViking) (default: `http://localhost:1933`). Replaces the placeholder stub from v4.5.5.
- `**VikingHttpClient`** — New `src/backends/viking-http-client.ts`: thin fetch-based HTTP client wrapping OpenViking's `/write`, `/read`, `/ls`, `/search`, `/abstract`, `/overview`, `/health`, `/mkdir` endpoints. Zero new npm dependencies (uses Node.js built-in `fetch`).
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

- `**StorageBackend` interface** — New `src/storage-backend.ts` defines an 11-method abstraction over CodyMaster's persistent memory store. Swapping storage engines is now a config change, not a code rewrite.
- `**SqliteBackend`** — Thin wrapper around `context-db.ts`. Zero logic duplication; all existing callers untouched. New callers use `getBackend(projectPath)` for polymorphism.
- `**VikingBackend` stub** — All methods throw a descriptive `NotImplementedError` with step-by-step install instructions for `@openviking/client`. Explicit swap path documented.
- `**getBackend(projectPath)` factory** — Reads `.cm/config.yaml → storage.backend` (`sqlite` | `viking`). Defaults to `sqlite` when config is absent or malformed.
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
