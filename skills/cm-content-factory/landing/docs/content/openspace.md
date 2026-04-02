# OpenSpace: Autonomous Workspace

**OpenSpace** provides your AI agents with a **sandbox workspace** to execute commands, run tests, and manage files safely.

---

## 🏗️ The Sandbox Model

Autonomous agents often need to do more than just "write code." They need to:
- Run `npm test` or `go test` to verify their changes.
- Build Docker images or binaries.
- Scrape websites for documentation.
- Manage Git worktrees for isolated feature development.

**OpenSpace** creates an isolated environment (either local or containerized) where these actions can occur without risk to your main production files.

## 🚌 Context Integration

Every action taken inside an **OpenSpace** workspace is automatically logged to the **Neural Spine**. If a test fails, the agent doesn't just see the error—it understands the *semantic context* of why it failed by searching through its memory.

## 🛠️ Key Commands

Agents use special skills to interact with OpenSpace:
- `cm-terminal`: Run commands and capture structured output.
- `cm-git-worktrees`: Manage isolated feature branches.
- `cm-status`: Track process progress across multi-agent pipelines.

---

[docs/](./index.html#v5-intro) ← Back to Intro
