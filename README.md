[English](README.md) | [Tiếng Việt](README-vi.md)

# CodyMaster

> *"I can't write code. But in 6 months, I shipped 12 real products using AI. CodyMaster is everything I learned — so you don't have to repeat my mistakes."* — **Tody Le**, Head of Product, Creator of CodyMaster

**50+ skills. One install. Your AI coding agent becomes a full team.**

**v7.0.2 — Browse Hybrid Bridge:** AI-native browser automation with a11y snapshots, error collection, video recording.

```
    ( . \ --- / . )
     /   ^   ^   \
    (      u      )
     |  \ ___ /  |
      '--w---w--'
       Meet Cody 🐹
```

[![npm version](https://img.shields.io/npm/v/codymaster.svg)](https://www.npmjs.com/package/codymaster)
[![npm downloads](https://img.shields.io/npm/dm/codymaster.svg)](https://www.npmjs.com/package/codymaster)
[![license](https://img.shields.io/npm/l/codymaster.svg)](https://github.com/tody-agent/codymaster/blob/main/LICENSE)

---

## The Problem

You installed an AI coding agent. It writes code fast. But then:

- **It designs differently every time** — your brand looks like 3 different companies
- **It fixes one thing, breaks five others** — you redo the same work over and over
- **It forgets everything** between sessions — you re-explain your project every morning
- **It writes zero tests, zero docs** — your codebase becomes a ticking time bomb
- **You install 15 skills** — none of them talk to each other

> *"AI gave me 100 hands. Without discipline, those hands created chaos."*

---

## The Solution: A Full Senior Team in One Install

CodyMaster isn't a collection of random skills. It's an **operating system** for your AI agent — 50+ skills that work together like a real team.

**When you install CodyMaster, you hire:**

| Role | What They Do | Key Skills |
|------|-------------|------------|
| **Senior Developer** | Write tests first, debug systematically, review code | `cm-tdd` `cm-debugging` `cm-code-review` |
| **UX Designer** | Extract design systems, preview UI before coding | `cm-design-system` `cm-ux-master` `cm-open-design` |
| **Product Manager** | Plan features, brainstorm ideas, understand users | `cm-planning` `cm-brainstorm-idea` |
| **DevOps Engineer** | Safe deploys, secret scanning, right-account checks | `cm-safe-deploy` `cm-identity-guard` |
| **Tech Writer** | Auto-generate docs, API refs, knowledge base from code | `cm-dockit` `cm-codeintell` |
| **Automation Lead** | Sprint pipelines, autopilot workflows, status tracking | `cm-sprint-bus` `cm-autopilot` |

---

## Quick Start — 30 Seconds

**Step 1: Install**

```bash
npm install -g codymaster && cm
```

A wizard detects your AI tools (Claude Code, Cursor, Gemini, etc.) and installs skills to all of them.

**Step 2: Start coding**

Open your AI agent and say what you want:

```
Build a landing page for my coffee shop
```

**Step 3: Watch it work**

CodyMaster automatically chains the right skills:
`cm-brainstorm-idea` → `cm-design-system` → `cm-execution` → `cm-safe-deploy`

That's it. No config files. No setup ritual. Just describe what you want.

---

## See It Work

Here's a real conversation — a non-technical founder building a booking site:

```
You:    I want to build a booking website for my spa business.
        I have an old website at myspa.com but it looks terrible.

AI:     [cm-brainstorm-idea] Let me analyze your current site first...
        I found 3 key issues: no mobile booking, unclear pricing,
        slow load time. Here are 2 approaches:
        A) Redesign from scratch (recommended — your brand needs it)
        B) Fix the existing site
        
You:    Let's go with A.

AI:     [cm-design-system] I'm extracting your brand colors from
        myspa.com... Found: gold + navy. Building a design system.
        [cm-planning] Here's the plan: booking page, services page,
        about page, contact. Estimated: 30 minutes of AI work.
        
You:    Sounds good, do it.

AI:     [cm-tdd] Writing tests first...
        [cm-execution] Building 4 pages...
        [cm-dockit] Generating service descriptions and FAQ docs...
        [cm-quality-gate] All tests pass. Performance: 98/100.
        [cm-safe-deploy] Deploying to staging...
        
        ✅ Done. Preview: https://staging-myspa.pages.dev
        
You:    The booking button is too small on mobile.

AI:     [cm-debugging] Found it — padding was 8px, should be 16px.
        [cm-code-review] Fix looks good. No side effects.
        [cm-safe-deploy] Deployed fix.
        
        ✅ Fixed. Try now.
```

**No code written by the human. No bugs introduced by the AI.** The system caught the mobile issue before it reached production.

---

## What Makes This Different

| | 😵 Random Skills | 🧠 CodyMaster |
|---|---|---|
| **Integration** | Each skill is standalone | 50+ skills that chain and share memory |
| **Memory** | Forgets everything between sessions | Remembers your project, your style, your mistakes |
| **Safety** | Deploy and pray | Multi-layer protection: tests → security → staging → production |
| **Design** | Random UI every time | Extracts your brand, enforces consistency |
| **Documentation** | "Maybe later" | Auto-generates docs from your code |
| **Self-improvement** | Static — what you install is what you get | Learns from feedback, gets better over time |

---

## Built For Builders, Not Coders

CodyMaster was built for people who **have ideas, not CS degrees**.

**You're a good fit if you:**
- Want to type a message and get a working product back
- Want your AI to learn from its mistakes
- Don't want to manually review every line of AI output
- Want to deploy with confidence, not prayer

**You're NOT a good fit if you:**
- Enjoy doing the same setup for every project
- Prefer slow, manual deploys with no safety net
- Like re-explaining your codebase every morning

---

## The 10-Second Tour

Instead of listing 50+ skills, here's what CodyMaster does in plain language:

### 💡 Before You Build
- **Thinks before coding** — asks questions, challenges your assumptions, saves you from building the wrong thing
- **Plans the architecture** — diagrams, data flow, edge cases — all before writing code

### 🎨 While Building
- **Enforces your design system** — consistent colors, fonts, spacing across every page
- **Writes tests first** — catches bugs before they exist
- **Debugs systematically** — traces the root cause, doesn't guess

### 🚀 Before Shipping
- **Scans for secrets** — no API keys leaking to GitHub
- **Checks the right account** — no accidental deploys to the wrong Cloudflare
- **Runs quality gates** — no deploy without passing tests + performance checks

### 📈 After Shipping
- **Generates documentation** — reads your code, writes the docs
- **Learns from feedback** — gets smarter with every project
- **Runs retrospectives** — captures what worked, what didn't, improves the process

📖 [Full skill reference →](skills/)

---

## The Design Pipeline

CodyMaster treats design as a **first-class discipline** — not an afterthought. Your AI doesn't just write code; it enforces visual consistency across every page.

**Three ways to get a design system:**

| Method | When to Use | How |
|--------|-------------|-----|
| **Extract from URL** | You have an existing brand/site | `cm-open-design` analyzes your site, extracts colors, fonts, spacing |
| **Pick from 129 systems** | You want a proven aesthetic | Choose from Linear, Stripe, Vercel, Notion, Apple, Tesla, and 123 more |
| **Choose a direction** | You have no brand yet | Pick from 5 curated styles: Editorial, Modern Minimal, Warm Soft, Tech Utility, Brutalist |

```
Extract → Tokens → Validate → Build → QA
   │          │         │          │       │
   │          │         │          │       └─ cm-quality-gate
   │          │         │          └─ cm-execution
   │          │         └─ cm-ux-master (48 UX laws)
   │          └─ cm-design-system (STITCH_TOKENS)
   └─ cm-open-design (129 systems + extraction)
```

📖 [Full design pipeline guide →](docs/design-pipeline.md)

---

## Real-World Scenarios

| You Say | What Happens |
|---------|-------------|
| *"Fix this bug"* | `cm-debugging` finds root cause → `cm-tdd` writes test → `cm-quality-gate` verifies |
| *"Build a landing page"* | `cm-brainstorm-idea` → `cm-design-system` → `cm-execution` → `cm-safe-deploy` |
| *"Make it look like Stripe"* | `cm-open-design` extracts Stripe tokens → `cm-design-system` applies → `cm-execution` builds |
| *"Deploy to production"* | `cm-secret-shield` → `cm-security-gate` → `cm-identity-guard` → `cm-safe-deploy` |
| *"What does this code do?"* | `cm-codeintell` reads the codebase → `cm-dockit` generates docs |
| *"Add Vietnamese support"* | `cm-safe-i18n` extracts strings → translates → validates → ships |
| *"Start a new project"* | `cm-project-bootstrap` scaffolds → `cm-planning` plans → `cm-execution` builds |

---

## Install

### One command

```bash
npm install -g codymaster && cm
```

### What the wizard does

1. **Detects** every AI tool you have (Claude Code, Cursor, Gemini CLI, Codex, OpenCode, Windsurf, Cline, Aider, Continue, Kiro, Amazon Q, Amp, Copilot, Claude Desktop)
2. **Asks** which ones you want skills for (pre-checked for detected tools)
3. **Installs** to each platform's native location
4. **Done** — open your AI agent and start building

### After install

```bash
cm doctor          # Check what's installed
cm status          # See your tasks and progress
cm dashboard       # Open the visual dashboard
```

### For OpenCode users

OpenCode supports both skills and plugins:

```bash
git clone https://github.com/tody-agent/codymaster.git ~/.cody-master

# Skills (auto-load)
ln -s ~/.cody-master/.opencode/skills ~/.opencode/skills

# Plugins (optional — adds custom tools)
mkdir -p ~/.opencode/plugins
ln -s ~/.cody-master/.opencode/plugins/cm-brainstorm-idea.ts ~/.opencode/plugins/
```

Restart OpenCode to activate. The `cm-brainstorm-idea` plugin adds a strategic analysis tool with auto-detection for brainstorm keywords.

📖 [Full OpenCode installation guide →](.opencode/INSTALL.md)

### For Codex users

Fastest path:

```bash
git clone https://github.com/tody-agent/codymaster.git ~/.cody-master
cd ~/.cody-master
npm ci
npm run build:platforms
```

Then tell Codex:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/tody-agent/codymaster/main/.codex/INSTALL.md
```

Or use the local Codex skill tree directly at `.codex/skills/`.

### No Node.js?

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/tody-agent/codymaster/main/install.sh) --all --profile core
```

### What's in the package

- **50+ skills** — ready-to-use SKILL.md files for every major AI coding agent
- **CLI (`cm`)** — install wizard, doctor, dashboard, MCP server, browse daemon
- **Skill profiles** — curated bundles: `core`, `growth`, `full`, `knowledge`
- **Multi-platform** — installs to Claude Code, Cursor, Gemini, Codex, OpenCode, Windsurf, Cline, Aider, Continue, Kiro, Amazon Q, Amp, Copilot, Claude Desktop
- **Zero config** — detects your tools, installs skills, you're done

---

## The Dashboard

Visual mission control for your projects:

```
┌─────────────────────────────────────────────┐
│           📊 CodyMaster Dashboard           │
│  Tasks │ Progress │ Tokens │ Logs           │
└─────────────────────────────────────────────┘
```

```bash
cm dashboard start   # Start the dashboard
cm dashboard open    # Open in browser
```

Track tasks, monitor progress, see what your AI team is doing — all in one screen.

---

## How It Works Under the Hood

For the curious (skip this if you just want to build):

- **Memory System** — Your AI remembers your project across sessions. No more re-explaining.
- **Skill Chaining** — Skills talk to each other. Planning feeds into design, design feeds into code, code feeds into tests.
- **Behavioral Discipline** — Inspired by [Andrej Karpathy's AI coding rules](https://x.com/karpathy/status/2015883857489522876). Your AI thinks before coding, keeps things simple, makes surgical changes.
- **Multi-Layer Safety** — Tests → security scan → staging → production. Each layer catches what the previous missed.
- **Self-Healing** — Skills learn from failures and improve over time.

📖 [Architecture deep dive →](docs/architecture/codymaster-brain.md)

---

## For Teams & Advanced Users

### Multiple AI Agents

Works with 14+ platforms out of the box:

```bash
cm install claude-code --profile core
cm install cursor --profile growth
cm install gemini --profile full
```

### MCP Server

Use CodyMaster as an MCP server for Claude Desktop:

```bash
npx codymaster mcp-serve --install-claude
```

### Goose Integration

```bash
cm mcp-serve --print-config  # Paste into Goose config
```

📖 [All integrations →](docs/integrations/)

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `cm` | Launch interactive wizard (auto-detect AI tools) |
| `cm doctor` | Check installation health across all platforms |
| `cm status` | View current tasks and progress |
| `cm dashboard` | Open visual mission control |
| `cm install <platform> --profile <name>` | Install skills to a specific platform |
| `cm update --full` | Update all skills to latest |
| `cm upgrade` | Upgrade CodyMaster itself |
| `cm mcp-serve` | Run as MCP server for Claude Desktop |
| `cm browse` | Open a URL in the browse daemon |
| `cm browse screenshot <url>` | Capture a screenshot |
| `cm browse snapshot <url>` | Get accessibility tree snapshot |

### Skill Profiles

| Profile | Skills | Best For |
|---------|--------|----------|
| `core` | 15 | Daily coding — planning, TDD, debug, review, deploy |
| `growth` | 25 | + design system, i18n, content factory |
| `full` | 50+ | Everything — full senior team |
| `knowledge` | 10 | Docs, code intelligence, retros |

```bash
cm install claude-code --profile core
cm install cursor --profile growth
cm install gemini --profile full
```

---

## Troubleshooting

### `cm: command not found`

```bash
# Make sure global npm bin is in PATH
npm config get prefix
# Add the output bin/ folder to your PATH
```

### Skills not showing in AI agent

```bash
cm doctor          # Check what's installed where
cm install --all   # Re-install to all detected platforms
```

### Build fails

```bash
npm run build      # Rebuild TypeScript
npm run test:gate:kit  # Run full quality gate
```

### Permission errors (macOS/Linux)

```bash
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

---

## Contributing

1. ⭐ **Star the repo** — helps more builders find this
2. Fork → Create `skills/cm-your-skill/SKILL.md`
3. Submit a Pull Request

CI runs `npm run test:gate:kit` on every push and PR.

---

## Resources

| Resource | Link |
|----------|------|
| 🌍 Website | [cody.todyle.com](https://cody.todyle.com) |
| 📖 Docs | [cody.todyle.com/docs](https://cody.todyle.com/docs) |
| 📘 Repo Docs | [docs/index.md](docs/index.md) |
| 🎨 Design Pipeline | [docs/design-pipeline.md](docs/design-pipeline.md) |
| 🛠️ Skills | [skills/](skills/) |
| 📖 Our Story | [cody.todyle.com/story](https://cody.todyle.com/story) |
| 📋 Changelog | [CHANGELOG.md](CHANGELOG.md) |
| 🐛 Issues | [GitHub Issues](https://github.com/tody-agent/codymaster/issues) |

---

## Who Built This

**Tody Le** — Head of Product with 10+ years of experience. Can't write code. Used AI to build real products for 6 months straight. Every skill in this kit was born from a real failure that cost real time and real tears.

> *"50+ skills. Each skill is a lesson. Each lesson is a sleepless night. And now, you don't have to go through those nights."*

---

*ISC License — Free to use, modify, and distribute.*

**Built with ❤️ for the vibe coding community.**

*"CodyMaster" = "Code Đi" (Vietnamese: "Go code!") — just start building.*
