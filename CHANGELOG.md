# Changelog

All notable changes to this project will be documented in this file.

Categories: 🚀 **Improvements** | 🐛 **Bug Fixes**

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
