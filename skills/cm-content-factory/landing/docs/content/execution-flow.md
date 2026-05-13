# Architecture & Execution Flow

Understanding how the **Neural Spine** processes a command helps you write better instructions and harness the true autonomous power of CodyMaster v5.

When you dispatch a command to the system, it doesn't just blindly pass your text to an LLM. It routes the instruction through a multi-stage **Agent Lifecyle**.

## The High-Level Flow

Here is a visual breakdown of how the OpenViking and OpenSpace integrations handle an incoming task:

```mermaid
graph TD
    User([User Prompt: "Refactor Authentication"]) ==> Router
    
    subgraph "Phase 1: Knowledge Gathering"
        Router[Task Router] --> OViking{OpenViking Engine}
        OViking --> L0[L0: Skeleton Directory Map]
        OViking --> L1[L1: Symbol Headers]
        OViking --> L2[L2: Semantic Vectors]
        L0 --> Compiler[Context Builder]
        L1 --> Compiler
        L2 --> Compiler
    end

    Compiler ==> SubAgent
    
    subgraph "Phase 2: Execution (OpenSpace)"
        SubAgent[AI Sub-Agent] --> Coding[Writes Code / Logic]
        Coding --> Sandbox[OpenSpace Container]
        Sandbox --> Bash[Excecutes Terminal/Tests]
        Bash -- "Fails ❌" --> Feedback[Stderr Log Reader]
        Feedback --> SubAgent
    end
    
    Bash -- "Passes ✅" --> Review[Frontend Integrity Gate]
    Review --> Ship((Complete: Ready to Git Push))
    
    style User fill:#3b82f6,stroke:#fff,stroke-width:2px,color:#fff
    style Ship fill:#10b981,stroke:#fff,stroke-width:2px,color:#fff
    style OViking fill:#8b5cf6,stroke:#fff,stroke-width:2px,color:#fff
    style Sandbox fill:#f59e0b,stroke:#fff,stroke-width:2px,color:#111
```

---

## Step-by-Step Walkthrough

### 1. Task Routing & Context Building
The moment you hit enter, your command is sent to the **Task Router**. Before connecting to an external AI model (like Claude 3.5 or GPT-4o), the router queries **OpenViking**. 
- OpenViking executes a rapid vector search over the local SQLite cache to find all functionally related files. 
- It bundles the `L0` (Project Structure), `L1` (Function Interfaces), and `L2` (Implementation Logic) to create a highly compressed, precisely targeted knowledge package.

### 2. Autonomous Execution
The heavily enriched context is sent to the **AI Sub-Agent**, which formulates the new code. This code is immediately sent into **OpenSpace**. 
- OpenSpace spins up an isolated sandbox. 
- It forces the system to run immediate syntax linters (`eslint`, `mypy`) and your existing Unit Tests (`jest`, `pytest`).

### 3. The Self-Healing Loop
If the execution environment (OpenSpace) returns an error or a failed test:
- The exact failure trace (`stderr`) is siphoned off and sent *back* to the Sub-Agent. 
- The AI autonomously rewrites the logic to resolve the bug, attempting again. **You are never interrupted to solve syntax errors.**

### 4. Integrity and Shipping
Once unit tests cleanly pass, the final validation stage evaluates Frontend Integrity (e.g. no missing padding, proper CSS compilation). Once confirmed, the result is packaged directly into a pristine, working commit for you to review or deploy.

> [!NOTE]
> All phases within the Execution Flow are entirely handled by the background Neural Spine mechanisms. You are simply engaging with a "Senior Developer" that solves the problem perfectly.
