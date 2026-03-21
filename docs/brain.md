# CodyMaster Brain: The Cognitive Architecture

Standard AI systems treat memory as an append-only log, inevitably leading to overloaded context, "goldfish memory", and recurring hallucinations. **CodyMaster Brain** addresses this by implementing a biomimetic memory architecture inspired by human cognitive processes. It doesn't just store information; it synthesizes, filters, and selectively forgets.

## The Three-Tier Memory System

CodyMaster divides memory processing into three distinct layers, ensuring that the AI has the exact context it needs, explicitly when it needs it.

### 1. Working Memory (Short-Term)
*Fast, immediate context for the current session.*

Just as humans can only hold about 7 items in short-term memory, CodyMaster utilizes strict working memory limits. Managed primarily by the **[`cm-continuity`](/skills/cm-continuity)** skill, this layer tracks the active task, recent context, and immediate goals using a strict read/update cycle protocol via `CONTINUITY.md`. 
* **When to use:** Start of a session to load context, and end of a session to save progress.

### 2. Episodic Memory (Mid-Term)
*Experience-based synthesis of problems and solutions.*

When tasks are completed, key insights, bug fixes, and architectural decisions are synthesized. If the AI encounters a CORS error and spends 10 minutes fixing it, it records *how* it was fixed. Next time a similar issue arises in that module, the fix is instantly recalled rather than retrying from scratch.

### 3. Semantic Memory (Long-Term)
*Structured, systematized knowledge bases.*

Architectural decisions, design system tokens, and core business rules are structured into systematic knowledge bases (like `AGENTS.md` and `stack.json`). The **[`cm-dockit`](/skills/cm-dockit)** skill is responsible for systematizing this knowledge so it can be queried efficiently without polluting the working memory.

---

## Biomimetic Mechanisms

CodyMaster Brain implements dynamic mechanisms to manage the lifecycle of information.

### Smart Decay (The Forgetting Curve)
Standard AI systems hold onto outdated knowledge forever, leading to bugs when dependencies change. CodyMaster Brain implements a decay mechanism inspired by the *Ebbinghaus Forgetting Curve*. Outdated libraries, old refactored code patterns, and obsolete learnings literally "decay" and expire mathematically, keeping your active context clean and highly relevant.

### Self-Healing Feedback Loops
When a bug leads to an infinite loop or a hallucination, CodyMaster Brain recognizes the pattern and "heals" its memory. It records the failure path as a negative constraint, ensuring the exact same mistake is never repeated in future sessions. 

### Scope Filtering
Instead of loading a massive `memory.txt` file on every request, the Brain only loads what is strictly relevant to the current `module` or `file`. If there are 50 recorded global learnings, the system uses semantic filtering to load only the 2 or 3 learnings applicable to the current task, saving thousands of tokens per request.

---

## Integrating Core Memory Skills

To fully utilize the CodyMaster Brain, these core skills should be wired into your standard workflow:

| Skill | Role in Memory Architecture | Usage |
|-------|-----------------------------|-------|
| 🧠 **[`cm-continuity`](/skills/cm-continuity)** | **Working Memory Engine** | Run at the start and end of complex sessions to maintain state across boundaries without bloating the prompt. |
| 🔍 **[`cm-deep-search`](/skills/cm-deep-search)** | **Retrieval Bridge** | When the context exceeds the working memory capacity, this skill intelligently fetches relevant semantic and episodic memory using vector or BM25 search. |
| 🗄️ **[`cm-dockit`](/skills/cm-dockit)** | **Knowledge Organizer** | Run periodically to analyze codebases and generate structured, LLM-readable knowledge bases (`AGENTS.md`, SOPs) that the brain can rapidly query. |
| 👑 **[`cm-skill-mastery`](/skills/cm-skill-mastery)** | **Meta-Cognition** | Helps the AI "think about thinking," knowing which memory structures to access, which skills to invoke, and how to sequence them effectively. |

By mirroring human memory systems—prioritizing relevant context, learning from mistakes, and strategically forgetting outdated information—CodyMaster Brain turns the AI from a stateless code generator into a contextual engineering partner.
