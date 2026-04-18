# Implementation Checklist

- [ ] 1.1 Extract `SKILLS_MAP` and detector logic from autoskills into `src/indexer/skills.ts`
- [ ] 1.2 Build test cases in `test/indexer-skills.test.ts`
- [ ] 2.1 Add `cm index skills` to CodyMaster CLI (`src/cli/commands/engineering.ts` or new file)
- [ ] 2.2 Wire CLI command to output to `.cm/project-skills.md`
- [ ] 3.1 Update `skills/cm-project-bootstrap/SKILL.md` to trigger `cm index skills`
- [ ] 4.1 Update `AGENTS.md` and `cm-skill-index` references
- [ ] 5.1 Verification testing (`npm run test:gate:kit`)
