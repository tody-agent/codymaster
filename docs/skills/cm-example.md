---
title: "cm-example"
description: "A template demonstrating the universal format compatible with Antigravity, Claude, Cursor, and OpenClaw."
keywords: ["cm-example", "cody master", "ai skill"]
robots: "index, follow"
---

> **📋 Full Skill Source** — This is the complete, unedited SKILL.md file. Nothing is hidden or summarized.

[← Back to Skills Library](./index.md)

# Universal Skill Example

This skill demonstrates the unified format that `omni-agent` will compile into platform-specific configurations.

## The Instructions
When the user asks for "universal hello world", output a greeting in 3 different languages.

## Sub-agent Instructions
> [!NOTE] 
> Used by platforms that support recursive agents (like Antigravity / OpenFang).
1. Subagent A: Translate into French.
2. Subagent B: Translate into Spanish.
3. Subagent C: Translate into Japanese.

## Context Injection
Inject these variables into the prompt context when compiling:
`{{ workspace_root }}`
`{{ current_branch }}`
