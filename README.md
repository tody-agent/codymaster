<div align="center">

# 🧠 CodyMaster

**The Universal AI Agent Skills Framework**
**33+ Skills · 1 Plugin · 7 Domains · 7+ Platforms**

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-3.4.0-blue.svg?cacheSeconds=2592000" />
  <img alt="Skills" src="https://img.shields.io/badge/skills-33%2B-success.svg" />
  <img alt="Commands" src="https://img.shields.io/badge/commands-10-orange.svg" />
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

**One-liner** — prints all commands for you:
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/tody-agent/codymaster/main/install.sh) --claude
```

**Or run manually:**
```bash
# Step 1: Add the marketplace
claude plugin marketplace add tody-agent/codymaster

# Step 2: Install all 33+ skills in one go
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

Or search for "cody-master" in the Cursor plugin marketplace.

### Codex

Tell Codex:
```
Fetch and follow instructions from https://raw.githubusercontent.com/tody-agent/codymaster/main/.codex/INSTALL.md
```

### OpenCode

Tell OpenCode:
```
Fetch and follow instructions from https://raw.githubusercontent.com/tody-agent/codymaster/main/.opencode/INSTALL.md
```

### Antigravity / Gemini (Manual)

```bash
# Global install
git clone https://github.com/tody-agent/codymaster.git ~/.cody-master
cp -r ~/.cody-master/skills/* ~/.gemini/antigravity/skills/

# Or per-project
cp -r ~/.cody-master/skills/* .gemini/skills/
```

### Other Assistants

The `skills/*/SKILL.md` files follow the universal skill format and work with any AI tool that reads them:

```bash
cp -r skills/* .opencode/skills/    # OpenCode
cp -r skills/* .cursor/skills/      # Cursor
cp -r skills/* .codex/skills/       # Codex
cp -r skills/* .kiro/skills/        # Kiro
```

---

## What's Inside

All 33+ skills ship as a **single plugin** (`cody-master`), organized by domain:

| Domain | Skills |
|--------|--------|
| 🔧 Engineering | `cm-tdd`, `cm-debugging`, `cm-quality-gate`, `cm-test-gate`, `cm-code-review` |
| ⚙️ Operations | `cm-safe-deploy`, `cm-identity-guard`, `cm-git-worktrees`, `cm-terminal`, `cm-secret-shield`, `cm-safe-i18n` |
| 🎨 Product | `cm-planning`, `cm-brainstorm-idea`, `cm-ux-master`, `cm-ui-preview`, `cm-dockit`, `cm-readit`, `cm-project-bootstrap`, `jobs-to-be-done` |
| 📈 Growth | `cm-content-factory`, `cm-ads-tracker`, `cro-methodology` |
| 🎯 Orchestration | `cm-execution`, `cm-continuity`, `cm-deep-search`, `cm-skill-chain`, `cm-skill-mastery`, `cm-how-it-work` |

---

## Start Here

After installing, run the interactive onboarding tour first:

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

Skills activate automatically when relevant — no explicit invocation needed. Commands force specific workflows.

---

## How It Works

**Skills** are the building blocks. Each skill gives your AI agent domain knowledge and a structured workflow for a specific task. Skills are loaded automatically when relevant.

**Commands** are user-triggered workflows invoked with `/command-name`. They chain one or more skills into an end-to-end process.

**Plugins** group related skills and commands into installable packages. Each plugin covers a domain — engineering, operations, product, growth, or orchestration.

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
| [Skills Reference](skills/) | All SKILL.md files |

---

## 🤝 Contributing

1. Fork the repository
2. Create a skill folder: `skills/your-skill-name/SKILL.md`
3. Add it to the appropriate plugin directory
4. Submit a Pull Request

See `skills/cm-example/SKILL.md` for the universal skill format template.

---

## 📜 License

MIT License — free to use, modify, and distribute.

<div align="center">
<br/>

*Built with ❤️ for the vibe coding community.*

</div>
