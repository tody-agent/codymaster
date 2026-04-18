[English](README.md) | [Tiếng Việt](README-vi.md) | [中文](README-zh.md) | [Русский](README-ru.md) | [한국어](README-ko.md) | [हिन्दी](README-hi.md)

# 🧠 CodyMaster

### Your AI Agent is smart. CodyMaster makes it *wise*.

**60+ Skills · 20+ Commands · 1 Plugin · 8+ Platforms · 6 Languages · v6.0.0**

```
    ( . \ --- / . )
     /   ^   ^   \
    (      u      )
     |  \ ___ /  |
      '--w---w--'
       Meet CodyMaster 🐹
  Your smart coding companion.
```

CodyMaster Kanban Dashboard

[![Discord](https://img.shields.io/badge/Discord-Join-7289da?logo=discord&logoColor=white)](https://discord.gg/codymaster)

### 🌟 If CodyMaster saves you time, give it a [Star](https://github.com/tody-agent/codymaster)! 🌟

---

## 🛑 The Problem Nobody Talks About

You installed an AI coding agent. It's *brilliant*. It writes code faster than any human.

But then reality hits:


| 😤 What Actually Happens                                                     | 💀 The Real Cost                               |
| ---------------------------------------------------------------------------- | ---------------------------------------------- |
| AI designs**differently every single time** — same brand, 3 different styles | Clients think you're 3 different companies     |
| AI fixes one bug,**silently breaks 5 other things**                          | You redo the same work 3-4 times               |
| AI**forgets everything** between sessions                                    | You re-explain the same codebase every morning |
| AI writes zero tests, zero docs                                              | Your codebase becomes a house of cards         |
| You install 15 different skills —**none of them talk to each other**         | Frankenstein toolkit with zero synergy         |
| Deploy to production =**deploy and pray** 🙏                                 | Broken deploys at 2 AM, no rollback            |


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
- **Progressive Loading (L0/L1/L2)** & **Smart Brain Router** — Context loaded at cheapest sufficient depth via a robust task classifier. Up to **80% token savings** on standard workflows.
- **Skill Execution Cache** — Warm FTS5 cache tracks successful agent skill chains. Matches bypass token-heavy LLM decision loops for instant task resolution.
- **cm:// URI Scheme** — Skills request context by URI, not file paths.
- **Token Budget** — 200k window pre-allocated by category. No more silent overflow.
- **Context Bus** — Skills share outputs in real-time within a chain.
- **MCP Server** — 18 tools exposed to Claude Desktop, Goose, and any MCP client (`src/mcp-context-server.ts`). Includes memory tools (`cm_memory_write`, `cm_natural`) plus advisory JSON surfaces (`cm_advisory_report`, `cm_advisory_metrics`, `cm_advisory_handoff`).
- **Intelligent Skill Selection** — `selectTopSkills()` dynamically picks the 2-3 most task-relevant skills per chain execution. Backed by SkillsBench research: 2-3 focused skills = **+18.6pp** vs 4+ loaded statically.
- **SQLite-first memory stack** — CodyMaster ships a supported default path built on SQLite + FTS5, token-budgeted context loading, and optional `qmd` / code intelligence layers. The older OpenViking path has been removed from the runtime.

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

Don't know what the old code does? `**cm-dockit`** reads your entire codebase and generates:

- 📚 Technical architecture docs
- 📖 User guides & SOPs
- 🔌 API references
- 🎯 Persona analysis & JTBD mapping
- 🌐 Multi-language. SEO-optimized.

**One scan = Complete knowledge base.**

### 💡 Strategic Brainstorming (Design Thinking + 9 Windows)

Before diving into code for complex requests, `**cm-brainstorm-idea`** evaluates your product using multi-dimensional analysis (Tech, Product, Design, Business). It generates 2-3 qualified options using the 9 Windows (TRIZ) framework and provides a visual UI Preview via **Pencil.dev** or **Google Stitch** to validate the direction before detailed planning. 

📖 [TRIZ-parallel workflow & UI preview handoff →](docs/architecture/triz-parallel-engine.md)

### 🏭 AI Content Factory v2.0 & Visual Dashboard

Need to scale content? `**cm-content-factory`** is a self-learning, multi-agent content engine. It automatically researches, writes, audits (SEO & Persuasion), and deploys high-converting articles with the Content Mastery framework (StoryBrand + Cialdini) to guarantee conversion.

Track it all on the **Visual Dashboard** (`cm-dashboard`): No more guessing. Track every task, every agent, every deployment on a real-time Kanban board. Pipeline progress, token tracker, event log — all on one screen.

### 🧬 Self-Healing Skills (Recovery, Search, and Evolution)

CodyMaster ships a dedicated self-healing skill family for keeping the skill library usable as the repo evolves.

- `**cm-skill-health`** audits a skill's real health from shipped signals: docs drift, broken references, retro notes, validation, and gates.
- `**cm-skill-evolution`** (Skill Evolver) completes the autonomy loop with three modes: `FIX`, `DERIVED`, and `CAPTURED`. It modifies, clones, and generates new skills automatically based on analyzer recommendations, paired with anti-loop protection and `.md` backups.
- `**cm-learning-promoter`** searches your database for recurring task struggles and automatically graduates them into permanently coded skills (`cm-learned-*`) when appropriately reinforced.
- `**cm advisory report` / `metrics` / `handoff`** turn execution telemetry into a reviewable operator loop before any skill repair begins. 
- Integrated Evolution commands (`cm evolve run/status/promote`) give immediate insight into all mutations.
- `**cm-skill-chain` Auto-Dispatch** — sequence dispatching remains automated with task detection and multi-step handoffs.
- `**cm-skill-search`** finds the best skill through `cm suggest`, skill indexes, and repo search.
- `**cm-skill-share`** packages a skill safely across repos and machines without dropping companion files.

> **Think of it like an immune system for your AI toolkit.** First inspect the telemetry, then diagnose the skill, then repair it deliberately, then capture the learning.

### 🚀 Growth Hacking Engine

Need popups, booking flows, or lead capture? `**cm-growth-hacking`** generates complete conversion systems: Bottom Sheet + Calendar CTA + Tracking. Auto-detects industry, selects the right pattern, wires up `**cm-booking-calendar`** for appointments and `**cm-ads-tracker**` for pixel tracking. Zero dependencies.

---

## 🆚 Scattered Skills vs CodyMaster


|                      | 😵 15 Random Skills                         | 🧠 CodyMaster                                                                                                                                                           |
| -------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Integration**      | Each skill is standalone, no shared context | 68+ skills that chain, share memory, and communicate                                                                                                                    |
| **Lifecycle**        | Covers coding only                          | Covers Idea → Design → Code → Test → Deploy → Docs → Learn                                                                                                              |
| **Memory**           | Forgets everything between sessions         | 5-tier Unified Brain: Sensory → Working → Long-term → Semantic → Structural + Cloud Brain, powered by SQLite + FTS5 by default with optional local semantic layers like `qmd`. |
| **Safety**           | YOLO deploys                                | 4-layer protection: TDD → Security → Isolation → Multi-gate deploy                                                                                                      |
| **Design**           | Random UI every time                        | Extracts & enforces design system + visual preview                                                                                                                      |
| **Documentation**    | "Maybe write a README later"                | Auto-generates complete docs, SOPs, API refs from code                                                                                                                  |
| **Self-improvement** | Static — what you install is what you get   | Advisory-driven self-healing: inspect telemetry → diagnose → repair with FIX / DERIVED / CAPTURED                                                                     |
| **Maintenance**      | Update 15 repos separately                  | One `npm i -g codymaster` updates everything                                                                                                                            |


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

### ✨ NEW: Claude Desktop Plugin (Zero Terminal Required)

The easiest way to install CodyMaster — no npm, no terminal, no setup.

**Claude Desktop / Claude Cowork:**

1. Open **Settings → Plugins** in Claude Desktop
2. Click **"Add marketplace"**
3. Enter: `tody-agent/codymaster`
4. Click **"Sync"** → done ✅

All 68+ skills and 18 slash commands load instantly. Works with **Claude Desktop**, **Claude Cowork**, and any Claude client that supports the plugin marketplace.

> You can also drag-and-drop the `cm.plugin` file from the [latest release](https://github.com/tody-agent/codymaster/releases) directly into Claude Desktop.

---

### 2. Install AI Skills (All Other Platforms)

CodyMaster uses **Native Plugin Extensions** for zero-friction installation. No bash scripts, no manual folder copying. Select your platform below:

**Claude Code CLI:**
```bash
claude plugin marketplace add tody-agent/codymaster
claude plugin install cm@codymaster --scope user
```

**Cursor (in Agent Chat):**
```text
/add-plugin cody-master
```

**Gemini CLI / Google Antigravity:**
```bash
gemini extensions install https://github.com/tody-agent/codymaster
```
*(Progressive disclosure: Add `@~/.gemini/antigravity/skills/cm-skill-index/SKILL.md` to your `GEMINI.md` to save tokens)*

**OpenCode / OpenClaw:**
Tell your agent:
```text
Fetch and follow instructions from https://raw.githubusercontent.com/tody-agent/codymaster/main/.opencode/INSTALL.md
```

### 3. Install Mission Control Dashboard (Optional but Recommended)

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

---

## Use with Goose

CodyMaster works as a [Goose](https://block.github.io/goose/) MCP extension, giving Goose persistent memory, skill orchestration, and token management.

**3-step setup:**

```bash
# 1. Install CodyMaster
npm install -g codymaster

# 2. Get your Goose config snippet
cm mcp-serve --print-config

# 3. Paste the output into your Goose config (~/.config/goose/config.yaml)
```

See [full Goose integration guide](docs/integrations/goose.md) for details.

---

## 🎯 Real-World Use Cases

> **Tip:** Start any session with `/cm:start <your goal>` and CodyMaster will pick the right skills automatically.


| Scenario                                   | Skills Used                                                                      | What You Say                         |
| ------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------ |
| 🐛 **Fix a bug without breaking anything** | `cm-debugging` → `cm-tdd` → `cm-quality-gate`                                    | *"Debug this crash"*                 |
| 🚀 **Ship a feature safely**               | `cm-planning` → `cm-tdd` → `cm-code-review` → `cm-safe-deploy`                   | *"Build the login flow"*             |
| 🎨 **Build a new UI from scratch**         | `cm-ux-master` → `cm-design-system` → `cm-ui-preview`                            | *"Design the dashboard page"*        |
| 🔒 **Deploy to production**                | `cm-secret-shield` → `cm-security-gate` → `cm-identity-guard` → `cm-safe-deploy` | *"Deploy to prod"*                   |
| 📝 **Understand a legacy codebase**        | `cm-codeintell` → `cm-dockit`                                                    | *"What does this code do?"*          |
| 📈 **Launch a landing page**               | `cm-brainstorm-idea` → `cm-cro-methodology` → `cm-content-factory`               | *"Build a landing page for my SaaS"* |
| 🌍 **Add multi-language support**          | `cm-safe-i18n`                                                                   | *"Add Vietnamese and Japanese"*      |
| 🔄 **Start a new project**                 | `cm-project-bootstrap` → `cm-planning`                                           | *"Bootstrap a Next.js SaaS"*         |
| 🧠 **Resume after a break**                | `cm-continuity` → `cm-status`                                                    | *"What was I working on?"*           |
| 🏭 **Scale SEO content**                   | `cm-content-factory` → `cm-auto-publisher` → `cm-ads-tracker`                    | *"Create 20 articles for my blog"*   |


---

## 🧰 The 60+ Skill Arsenal


| Domain               | Skills                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔧 **Engineering**   | `cm-tdd` `cm-debugging` `cm-quality-gate` `cm-test-gate` `cm-code-review` `cm-clean-code`                                                     |
| ⚙️ **Operations**    | `cm-safe-deploy` `cm-identity-guard` `cm-secret-shield` `cm-security-gate` `cm-git-worktrees` `cm-terminal` `cm-safe-i18n`                    |
| 🎨 **Product & UX**  | `cm-planning` `cm-design-system` `cm-ux-master` `cm-ui-preview` `cm-project-bootstrap` `cm-jtbd` `cm-brainstorm-idea` `cm-dockit` `cm-readit` |
| 📈 **Growth & CRO**  | `cm-content-factory` `cm-auto-publisher` `cm-ads-tracker` `cm-cro-methodology` `cm-growth-hacking` `cm-booking-calendar` `cm-google-form`     |
| 🏢 **Enterprise**    | `cm-reactor` `cm-notebooklm`                                                                                                                  |
| 🧬 **Self-Healing**  | `cm-skill-health` `cm-skill-evolution` `cm-skill-search` `cm-skill-share` `cm-skill-chain` `cm-skill-mastery` `cm-skill-index`                |
| 🎯 **Orchestration** | `cm-execution` `cm-continuity` `cm-deep-search` `cm-codeintell` `cm-how-it-work`                                                              |
| 🖥️ **Workflow**     | `cm-start` `cm-dashboard` `cm-status`                                                                                                         |


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
cm index skills             → Zero-Token tech stack and skill local indexer
cm sprint …                 → Sprint pipeline + .cm/sprint
cm design-studio [init|status]
cm distro validate …        → Validate skill pack layout
```

**Memory, bus, budgets, `cm://` resolution:** use the **MCP context server** — see [docs/api/api-reference.md](docs/api/api-reference.md).

**Engineering (browse, guardian, sprint):** [docs/workflows/engineering-pipeline.md](docs/workflows/engineering-pipeline.md) · [docs/browse-daemon.md](docs/browse-daemon.md) · [docs/workflows/guardian-hooks.md](docs/workflows/guardian-hooks.md) · [docs/architecture/servers-and-mcp.md](docs/architecture/servers-and-mcp.md)

Legacy configs that still say `storage.backend: viking` are automatically routed back to SQLite.

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
- 🛠️ [Skills Reference](skills/) — Browse **56** bundled `cm-`* SKILL.md packs (profiles/installer can add more)
- 📖 [Our Story](https://cody.todyle.com/story) — Why this exists

---

## 🤝 Contributing

1. ⭐ **Star the repo** — it helps more builders find this
2. Fork → Create `skills/cm-your-skill/SKILL.md`
3. Submit a Pull Request

CI runs `npm ci` and `npm run test:gate:kit` on pushes and pull requests (see `.github/workflows/ci.yml`).

---

*ISC License — Free to use, modify, and distribute.*   

**Built with ❤️ for the vibe coding community.**

*"CodyMaster" = "Code Đi" (Vietnamese: "Go code!") — just start building.*
