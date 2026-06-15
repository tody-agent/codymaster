"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEvolveCommands = registerEvolveCommands;
const path_1 = __importDefault(require("path"));
const skill_evolver_1 = require("../../skill-evolver");
const learning_promoter_1 = require("../../learning-promoter");
const advisory_handoff_1 = require("../../advisory-handoff");
const storage_backend_1 = require("../../storage-backend");
const skill_integrity_1 = require("../../skill-integrity");
// ─── Evolution CLI Commands ─────────────────────────────────────────────────
function registerEvolveCommands(program) {
    const evolve = program
        .command('evolve')
        .description('Skill Evolution Engine — self-improving skills via FIX/DERIVED/CAPTURED modes');
    evolve
        .command('status')
        .description('Show skill evolution status and records')
        .option('-p, --project <path>', 'Project path', process.cwd())
        .action((opts) => {
        var _a;
        const evolver = new skill_evolver_1.SkillEvolver(opts.project);
        const records = evolver.listSkillRecords();
        if (records.length === 0) {
            console.log('🧬 No skill evolution records yet. Skills will begin evolving after task executions.');
            return;
        }
        console.log('🧬 Skill Evolution Records');
        console.log('─'.repeat(70));
        console.log(`${'Skill'.padEnd(30)} ${'Origin'.padEnd(10)} ${'Gen'.padEnd(5)} ${'Evolutions'.padEnd(12)} Last Mode`);
        console.log('─'.repeat(70));
        for (const record of records) {
            console.log(`${record.skill_name.padEnd(30)} ${record.origin.padEnd(10)} ${String(record.generation).padEnd(5)} ${String(record.evolution_count).padEnd(12)} ${(_a = record.last_evolution_mode) !== null && _a !== void 0 ? _a : '-'}`);
        }
    });
    evolve
        .command('run <mode> <skill>')
        .description('Execute evolution on a skill (modes: FIX, DERIVED, CAPTURED)')
        .option('-p, --project <path>', 'Project path', process.cwd())
        .option('-c, --confidence <n>', 'Override confidence threshold', '0.85')
        .action((mode, skill, opts) => {
        const upperMode = mode.toUpperCase();
        if (!['FIX', 'DERIVED', 'CAPTURED'].includes(upperMode)) {
            console.error(`❌ Invalid mode: ${mode}. Must be FIX, DERIVED, or CAPTURED.`);
            process.exit(1);
        }
        const evolver = new skill_evolver_1.SkillEvolver(opts.project);
        const result = evolver.evolve(upperMode, skill, parseFloat(opts.confidence));
        console.log((0, skill_evolver_1.formatEvolutionResult)(result));
    });
    evolve
        .command('auto')
        .description('Auto-evolve based on latest advisory handoff')
        .option('-p, --project <path>', 'Project path', process.cwd())
        .action((opts) => {
        try {
            const backend = (0, storage_backend_1.getBackend)(opts.project);
            backend.initialize();
            const handoff = (0, advisory_handoff_1.buildAdvisoryHandoff)(backend, { consumer: 'cm-skill-evolution' });
            const evolver = new skill_evolver_1.SkillEvolver(opts.project, backend);
            const result = evolver.evolveFromAdvisory(handoff);
            console.log((0, skill_evolver_1.formatEvolutionResult)(result));
        }
        catch (err) {
            console.error(`❌ Auto-evolve failed: ${err instanceof Error ? err.message : err}`);
        }
    });
    evolve
        .command('history')
        .description('Show evolution history')
        .option('-p, --project <path>', 'Project path', process.cwd())
        .option('-s, --skill <name>', 'Filter by skill name')
        .option('-n, --limit <n>', 'Max entries', '20')
        .action((opts) => {
        const evolver = new skill_evolver_1.SkillEvolver(opts.project);
        const history = evolver.getHistory(opts.skill, parseInt(opts.limit));
        console.log((0, skill_evolver_1.formatEvolutionHistory)(history));
    });
    evolve
        .command('rollback <skill>')
        .description('Rollback a skill to its pre-evolution backup')
        .option('-p, --project <path>', 'Project path', process.cwd())
        .action((skill, opts) => {
        const evolver = new skill_evolver_1.SkillEvolver(opts.project);
        const result = evolver.rollback(skill);
        console.log((0, skill_evolver_1.formatEvolutionResult)(result));
    });
    evolve
        .command('integrity')
        .alias('check')
        .description('Scan skills for integrity issues (folder/name mismatch, missing name, duplicate body)')
        .option('-p, --project <path>', 'Project path', process.cwd())
        .action((opts) => {
        const skillsDir = path_1.default.join(opts.project, 'skills');
        const issues = (0, skill_integrity_1.scanSkillIntegrity)(skillsDir);
        console.log((0, skill_integrity_1.formatIntegrityReport)(issues));
        if (issues.length > 0)
            process.exit(1);
    });
    // ─── Learning Promotion ─────────────────────────────────────────────────
    evolve
        .command('candidates')
        .description('Show learnings that qualify for promotion to skills')
        .option('-p, --project <path>', 'Project path', process.cwd())
        .action((opts) => {
        const promoter = new learning_promoter_1.LearningPromoter(opts.project);
        const candidates = promoter.findCandidates();
        console.log((0, learning_promoter_1.formatPromotionCandidates)(candidates));
    });
    evolve
        .command('promote <learningId>')
        .description('Promote a specific learning to a reusable skill')
        .option('-p, --project <path>', 'Project path', process.cwd())
        .action((learningId, opts) => {
        const promoter = new learning_promoter_1.LearningPromoter(opts.project);
        const result = promoter.promote(learningId);
        const icon = result.promoted ? '✅' : '❌';
        console.log(`${icon} ${result.reason}`);
        if (result.promoted) {
            console.log(`   Skill: ${result.skillName}`);
            console.log(`   Path:  ${result.skillPath}`);
        }
    });
    evolve
        .command('auto-promote')
        .description('Auto-promote the top learning candidate to a skill')
        .option('-p, --project <path>', 'Project path', process.cwd())
        .action((opts) => {
        const promoter = new learning_promoter_1.LearningPromoter(opts.project);
        const result = promoter.autoPromote();
        if (!result) {
            console.log('📚 No learnings qualify for auto-promotion yet.');
            return;
        }
        const icon = result.promoted ? '✅' : '❌';
        console.log(`${icon} ${result.reason}`);
    });
}
