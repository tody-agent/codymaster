# Knowledge Management

> CodeIntell, Dockit, Deep Search, and NotebookLM integration. This guide teaches you how to manage and leverage knowledge in your project.

## Table of Contents

1. [Overview](#overview)
2. [CodeIntell](#codeintell)
3. [Dockit](#dockit)
4. [Deep Search](#deep-search)
5. [NotebookLM](#notebooklm)
6. [Knowledge Layers](#knowledge-layers)
7. [Best Practices](#best-practices)

---

## Overview

### Why Knowledge Management?

- **Reduce token usage** — Don't re-analyze the codebase
- **Improve accuracy** — Have precise context
- **Share knowledge** — Team-wide understanding
- **Preserve decisions** — Don't repeat discussions

### Knowledge Tools

| Tool | Purpose | Output |
|------|---------|--------|
| **CodeIntell** | Code structure analysis | Skeleton index, AST graph |
| **Dockit** | Documentation generation | Docs, SOPs, API reference |
| **Deep Search** | Semantic search | Local search via qmd |
| **NotebookLM** | Cloud knowledge | Podcasts, flashcards |

---

## CodeIntell

### What is CodeIntell?

A zero-dependency code intelligence tool that provides:
- Skeleton Index (< 4 seconds)
- AST knowledge graph (CodeGraph)
- Architecture diagrams (Mermaid)
- Smart context builder

### Generate Skeleton

```bash
# Generate skeleton index
cm index skeleton

# This creates:
# .cm/skeleton.md — instant codebase map
# .cm/architecture.mmd — architecture diagram
```

### Read Skeleton

```bash
# Quick overview
cat .cm/skeleton.md

# This shows:
# - Tech stack
# - Key modules
# - File structure
# - Dependencies
```

### Use CodeGraph

```bash
# Check if codegraph is available
codegraph status

# If available, use for context
codegraph_files --summary

# This provides:
# - Module relationships
# - Most connected modules
# - Dead code detection
```

### Benefits

- **95% token compression** for onboarding
- **30% fewer tokens** for deep analysis
- **Instant codebase understanding**

---

## Dockit

### What is Dockit?

A knowledge systematization engine that generates:
- Personas
- JTBD (Jobs to Be Done)
- Process Flows
- Technical docs
- SOP user guides
- API references

### Generate Documentation

```bash
# Generate complete documentation
/cm-dockit

# This will:
# 1. Analyze codebase
# 2. Generate documentation
# 3. Create VitePress site
# 4. Optimize for SEO
```

### Generate Specific Docs

```bash
# Generate API reference
/cm-dockit --type api

# Generate user guide
/cm-dockit --type user-guide

# Generate SOP
/cm-dockit --type sop
```

### Output Formats

| Format | Use Case |
|--------|----------|
| **Markdown** | Git repository, wiki |
| **VitePress** | Documentation site |
| **PDF** | Offline reference |

---

## Deep Search

### What is Deep Search?

Semantic search via qmd for large codebases (>200 src / >50 docs files).

### Setup

```bash
# Check if qmd is available
which qmd

# If not available, install
npm install -g qmd

# Index codebase
qmd index .

# This creates:
# .qmd/index.json — search index
```

### Search

```bash
# Semantic search
qmd search "authentication flow"

# This finds:
# - Related code files
# - Documentation
# - Comments
# - Test files
```

### Benefits

- **Semantic understanding** — Finds related concepts
- **Fast retrieval** — Millisecond response
- **Zero-config** — Works out of the box

---

## NotebookLM

### What is NotebookLM?

Google's NotebookLM for cloud knowledge management.

### Sync Knowledge

```bash
# Sync skills to NotebookLM
/cm-notebooklm sync

# This will:
# 1. Export skills to markdown
# 2. Upload to NotebookLM
# 3. Create notebook
# 4. Generate podcasts
```

### Use Cases

- **Cloud recall** — Access knowledge anywhere
- **Podcasts** — Audio summaries of codebase
- **Flashcards** — Study key concepts
- **Cross-machine** — Sync across devices

---

## Knowledge Layers

### Layer 1: Working Memory

**Purpose:** Current session context
**Size:** ~200 tokens
**Update:** Every session
**Read:** Session start

```bash
# Read
cat .cm/CONTINUITY.md

# Update
/cm-continuity update
```

### Layer 2: Learnings

**Purpose:** Accumulated knowledge
**Size:** Unlimited
**Update:** After important decisions
**Read:** When needed

```bash
# Save
cm_natural("remember that we use bcrypt for password hashing")

# Retrieve
cm_natural("what did we learn about password hashing?")
```

### Layer 3: Documentation

**Purpose:** Comprehensive reference
**Size:** Varies
**Update:** After major changes
**Read:** When onboarding

```bash
# Generate
/cm-dockit

# Read
cat docs/README.md
```

### Layer 4: Code Structure

**Purpose:** Codebase understanding
**Size:** ~1KB
**Update:** After structural changes
**Read:** Session start

```bash
# Generate
cm index skeleton

# Read
cat .cm/skeleton.md
```

### Layer 5: Cloud Knowledge

**Purpose:** Cross-machine access
**Size:** Unlimited
**Update:** Periodically
**Read:** Anywhere

```bash
# Sync
/cm-notebooklm sync

# Access
# https://notebooklm.google.com
```

---

## Best Practices

### 1. Generate Skeleton on Project Start

```bash
# First thing after cloning
cm index skeleton

# This provides instant codebase understanding
```

### 2. Update CONTINUITY.md Regularly

```bash
# Before switching tasks
/cm-continuity update

# Before ending session
/cm-continuity update
```

### 3. Save Important Learnings

```bash
# After making a decision
cm_natural("remember that we use next-intl for i18n")

# After fixing a bug
cm_natural("remember that token refresh must reset the idle timer")
```

### 4. Generate Documentation After Major Changes

```bash
# After adding features
/cm-dockit

# This keeps docs up to date
```

### 5. Use Deep Search for Large Codebases

```bash
# When codebase is large (>200 files)
qmd index .
qmd search "authentication flow"
```

### 6. Sync to Cloud Periodically

```bash
# Weekly sync
/cm-notebooklm sync

# This ensures knowledge is accessible everywhere
```

---

## Example: Complete Knowledge Management

### Project Setup

```bash
# 1. Clone project
git clone https://github.com/your-org/your-project.git
cd your-project

# 2. Initialize CodyMaster
cm init

# 3. Generate skeleton
cm index skeleton

# 4. Generate documentation
/cm-dockit

# 5. Setup Deep Search
qmd index .

# 6. Sync to cloud
/cm-notebooklm sync
```

### Daily Workflow

```bash
# 1. Start session
cat .cm/CONTINUITY.md

# 2. Check knowledge
cm_natural("what did we learn about [topic]?")

# 3. Work
/cm-execution

# 4. Save learnings
cm_natural("remember that [important decision]")

# 5. End session
/cm-continuity update
```

### Onboarding New Developer

```bash
# 1. Read skeleton
cat .cm/skeleton.md

# 2. Read documentation
cat docs/README.md

# 3. Check learnings
cm_natural("show me all project learnings")

# 4. Start working
/cm-execution
```

---

## Next Steps

- [Skill Chain Automation](./17-skill-chain-automation.md) — Automate knowledge workflows
- [Memory & Context Management](./11-memory-management.md) — Memory system
- [Team Collaboration](./13-team-collaboration.md) — Share knowledge with team
