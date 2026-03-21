# CodyMaster — OpenCode Installation

## Quick Install

Tell OpenCode:

```
Fetch and follow instructions from https://raw.githubusercontent.com/tody-agent/cody-master/main/.opencode/INSTALL.md
```

## Manual Setup

1. Clone the repository:
```bash
git clone https://github.com/tody-agent/cody-master.git ~/.cody-master
```

2. Copy skills to your OpenCode skills directory:
```bash
mkdir -p .opencode/skills/
cp -r ~/.cody-master/skills/* .opencode/skills/
```

3. Skills will be automatically loaded by OpenCode when relevant.

## Available Skills

CodyMaster provides 27+ skills across 5 domains:

- **Engineering**: TDD, debugging, quality gates, test infrastructure, code review
- **Operations**: safe deploy, identity guard, git worktrees, terminal, secrets, i18n
- **Product**: planning, brainstorming, UX/UI, preview, docs, readit, bootstrap
- **Growth**: content factory, ads tracking, CRO
- **Orchestration**: execution, continuity, skill chain, skill index, skill mastery, deep search

## Usage

Skills activate automatically when relevant. You can also reference them directly by name (e.g., `cm-tdd`, `cm-debugging`).
