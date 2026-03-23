---
name: cm-brainstorm-idea
description: "Strategic analysis gate for existing products — multi-dimensional evaluation (tech, product, design, business) using Design Thinking + 9 Windows (TRIZ) + Double Diamond. Outputs 2-3 qualified options with recommendations. Use BEFORE cm-planning for complex initiatives and enhancements on existing codebases."
---

# Brainstorm Idea — Strategic Analysis Gate

> **Role: Strategic Analyst** — You evaluate problems from tech, product, design, and business dimensions.

> **Understand deeply. Evaluate multi-dimensionally. Propose qualified options. Then — and only then — plan.**
> This skill is the BRIDGE between an existing product and its next evolution.

## When to Use

**ALWAYS when:**
- User requests complex changes to an existing product
- Initiatives or enhancements that touch multiple system areas
- User jumps straight into hard/complex tasks without analysis
- Post `cm-project-bootstrap` — product exists, needs improvement
- Feature requests that could be solved in fundamentally different ways
- "What should we do next?" / "What to improve?" / "Enhancement" / "Initiative"

**Skip when:**
- Simple bug fixes (use `cm-debugging`)
- New project from scratch (use `cm-project-bootstrap`)
- Task is already clearly defined and scoped (go to `cm-planning`)
- Quick one-off changes (< 30 min work)

## Gate Function

```
User requests complex task
  → Is the problem clearly understood and qualified?
    → NO → Run cm-brainstorm-idea FIRST
    → YES → Go to cm-planning directly
```

When downstream skills detect an unqualified complex request, they should REDIRECT here:
```
cm-planning detects ambiguity → "Problem not clear. Run cm-brainstorm-idea first."
cm-execution gets vague plan  → "Plan lacks context. Go back to cm-brainstorm-idea."
```

---

## The Process

```
Phase 1: DISCOVER     (Diamond 1 — Diverge)   → Scan wide, understand current state
Phase 2: DEFINE       (Diamond 1 — Converge)   → Qualify the REAL problem
Phase 3: DEVELOP      (Diamond 2 — Diverge)    → Generate 2-3 solution options
Phase 4: EVALUATE     (Diamond 2 — Converge)   → Score, compare, recommend
Phase 4.5: UI PREVIEW (Visual Validation)       → See it before you build it
Phase 5: HANDOFF      (Bridge to cm-planning)   → Package for downstream skills
```

### Phase 1: DISCOVER — Scan & Empathize

> **Goal:** Understand the current state of the product from all angles.

#### 1a-pre. Load Working Memory

Per `_shared/helpers.md#Load-Working-Memory`

#### 1a. Codebase Scan

Read and map the existing system:

```
✅ DO:
- Read AGENTS.md for project overview
- Scan project structure (list_dir)
- Read key config files (package.json, wrangler.toml, etc.)
- Identify tech stack, patterns, dependencies
- Check test coverage and existing quality

📋 OUTPUT: Codebase Summary
- Tech stack: [...]
- Architecture pattern: [...]
- Key dependencies: [...]
- Test coverage: [high/medium/low/none]
- Code health signals: [...]
- Corpus size: [total source files] src / [total doc files] docs

🔍 SIZE CHECK (auto — triggers cm-deep-search):
  IF docs/ > 50 files OR source > 200 files:
    → Suggest: "This project is quite large. See cm-deep-search to setup semantic search with qmd."
    → Non-blocking: continue Phase 1 regardless of user response
```

#### 1b. User Context Interview

Ask targeted questions to understand intent:

```
📋 DISCOVERY QUESTIONS:
1. Who does the current product serve? (Target users?)
2. What is the biggest pain point right now? (Biggest pain point?)
3. What is the next business goal? (Next business goal?)
4. Are there any tech/budget/timeline constraints? (Constraints?)
5. What solutions have already been tried? (What's been tried?)
```

#### 1c. Multi-Dimensional Current State

| Dimension | What to Assess | Sources |
|-----------|---------------|---------|
| **Tech** | Code quality, scalability, tech debt, performance | Codebase scan, test results |
| **Product** | Feature completeness, user satisfaction, funnel gaps | User interview, analytics |
| **Design** | UX quality, accessibility, mobile readiness, design system | UI review, `cm-ux-master` |
| **Business** | Revenue impact, market position, competitive landscape | User interview, research |

---

### Phase 2: DEFINE — Qualify the Problem

> **Goal:** Use 9 Windows to see the problem from all time × system perspectives, then converge on the REAL problem.

#### 9 Windows Analysis (TRIZ)

Map the situation across time and system levels:

```
┌─────────────────┬──────────────────┬──────────────────┬──────────────────┐
│                 │     PAST         │    PRESENT       │    FUTURE        │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ SUPER-SYSTEM    │ Market/industry  │ Current market   │ Where market     │
│ (ecosystem)     │ was like this... │ looks like...    │ is heading...    │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ SYSTEM          │ Product used to  │ Product now      │ Product should   │
│ (the product)   │ be like this...  │ does this...     │ become this...   │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ SUB-SYSTEM      │ Components were  │ Components now   │ Components need  │
│ (components)    │ built this way...│ work this way... │ to evolve to...  │
└─────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

**Fill all 9 windows** based on Phase 1 findings. This reveals:
- Evolution patterns (Past → Present trends)
- System-level tensions (Super-system demands vs Sub-system capabilities)
- Future opportunities (where convergence creates value)

#### Problem Qualification Statement

After 9 Windows analysis, write a qualified problem statement:

```markdown
## Qualified Problem

**For:** [user/customer segment]
**Who:** [current pain/need]
**The:** [product/feature] is a [category]
**That:** [key benefit/change needed]
**Unlike:** [current state / alternative]
**Our approach:** [high-level direction]

### Root Cause(s):
1. [Technical root cause]
2. [Product root cause]
3. [Design root cause]

### Impact if NOT addressed:
- [Business impact]
- [User impact]
- [Technical debt impact]
```

---

### Phase 3: DEVELOP — Generate Options

> **Goal:** Create 2-3 fundamentally different approaches. Not variations of one idea.

#### Design Thinking Ideation Rules

```
✅ DO:
- Generate at LEAST 2, at MOST 3 options
- Each option must be FUNDAMENTALLY different in approach
- Think from different perspectives: user-first, tech-first, business-first
- Consider both quick-win and long-term approaches
- Include rough effort estimation for each

❌ DON'T:
- Propose only 1 option (no choice = bad analysis)
- Propose 4+ options (decision paralysis)
- Make all options "the same idea with different UIs"
- Skip effort estimation
- Ignore existing constraints from Phase 1
```

#### Option Template

For each option, document:

```markdown
### Option [A/B/C]: [Descriptive Name]

**Approach:** [1-2 sentence summary]
**Philosophy:** [User-first / Tech-first / Business-first / Balanced]

**What changes:**
- [Component 1]: [change description]
- [Component 2]: [change description]

**Effort:** [S/M/L/XL] (~[time estimate])
**Risk level:** [Low/Medium/High]

**Pros:**
- [Pro 1]
- [Pro 2]

**Cons:**
- [Con 1]
- [Con 2]

**Best when:** [scenario where this option shines]
```

---

### Phase 4: EVALUATE — Score & Recommend

> **Goal:** Compare options objectively across 4 dimensions. Make a clear recommendation.

#### Multi-Dimensional Scoring Matrix

| Dimension | Weight | Option A | Option B | Option C |
|-----------|--------|----------|----------|----------|
| **Tech** (feasibility, maintainability, scalability) | 25% | ?/10 | ?/10 | ?/10 |
| **Product** (user value, feature completeness, PMF) | 30% | ?/10 | ?/10 | ?/10 |
| **Design** (UX quality, accessibility, polish) | 20% | ?/10 | ?/10 | ?/10 |
| **Business** (ROI, time-to-market, strategic fit) | 25% | ?/10 | ?/10 | ?/10 |
| **Weighted Total** | 100% | ?/10 | ?/10 | ?/10 |

> Adjust weights based on project context. A consumer app might weight Design higher. A B2B SaaS might weight Business higher.

#### Recommendation Format

```markdown
## 🎯 Recommendation

**Choose Option [X]: [Name]**

### Why Option X:
1. [Strongest reason — tied to qualified problem]
2. [Second reason — tied to constraint/context]
3. [Third reason — tied to future evolution]

### Why NOT the other options:
- **Option [Y]:** [specific deal-breaker]
- **Option [Z]:** [specific deal-breaker]

### Quick-win suggestion:
If you want to see results quickly, you can start with [subset of Option X]
before implementing the full solution.
```

---

### Phase 4.5: UI PREVIEW — See It Before You Build It

> **Goal:** After recommending an option, offer the user a visual preview to validate the direction before investing in planning & coding.

#### When to Trigger

After Phase 4 recommendation is clear, ALWAYS ask:

```markdown
🎨 **Want to preview the design?**

Option [X] has been recommended. Would you like to create a UI concept before detailed planning?

1. ✅ **Yes** — Quick preview to visualize better
2. ⏭️ **No** — Go straight to planning
```

#### Smart Tool Detection

Auto-detect which design tool is available and best suited:

```
Check available MCP tools:
  → Stitch MCP available? (create_project, generate_screen_from_text)
  → Pencil MCP available? (batch_design, get_editor_state)

┌─────────────────────────────────────────────────────────────┐
│              TOOL SELECTION MATRIX                          │
├──────────────┬──────────────┬───────────────────────────────┤
│ Stitch only  │ Pencil only  │ Both available                │
├──────────────┼──────────────┼───────────────────────────────┤
│ Use Stitch   │ Use Pencil   │ Ask user preference:          │
│ (quick       │ (detailed    │ - "Quick" → Stitch             │
│  concept)    │  control)    │ - "Control" → Pencil           │
│              │              │ - Default: Stitch (faster)    │
└──────────────┴──────────────┴───────────────────────────────┘
```

**Stitch path** (fast concept generation):
- Best for: Quick visual validation, non-technical stakeholders
- Auto-creates project, generates screens from the recommended option
- Uses `cm-ui-preview` Step 3 prompt enhancement pipeline

**Pencil path** (developer control):
- Best for: Devs who want pixel-level control, design system alignment
- Opens .pen editor, follows design guidelines for component layout
- Can export to code-ready assets

#### Execution Flow

```
User says "Yes" (Yes to preview):
  1. Detect available tools (Stitch / Pencil / both)
  2. If both → ask preference or auto-select based on context
  3. Delegate to cm-ui-preview with brainstorm context:
     - Pass: qualified problem, recommended option, design constraints
     - cm-ui-preview creates concept screens
  4. User reviews preview:
     → ✅ Confirm → Proceed to Phase 5 (Handoff) with visual reference
     → ✏️ Edit → Iterate on preview
     → ❌ Change option → Go back to Phase 4, pick different option

User says "No" (Skip preview):
  → Proceed directly to Phase 5 (Handoff)
```

#### Context Passed to cm-ui-preview

```markdown
## Brainstorm Context for UI Preview

**Initiative:** [Name from Phase 2]
**Recommended Option:** [Option X summary]
**Target Users:** [From Phase 1 discovery]
**Design Constraints:** [From codebase scan — existing design system, tokens, etc.]
**Key Screens Needed:** [List from recommended option's "What changes"]
**Device Type:** [DESKTOP / MOBILE — from project context]
```

---

### Phase 5: HANDOFF — Package for Downstream

> **Goal:** Create a clean handoff document that `cm-planning` can use immediately.

#### Handoff Output: `brainstorm-output.md`

Save to `docs/brainstorm/` or project root:

```markdown
# Brainstorm Output: [Initiative Name]
Generated by: cm-brainstorm-idea
Date: [date]

## Qualified Problem
[From Phase 2]

## 9 Windows Analysis
[Summary table from Phase 2]

## Options Evaluated
[Summary from Phase 3-4]

## Recommendation
[From Phase 4]

## Next Steps for cm-planning:
1. [Specific scope to plan]
2. [Key constraints to respect]
3. [Technical decisions already made]
4. [Open questions for implementation]

## Context for downstream skills:
- cm-planning: [what to focus the plan on]
- cm-tdd: [key areas that need test coverage]
- cm-ux-master: [design considerations]
- cm-execution: [suggested execution mode]
```

#### 5b. Record Decision & Update Memory

Per `_shared/helpers.md#Save-Decision` — record the recommended option.
Per `_shared/helpers.md#Update-Continuity` — update Active Goal and Next Actions.

---

## Red Flags — STOP

| Thought | Reality |
|---------|---------|
| "The user knows what they want, skip analysis" | Complex requests ALWAYS benefit from analysis |
| "Let me just start coding" | Code without analysis = rework later |
| "One option is obviously right" | If you can't articulate 2+ options, you haven't explored enough |
| "All options look the same" | Dig deeper — change the lens (user-first vs tech-first) |
| "This will take too long" | 30-60 min analysis saves 3-5 days of rework |
| "The 9 Windows are overkill" | They reveal blind spots you WILL miss otherwise |

---

## Integration

| Skill | Relationship |
|-------|-------------|
| `cm-project-bootstrap` | UPSTREAM: Product must exist before brainstorming improvements |
| `cm-ui-preview` | USED IN Phase 4.5: Visual preview with Stitch or Pencil (auto-detected) |
| `cm-deep-search` | TRIGGERED IN Phase 1a: Suggests qmd when project corpus exceeds thresholds |
| `cm-planning` | DOWNSTREAM: Receives qualified output, writes implementation plan |
| `cm-execution` | DOWNSTREAM: Executes the plan that originated from this analysis |
| `cm-ux-master` | USED IN Phase 1 & 3: UX assessment and design ideation |
| `cm-debugging` | REDIRECT: Simple bugs don't need brainstorming |
| `cro-methodology` | COMPLEMENT: CRO analysis for conversion-specific improvements |
| `cm-jtbd` | COMPLEMENT: JTBD research for user-need discovery |

### Lifecycle Position

```
cm-project-bootstrap → cm-brainstorm-idea → [UI Preview?] → cm-planning → cm-execution
     (build)              (analyze)         (visualize)       (plan)        (implement)
```

## The Bottom Line

**Don't rush to solutions. Qualify the problem. Evaluate options. Recommend with evidence. Then — plan.**
