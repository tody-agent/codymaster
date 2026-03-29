# Changelog

All notable changes to this project will be documented in this file.

Categories: 🚀 **Improvements** | 🐛 **Bug Fixes** | 🔒 **Security**

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
