import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

function projectPath(opt: string | undefined): string {
  return path.resolve(opt || process.cwd());
}

const CHECKLIST = `# Design studio — checklist

- [ ] Problem / JTBD one-liner
- [ ] 2–3 UI variants named (A/B/C)
- [ ] Chosen variant + rationale
- [ ] Handoff block filled in HANDOFF.md
`;

const VARIANTS = `# Variants

| Id | Name | Notes |
|----|------|-------|
| A  |      |       |
| B  |      |       |
| C  |      |       |
`;

const HANDOFF = `# Handoff to implementation

**Chosen variant:** (A/B/C)

**Screens / flows:**

**Tokens / components to reuse:**

**Out of scope:**

**Agent prompt stub:**

\`\`\`
Implement the chosen variant using existing design system tokens. …
\`\`\`
`;

const README = `# .cm/design-studio

Local artifact folder for **cm-design-studio**: variants, checklist, handoff.

Happy path:

1. \`cm design-studio init\`
2. Edit CHECKLIST.md + VARIANTS.md
3. Fill HANDOFF.md, then run your build skill (e.g. cm-execution) with that stub.
`;

/** Writes default artifact files; skips paths that already exist. Returns created + skipped counts. */
export function initDesignStudioArtifacts(root: string): { created: number; skipped: number } {
  const base = path.join(root, '.cm', 'design-studio');
  fs.mkdirSync(base, { recursive: true });
  const files: [string, string][] = [
    ['README.md', README],
    ['CHECKLIST.md', CHECKLIST],
    ['VARIANTS.md', VARIANTS],
    ['HANDOFF.md', HANDOFF],
  ];
  let created = 0;
  let skipped = 0;
  for (const [name, body] of files) {
    const p = path.join(base, name);
    if (fs.existsSync(p)) {
      skipped++;
    } else {
      fs.writeFileSync(p, body, 'utf8');
      created++;
    }
  }
  return { created, skipped };
}

export function registerDesignStudioCommands(program: Command): void {
  const ds = program
    .command('design-studio')
    .description('Design variant workspace under .cm/design-studio');

  ds.command('init')
    .description('Create .cm/design-studio with checklist and handoff templates')
    .option('--project <dir>', 'project root', process.cwd())
    .action((opts: { project?: string }) => {
      const root = projectPath(opts.project);
      const { created, skipped } = initDesignStudioArtifacts(root);
      const base = path.join(root, '.cm', 'design-studio');
      if (created) console.log(chalk.green(`wrote ${created} file(s) under`), base);
      if (skipped) console.log(chalk.yellow(`skipped ${skipped} existing`));
    });

  ds.command('status')
    .description('List design-studio artifact files if present')
    .option('--project <dir>', 'project root', process.cwd())
    .action((opts: { project?: string }) => {
      const root = projectPath(opts.project);
      const base = path.join(root, '.cm', 'design-studio');
      if (!fs.existsSync(base)) {
        console.log(chalk.yellow('Not initialized. Run:'), chalk.cyan('cm design-studio init'));
        return;
      }
      for (const f of fs.readdirSync(base)) {
        const p = path.join(base, f);
        const st = fs.statSync(p);
        console.log(st.isDirectory() ? `${f}/` : f);
      }
    });
}
