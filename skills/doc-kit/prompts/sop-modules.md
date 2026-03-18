# SOP Template Prompt

You are DocKit Master. Create SOP user guides for: {{PROJECT_PATH}}

## Task

Generate a complete set of SOP (Standard Operating Procedure) documents.

## Instructions

1. **SOP Index** — overview of all features with difficulty, role, link
2. **One SOP per feature/module** including:
   - Quick Reference box (who, where, time, prerequisites)
   - Prerequisites checklist
   - Step-by-step guide with screenshots descriptions
   - Tables for form fields, filter options
   - Expected results section
   - Troubleshooting (in details/collapsible tags)
   - Related features cross-links
3. **Use admonitions** — :::tip, :::warning for callouts
4. **Map to API endpoints** at the bottom

## Modules to Cover

Discover modules from the codebase analysis. Typical modules:
- Employee management
- Scoring/rating
- Violations
- Recovery/training
- Bonuses/rewards
- Benefits calculation
- Reports/dashboard
- Configuration/settings
- Approvals
- Exports

## Output

Write index to: {{OUTPUT_PATH}} and individual SOPs to the same directory.
Language: {{LANGUAGE}}.
