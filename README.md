<div align="center">

# 🧠 CodyMaster

**The Universal AI Agent Skills Framework**
**33+ Skills · 1 Plugin · 7 Domains · 7+ Platforms**

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-3.3.0-blue.svg?cacheSeconds=2592000" />
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

## Available Plugins

### 🔧 cm-engineering — Engineering Discipline

Skills: `cm-tdd`, `cm-debugging`, `cm-quality-gate`, `cm-test-gate`, `cm-code-review`
Commands: `/build`, `/review`, `/debug`

### ⚙️ cm-operations — Deployment & Security

Skills: `cm-safe-deploy`, `cm-identity-guard`, `cm-git-worktrees`, `cm-terminal`, `cm-secret-shield`, `cm-safe-i18n`
Commands: `/deploy`

### 🎨 cm-product — Design & Planning

Skills: `cm-planning`, `cm-brainstorm-idea`, `cm-ux-master`, `cm-ui-preview`, `cm-dockit`, `cm-readit`, `cm-project-bootstrap`
Commands: `/bootstrap`, `/plan`, `/ux`

### 📈 cm-growth — Marketing & Content

Skills: `cm-content-factory`, `cm-ads-tracker`, `cro-methodology`
Commands: `/content`, `/track`

### 🎯 cm-orchestration — Workflow & Memory

Skills: `cm-execution`, `cm-continuity`, `cm-skill-chain`, `cm-skill-index`, `cm-skill-mastery`, `cm-deep-search`
Commands: `/continuity`

---

## Start Here

| Goal | Command |
|------|---------|
| New project? | `/bootstrap` |
| Plan a feature? | `/plan` |
| Build with TDD? | `/build` |
| Debug an issue? | `/debug` |
| Review code? | `/review` |
| Deploy safely? | `/deploy` |
| Design UI? | `/ux` |
| Create content? | `/content` |
| Setup tracking? | `/track` |
| Resume session? | `/continuity read` |

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
