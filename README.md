# 🧠 CodyMaster Universal Skills Platform

A community-driven, open-source repository centralizing the best AI "Agent Skills" and "Workflows" into a **universal format**. This toolkit acts as a "Swiss Army Knife", empowering developers to deploy powerful AI capabilities consistently across leading platforms:

*   🟢 **Google Antigravity (Gemini)**
*   🟣 **Claude Code**
*   🔵 **Cursor**
*   🟠 **Windsurf**
*   🟤 **Cline / RooCode**
*   🐈 **GitHub Copilot**
*   🐾 **OpenClaw / OpenFang**

## 🚀 Installation

Install the Universal CLI across your system or specifically in your current workspace using our interactive bash installer:

```bash
curl -sL https://raw.githubusercontent.com/username/codymaster/main/install.sh | bash
```

Alternatively, install via NPM:
```bash
npm install -g codymaster
```

## 🛠️ CLI Help & Support

The `cm` CLI is fully documented. 
Type `cm --help` in your terminal anytime.

```text
Usage: cm [options] [command]

CodyMaster Universal Skills CLI

Options:
  -V, --version                 output the version number
  -h, --help                    display help for command

Commands:
  install [options] <skill>     Install a new agent skill to the central registry
  dashboard                     Launch the Universal Agent Skills Observatory Dashboard
  status                        Show active installed skills in the current workspace
  update                        Update all skills to the latest Universal format
  help [command]                display help for command
```

## 🏎️ Super Agent & Multi-Subagent Orchestration

To maximize coding speed and parallelize complex tasks, the CodyMaster Universal Kit introduces the **Orchestrator Pattern**. 

Instead of sequential file edits, your primary LLM acts as the **Super Agent**, breaking down tasks from the `Task Breakdown` into parallelizable chunks and dispatching them to **Subagents**.

**How to Use Multi-Subagents:**
1. Configure your Universal Skill with a `<subagent>` block.
2. The core adapter will compile this into platform-specific commands (e.g., Windsurf Cascade background tasks, or Gemini `browser_subagent` concurrent tools).
3. The Super Agent pauses while Subagents tackle specific files independently, merging the results upon completion.

## 📊 Visual Dashboard

We provide a real-time web dashboard for visualizing agent operations, memory variables, and subagent parallel workflows.

Start the dashboard locally:
```bash
npx cm dashboard
```
*Navigates to `http://localhost:3455` to view real-time task pipelines, agent logs, and codebase heatmaps.*

## 🤝 Contributing
Want to add a new skill to the community?
Create a folder inside `/skills` following the `SKILL.md` Universal Spec, and submit a PR!
