---
description: Interactive onboarding tour — discover Cody Master skills, workflows, and examples. Run this first to learn how to use the kit.
argument-hint: "[vi|en|zh|ko|ru|hi]"
---

# 🧠 Welcome to Cody Master

You are now running the interactive onboarding demo. Guide the user through Cody Master in their language.

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
- What Cody Master is (1 sentence)
- That it gives AI agents 33+ specialized skills
- That this demo will take ~2 minutes

## Step 3 — Show the Workflow

Explain the main workflow with a visual diagram:

```
💡 Idea
  ↓  /cody-master:plan     (brainstorm + architecture + approval)
📋 Plan
  ↓  /cody-master:build    (TDD: red → green → refactor)
⚙️  Code
  ↓  /cody-master:review   (code review + quality gate)
✅ Verified
  ↓  /cody-master:deploy   (multi-gate deploy + rollback)
🚀 Live
```

## Step 4 — Slash Commands Tour

Present each command with a concrete example. Format as a table:

| Command | What it does | Example |
|---------|-------------|---------|
| `/cody-master:plan` | Brainstorm + architecture + plan | `/cody-master:plan Add OAuth login` |
| `/cody-master:build` | TDD implementation | `/cody-master:build Execute the auth plan` |
| `/cody-master:debug` | 4-phase root cause analysis | `/cody-master:debug Login fails after redirect` |
| `/cody-master:review` | Code review + quality check | `/cody-master:review` |
| `/cody-master:deploy` | Safe multi-gate deployment | `/cody-master:deploy to staging` |
| `/cody-master:ux` | UX design + prototyping | `/cody-master:ux Design the onboarding flow` |
| `/cody-master:content` | AI content factory | `/cody-master:content Write a product launch post` |
| `/cody-master:track` | Task + progress tracking | `/cody-master:track` |
| `/cody-master:continuity` | Session memory | `/cody-master:continuity` |
| `/cody-master:bootstrap` | New project setup | `/cody-master:bootstrap my-saas-app` |

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
> "What would you like to build? I'll start with `/cody-master:plan` to design it."

**Option B — Fix a bug:**
> "Paste your error message and I'll apply `/cody-master:debug` to find the root cause."

**Option C — Explore skills:**
> "Ask me `what skills do you have?` and I'll show the full catalog with `cm-skill-index`."

## Step 7 — Useful Resources

Show at the end:
- 📚 Docs: https://codymaster.pages.dev/docs
- 🔄 Update: `claude plugin update cody-master@cody-master`
- 💬 All skills: `/cody-master:skills`
- 🔁 Restart tour: `/cody-master:demo`

Close with an encouraging call-to-action in the user's chosen language.
