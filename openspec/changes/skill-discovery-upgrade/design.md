# Design: Skill Discovery Auto-Detect Upgrade

## Context & Technical Approach
Currently, CodyMaster reads the entire 59-item `cm-skill-index` and forces the LLM to guess what framework skills to pick and run via `npx skills ...`. `midudev/autoskills` uses deterministic AST and file parsing (looking at package.json, go.mod, etc.) to figure out exactly what dependencies the project uses automatically.
We will port this deterministic logic from `autoskills` into the CodyMaster CLI (e.g. `src/indexer/`). This compiler will detect the tech stack natively and build a miniature, highly-focused `project-skills.md` index. The LLM will then read this 3-4 item list instead of the 59-item monolithic index whenever it needs to understand the local stack.

## Proposed Changes
### `src/indexer/skills.ts` [NEW]
- Port the config-checking logic from `autoskills/lib.ts` (checking dependencies arrays in `package.json`).
- Implement the `SKILLS_MAP` matching mechanism.

### `src/cli/commands/engineering.ts` (or similar CLI point) [MODIFY]
- Add a new command surface `cm index skills` mapped to the logic above.
- Ensure the output writes to `.cm/project-skills.md`.

### `skills/cm-project-bootstrap/SKILL.md` [MODIFY]
- Update the bootstrap sequence / `cm-start` logic to automatically run `cm index skills` so that the custom index is pre-compiled before the LLM starts its planning phases.

## Verification
- Unit test `src/indexer/skills.test.ts` against mock `package.json` fixtures.
- Run `npm run build` and `npm run test:gate:kit`
- Run `cm index skills` on the root workspace to output `.cm/project-skills.md` and verify `autoskills` community mappings (e.g. standard typescript/node skills).
