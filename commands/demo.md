---
description: Interactive onboarding tour — discover CodyMaster skills, workflows, and examples. Run this first to learn how to use the kit.
argument-hint: "[vi|en|zh|ko|ru|hi]"
---

# 🧠 Welcome to CodyMaster

You are now running the interactive onboarding demo. Guide the user through CodyMaster in their language.

## Step 1 — Detect Language

Check if the user passed a language argument via `$ARGUMENTS`. If so, use that language.
Otherwise, greet in English and ask which language they prefer:
- 🇬🇧 English
- 🇻🇳 Tiếng Việt
- 🇨🇳 中文
- 🇰🇷 한국어
- 🇷🇺 Русский
- 🇮🇳 हिन्दी

Remember the chosen language and respond in it for all following steps.

## Step 2 — Welcome Message

Show a warm, concise welcome. Include:
- What CodyMaster is (1 sentence)
- That it gives AI agents 33+ specialized skills
- That this demo will take ~2 minutes

## Step 3 — Show the Workflow

Explain the main workflow with a visual diagram:

```
💡 Idea
  ↓  /cm:plan     (brainstorm + architecture + approval)
📋 Plan
  ↓  /cm:build    (TDD: red → green → refactor)
⚙️  Code
  ↓  /cm:review   (code review + quality gate)
✅ Verified
  ↓  /cm:deploy   (multi-gate deploy + rollback)
🚀 Live
```

## Step 4 — Slash Commands Tour

Present each command with a concrete example. Format as a table:

| Command | What it does | Example |
|---------|-------------|---------|
| `/cm:plan` | Brainstorm + architecture + plan | `/cm:plan Add OAuth login` |
| `/cm:build` | TDD implementation | `/cm:build Execute the auth plan` |
| `/cm:debug` | 4-phase root cause analysis | `/cm:debug Login fails after redirect` |
| `/cm:review` | Code review + quality check | `/cm:review` |
| `/cm:deploy` | Safe multi-gate deployment | `/cm:deploy to staging` |
| `/cm:ux` | UX design + prototyping | `/cm:ux Design the onboarding flow` |
| `/cm:content` | AI content factory | `/cm:content Write a product launch post` |
| `/cm:track` | Task + progress tracking | `/cm:track` |
| `/cm:continuity` | Session memory | `/cm:continuity` |
| `/cm:bootstrap` | New project setup | `/cm:bootstrap my-saas-app` |

## Step 5 — Agent Skills (Automatic)

Explain that besides slash commands, Claude also uses **agent skills automatically**:

> These activate without any command — just describe what you want:
>
> - *"write tests first"* → `cm-tdd` activates
> - *"there's a bug in..."* → `cm-debugging` activates
> - *"plan this feature"* → `cm-planning` activates
> - *"deploy to production"* → `cm-safe-deploy` activates
> - *"review this code"* → `cm-quality-gate` activates

## Step 6 — Quick Start Challenge

Ask the user to try ONE of these right now and offer to help:

**Option A — Build something new:**
> "What would you like to build? I'll start with `/cm:plan` to design it."

**Option B — Fix a bug:**
> "Paste your error message and I'll apply `/cm:debug` to find the root cause."

**Option C — Explore skills:**
> "Ask me `what skills do you have?` and I'll show the full catalog with `cm-skill-index`."

## Step 7 — Useful Resources

Show at the end:
- 📚 Docs: https://codymaster.pages.dev/docs
- 🔄 Update: `claude plugin update cm@codymaster`
- 💬 All skills: `/cm:skills`
- 🔁 Restart tour: `/cm:demo`

Close with an encouraging call-to-action in the user's chosen language.
