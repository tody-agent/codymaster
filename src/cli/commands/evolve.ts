import { Command } from 'commander';
import { SkillEvolver, formatEvolutionResult, formatEvolutionHistory } from '../../skill-evolver';
import { LearningPromoter, formatPromotionCandidates } from '../../learning-promoter';
import { buildAdvisoryHandoff } from '../../advisory-handoff';
import { getBackend } from '../../storage-backend';
import type { EvolutionMode } from '../../skill-evolver';

// ─── Evolution CLI Commands ─────────────────────────────────────────────────

export function registerEvolveCommands(program: Command) {
  const evolve = program
    .command('evolve')
    .description('Skill Evolution Engine — self-improving skills via FIX/DERIVED/CAPTURED modes');

  evolve
    .command('status')
    .description('Show skill evolution status and records')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action((opts: { project: string }) => {
      const evolver = new SkillEvolver(opts.project);
      const records = evolver.listSkillRecords();

      if (records.length === 0) {
        console.log('🧬 No skill evolution records yet. Skills will begin evolving after task executions.');
        return;
      }

      console.log('🧬 Skill Evolution Records');
      console.log('─'.repeat(70));
      console.log(
        `${'Skill'.padEnd(30)} ${'Origin'.padEnd(10)} ${'Gen'.padEnd(5)} ${'Evolutions'.padEnd(12)} Last Mode`
      );
      console.log('─'.repeat(70));

      for (const record of records) {
        console.log(
          `${record.skill_name.padEnd(30)} ${record.origin.padEnd(10)} ${String(record.generation).padEnd(5)} ${String(record.evolution_count).padEnd(12)} ${record.last_evolution_mode ?? '-'}`
        );
      }
    });

  evolve
    .command('run <mode> <skill>')
    .description('Execute evolution on a skill (modes: FIX, DERIVED, CAPTURED)')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .option('-c, --confidence <n>', 'Override confidence threshold', '0.85')
    .action((mode: string, skill: string, opts: { project: string; confidence: string }) => {
      const upperMode = mode.toUpperCase() as EvolutionMode;
      if (!['FIX', 'DERIVED', 'CAPTURED'].includes(upperMode)) {
        console.error(`❌ Invalid mode: ${mode}. Must be FIX, DERIVED, or CAPTURED.`);
        process.exit(1);
      }

      const evolver = new SkillEvolver(opts.project);
      const result = evolver.evolve(upperMode, skill, parseFloat(opts.confidence));
      console.log(formatEvolutionResult(result));
    });

  evolve
    .command('auto')
    .description('Auto-evolve based on latest advisory handoff')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action((opts: { project: string }) => {
      try {
        const backend = getBackend(opts.project);
        backend.initialize();
        const handoff = buildAdvisoryHandoff(backend, { consumer: 'cm-skill-evolution' });
        const evolver = new SkillEvolver(opts.project, backend);
        const result = evolver.evolveFromAdvisory(handoff);
        console.log(formatEvolutionResult(result));
      } catch (err) {
        console.error(`❌ Auto-evolve failed: ${err instanceof Error ? err.message : err}`);
      }
    });

  evolve
    .command('history')
    .description('Show evolution history')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .option('-s, --skill <name>', 'Filter by skill name')
    .option('-n, --limit <n>', 'Max entries', '20')
    .action((opts: { project: string; skill?: string; limit: string }) => {
      const evolver = new SkillEvolver(opts.project);
      const history = evolver.getHistory(opts.skill, parseInt(opts.limit));
      console.log(formatEvolutionHistory(history));
    });

  evolve
    .command('rollback <skill>')
    .description('Rollback a skill to its pre-evolution backup')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action((skill: string, opts: { project: string }) => {
      const evolver = new SkillEvolver(opts.project);
      const result = evolver.rollback(skill);
      console.log(formatEvolutionResult(result));
    });

  // ─── Learning Promotion ─────────────────────────────────────────────────

  evolve
    .command('candidates')
    .description('Show learnings that qualify for promotion to skills')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action((opts: { project: string }) => {
      const promoter = new LearningPromoter(opts.project);
      const candidates = promoter.findCandidates();
      console.log(formatPromotionCandidates(candidates));
    });

  evolve
    .command('promote <learningId>')
    .description('Promote a specific learning to a reusable skill')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action((learningId: string, opts: { project: string }) => {
      const promoter = new LearningPromoter(opts.project);
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
    .action((opts: { project: string }) => {
      const promoter = new LearningPromoter(opts.project);
      const result = promoter.autoPromote();
      if (!result) {
        console.log('📚 No learnings qualify for auto-promotion yet.');
        return;
      }
      const icon = result.promoted ? '✅' : '❌';
      console.log(`${icon} ${result.reason}`);
    });
}
