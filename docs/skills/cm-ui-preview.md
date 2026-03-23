---
title: "cm-ui-preview"
description: "Master Design Skill. Orchestrates AI-powered UI generation using Google Stitch MCP and Pencil.dev MCP, guided by cm-ux-master intelligence and professional prompt enhancement pipelines."
keywords: ["cm-ui-preview", "cody master", "ai skill", "pencil.dev", "google stitch"]
robots: "index, follow"
---

> **📋 Full Skill Source** — This is the complete, unedited SKILL.md file. Nothing is hidden or summarized.

[← Back to Skills Library](./index.md)

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
You MUST fallback to the pre-built default design system: `skills/cm-design-system/resources/shadcn-default.md`.
*Suggest running `cm-design-system` if the user wants to extract a custom design instead of using the default Shadcn minimalist style.*

## Step 3: Prompt Enhancement Pipeline (CRITICAL)

**DO NOT send vague prompts to Stitch (e.g., "Make a login page").**
You must assemble an "Optimized Prompt Structure" — a detailed construction blueprint.

> **Note for Pencil path:** The same prompt structure is used for your own reasoning. You will then translate the blueprint into `batch_design` operations (see Step 4b).

## Step 4a: Stitch Execution (Quick Concept)

> Use this path when Stitch MCP is available and user wants fast concept generation.

1. **Project Creation:** `mcp_StitchMCP_create_project()`
2. **Screen Generation:** `mcp_StitchMCP_generate_screen_from_text()`
3. **User Presentation:** Show output, provide URL, present AI Insights.

## Step 4b: Pencil Execution (Precise Control)

> Use this path when Pencil MCP is available and user wants pixel-level design control, or when working with existing `.pen` files.

### Workflow

1. **Initialize:** `get_editor_state()` → `open_document()`
2. **Load Guidelines & Style:** `get_guidelines()` → `get_style_guide_tags()` → `get_style_guide()`
3. **Apply Design Tokens:** `set_variables()` — Map DESIGN.md tokens to `.pen` variables
4. **Build Layout:** `batch_get()` (read components) → `batch_design()` (insert/update)
5. **Verify:** `get_screenshot()` — Visual verification

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

- **If Confirm:** Proceed to code implementation. Follow the preview exactly.
- **If Edit:** Use `edit_screens()` (Stitch) or `batch_design()` (Pencil).
- **Export (Pencil only):** Use `export_nodes()` to produce PNG/PDF assets.

## Anti-Patterns (Strict Prohibitions)

- ⛔ **NO VAGUE PROMPTS:** Never pass user input straight to Stitch without the Step 3 Enhancement Pipeline.
- ⛔ **NO FAKE SUCCESS:** If the MCP tool fails, do not hallucinate a success message.
- ⛔ **NO CODING (Yet):** This phase is purely for DESIGN PREVIEW.
- ⛔ **NO APP SCAFFOLDING:** Do not initialize project codebases in this workflow.
- ⛔ **NO RAW .PEN READS:** Never use `view_file` or `grep_search` on `.pen` files. Always use Pencil MCP tools.
