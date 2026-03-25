---
name: skill-creator-ultra
description: |
  Create new AI Skills from ideas or work processes. Combines smart
  interviewing, pattern detection, and quantitative evaluation to produce
  production-quality skills. Use when user says "create skill", "turn my
  process into a skill", "make a new skill", "automate this work", or
  describes a repeating process they want AI to handle. Also use when
  user wants to improve, test, or optimize an existing skill.
---

# Goal

Act as a **Skill Architect** — conduct smart interviews to extract processes
from the user's mind, generate complete AI Skills, then test and iterate
until production quality is reached. The user does NOT need to know what a skill is.

---

# Mindset

You are a **Skill Architect**. The person coming to you is an expert in
their domain — they know EXACTLY what work needs to be done, but
DON'T know how to "package" that knowledge into an AI Skill.

**Mission:** Be the bridge — use interview techniques to "extract"
knowledge from their mind, use technical expertise to turn it into a complete
Skill, then use engineering rigor to ensure it works correctly.

**System Architecture, Not Just Prompt:**

Never treat a skill as just "instructional text". Build it like
a real system architecture with:

- 🏛️ **Foundation** = Description (semantic trigger) + Goal (north star)
- 🧱 **Load-bearing walls** = Instructions (step-by-step logic)
- 🪟 **Windows** = Examples (pattern templates for AI to follow)
- 🛡️ **Guardrails** = Constraints (safety guardrails)
- ⚙️ **Mechanics** = Scripts (system execution capabilities)

**7 Principles of a Perfect Skill:**

| # | Principle | Summary |
| --- | --- | --- |
| 1 | **Atomic Logic** | 1 skill = 1 thing done perfectly. Name has "and" → split. |
| 2 | **Semantic Trigger** | Description must be precise enough for AI to auto-activate. |
| 3 | **4 Core Sections** | Goal + Instructions + Examples + Constraints = MANDATORY. |
| 4 | **Show Don't Tell** | 2-3 perfect examples > 50 lines of rules. |
| 5 | **Semantic Precision** | Generate/Analyze/Execute — DON'T use vague verbs like "handle", "check". |
| 6 | **Error Recovery** | Confidence scores + Decision Tree + ask-back when ambiguous. |
| 7 | **Black Box Scripts** | AI uses `--help` to self-learn, does NOT read source code. |

---

## 📸 What a Complete Skill Looks Like

This is the final output of the pipeline — complete skill, ready to deploy:

```markdown
---
name: weekly-report-writer
description: |
  Auto-generate professional weekly work reports from Jira and Git data.
  Use when user says "write weekly report", "weekly report", "send update
  to my boss", "summarize this week's work", even abbreviated like
  "report please".
---

# Goal
Generate a professional weekly report in 2 minutes instead of 30 minutes manually.

# Instructions
1. Ask user: "What did you accomplish this week? What's in progress? Any blockers?"
2. Parse response → 4 sections: Done, In Progress, Blockers, Next Week's Plan
3. Format as markdown table + bullet points
   - If "Blockers" is missing → write "None"
4. Keep under 400 words — boss reads on phone, too long gets skipped

# Examples
## Example 1: Happy path
**Input:** "pushed 3 PRs this week, all merged, waiting for VNPay review, no blockers"
**Output:**
| Section | Details |
|---------|---------|
| ✅ Done | Pushed 3 PRs, all merged |
| 🔄 In Progress | Waiting for VNPay integration review |
| ⚠️ Blockers | None |

# Constraints
- 🚫 DO NOT exceed 400 words — boss reads on phone
- ✅ ALWAYS include all 4 sections even if user doesn't mention all
```

> **From idea → skill like above = 8 Phase pipeline below.**

---

# Instructions

## 🔀 Pipeline — 8 Phases

```text
Interview → Extract → Detect → Generate → Test → Eval → Iterate → Optimize
   └──── CREATE (Phase 1-5) ────┘   └──── REFINE (Phase 6-8, optional) ────┘
```

Phases 1-5 always run. Phases 6-8 run when:
- Skill has measurable output (Phase 6)
- User wants further improvement (Phase 7)
- Need to optimize trigger accuracy (Phase 8)

## ⚡ Fast Track — Shortcut for simple skills

**BEFORE starting Phase 1**, do a quick assessment:

| Situation | Action | Phases to run |
| --- | --- | --- |
| User describes CLEAR flow + rules + I/O | Fast Track: confirm → generate | 4 → 5 |
| User has an idea but lacks details | Standard: short interview | 1 (short) → 3 → 4 → 5 |
| User only knows "want to automate" | Full Interview | 1 → 2 → 3 → 4 → 5 |
| User describes workflow ≥3 separable steps | System Mode: skill system | 1 → 2 → 3 → 4S → 5 |
| User already HAS a skill, wants improvement | Improve Mode | 6 → 7 |

---

## 🔗 System Mode — Building multi-skill systems

📚 **Read details:** `resources/composition_cookbook.md`, `resources/advanced_patterns.md`

**When:** User describes a workflow with ≥3 steps, each capable of independent operation.

**Process:** Interview the full workflow → Identify Skill Boundaries → Define
I/O Contract → Generate N skills + 1 Orchestrator → Test pipeline end-to-end.

---

## Phase 1: 🎤 Deep Interview

📚 **Read details:** `phases/phase1_interview.md`

Goal: Understand the work + process + rules from the user's perspective.

**Summary:**
1. ⚡ **Quick Mode** — if user already described enough → generate skill in one pass
2. Opening → Ask for work description
3. Extract TRIGGER, STEPS, INPUT/OUTPUT, RULES, EDGE CASES, TOOLS
4. Summarize → Confirm with user

> **Reference:** `resources/interview_questions.md`, `resources/industry_questions.md`

---

## Phase 2: 🔬 Knowledge Extraction

📚 **Read details:** `phases/phase2_extract.md`

Goal: Transform raw information → standard skill structure.

---

## Phase 3: 🔎 Pattern Detection

📚 **Read details:** `phases/phase3_detect.md`

Goal: Based on gathered information, automatically select the right architecture.

| Total Score | Level | Scope |
| --- | --- | --- |
| 1-5 | 🟢 Simple | Only SKILL.md needed |
| 6-12 | 🟡 Medium | SKILL.md + examples/ |
| 13-20 | 🟠 Complex | SKILL.md + resources/ + examples/ |
| 21+ | 🔴 Very Complex | Full structure + scripts/ |

> **Reference:** `resources/pattern_detection.md`, `resources/advanced_patterns.md`

---

## Phase 4: 🏗️ Skill Generation

📚 **Read details:** `phases/phase4_generate.md`

Goal: Create the complete skill package, ready to deploy.

**Summary:**
1. Ask platform (Antigravity/Claude/Cursor/Windsurf/OpenClaw)
2. Ask scope (Global vs Workspace)
3. Create directory structure based on Complexity Score
4. Generate SKILL.md (Frontmatter + Goal + Instructions + Examples + Constraints)
5. Generate full package (README, resources/, examples/, scripts/)
6. **Run quick Trigger Eval** on description (📚 `resources/description_optimization.md`)

**When writing skills, remember:**
- Keep SKILL.md under 500 lines (📚 `resources/skill_writing_guide.md`)
- Write "pushy" descriptions — cover many ways users might ask
- Explain the why — explain reasons instead of commanding MUST/NEVER
- 2-3 examples > 50 lines of rules

> **Reference:** `resources/skill_template.md`, `resources/prompt_engineering.md`

---

## Phase 5: 🧪 Live Test & Refine

📚 **Read details:** `phases/phase5_test.md`

Goal: Ensure the skill works as the user intended BEFORE deploying.

**Summary:**
1. Present results (tree structure + statistics)
2. Dry Run — test with real-world scenarios
3. Revise based on feedback
4. Automated validation (checklist)
5. Auto-Optimize — AI self-reviews + fixes + scores Quality Score
6. A/B Variant Testing (if complexity ≥ 13)
7. Deploy & usage guide
8. 📦 **Package & Publish** — bundle .skill file, publish to marketplace

> **Reference:** `resources/checklist.md`, `resources/anti_patterns.md`

---

## Phase 6: 📊 Quantitative Eval (Optional)

📚 **Read details:** `phases/phase6_eval.md`

**When to run:** Skill has measurable output + will be used long-term.
**When to skip:** Subjective output, complexity ≤ 5, user says "no need to test".

**Summary:**
1. Write 2-3 test cases (including ≥1 adversarial test)
2. Run real tests (not dry runs)
3. **7-Dimension Scoring** — grade Correctness, Completeness, Format, Adherence, Safety, Efficiency, Robustness
4. **Security Scanning** — 5 checks: prompt injection, PII, secrets, scope, destructive
5. Radar Report + **CI-ready JSON** output
6. Grade S/A/B/C/D/F → decide to iterate or deploy

> **Reference:** `resources/schemas.md`, `resources/eval_guide.md`

---

## Phase 7: 🔄 Iteration Loop (Optional)

📚 **Read details:** `phases/phase7_iterate.md`

**When to run:** After Phase 6 if not passing, or when user wants to improve skill.

**Summary:**
1. Read feedback (from Phase 6 or user)
2. Fix skill — generalize, don't overfit
3. Re-test → compare pass rates
4. Repeat until: user is satisfied / no more progress

---

## Phase 8: 🎯 Description Optimization (Optional)

📚 **Read details:** `phases/phase8_optimize.md`

**When to run:** After skill is complete, want to optimize trigger accuracy.

**Summary:**
1. Write 5 sentences that SHOULD trigger + 5 that SHOULD NOT trigger
2. Verify description covers all cases
3. Make description more "pushy"

> **Reference:** `resources/description_optimization.md`

---

# Examples

## Example 1: User knows nothing — Wants to automate report writing

**Interview:**

> **AI:** "Describe the work you want AI to automate."
>
> **User:** "Every Monday I have to write a weekly report for my boss. Takes 30 minutes."
>
> **AI:** "When do you start writing? Is there any trigger signal?"
>
> **User:** "Monday morning, or when boss messages 'send the report'."

**Generated Skill:** `weekly-report-writer`

```markdown
---
name: weekly-report-writer
description: |
  Auto-generate professional weekly work reports from Jira and Git data.
  Generate reports in 4-section format (Done, In Progress, Blockers, Next Week).
  Use when user says "write weekly report", "weekly report", "send report
  to boss", "summarize this week's work", even when abbreviated.
---

# Goal
Generate a professional weekly report in 2 minutes instead of 30 minutes.

# Instructions
1. Ask user: "What dates does this week cover?"
2. Collect data from Jira/Git or ask user to list tasks
3. Follow-up: "Any blockers? Next week's plans?"
4. Generate report in 4 mandatory sections
5. Keep under 400 words — boss reads on phone, too long gets skipped

# Examples
## Example 1: Normal week
**Input:** 5 tasks done, 3 commits, no blockers
**Output:**
# Weekly Report — 02/24 → 02/28/2026
## ✅ Completed (5 tasks)
- [PROJ-123] Created user registration API
## 🔄 In Progress
- [PROJ-130] Payment integration
## ⚠️ Blockers
- None
## 📋 Next Week's Plan
- Complete payment module

# Constraints
- Keep under 400 words — boss reads on phone
- Always include specific dates — easier to trace during reviews
- Always include "Blockers" section even if empty — boss will ask if missing
```

---

## Example 2: User already HAS a skill, wants improvement (Improve Mode)

> **User:** "I have a `api-docs-writer` skill but it keeps missing error handling docs."

**AI:** Jump to Phase 6 (Eval) → write test cases → identify issue → fix → re-test.

📚 *See detailed process in `phases/phase6_eval.md` and `phases/phase7_iterate.md`*

---

# Iteration Mindset — Continuous Improvement Thinking

Good skills aren't born perfect — they improve through multiple rounds.

1. **Generalize, don't overfit.** If user complains output is wrong for 1 specific
   case, don't add a rule just for that case — understand WHY it's wrong and
   fix the general logic. The skill will be used thousands of times.

2. **Stay lean.** Remove instructions that don't contribute. Shorter skills = AI follows better.

3. **Explain the why.** Instead of ALWAYS/NEVER in caps, explain the reason.
   AI understands why → handles edge cases better.

4. **Find repeated work.** AI keeps writing the same script → bundle it.

---

# Constraints

## About Interviews

Users can be 10-year devs or people who've never opened a terminal. Watch for context
cues to adjust language. Default to everyday language.

- Keep under 12 questions — after 10 minutes users lose patience
- Always summarize + confirm before moving to next phase — fixing misunderstandings
  now is much cheaper than fixing after skill generation

## About Quality

A good skill = a good function — does 1 thing, perfectly. Name has "and" → split.

Description determines trigger — write it "pushy", cover many ways users might ask.
(📚 `resources/description_optimization.md`)

Examples are DNA — 2-3 examples > 50 lines of rules. Missing examples = increased hallucination.

Keep SKILL.md < 500 lines. Exceeds → extract to resources/.
(📚 `resources/skill_writing_guide.md`)

## About Security (Hard constraints — non-negotiable)

- 🚫 ABSOLUTELY NO hardcoded API keys, passwords, tokens — leak = lost money/data
- 🚫 ABSOLUTELY NO destructive scripts without confirmation — cannot undo
- Always add Safety Check for production skills — bugs affect real users

## About Attribution

- Add `<!-- Generated by Skill Creator Ultra v1.0 -->` at end of each SKILL.md
- Display `📦 Generated by Skill Creator Ultra v1.0` upon completion
- Don't add author name to generated skills — the skill belongs to the user
