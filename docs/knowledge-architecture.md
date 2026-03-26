---
title: CodyMaster 5-Tier Knowledge Architecture
description: Comprehensive guide to the Unified Brain ecosystem that powers CodyMaster
---

# 🧠 The Unified Brain: 5-Tier Knowledge Architecture

CodyMaster is not just a coding assistant; it is a self-healing, self-reinforcing artificial intelligence ecosystem. Its primary differentiator is its **Unified Brain Architecture**—a sophisticated 5-tier knowledge management system that persists memory across sessions, machines, and entire project lifecycles.

Instead of starting from zero in every chat, CodyMaster builds a compounding understanding of your codebase, your design decisions, and your personal coding style.

---

## 🏗️ The 5 Tiers of CodyMaster's Memory

Our architecture progresses from temporary contextual awareness to permanent, structural, and cloud-synchronized knowledge.

### 1. Tier 1: Sensory Memory (Session Variables)
**The "Here and Now"**
In a single development session, CodyMaster immediately grasps active files, cursor positions, and terminal outputs. This is the baseline context provided to the LLM for immediate coding tasks.

### 2. Tier 2: Working Memory (`cm-continuity`)
**The "Scratchpad"**
When working through complex, multi-step problems, CodyMaster uses `CONTINUITY.md`. It acts as a persistent scratchpad, journaling current objectives, active bugs, and immediate next steps. When a session drops and restarts, CodyMaster reads this file and resumes exactly where it left off, preventing repetitive loops.

### 3. Tier 3: Long-Term Memory (`learnings.json`)
**The "Reinforcement Layer"**
Mistakes happen, but CodyMaster learns from them. When a bug is fixed or a specific architectural decision is made, it is logged into long-term `learnings.json` and `decisions.json`. This layer uses a Time-To-Live (TTL) decay model to prioritize recent and critical learnings over obsolete past decisions, fundamentally shaping how the AI writes code in the future.

### 4. Tier 4: Semantic Memory (`cm-deep-search`)
**The "Local Vector DB"**
For massive codebases and documentation repositories, asking an LLM to read everything is inefficient and expensive. We use `tobi/qmd` locally to create a fast BM25/Vector semantic index. CodyMaster can now deep-search requirements, old design docs, and API specifications instantly with minimal token overhead.

### 5. Tier 5: Structural Memory (`cm-codeintell`)
**The "Code Structure Graph"**
While Semantic Memory finds text, Structural Memory understands code. `cm-codeintell` scans the entire project to build a Skeleton Index (AST-based). It knows every class, function, and import relationship—compressing codebase context by up to 95%. CodyMaster doesn't need to read the full source file to know what a function does; it just reads the index.

---

## ☁️ The Cloud Brain (`cm-notebooklm`)

Local knowledge is powerful, but developer workstations are often ephemeral or siloed. 
CodyMaster integrates **NotebookLM as the system's "Cloud Brain" and "Soul"**.

### Cross-Machine Persistence
High-value knowledge—such as custom created skills, macro-level architectural shifts, and deep codebase insights extracted by `cm-dockit`—are synced to the Cloud Brain. 

### Multi-Modal Recall
Because it resides in NotebookLM, your project's knowledge base can be converted into:
- Audio podcasts for onboarding new human developers.
- Flashcards for quickly reviewing the tech stack.
- A semantic query endpoint for other AI agents to ask questions globally.

---

## ⚙️ The Integration Pipeline

The true power of this architecture is how the skills combine in an automated pipeline:

1. **Scan & Index:** `cm-codeintell` maps the codebase structurally (zero dependencies, <4s execution).
2. **Document & Synthesize:** `cm-dockit` uses the structure to generate SEO-optimized Markdown docs, process flows, and Personas.
3. **Embed Locally:** `cm-deep-search` indexes those new Markdown docs to provide real-time, low-token search capabilities to the local agent.
4. **Cloud Sync:** The highest-value generated docs and learnings are pushed to `cm-notebooklm` via the `brain-sync.sh` workflow.

This pipeline ensures that every line of code written not only solves the immediate problem but structurally increases the intelligence of the entire CodyMaster ecosystem.
