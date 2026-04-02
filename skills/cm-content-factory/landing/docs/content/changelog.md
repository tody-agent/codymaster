# Changelog & What's New in v5

Welcome to the **"Neural Spine"** era! Version 5 is a massive milestone that transitions CodyMaster from a specialized "Content Factory" tool into a full-fledged **Senior AI-Native Engineering Workspace**. 

We achieved this paradigm shift by deeply studying and integrating the architectural breakthroughs from two external frameworks: **OpenViking** and **OpenSpace**.

---

## 🚀 Key Architectural Shifts

### 1. Replaced "Dumb" RAG with OpenViking (Semantic Memory)
**The Problem in v4**: AI agents suffered from "code amnesia." Standard Retrieval-Augmented Generation (RAG) relied on chunking text indiscriminately. Agents hallucinated imports and forgot how system components linked together.
**The v5 Upgrade**:
By adopting OpenViking concepts, CodyMaster v5 introduces an **AST (Abstract Syntax Tree)** and **Vector-based Memory Engine**. 
- It creates a **L0 Skeleton Index** of your entire system's structure instantly.
- It provides a **L1 Symbol Index** to grasp function signatures perfectly without bogging down the LLM context window with implementation details.
- Your AI agent now acts like a senior dev who inherently "knows" your monolith's entire structure before typing a single line.

### 2. Upgraded to OpenSpace (The Autonomous Executor)
**The Problem in v4**: Agents were essentially advanced type-writers. They wrote code, but you had to physically run the terminal commands, test the code, read the errors, and paste the errors back to the AI.
**The v5 Upgrade**:
We introduced **OpenSpace**—a secure sandbox and execution container. 
- Agents can now natively execute Bash commands (`npm test`, `git pull`) within a safe holding environment. 
- The framework auto-captures standard-error (stderr) logs and creates a self-healing loop. If the AI writes a bug, the test suite catches it, and the AI fixes itself autonomously *before* presenting the final code to you.

---

## 🌟 New Features at a Glance

* **100% Zero-Regression Deployments**: Through TDD-first gates in OpenSpace, no commit is permitted unless tests successfully pass.
* **Context Bus**: An infrastructure pipeline allowing parallel sub-agents (e.g., a "Backend Database" agent and a "Frontend React" agent) to exchange variables and context natively without losing vital token budgets.
* **Vision & UI Auto-Healing**: Equipped with frontend Playwright capture mechanisms, agents can take screenshots of their code results, run Vision Models to spot CSS un-alignments, and natively fix visual bugs.
* **Completely Self-Evolving Skills**: The Skill Chain Engine analyzes repeated commands in your workflow and dynamically builds *new* automation skills specifically tailored to your unique codebase.

> [!TIP]
> **To Experience It Directly:** Try assigning a task requiring multi-file context tracking, such as *"Migrate our authentication endpoints across the monolith to use the new JWT standard."* and watch OpenViking automatically pull the precise 7 files needed.
