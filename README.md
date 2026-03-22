<div align="center">

# 🧠 CodyMaster

**Transform Your AI Coding Agent into an Autonomous Senior Developer.**

*The ultimate skills framework for Claude Code, Cursor, Gemini, and beyond. Inject TDD discipline, systematic debugging, safe deployments, and context memory directly into your AI workflow.*

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-3.4.0-blue.svg?cacheSeconds=2592000" />
  <img alt="Skills" src="https://img.shields.io/badge/skills-33-success.svg" />
  <img alt="Commands" src="https://img.shields.io/badge/commands-11-orange.svg" />
  <img alt="Plugins" src="https://img.shields.io/badge/plugins-1-purple.svg" />
  <a href="https://github.com/tody-agent/codymaster#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
</p>

### 🌟 If CodyMaster helps you ship faster, please [Star this repository](https://github.com/tody-agent/codymaster)! 🌟

</div>

---

## 🛑 The Problem: AI Agents Are Smart, But Undisciplined
Your AI coding assistant is incredibly smart, but it often guesses, writes untested code, breaks existing features, and forgets context across sessions. You spend more time reviewing and fixing AI-generated bugs than actually coding.

## 🟢 The Solution: CodyMaster
CodyMaster is a **Universal AI Agent Skills Framework**. It acts as a strict "manager" for your AI, forcing it to follow engineering best practices, test-driven development (TDD), and systematic debugging workflows. 

With **33 domain-specific skills**, your AI goes from being a junior coder to a seasoned Tech Lead.

---

## 🚀 1-Minute Quickstart

### 🥇 Claude Code (Recommended)
**One-liner installer — Auto-detect, multi-language, scope selection:**
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/tody-agent/codymaster/main/install.sh) --claude
```
*Or manually: `claude plugin marketplace add tody-agent/codymaster` then `claude plugin install cody-master@cody-master`*

### 🥈 Cursor IDE
Simply type in the chat to install the curated skills:
```
/add-plugin cody-master
```
*Or search "cody-master" in the Cursor plugin marketplace.*

### 🥉 Gemini CLI / Antigravity
```bash
gemini extensions install https://github.com/tody-agent/codymaster
```

<details>
<summary><b>View Installation for Other Agents (Codex, OpenCode, Kiro)</b></summary>

**OpenCode / Codex**
Fetch and follow instructions from `.opencode/INSTALL.md` or `.codex/INSTALL.md` in this repository.

**Universal Fallback (Any Agent)**
`skills/*/SKILL.md` follows the universal format. Drop them anywhere in your workspace:
```bash
# Global fallback (example)
git clone https://github.com/tody-agent/codymaster.git ~/.cody-master
cp -r ~/.cody-master/skills/* ~/.gemini/antigravity/skills/

# Local workspace fallback
cp -r skills/* .opencode/skills/
cp -r skills/* .cursor/skills/
cp -r skills/* .codex/skills/
cp -r skills/* .kiro/skills/
```
</details>

---

## ✨ Why You Need This (The Magic)

- **Test-Driven Development (TDD)**: Forces the AI to write tests *before* writing implementation code. Stop the regression loop.
- **Systematic Debugging**: No more blind guessing. The AI runs diagnostic commands, reads logs, and isolates root causes before proposing fixes.
- **Working Memory**: Context naturally persists across coding sessions using `CONTINUITY.md`. Your AI remembers its mistakes.
- **Defense-in-Depth**: Includes pre-commit secret scanning, strict git worktree isolation, and safe multi-gate deployment pipelines.

---

## 🧰 The 33-Skill Arsenal 

All 33 skills ship as a **single plugin** (`cody-master`), instantly upgrading your agent across 6 domains:

| Domain | Core Skills Included |
|--------|----------------------|
| 🔧 **Engineering** | `cm-tdd` `cm-debugging` `cm-quality-gate` `cm-test-gate` `cm-code-review` |
| ⚙️ **Operations** | `cm-safe-deploy` `cm-identity-guard` `cm-secret-shield` `cm-git-worktrees` `cm-terminal` `cm-safe-i18n` |
| 🎨 **Product & UX**| `cm-planning` `cm-ux-master` `cm-ui-preview` `cm-project-bootstrap` `cm-jtbd` `cm-brainstorm-idea` `cm-dockit` `cm-readit` |
| 📈 **Growth/CRO**  | `cm-content-factory` `cm-ads-tracker` `cro-methodology` |
| 🎯 **Orchestration**| `cm-execution` `cm-continuity` `cm-skill-chain` `cm-skill-mastery` `cm-skill-index` `cm-deep-search` `cm-how-it-work` |
| 🖥️ **Workflow**    | `cm-start` `cm-dashboard` `cm-status` |

---

## 🎮 How to Command Your AI

Skills activate **automatically** behind the scenes when relevant. But you can also explicitly orchestrate workflows using Commands. 

After installing, try the interactive onboarding:
```
/cody-master:demo
```

### Popular Workflows:
| You Want To... | Just Type... |
|----------------|--------------|
| Boot a new project from scratch | `/cody-master:bootstrap` |
| Plan a complex feature | `/cody-master:plan` |
| Build robustly with TDD | `/cody-master:build` |
| Fix a stubborn bug | `/cody-master:debug` |
| Extract UX & Design a UI | `/cody-master:ux` |
| Setup Marketing Tracking | `/cody-master:track` |

**The Vibe Coding Flow:** `Your Idea → /plan → /build (TDD) → /review → /deploy → Production`

---

## 📚 Resources & Documentation

- 🌍 **[Official Website](https://codymaster.pages.dev)**: Concept overviews & methodology.
- 📖 **[Documentation](https://codymaster.pages.dev/docs)**: Full deep-dive into the framework.
- 🛠️ **[Skills Reference](skills/)**: Browse the raw prompts and logic inside all 33 `SKILL.md` files.

---

## 🤝 Join the Rebellion (Contributing)

We are building the open standard for AI Agent Skills. Help us make AI coding actually reliable.

1. **Star the repo!** (It helps us build momentum 🌟)
2. Fork the repository
3. Create your custom skill `skills/cm-your-skill/SKILL.md` 
4. Submit a Pull Request!

---

<div align="center">

*MIT License — Free to use, modify, and distribute.* <br/>
**Built with ❤️ for the vibe coding community.**

</div>
