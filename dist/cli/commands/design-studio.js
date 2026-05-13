"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDesignStudioArtifacts = initDesignStudioArtifacts;
exports.registerDesignStudioCommands = registerDesignStudioCommands;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
function projectPath(opt) {
    return path_1.default.resolve(opt || process.cwd());
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

Local artifact folder for the **design-studio** flow: variants, checklist, handoff.

Happy path:

1. \`cm design-studio init\`
2. Edit CHECKLIST.md + VARIANTS.md
3. Fill HANDOFF.md, then run your build skill (e.g. cm-execution) with that stub.
`;
/** Writes default artifact files; skips paths that already exist. Returns created + skipped counts. */
function initDesignStudioArtifacts(root) {
    const base = path_1.default.join(root, '.cm', 'design-studio');
    fs_1.default.mkdirSync(base, { recursive: true });
    const files = [
        ['README.md', README],
        ['CHECKLIST.md', CHECKLIST],
        ['VARIANTS.md', VARIANTS],
        ['HANDOFF.md', HANDOFF],
    ];
    let created = 0;
    let skipped = 0;
    for (const [name, body] of files) {
        const p = path_1.default.join(base, name);
        if (fs_1.default.existsSync(p)) {
            skipped++;
        }
        else {
            fs_1.default.writeFileSync(p, body, 'utf8');
            created++;
        }
    }
    return { created, skipped };
}
function registerDesignStudioCommands(program) {
    const ds = program
        .command('design-studio')
        .description('Design variant workspace under .cm/design-studio');
    ds.command('init')
        .description('Create .cm/design-studio with checklist and handoff templates')
        .option('--project <dir>', 'project root', process.cwd())
        .action((opts) => {
        const root = projectPath(opts.project);
        const { created, skipped } = initDesignStudioArtifacts(root);
        const base = path_1.default.join(root, '.cm', 'design-studio');
        if (created)
            console.log(chalk_1.default.green(`wrote ${created} file(s) under`), base);
        if (skipped)
            console.log(chalk_1.default.yellow(`skipped ${skipped} existing`));
    });
    ds.command('status')
        .description('List design-studio artifact files if present')
        .option('--project <dir>', 'project root', process.cwd())
        .action((opts) => {
        const root = projectPath(opts.project);
        const base = path_1.default.join(root, '.cm', 'design-studio');
        if (!fs_1.default.existsSync(base)) {
            console.log(chalk_1.default.yellow('Not initialized. Run:'), chalk_1.default.cyan('cm design-studio init'));
            return;
        }
        for (const f of fs_1.default.readdirSync(base)) {
            const p = path_1.default.join(base, f);
            const st = fs_1.default.statSync(p);
            console.log(st.isDirectory() ? `${f}/` : f);
        }
    });
}
