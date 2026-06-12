"use strict";
/**
 * `cm stack` — detect ecosystems/frameworks and emit .cm/project-skills.md.
 * `cm tier`  — classify project size tier and emit .cm/project-tier.md.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerStackCommands = registerStackCommands;
const stack_detect_1 = require("../../indexer/stack-detect");
const tier_classify_1 = require("../../tier-classify");
function registerStackCommands(program) {
    const stack = program.command('stack').description('Detect project stack and suggest skills');
    stack
        .command('detect')
        .description('scan the current project and print suggestions')
        .option('--write', 'write report to .cm/project-skills.md')
        .option('--json', 'print raw JSON')
        .action((opts) => {
        const r = (0, stack_detect_1.detectStack)(process.cwd());
        if (opts.json) {
            process.stdout.write(JSON.stringify(r, null, 2) + '\n');
        }
        else {
            process.stdout.write((0, stack_detect_1.renderStackMarkdown)(r));
        }
        if (opts.write) {
            const file = (0, stack_detect_1.writeProjectSkills)(process.cwd(), r);
            process.stdout.write(`\nWrote ${file}\n`);
        }
    });
    const tier = program.command('tier').description('Classify project tier (LITE/STANDARD/PROFESSIONAL/ENTERPRISE)');
    tier
        .command('classify')
        .description('measure and classify the current project')
        .option('--write', 'write report to .cm/project-tier.md')
        .option('--json', 'print raw JSON')
        .action((opts) => {
        const r = (0, tier_classify_1.classifyProject)(process.cwd());
        if (opts.json) {
            process.stdout.write(JSON.stringify(r, null, 2) + '\n');
        }
        else {
            process.stdout.write((0, tier_classify_1.renderTierMarkdown)(r));
        }
        if (opts.write) {
            const file = (0, tier_classify_1.writeTierReport)(process.cwd(), r);
            process.stdout.write(`\nWrote ${file}\n`);
        }
    });
}
