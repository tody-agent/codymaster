# CodyMaster — Codex Installation

## Quick Install

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/tody-agent/codymaster/main/.codex/INSTALL.md
```

## Manual Setup

1. Clone the repository:
```bash
git clone https://github.com/tody-agent/codymaster.git ~/.cody-master
```

2. Copy skills to your Codex skills directory:
```bash
cp -r ~/.cody-master/skills/* .codex/skills/
```

3. The skills will be automatically loaded by Codex when relevant.

## Available Skills

CodyMaster provides 27+ skills across 5 domains:

- **Engineering**: TDD, debugging, quality gates, test infrastructure, code review
- **Operations**: safe deploy, identity guard, git worktrees, terminal, secrets, i18n
- **Product**: planning, brainstorming, UX/UI, preview, docs, readit, bootstrap
- **Growth**: content factory, ads tracking, CRO
- **Orchestration**: execution, continuity, skill chain, skill index, skill mastery, deep search

## Usage

Skills activate automatically when relevant. You can also reference them directly by name (e.g., `cm-tdd`, `cm-debugging`).
