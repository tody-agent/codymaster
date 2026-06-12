# CodyMaster — OpenCode Plugins

OpenCode plugins extend the AI agent with custom tools and event hooks.

## Available Plugins

### cm-brainstorm-idea

Strategic analysis gate for existing products. Use **before** `cm-planning` for complex initiatives.

| Feature | Description |
|---------|-------------|
| **Frameworks** | Design Thinking + 9 Windows (TRIZ) + Double Diamond |
| **Output** | 2-3 qualified options + recommendation |
| **Handoff** | `openspec/changes/[initiative]/proposal.md` |

#### Install

```bash
# Option A: Copy (standalone)
mkdir -p ~/.opencode/plugins
cp .opencode/plugins/cm-brainstorm-idea.ts ~/.opencode/plugins/

# Option B: Symlink (always latest)
mkdir -p ~/.opencode/plugins
ln -s $(pwd)/.opencode/plugins/cm-brainstorm-idea.ts ~/.opencode/plugins/

# Option C: npm (coming soon)
# Add to opencode.json:
# "plugin": ["@codymaster/cm-brainstorm-idea"]
```

#### What It Does

**Custom Tool: `cm-brainstorm-idea`**

When called, injects the full 5-phase analysis framework into the AI context:

```
Phase 1: DISCOVER   → Scan codebase, interview user, assess current state
Phase 2: DEFINE     → 9 Windows analysis, qualify the REAL problem
Phase 3: DEVELOP    → Generate 2-3 fundamentally different options
Phase 4: EVALUATE   → Score with weighted matrix, recommend
Phase 5: HANDOFF    → Package for cm-planning
```

**Event Hook: `tui.prompt.append`**

Auto-detects brainstorm-related keywords and suggests using the tool:

| Trigger Keywords |
|------------------|
| `brainstorm`, `what should we`, `what to improve` |
| `enhancement`, `initiative`, `analyze this` |
| `how should we approach`, `strategic`, `evaluate options` |

#### Usage

**Direct call:**
```
Use cm-brainstorm-idea to analyze: "Add multi-language support to our app"
```

**Auto-trigger:**
```
What should we improve about our booking system?
```
→ Plugin detects keywords → suggests brainstorm tool

#### Scoring Matrix

| Dimension | Weight |
|-----------|--------|
| Tech (feasibility, maintainability, scalability) | 25% |
| Product (user value, feature completeness, PMF) | 30% |
| Design (UX quality, accessibility, polish) | 20% |
| Business (ROI, time-to-market, strategic fit) | 25% |

#### Integration

```
cm-project-bootstrap → cm-brainstorm-idea → [UI Preview?] → cm-planning → cm-execution
     (build)              (analyze)         (visualize)       (plan)        (implement)
```

Related skills:
- `cm-codeintell` — Phase 1a: structural overview
- `cm-ui-preview` — Phase 4.5: visual preview (Stitch/Pencil)
- `cm-deep-search` — Phase 1a: large project support
- `cm-planning` — Downstream: receives qualified output
- `cm-ux-master` — Phase 1 & 3: UX assessment

---

## Plugin Development

### Structure

```
.opencode/plugins/
├── cm-brainstorm-idea.ts    # Strategic analysis plugin
├── your-plugin.ts           # Your custom plugin
└── package.json             # Dependencies (optional)
```

### Create a Plugin

```typescript
import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  return {
    // Custom tools
    tool: {
      "my-tool": tool({
        description: "What it does",
        args: {
          input: tool.schema.string({ description: "Input" }),
        },
        async execute(args, context) {
          return `Result: ${args.input}`
        },
      }),
    },

    // Event hooks
    "tui.prompt.append": async (input, output) => {
      // Inject context based on user message
    },
  }
}

export default MyPlugin
```

### Available Hooks

| Hook | Description |
|------|-------------|
| `command.executed` | After CLI command runs |
| `file.edited` | After file is modified |
| `message.updated` | After message is processed |
| `session.idle` | When session completes |
| `tui.prompt.append` | Before prompt is sent to AI |
| `tool.execute.before` | Before tool runs |
| `tool.execute.after` | After tool runs |
| `shell.env` | Inject environment variables |

📖 [Full plugin docs →](https://opencode.ai/docs/plugins)

---

## Resources

| Resource | Link |
|----------|------|
| OpenCode Docs | [opencode.ai](https://opencode.ai) |
| Plugin API | [opencode.ai/docs/plugins](https://opencode.ai/docs/plugins) |
| CodyMaster Repo | [github.com/tody-agent/codymaster](https://github.com/tody-agent/codymaster) |
| Skills Catalog | [skills/](../../skills/) |
