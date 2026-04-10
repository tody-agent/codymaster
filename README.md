<div align="center">

[English](README.md) | [Tiếng Việt](README-vi.md) | [中文](README-zh.md) | [Русский](README-ru.md) | [한국어](README-ko.md) | [हिन्दी](README-hi.md)

# 🧠 CodyMaster

### Your AI Agent is smart. CodyMaster makes it *wise*.

**68+ Skills · 18 Commands · 1 Plugin · 7+ Platforms · 6 Languages**

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-4.8.0-blue.svg?cacheSeconds=2592000" />
  <img alt="Skills" src="https://img.shields.io/badge/skills-68+-success.svg" />
  <img alt="Platforms" src="https://img.shields.io/badge/platforms-7+-orange.svg" />
  <img alt="Open Source" src="https://img.shields.io/badge/license-ISC-purple.svg" />
  <a href="https://github.com/tody-agent/codymaster#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
</p>

```
    ( . \ --- / . )
     /   ^   ^   \
    (      u      )
     |  \ ___ /  |
      '--w---w--'
       Meet CodyMaster 🐹
  Your smart coding companion.
```

![CodyMaster Kanban Dashboard](assets/images/dashboard.png)

### 🌟 If CodyMaster saves you time, give it a [Star](https://github.com/tody-agent/codymaster)! 🌟

</div>

---

## 🛑 The Problem Nobody Talks About

You installed an AI coding agent. It's *brilliant*. It writes code faster than any human.

But then reality hits:

| 😤 What Actually Happens                                                            | 💀 The Real Cost                               |
| ----------------------------------------------------------------------------------- | ---------------------------------------------- |
| AI designs**differently every single time** — same brand, 3 different styles | Clients think you're 3 different companies     |
| AI fixes one bug,**silently breaks 5 other things**                           | You redo the same work 3-4 times               |
| AI**forgets everything** between sessions                                     | You re-explain the same codebase every morning |
| AI writes zero tests, zero docs                                                     | Your codebase becomes a house of cards         |
| You install 15 different skills —**none of them talk to each other**         | Frankenstein toolkit with zero synergy         |
| Deploy to production =**deploy and pray** 🙏                                  | Broken deploys at 2 AM, no rollback            |

> *"AI gave me 100 hands. But without discipline, those hands created chaos."*
> — **Tody Le**, Head of Product · 10+ years · Creator of CodyMaster

---

## 🟢 The Solution: An Entire Senior Team in One Kit

CodyMaster isn't just "another AI skills pack." It's **10+ years of product management experience + 6 months of battle-tested vibe coding**, distilled into 68+ interconnected skills that work as a **single integrated system**.

When you install CodyMaster, you're not adding skills.
**You're hiring an entire senior team:**

```mermaid
graph TD
    A["🧠 CodyMaster Kit"] --> B["👨‍💻 Senior Developer<br/><i>cm-tdd · cm-debugging · cm-code-review · cm-clean-code</i>"]
    A --> C["🎨 UX Lead<br/><i>cm-design-system · cm-ux-master · cm-ui-preview</i>"]
    A --> D["📋 Product Manager<br/><i>cm-planning · cm-brainstorm-idea · cm-jtbd</i>"]
    A --> E["🔒 DevOps Engineer<br/><i>cm-safe-deploy · cm-secret-shield · cm-security-gate · cm-identity-guard</i>"]
    A --> F["📝 Technical Writer<br/><i>cm-dockit · cm-content-factory · cm-auto-publisher</i>"]
    A --> G["📈 Growth Marketer<br/><i>cm-ads-tracker · cm-cro-methodology · cm-growth-hacking</i>"]
    A --> H["🏭 Enterprise Dev<br/><i>cm-booking-calendar · cm-google-form</i>"]
    style A fill:#fbc531,stroke:#e1b12c,color:#2f3640,stroke-width:3px
    classDef team fill:#2f3640,stroke:#dcdde1,stroke-width:1px,color:#fff;
    class B,C,D,E,F,G,H team;
```

---

## ⚡ What Makes CodyMaster Different

Other skill packs give you loose tools. CodyMaster gives you an **interconnected operating system** for your AI — 68+ skills that chain, share memory, and communicate like a real team.

### 🔄 Full Lifecycle Coverage (Idea → Production)

No gaps. No manual handoffs. Every phase is covered:

```mermaid
graph LR
    A["💡 Idea"] --> B["📋 Plan"]
    B --> C["🎨 Design"]
    C --> D["🧪 Test First"]
    D --> E["💻 Code"]
    E --> F["🔍 Debug"]
    F --> G["✅ Quality Gate"]
    G --> H["🔒 Security Scan"]
    H --> I["🚀 Deploy"]
    I --> J["📊 Monitor"]
    J --> K["📝 Document"]
    K --> L["🧠 Learn & Improve"]
    L -.-> A
    classDef phase fill:#353b48,stroke:#fbc531,stroke-width:2px,color:#fff;
    class A,B,C,D,E,F,G,H,I,J,K,L phase;
```

### 🧠 The Unified Brain: 5-Tier Memory + Smart Spine

Your AI doesn't just execute — it **understands and remembers** using a multi-scale, 5-Tier + Smart Spine architecture that persists across sessions and machines:

1. **Sensory Memory (Session)** — Immediate context of active files and terminals.
2. **Working Memory (`cm-continuity`)** — Cross-session scratchpad. AI never repeats the same mistake.
3. **Long-Term Memory (`learnings.json`)** — Reinforced lessons with smart Ebbinghaus TTL decay.
4. **Semantic Memory (`cm-deep-search`)** — Local vector search across docs using `qmd`.
5. **Structural Memory (`cm-codeintell`)** — AST-based CodeGraph. Up to 95% token compression for full codebase context.

🦴 **Smart Spine (v4.6+)** — The nervous system connecting all 5 tiers:
- **SQLite + FTS5** — BM25-ranked keyword search replaces flat JSON scans.
- **Progressive Loading (L0/L1/L2)** — Context loaded at cheapest sufficient depth. 78% token savings.
- **cm:// URI Scheme** — Skills request context by URI, not file paths.
- **Token Budget** — 200k window pre-allocated by category. No more silent overflow.
- **Context Bus** — Skills share outputs in real-time within a chain.
- **MCP Server** — 13 tools exposed to Claude Desktop and any MCP client (`src/mcp-context-server.ts`).
- **OpenViking Backend natively integrated** — Inspired by OpenViking's architecture, CodyMaster defaults to `openviking` auto-installation. It delivers true semantic vector graph memory, automatic session compression, and temporal context layering. (One config line change: `storage.backend: viking`).

☁️ **The Cloud Brain (`cm-notebooklm`)**
High-value knowledge and design patterns are synced to NotebookLM, providing a universal, cross-machine "Soul" for your project. Auto-generate podcasts and flashcards to onboard human developers alongside the AI.

📖 [CodyMaster Brain & memory model →](docs/architecture/codymaster-brain.md)

### 🛡️ Multi-Layer Protection (Your Codebase Won't Get Destroyed)

Every line of code passes through multiple safety gates before reaching production:

```mermaid
flowchart LR
    subgraph "Layer 1: Write"
        A["cm-tdd<br/>Tests First"] --> B["cm-code-review"]
    end
    subgraph "Layer 2: Secure"
        B --> C["cm-secret-shield<br/>Leak Scan"] --> S["cm-security-gate<br/>Vuln Scan"] --> D["cm-identity-guard<br/>Right Account"]
    end
    subgraph "Layer 3: Isolate"
        D --> E["cm-git-worktrees<br/>Isolated Branch"]
    end
    subgraph "Layer 4: Deploy"
        E --> F["cm-quality-gate<br/>Evidence Check"] --> G["cm-safe-deploy<br/>Multi-Gate Pipeline"]
    end
    style A fill:#e84118,stroke:#c23616,color:#fff
    style C fill:#e84118,stroke:#c23616,color:#fff
    style F fill:#0097e6,stroke:#00a8ff,color:#fff
    style G fill:#4cd137,stroke:#44bd32,color:#fff
```

> **Result:** Zero leaked secrets. Zero wrong-account deploys. Zero "worked on my machine" failures.

### 🎨 Design System Builder — Even From Old Products

Got a legacy product with no design system? **cm-design-system** scans your website, extracts colors, typography, spacing, and tokens, then rebuilds a proper design system. Preview designs visually with **Pencil.dev** or **Google Stitch** before writing a single line of code.

### 📝 Zero Documentation? No Problem.

Don't know what the old code does? **`cm-dockit`** reads your entire codebase and generates:

- 📚 Technical architecture docs
- 📖 User guides & SOPs
- 🔌 API references
- 🎯 Persona analysis & JTBD mapping
- 🌐 Multi-language. SEO-optimized.

**One scan = Complete knowledge base.**

### 💡 Strategic Brainstorming (Design Thinking + 9 Windows)

Before diving into code for complex requests, **`cm-brainstorm-idea`** evaluates your product using multi-dimensional analysis (Tech, Product, Design, Business). It generates 2-3 qualified options using the 9 Windows (TRIZ) framework and provides a visual UI Preview via **Pencil.dev** or **Google Stitch** to validate the direction before detailed planning. 

📖 [TRIZ-parallel workflow & UI preview handoff →](docs/architecture/triz-parallel-engine.md)


### 🏭 AI Content Factory v2.0 & Visual Dashboard

Need to scale content? **`cm-content-factory`** is a self-learning, multi-agent content engine. It automatically researches, writes, audits (SEO & Persuasion), and deploys high-converting articles with the Content Mastery framework (StoryBrand + Cialdini) to guarantee conversion.

Track it all on the **Visual Dashboard** (`cm-dashboard`): No more guessing. Track every task, every agent, every deployment on a real-time Kanban board. Pipeline progress, token tracker, event log — all on one screen.

### 🧬 Self-Healing AI (Skills That Fix Themselves)

CodyMaster doesn't just run skills — it **watches them, scores them, and heals them automatically.**

- **`cm-skill-health`** monitors every invocation: success rate, token usage, error patterns.
- **`cm-skill-evolution`** auto-patches degraded skills (Mode: FIX) when health scores drop below threshold.
- **`cm-skill-chain` Auto-Dispatch** — Inspired by OpenSpace automation orchestrators, sequence dispatching is now 100% automated with intelligent task detection, zero-touch handoffs, and multi-agent coordination.
- **`cm-skill-search`** uses BM25 ranking to find the right skill for any task.
- **`cm-skill-share`** exports & imports skills across teams and machines.

> **Think of it like an immune system for your AI toolkit.** Skills that break get healed. Skills that work well get reinforced. Dead skills get archived.

### 🚀 Growth Hacking Engine

Need popups, booking flows, or lead capture? **`cm-growth-hacking`** generates complete conversion systems: Bottom Sheet + Calendar CTA + Tracking. Auto-detects industry, selects the right pattern, wires up **`cm-booking-calendar`** for appointments and **`cm-ads-tracker`** for pixel tracking. Zero dependencies.

---

## 🆚 Scattered Skills vs CodyMaster

|                            | 😵 15 Random Skills                         | 🧠 CodyMaster                                                         |
| -------------------------- | ------------------------------------------- | --------------------------------------------------------------------- |
| **Integration**      | Each skill is standalone, no shared context | 68+ skills that chain, share memory, and communicate                   |
| **Lifecycle**        | Covers coding only                          | Covers Idea → Design → Code → Test → Deploy → Docs → Learn      |
| **Memory**           | Forgets everything between sessions         | 5-tier Unified Brain: Sensory → Working → Long-term → Semantic → Structural + Cloud Brain. Optional **OpenViking** backend for vector search + auto memory compression. |
| **Safety**           | YOLO deploys                                | 4-layer protection: TDD → Security → Isolation → Multi-gate deploy |
| **Design**           | Random UI every time                        | Extracts & enforces design system + visual preview                    |
| **Documentation**    | "Maybe write a README later"                | Auto-generates complete docs, SOPs, API refs from code                |
| **Self-improvement** | Static — what you install is what you get  | Self-healing: monitors health → auto-patches → reinforces winners   |
| **Maintenance**      | Update 15 repos separately                  | One `npm i -g codymaster` updates everything                        |

---

## 🦥 Built For Lazy People (Seriously)

We're going to be honest: **CodyMaster was built for lazy people.**

If you want to:

- ✅ Type a chat message and get a **working product** back
- ✅ Have your AI **learn from its mistakes** and get better every day
- ✅ Never setup the same boilerplate twice
- ✅ Deploy with **confidence** instead of praying

**→ CodyMaster is for you.**

If you prefer:

- ❌ Manually reviewing every line of AI output
- ❌ Doing the same setup ritual for every project
- ❌ Slow, manual deploys with no safety net

**→ CodyMaster is NOT for you.**

---

## 🚀 1-Minute Install

### 1. Install AI Skills (All Platforms)

One command installs all 68+ skills to your environment. Supports Claude Code, Gemini CLI, Cursor, Aider, Windsurf, Cline, OpenCode, and more:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/tody-agent/codymaster/main/install.sh) --all
```

#### After `install.sh --all` (verify)

- **Restart** Claude Code, Cursor, or Gemini / Antigravity so they reload config and rules from disk.
- **Cursor:** rules go to **`~/.cursor/rules`** (always under your home folder, not wherever you ran the script). In Agent chat, run **`/add-plugin cody-master`**. To install rules **only inside one git repo**, run from that repo: `bash install.sh --cursor --cursor-project`.
- **Gemini / Antigravity:** skills live in `~/.gemini/antigravity/skills`. The installer **creates or appends** `~/.gemini/GEMINI.md` with `@~/.gemini/antigravity/skills/cm-skill-index/SKILL.md` when that hint is missing.
- **Claude Code:** if commands like `/cm:demo` do not appear, run `claude plugin marketplace add tody-agent/codymaster` then `claude plugin install cm@codymaster --scope user` (or `--scope project`).
- **Non-interactive:** `--all` skips the onboarding menu. For a single platform, add **`--yes`** (e.g. `bash install.sh --gemini --yes`).

#### Google Antigravity / Gemini CLI / Windsurf (token budget)

Antigravity and some Windsurf builds count **skills + MCP** against a customization token budget. Installing every skill globally can trigger truncation or unstable agent runs (especially if an MCP server errors and retries).

- **Recommended:** install a **small global profile**, add the rest per project.

```bash
# Core only → ~/.gemini/antigravity/skills (merge more profiles later with the same command)
bash <(curl -fsSL https://raw.githubusercontent.com/tody-agent/codymaster/main/install.sh) --gemini --profile core

# Optional packs (re-run to add folders alongside core)
bash install.sh --gemini --profile growth
bash install.sh --gemini --profile design
bash install.sh --gemini --profile knowledge
```

- **Paths:** Antigravity / Gemini CLI skills → `~/.gemini/antigravity/skills`. This repo’s installer for **Windsurf** writes to **project** `.windsurf/rules` when you run `install.sh --windsurf` from a repo root. Some Windsurf/Codeium setups also use a **global** skills directory (e.g. under Codeium); if you copy skills there manually, use the same `--profile` flags to avoid duplicating hundreds of rules.
- **MCP:** Disable MCP servers you are not using in the IDE settings. Flaky or rate-limited MCPs can cause “MCP Error” loops until the agent terminates.
- **Progressive disclosure:** Add `@~/.gemini/antigravity/skills/cm-skill-index/SKILL.md` to `GEMINI.md` so the model loads the index before pulling full skills.

Profiles are defined under [`skills/profiles/`](skills/profiles/README.md).

*For Cursor IDE users, you can also just type `/add-plugin cody-master` in your agent chat.*

### 2. Install Mission Control Dashboard (Optional but Recommended)

Visualize your progress, manage tasks, and track your 10x coding streak with Cody the Hamster 🐹.

**Both are official:** install **per project** (no `-g`) or **globally**.

Per project — keeps the CLI version with the repo (use `npx` so you do not need `cm` on your PATH):

```bash
npm install codymaster
npx cm
```

Global — type `cm` from any directory:

```bash
npm install -g codymaster
cm
```

The CLI will greet you and keep you organized on your long coding sessions!

```text
    ( . \ --- / . )
     /   ^   ^   \        Hi! I'm Cody 🐹
    (      u      )        Your smart coding companion.
     |  \ ___ /  |
      '--w---w--'

│
◆  Quick menu
│  ● 📊  Dashboard (Start & open)
│  ○ 📋  My Tasks
│  ○ 📈 Status
│  ○ 🧩  Browse Skills
```

</details>

---

## 🧰 The 68+ Skill Arsenal

| Domain                    | Skills                                                                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔧 **Engineering**   | `cm-tdd` `cm-debugging` `cm-quality-gate` `cm-test-gate` `cm-code-review` `cm-clean-code`                                                                             |
| ⚙️ **Operations**  | `cm-safe-deploy` `cm-identity-guard` `cm-secret-shield` `cm-security-gate` `cm-git-worktrees` `cm-terminal` `cm-safe-i18n`                                             |
| 🎨 **Product & UX**  | `cm-planning` `cm-design-system` `cm-ux-master` `cm-ui-preview` `cm-project-bootstrap` `cm-jtbd` `cm-brainstorm-idea` `cm-dockit` `cm-readit` |
| 📈 **Growth & CRO**    | `cm-content-factory` `cm-auto-publisher` `cm-ads-tracker` `cm-cro-methodology` `cm-growth-hacking` `cm-booking-calendar` `cm-google-form`                                                                                                   |
| 🏢 **Enterprise**  | `cm-reactor` `cm-notebooklm`                                                                                                  |
| 🧬 **Self-Healing**   | `cm-skill-health` `cm-skill-evolution` `cm-skill-search` `cm-skill-share` `cm-skill-chain` `cm-skill-mastery` `cm-skill-index`             |
| 🎯 **Orchestration** | `cm-execution` `cm-continuity` `cm-deep-search` `cm-codeintell` `cm-how-it-work`             |
| 🖥️ **Workflow**    | `cm-start` `cm-dashboard` `cm-status`                                                                                                                     |

---

## 🎮 Commands

Run `cm --help` (or `node dist/index.js --help` from a clone) for the **authoritative** list. Highlights from `src/cli/command-registry.ts`:

```
cm, codymaster              → CLI entry
cm status                   → Task & project summary
cm task <cmd> [args...]     → Task management
cm project <cmd> [args...]  → Project management
cm deploy <cmd> [args...]   → Deploy / rollback / history / changelog
cm dashboard [start|stop|status|open|url] → Mission Control (default :6969)
cm agent [status|memory|brain|learn]      → Working memory / learnings
cm brain                    → Continuity + next actions
cm chain <cmd> [args...]    → Skill chain execution
cm config [key] [value]   → Config helper
cm open                     → Open dashboard in browser
cm browse …                 → Local Playwright browse daemon (QA)
cm guardian …               → Destructive-command / path checks
cm sprint …                 → Sprint pipeline + .cm/sprint
cm design-studio [init|status]
cm distro validate …        → Validate skill pack layout
```

**Memory, bus, budgets, `cm://` resolution:** use the **MCP context server** — see [docs/api/api-reference.md](docs/api/api-reference.md).

**Engineering (browse, guardian, sprint):** [docs/workflows/engineering-pipeline.md](docs/workflows/engineering-pipeline.md) · [docs/browse-daemon.md](docs/browse-daemon.md) · [docs/workflows/guardian-hooks.md](docs/workflows/guardian-hooks.md) · [docs/architecture/servers-and-mcp.md](docs/architecture/servers-and-mcp.md)

```bash
# OpenViking backend (optional — semantic vector search)
pip install openviking && openviking start
# Then set storage.backend: viking in .cm/config.yaml
```

**Slash Commands (inside AI agents):**

```
/cm:demo         → Interactive onboarding tour
/cm:plan         → Plan a feature with analysis
/cm:build        → Build with strict TDD
/cm:debug        → Systematic debugging
/cm:ux           → Design system extraction & UI preview
```

---

## 👤 Who Built This

**Tody Le** — Head of Product with 10+ years of experience. Can't write code. Used AI to build real products for 6 months straight. Every skill in this kit was born from a real failure that cost real time and real tears.

> *"68+ skills. Each skill is a lesson. Each lesson is a sleepless night. And now, you don't have to go through those nights."*

📖 [Read the full story →](https://cody.todyle.com/story)

---

## 📚 Resources

- 🌍 [Website](https://cody.todyle.com) — Overview & demos
- 📖 [Documentation (site)](https://cody.todyle.com/docs) — Hosted deep-dive
- 📘 [Documentation (repo)](docs/index.md) — Markdown source; run `npm run docs:dev` for VitePress
- 🛠️ [Skills Reference](skills/) — Browse **56** bundled `cm-*` SKILL.md packs (profiles/installer can add more)
- 📖 [Our Story](https://cody.todyle.com/story) — Why this exists

---

## 🤝 Contributing

1. ⭐ **Star the repo** — it helps more builders find this
2. Fork → Create `skills/cm-your-skill/SKILL.md`
3. Submit a Pull Request

CI runs `npm ci` and `npm run test:gate:kit` on pushes and pull requests (see `.github/workflows/ci.yml`).

---

<div align="center">

*ISC License — Free to use, modify, and distribute.* <br/>
**Built with ❤️ for the vibe coding community.**

*"CodyMaster" = "Code Đi" (Vietnamese: "Go code!") — just start building.*

</div>
