---
title: "cm-deep-search"
description: "Semantic memory power-up — detects oversized codebases and suggests tobi/qmd for local semantic search. Bridges cm-continuity working memory with long-term document retrieval."
keywords: ["cm-deep-search", "cody master", "ai skill", "semantic search", "qmd"]
robots: "index, follow"
---

> **📋 Full Skill Source** — This is the complete, unedited SKILL.md file. Nothing is hidden or summarized.

[← Back to Skills Library](./index.md)

# Deep Search — Semantic Memory Power-Up

> **When your project outgrows AI's context window, bring the search engine to your docs.**
> Optional integration with [tobi/qmd](https://github.com/tobi/qmd) — BM25 + Vector + LLM re-ranking, 100% local.

## When to Trigger

**This skill is NOT invoked directly.** It is triggered automatically by other skills when they detect an oversized project.

### Detection Thresholds

During codebase scan (Phase 1a of `cm-brainstorm-idea`, Step 2 of `cm-dockit`, etc.), check:

```
TRIGGER if ANY of these are true:
  → docs/ folder contains >50 markdown files
  → Project has >200 source files total
  → User mentions "meeting notes", "old PRDs", "historical specs"
  → User asks "find that file about X from before"
  → cm-dockit just generated >30 doc files
```

### What to Say (Non-Intrusive)

When threshold is met, suggest naturally — DO NOT block or force:

```markdown
💡 **Pro Tip: Deep Search**

This project has [X docs / Y source files] — too large for AI to read directly.
You can install **[qmd](https://github.com/tobi/qmd)** to create semantic search
across all documentation, helping AI find the right context faster.

Quick install:
npm install -g @tobilu/qmd
qmd collection add ./docs --name project-docs
qmd context add qmd://project-docs "Project documentation for [project name]"
qmd embed

Then AI can search with: `qmd query "your question"`
```

## Setup Guide

### Step 1: Install

```bash
# Node.js
npm install -g @tobilu/qmd

# Or Bun
bun install -g @tobilu/qmd
```

### Step 2: Index project docs

```bash
# Add collections
qmd collection add ./docs --name docs
qmd collection add ./src --name source --mask "**/*.{ts,tsx,js,jsx,py,go,rs}"

# Add context (helps AI understand each collection)
qmd context add qmd://docs "Technical documentation for [project-name]"
qmd context add qmd://source "Source code for [project-name]"

# Create vector embeddings
qmd embed
```

### Step 3: Setup MCP Server (for Claude/Cursor/Antigravity)

Add to MCP config:

```json
{
  "mcpServers": {
    "qmd": {
      "command": "qmd",
      "args": ["mcp"]
    }
  }
}
```

Or run HTTP mode for shared server:

```bash
qmd mcp --http --daemon
```

### Step 4: Verify

```bash
# Check index
qmd status

# Test search
qmd query "authentication flow"
```

## Usage with Cody Master Skills

### With `cm-brainstorm-idea` (Phase 1: DISCOVER)

When AI needs to understand a large project holistically:

```bash
# Find all docs related to the brainstorm topic
qmd query "user authentication redesign" --json -n 10

# Get full content of important docs
qmd get "docs/architecture.md" --full
```

### With `cm-planning` (Phase A: Brainstorm)

When you need to find specs, PRDs, or past decisions related to the feature being planned:

```bash
qmd query "payment integration decisions" --files --min-score 0.4
```

### With `cm-dockit` (Post-generation)

After `cm-dockit` finishes generating docs, index them so AI can search from any session:

```bash
qmd collection add ./docs --name project-knowledge
qmd embed
```

### With `cm-continuity` (Tier 4: External Memory)

`cm-continuity` manages working memory (500 words). `qmd` extends with long-term semantic search:

```
Tier 1: Sensory Memory     → temp variables in session (not saved)
Tier 2: Working Memory      → CONTINUITY.md (~500 words)
Tier 3: Long-Term Memory    → learnings.json, decisions.json
Tier 4: External Semantic   → qmd (optional, for large projects)
```

## Staleness Prevention

The biggest risk of Semantic Search is **stale index / new source**. If AI reads old docs it produces wrong code.

Cody Master handles this with 3 mechanisms:

### 1. Post-Execution Sync

Whenever AI completes a task that changes/creates many files (e.g., `cm-dockit` generates docs, `cm-execution` refactors source):

```bash
# Runs fast because qmd only embeds changed files (incremental)
qmd embed
```

> **AI Rule:** If the project uses qmd, AI must automatically run `qmd embed` via terminal before ending a task.

### 2. Pre-Flight Check

Before starting `cm-brainstorm-idea` or `cm-planning` on a project using qmd, AI runs a health check:

```json
// AI auto-runs this MCP tool
{
  "name": "status",
  "arguments": {}
}
```

If status reports pending/un-embedded files, AI runs `qmd embed` before searching.

### 3. Git Hook (Recommended for Users)

For 100% safety outside AI's control (when users edit code manually):

```bash
# Add to .git/hooks/post-commit
#!/bin/sh
qmd embed > /dev/null 2>&1 &
```

This ensures every commit silently updates the index in the background.

## Position in Cody Master Lifecycle

```
cm-continuity (memory) ─────────────── always active
cm-deep-search (search) ──── optional ─┤
                                       ├── feeds context to ──→ cm-brainstorm-idea
                                       │                   ──→ cm-planning
cm-dockit (generate docs) ── produces ─┤                   ──→ cm-execution
```

## Integration

| Skill | Relationship |
|-------|-------------|
| `cm-continuity` | COMPLEMENT: continuity = RAM, qmd = semantic disk search |
| `cm-brainstorm-idea` | TRIGGERED BY: Phase 1a codebase scan detects large corpus |
| `cm-dockit` | TRIGGERED AFTER: docs generated, suggest indexing |
| `cm-planning` | CONSUMER: uses qmd results for context during planning |
| `cm-execution` | CONSUMER: searches for related code/docs during execution |

## Requirements

```
System: macOS / Linux / Windows (WSL)
Runtime: Node.js 20+ or Bun 1.0+
VRAM: ~2-4GB for GGUF models (embedding + reranking)
Disk: ~2-5GB for models (downloaded on first run)
```

## Rules

```
✅ DO:
- Suggest qmd ONLY when detection threshold is met
- Keep suggestion non-intrusive (Pro Tip format, never blocking)
- Always include context command (qmd context add) — this is qmd's killer feature
- Guide user to setup MCP server for seamless AI integration

❌ DON'T:
- Force installation on every project
- Suggest qmd for small projects (<50 docs, <200 src files)
- Replace cm-continuity — they solve DIFFERENT problems
- Assume qmd is installed — always check first
```

## The Bottom Line

**`cm-continuity` = "remember what I'm doing." `cm-deep-search` = "find what was written before." Together = complete memory.**
