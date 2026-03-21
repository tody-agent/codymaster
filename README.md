<div align="center">

# 🧠 CodyMaster

**The Universal AI Agent Skills Framework**
**33 Skills · 11 Commands · 1 Plugin · 6 Domains · 7+ Platforms**

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-3.4.0-blue.svg?cacheSeconds=2592000" />
  <img alt="Skills" src="https://img.shields.io/badge/skills-33-success.svg" />
  <img alt="Commands" src="https://img.shields.io/badge/commands-11-orange.svg" />
  <img alt="Plugins" src="https://img.shields.io/badge/plugins-1-purple.svg" />
  <a href="https://github.com/tody-agent/codymaster#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
</p>

> *Turns your AI coding agent into an autonomous senior developer with TDD discipline, systematic debugging, safe deployments, and working memory.*

</div>

---

## Installation

### Claude Code (Recommended)

**One-liner** — auto-detect, multi-language, scope selection:
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/tody-agent/codymaster/main/install.sh) --claude
```

**Or manually:**
```bash
# 1. Add marketplace
claude plugin marketplace add tody-agent/codymaster

# 2. Install all 33 skills
claude plugin install cody-master@cody-master
```

### Gemini CLI

```bash
gemini extensions install https://github.com/tody-agent/codymaster
```

### Cursor

```
/add-plugin cody-master
```

Or search "cody-master" in the Cursor plugin marketplace.

### Codex

```
Fetch and follow instructions from https://raw.githubusercontent.com/tody-agent/codymaster/main/.codex/INSTALL.md
```

### OpenCode

```
Fetch and follow instructions from https://raw.githubusercontent.com/tody-agent/codymaster/main/.opencode/INSTALL.md
```

### Antigravity / Gemini (Manual)

```bash
# Global
git clone https://github.com/tody-agent/codymaster.git ~/.cody-master
cp -r ~/.cody-master/skills/* ~/.gemini/antigravity/skills/

# Per-project
cp -r ~/.cody-master/skills/* .gemini/skills/
```

### Any Other Agent

`skills/*/SKILL.md` follows the universal format — drop them anywhere:

```bash
cp -r skills/* .opencode/skills/
cp -r skills/* .cursor/skills/
cp -r skills/* .codex/skills/
cp -r skills/* .kiro/skills/
```

---

## What's Inside

All 33 skills ship as a **single plugin** (`cody-master`), organized by domain:

| Domain | Skills |
|--------|--------|
| 🔧 Engineering | `cm-tdd` `cm-debugging` `cm-quality-gate` `cm-test-gate` `cm-code-review` |
| ⚙️ Operations | `cm-safe-deploy` `cm-identity-guard` `cm-git-worktrees` `cm-terminal` `cm-secret-shield` `cm-safe-i18n` |
| 🎨 Product | `cm-planning` `cm-brainstorm-idea` `cm-ux-master` `cm-ui-preview` `cm-dockit` `cm-readit` `cm-project-bootstrap` `cm-jtbd` |
| 📈 Growth | `cm-content-factory` `cm-ads-tracker` `cro-methodology` |
| 🎯 Orchestration | `cm-execution` `cm-continuity` `cm-skill-chain` `cm-skill-index` `cm-skill-mastery` `cm-deep-search` `cm-how-it-work` |
| 🖥️ Workflow | `cm-start` `cm-dashboard` `cm-status` |

---

## Start Here

After installing, run the onboarding tour:

```
/cody-master:demo
```

| Goal | Command |
|------|---------|
| Onboarding tour | `/cody-master:demo` |
| New project? | `/cody-master:bootstrap` |
| Plan a feature? | `/cody-master:plan` |
| Build with TDD? | `/cody-master:build` |
| Debug an issue? | `/cody-master:debug` |
| Review code? | `/cody-master:review` |
| Deploy safely? | `/cody-master:deploy` |
| Design UI? | `/cody-master:ux` |
| Create content? | `/cody-master:content` |
| Setup tracking? | `/cody-master:track` |
| Resume session? | `/cody-master:continuity` |

Skills activate **automatically** when relevant — no invocation needed. Commands force specific workflows.

---

## How It Works

**Skills** (`skills/cm-*/SKILL.md`) give your AI agent domain knowledge and structured workflows. They activate automatically when relevant — no invocation needed.

**Commands** (`commands/*.md`) are user-triggered workflows invoked with `/cody-master:name`. They chain skills into end-to-end processes.

```
Your Idea → /plan → /build (TDD) → /review → /deploy → Production
```

---

## Philosophy

- **Test-Driven Development** — Write tests first, always
- **Systematic over ad-hoc** — Process over guessing
- **Complexity reduction** — Simplicity as primary goal
- **Evidence over claims** — Verify before declaring success
- **Defense-in-depth** — Multiple safety layers
- **Working memory** — Context persists across sessions

---

## 📚 Documentation

| Doc | Description |
|-----|-------------|
| [Website](https://codymaster.pages.dev) | Landing page and overview |
| [Docs](https://codymaster.pages.dev/docs) | Full documentation |
| [Skills Reference](skills/) | All 33 SKILL.md files |
| [Installation Guide](docs/sop/installation.md) | Detailed setup for all platforms |

---

## 🤝 Contributing

1. Fork the repository
2. Create `skills/cm-your-skill/SKILL.md` (see `skills/cm-example/SKILL.md` as template)
3. Submit a Pull Request

---

## 📜 License

MIT License — free to use, modify, and distribute.

<div align="center">
<br/>

*Built with ❤️ for the vibe coding community.*

</div>
