---
name: cm-ui-preview
description: "Master Design Skill. Orchestrates AI-powered UI generation using Google Stitch MCP, guided by cm-ux-master intelligence and professional prompt enhancement pipelines. Implements the 'Stitch Build Loop', 'Prompt Optimization Structure', and strict design system adherence to generate production-ready UI previews before coding."
---

# UI Preview — The Master Design Orchestrator

> **See it before you build it.**
> This skill transforms vague user requests into precise, structured 'Construction Blueprints' for the Google Stitch AI generator, ensuring UI outputs are professional, consistent with project branding, and ergonomically sound.

## When to Use

**ALWAYS trigger when the task involves building, redesigning, or modifying UI:**
- Creating new pages, screens, or layouts
- Building components (forms, cards, dashboards)
- Restyling or beautifying existing UIs
- Translating a wireframe or concept into high-fidelity UI

**Trigger keywords:** build UI, design page, create screen, landing page, dashboard layout, UI designer, use stitch, stitch me a ui, redesign, restyle

## Architecture & Workflow (End-to-End)

This skill operates as a pipeline. **Do not skip steps.**

```
  ┌─────────────────────────────────────────────────────────┐
  │              cm-ui-preview Master Workflow              │
  ├─────────────────────────────────────────────────────────┤
  │                                                         │
  │  Step 1: PREFLIGHT & INTENT                             │
  │  ├── Detect task: New UI vs. Refine/Beautify            │
  │  └── Verify Stitch MCP tools availability               │
  │                                                         │
  │  Step 2: DESIGN SYSTEM EXTRACTION (The Source of Truth) │
  │  ├── Check: .stitch/DESIGN.md, css tokens, etc.         │
  │  └── Fallback: Trigger `cm-ux-master` to generate one   │
  │                                                         │
  │  Step 3: PROMPT ENHANCEMENT (The Build Blueprint)       │
  │  ├── Project Overview (What, who, style vibe)           │
  │  ├── Design System Specs (Colors, Typography, Layout)   │
  │  └── Page Structure (Core function + Specific areas)    │
  │                                                         │
  │  Step 4: STITCH EXECUTION (The Build Loop)              │
  │  ├── create_project()                                   │
  │  ├── generate_screen_from_text()                        │
  │  ├── Present link + AI insights to user                 │
  │  └── User Decision: Confirm / Edit / Skip               │
  │                                                         │
  │  Step 5: FINALIZATION & BATON PASS                      │
  │  ├── Save state to .stitch/next-prompt.md               │
  │  └── Hand off to cm-execution for actual coding         │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
```

## Step 1: Preflight & Intent Classification

1. **Verify Stitch MCP:** Check if `create_project` and `generate_screen_from_text` are available. If not, inform the user they are missing the Stitch tools but proceed with Prompt-Only generation (output the blueprint for them to use manually).
2. **Classify Intent:**
   - **New Screen:** Proceed with full generation.
   - **Refine/Beautify (edit):** Use `edit_screens()` on existing IDs instead of `generate_screen_from_text()`.

## Step 2: Design System Extraction (Source of Truth)

Before assembly, you MUST establish the design constraints.

**Look for:**
- `.stitch/DESIGN.md` (Primary source for Stitch)
- `design-system/MASTER.md` (From `cm-ux-master`)
- `.cm/design-tokens.css` or Tailwind configs

**If no design system exists:**
*Suggest running `cm-ux-master` or create a `.stitch/DESIGN.md` baseline.*
A baseline MUST contain:
- Platform (Web/Mobile)
- Primary/Secondary Colors (with hex codes)
- Typography (Font families)
- Component constraints (Rounded vs Sharp, Shadow levels)

## Step 3: Prompt Enhancement Pipeline (CRITICAL)

**DO NOT send vague prompts to Stitch (e.g., "Make a login page").**
You must assemble an "Optimized Prompt Structure" — a detailed construction blueprint.

Structure your prompt exactly like this:

```markdown
[Overall vibe, mood, and purpose of the page: e.g., "A modern fintech dashboard for B2B users. Professional, trustworthy, high data density, light mode."]

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web Desktop-first
- Palette: Primary Blue (#0F62FE), Secondary Gray (#F4F4F4), Danger Red (#DA1E28)
- Typography: Inter for UI, Roboto Mono for numbers
- Styles: 4px border radius, subtle drop shadows on cards

**PAGE STRUCTURE & FUNCTION:**
### 1. Dashboard Home
**Core function**: Overview of recent transactions and account health.
- **Top Nav**: Brand logo, Global Search input, User Avatar dropdown.
- **Hero/Header**: Greeting "Welcome back, {User}", Total Balance callout (Large bold text).
- **Main Function Area**:
  - Left col: Line chart showing 30-day revenue.
  - Right col: Vertical list of "Recent Transactions" (Icon, Title, Date, Amount (Green/Red)).
- **Action Area**: Primary CTA "Send Money" (Blue fill, large), Secondary "Download Statement" (Outline).
```

*Refine UI terminology:* Replace "nice buttons" with "Primary CTA", replace "boxes" with "Cards". Apply relevant constraints from `cm-ux-master` (e.g., Miller's Law for chunking lists).

## Step 4: Stitch Execution (The Build Loop)

1. **Project Creation:**
   ```javascript
   mcp_StitchMCP_create_project({ title: "UI Preview — {Feature}" })
   ```
2. **Screen Generation:**
   ```javascript
   mcp_StitchMCP_generate_screen_from_text({
     projectId: "<id>",
     prompt: "<Your Optimized Prompt Blueprint>",
     deviceType: "DESKTOP" // or MOBILE
   })
   ```
3. **User Presentation:**
   Show the output, provide the URL, and present the **AI Insights** (from the tool's `outputComponents` response).

   ```markdown
   🎨 **UI Preview Generated!**

   - **Stitch Project ID:** `<id>`
   - **View & Edit:** [Open in Google Stitch](https://stitch.withgoogle.com/projects/<id>)
   - **AI Insights:** [Any suggestions or notes returned by Stitch]

   What's next?
   1. ✅ **Confirm** — I will write the code matching this design exactly.
   2. ✏️ **Edit** — Tell me what to change, I'll update the preview.
   3. ⏭️ **Skip** — Proceed straight to coding.
   ```

## Step 5: Finalization & Baton Pass

- **If Confirm:** Proceed to code implementation. You MUST follow the visual layout, spacing, and colors shown in the Stitch preview.
- **If Edit:** Call `mcp_StitchMCP_edit_screens()` with the specific element changes.
- **Baton Update (Optional but Recommended):** Maintain a `.stitch/next-prompt.md` to feed into the next agent task or session for continuity.

## Anti-Patterns (Strict Prohibitions)

- ⛔ **NO VAGUE PROMPTS:** Never pass user input straight to Stitch without the Step 3 Enhancement Pipeline.
- ⛔ **NO FAKE SUCCESS:** If the MCP tool fails or isn't connected, do not hallucinate a success message or URL.
- ⛔ **NO CODING (Yet):** This phase is purely for DESIGN PREVIEW. Do not write React/Vue code until the user clicks "Confirm" or "Skip".
- ⛔ **NO APP SCAFFOLDING:** Do not initialize project codebases in this workflow.

## Future: Pencil.dev Support
*Pencil MCP tools are available and will be integrated as an alternative execution engine in future updates (`batch_design`, `get_editor_state`).*
