---
name: cm-ui-preview
description: "Master Design Skill. Orchestrates AI-powered UI generation using Google Stitch MCP and Pencil.dev MCP, guided by cm-ux-master intelligence and professional prompt enhancement pipelines. Implements the 'Stitch Build Loop', 'Pencil Build Loop', 'Prompt Optimization Structure', and strict design system adherence to generate production-ready UI previews before coding."
---

# UI Preview — The Master Design Orchestrator

> **See it before you build it.**
> This skill transforms vague user requests into precise, structured 'Construction Blueprints' for AI design generators (Google Stitch or Pencil.dev), ensuring UI outputs are professional, consistent with project branding, and ergonomically sound.

## When to Use

**ALWAYS trigger when the task involves building, redesigning, or modifying UI:**
- Creating new pages, screens, or layouts
- Building components (forms, cards, dashboards)
- Restyling or beautifying existing UIs
- Translating a wireframe or concept into high-fidelity UI
- Working with `.pen` design files (Pencil.dev)

**Trigger keywords:** build UI, design page, create screen, landing page, dashboard layout, UI designer, use stitch, stitch me a ui, use pencil, .pen file, redesign, restyle

## Architecture & Workflow (End-to-End)

This skill operates as a pipeline. **Do not skip steps.**

```
  ┌─────────────────────────────────────────────────────────┐
  │              cm-ui-preview Master Workflow              │
  ├─────────────────────────────────────────────────────────┤
  │                                                         │
  │  Step 1: PREFLIGHT & INTENT                             │
  │  ├── Detect task: New UI vs. Refine/Beautify            │
  │  └── Detect tools: Stitch MCP / Pencil MCP / Both      │
  │                                                         │
  │  Step 2: DESIGN SYSTEM EXTRACTION (The Source of Truth) │
  │  ├── Check: .stitch/DESIGN.md, .pen files, css tokens   │
  │  └── Fallback: Trigger `cm-design-system` to generate   │
  │                                                         │
  │  Step 3: PROMPT ENHANCEMENT (The Build Blueprint)       │
  │  ├── Project Overview (What, who, style vibe)           │
  │  ├── Design System Specs (Colors, Typography, Layout)   │
  │  └── Page Structure (Core function + Specific areas)    │
  │                                                         │
  │  Step 4a: STITCH EXECUTION (Quick Concept)              │
  │  ├── create_project()                                   │
  │  ├── generate_screen_from_text()                        │
  │  ├── Present link + AI insights to user                 │
  │  └── User Decision: Confirm / Edit / Skip               │
  │                                                         │
  │  Step 4b: PENCIL EXECUTION (Precise Control)            │
  │  ├── get_editor_state() / open_document()               │
  │  ├── get_guidelines() + get_style_guide()               │
  │  ├── batch_design() — Insert components & layout        │
  │  ├── get_screenshot() — Visual verification             │
  │  └── User Decision: Confirm / Edit / Skip               │
  │                                                         │
  │  Step 5: FINALIZATION & BATON PASS                      │
  │  ├── Save state (.stitch/next-prompt.md or .pen file)   │
  │  └── Hand off to cm-execution for actual coding         │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
```

## Step 1: Preflight & Intent Classification

### 1a. Tool Detection (REQUIRED)

Detect which design MCP tools are available:

```
┌──────────────┬──────────────┬───────────────────────────────┐
│ Stitch only  │ Pencil only  │ Both available                │
├──────────────┼──────────────┼───────────────────────────────┤
│ Use Stitch   │ Use Pencil   │ Ask user preference:          │
│ (quick       │ (detailed    │ - "Quick concept" → Stitch    │
│  concept)    │  control)    │ - "Precise control" → Pencil  │
│              │              │ - Default: Stitch (faster)    │
└──────────────┴──────────────┴───────────────────────────────┘
```

- **Stitch MCP:** Check if `create_project` and `generate_screen_from_text` are available.
- **Pencil MCP:** Check if `get_editor_state` and `batch_design` are available.
- **Neither:** Proceed with Prompt-Only generation (output the blueprint for manual use).

### 1b. Intent Classification

- **New Screen:** Proceed with full generation (Step 4a or 4b).
- **Refine/Beautify (edit):**
  - Stitch: Use `edit_screens()` on existing screen IDs.
  - Pencil: Use `batch_design()` with Update (U) operations on existing nodes.

## Step 2: Design System Extraction (Source of Truth)

Before assembly, you MUST establish the design constraints.

**Look for:**
- `DESIGN.md` or `.stitch/DESIGN.md` (Primary source for Stitch)
- Existing `.pen` files in the project (Primary source for Pencil)
- `design-system/MASTER.md` (Legacy format from `cm-ux-master`)
- `.cm/design-tokens.css` or Tailwind configs

**CRITICAL STANDARD:**
A valid Stitch design file MUST conform to the `skills/cm-ux-master/DESIGN_STANDARD_TEMPLATE.md` standard. It must include both:
1. The Markdown structure (Overview, Colors, Typography, Spacing & Shapes, Components, Do's and Don'ts).
2. The hidden JSON block delimited EXACTLY by `<!-- STITCH_TOKENS_START -->` and `<!-- STITCH_TOKENS_END -->`.

**For Pencil.dev:** Design tokens from `DESIGN.md` can be translated to `.pen` file variables via `mcp_pencil_set_variables`. The Pencil MCP also provides built-in style guides via `get_style_guide_tags` and `get_style_guide`.

**If no design system exists or it's in a legacy format:**
You MUST fallback to the pre-built default design system: `skills/cm-design-system/resources/shadcn-default.md`. Read this file and inject its contents (including the `<!-- STITCH_TOKENS_START -->` block) into your prompt.
*Suggest running `cm-design-system` if the user wants to extract a custom design instead of using the default Shadcn minimalist style.*

## Step 3: Prompt Enhancement Pipeline (CRITICAL)

**DO NOT send vague prompts to Stitch (e.g., "Make a login page").**
You must assemble an "Optimized Prompt Structure" — a detailed construction blueprint.

Structure your prompt exactly like this:

```markdown
[Overall vibe, mood, and purpose of the page: e.g., "A modern fintech dashboard for B2B users. Professional, trustworthy, high data density, light mode."]

**DESIGN SYSTEM (REQUIRED):**
[Inject the full contents of DESIGN.md here. It MUST include the <!-- STITCH_TOKENS_START --> ... <!-- STITCH_TOKENS_END --> block so the Stitch engine ingests the design tokens properly.]

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

> **Note for Pencil path:** The same prompt structure is used for your own reasoning. You will then translate the blueprint into `batch_design` operations (see Step 4b).

## Step 4a: Stitch Execution (Quick Concept)

> Use this path when Stitch MCP is available and user wants fast concept generation.

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
   🎨 **UI Preview Generated (Stitch)!**

   - **View & Edit:** [Google Stitch Link]
   - **AI Insights:** [Any suggestions or notes returned by Stitch]

   What's next?
   1. ✅ **Confirm** — I will write the code matching this design exactly.
   2. ✏️ **Edit** — Tell me what to change, I'll update the preview.
   3. ⏭️ **Skip** — Proceed straight to coding.
   ```

## Step 4b: Pencil Execution (Precise Control)

> Use this path when Pencil MCP is available and user wants pixel-level design control, or when working with existing `.pen` files.

### 4b.1: Initialize

```javascript
// Check current editor state (or open existing .pen file)
mcp_pencil_get_editor_state({ include_schema: true })

// If no document is open, create a new one or open an existing .pen file
mcp_pencil_open_document({ filePathOrTemplate: "new" })
// OR
mcp_pencil_open_document({ filePathOrTemplate: "/path/to/project/design.pen" })
```

### 4b.2: Load Design Guidelines & Style

```javascript
// Get design rules for the target platform
mcp_pencil_get_guidelines({ topic: "web-app" })  // or "mobile-app", "landing-page"

// Get style inspiration
mcp_pencil_get_style_guide_tags()  // Returns available tags
mcp_pencil_get_style_guide({ tags: ["modern", "dashboard", "dark", "website", "minimal"] })
```

### 4b.3: Apply Design Tokens (from DESIGN.md)

If a `DESIGN.md` exists with tokens, map them to `.pen` variables:

```javascript
mcp_pencil_set_variables({
  filePath: "design.pen",
  variables: {
    "primary": { "type": "color", "value": "#3B82F6" },
    "secondary": { "type": "color", "value": "#10B981" },
    "surface": { "type": "color", "value": "#FFFFFF" },
    "text-primary": { "type": "color", "value": "#0F172A" },
    "border-radius": { "type": "number", "value": 8 }
  }
})
```

### 4b.4: Build Layout with batch_design

Use the prompt blueprint from Step 3 to construct the UI:

```javascript
// Read available design system components first
mcp_pencil_batch_get({
  filePath: "design.pen",
  patterns: [{ reusable: true }],
  readDepth: 2,
  searchDepth: 3
})

// Then build the layout using Insert (I), Update (U), etc.
mcp_pencil_batch_design({
  filePath: "design.pen",
  operations: `
    screen=I(document,{type:"frame",name:"Dashboard",width:1440,height:900,fill:"#FFFFFF",layout:"horizontal"})
    sidebar=I(screen,{type:"frame",name:"Sidebar",width:240,height:"fill_container",fill:"#0F172A",layout:"vertical",padding:16,gap:8})
    main=I(screen,{type:"frame",name:"Main Content",width:"fill_container",height:"fill_container",layout:"vertical",padding:32,gap:24})
    header=I(main,{type:"frame",name:"Header",width:"fill_container",height:64,layout:"horizontal"})
    title=I(header,{type:"text",content:"Dashboard",fontSize:24,fontWeight:"bold"})
  `
})
```

### 4b.5: Verify with Screenshot

```javascript
mcp_pencil_get_screenshot({ filePath: "design.pen", nodeId: "<screen-id>" })
```

Analyze the screenshot for visual issues, then present to user:

```markdown
🎨 **UI Preview Generated (Pencil.dev)!**

- **File:** `design.pen` (editable locally)
- **Screenshot:** [embedded image]

What's next?
1. ✅ **Confirm** — I will write the code matching this design exactly.
2. ✏️ **Edit** — Tell me what to change, I'll update the `.pen` file.
3. 🔄 **Export** — Export to PNG/PDF for stakeholder review.
4. ⏭️ **Skip** — Proceed straight to coding.
```

### Pencil Quick Reference

| Operation | Use For | Example |
|-----------|---------|---------|
| `I(parent, data)` | Insert new node | `I(screen, {type:"frame", ...})` |
| `U(path, data)` | Update existing node | `U("nodeId", {fill:"#FFF"})` |
| `C(path, parent, data)` | Copy/duplicate | `C("screenId", document, {name:"V2"})` |
| `R(path, data)` | Replace child in instance | `R("inst/slot", {type:"text",...})` |
| `D(nodeId)` | Delete node | `D("oldNodeId")` |
| `G(nodeId, type, prompt)` | Generate/stock image | `G(heroImg, "stock", "office")` |

## Step 5: Finalization & Baton Pass

- **If Confirm:** Proceed to code implementation. You MUST follow the visual layout, spacing, and colors shown in the preview (Stitch or Pencil).
- **If Edit:**
  - Stitch: Call `mcp_StitchMCP_edit_screens()` with the specific element changes.
  - Pencil: Call `mcp_pencil_batch_design()` with Update/Replace operations.
- **Baton Update (Optional but Recommended):**
  - Stitch: Maintain a `.stitch/next-prompt.md` for session continuity.
  - Pencil: The `.pen` file itself serves as the persistent design artifact.
- **Export (Pencil only):** Use `mcp_pencil_export_nodes()` to produce PNG/PDF assets for stakeholder review.

## Anti-Patterns (Strict Prohibitions)

- ⛔ **NO VAGUE PROMPTS:** Never pass user input straight to Stitch without the Step 3 Enhancement Pipeline.
- ⛔ **NO FAKE SUCCESS:** If the MCP tool fails or isn't connected, do not hallucinate a success message or URL.
- ⛔ **NO CODING (Yet):** This phase is purely for DESIGN PREVIEW. Do not write React/Vue code until the user clicks "Confirm" or "Skip".
- ⛔ **NO APP SCAFFOLDING:** Do not initialize project codebases in this workflow.
- ⛔ **NO RAW .PEN READS:** Never use `view_file` or `grep_search` on `.pen` files. Always use `mcp_pencil_batch_get`.
