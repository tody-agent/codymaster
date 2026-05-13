# OpenSpace Autonomous Workspace

**OpenSpace** is the execution engine of the Neural Spine architecture. It elevates your AI from being merely a static text-generator to an active, real-time engineering participant.

## The Execution Gap

Most AI setups lack operational agency. Once an LLM outputs code, a human developer has to copy, paste, save, format, compile, and run tests. This process introduces massive friction and manual error into what should be an automated loop.

## Enter OpenSpace

OpenSpace surrounds the agent with a secure execution container (sandbox) tightly coupled with your source control and operational tools. 

### Key Capabilities

- **Command Line Autonomy**: The agent can run raw terminal commands (`npm i`, `pytest`, `cargo run`) to verify that the code it generates compiles and passes logic tests.
- **Visual Self-Correction**: Using Playwright/Puppeteer bindings, OpenSpace can take screenshots of running frontends, parse the UI using Vision models, and autonomously adjust CSS alignments or missing padding without human intervention.
- **The Secret Shield**: OpenSpace filters shell execution to prevent agents from inadvertently deleting local databases, exposing secrets (via `.env` blockades), or committing raw tokens to GitHub.

## Anatomy of a Session

When an agent is initialized in OpenSpace, it acts as a headless developer:
1. It pulls semantic context from **[OpenViking](#openviking)**.
2. It drafts a solution to isolated branch files.
3. It spawns an OpenSpace terminal subprocess to run Linters and Unit Tests.
4. If a test fails, it captures the `stderr` output within OpenSpace and self-heals the code until all checks pass.

This loop ensures that the code pushed to you is robust, tested, and fully autonomous.
