# The UI Preview Phase: Visual Validation Before Planning

**"See It Before You Build It."** 

This is the core philosophy behind **Phase 4.5: UI Preview** in the `cm-brainstorm-idea` analysis gate. 

Historically, AI agents would brainstorm an idea, write a technical plan, and jump straight into coding. If the layout or user experience wasn't what the user envisioned, the entire process had to be reversed — wasting time, tokens, and energy.

With **Phase 4.5**, CodyMaster introduces an optional visual validation step to bridge the gap between abstract strategy and concrete planning.

## How It Works

Once `cm-brainstorm-idea` evaluates the problem and recommends the best approach (Phase 4), it automatically offers to generate a UI Concept.

```text
🎨 Want to preview the design?
Option X has been recommended. Would you like to create a UI concept before detailed planning?
1. ✅ Yes — Quick preview to visualize better
2. ⏭️ No — Go straight to planning
```

### Smart Tool Delegation

If the user accepts, CodyMaster delegates the visual generation to `cm-ui-preview`, which smartly auto-detects the best available MCP (Model Context Protocol) tool for the job:

1. **Google Stitch MCP**: Used for rapid, high-level mockups and conceptual visualization. Best when speed is the priority.
2. **Pencil MCP**: Used for pixel-perfect design system alignment, reading `.pen` files, and generating code-ready components.

### The Lifecycle Handoff

The UI Preview bridges the upstream strategy and the downstream execution:

1. **`cm-brainstorm-idea`** figures out *what* to build and *why*.
2. **Phase 4.5 (UI Preview)** figures out *how it looks*.
3. **`cm-planning`** figures out *how to code it*.
4. **`cm-execution`** writes the code.

By ensuring everyone is aligned on the visual goal *before* `cm-planning` writes the implementation specs, CodyMaster eliminates rework and guarantees that the final code matches the user's expectations.

---
**Documented:** 2026-03-29 during CodyMaster v4.4.2 OpenSpec upgrades.
