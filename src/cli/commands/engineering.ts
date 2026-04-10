import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import http from 'http';
import chalk from 'chalk';
import { BrowseDaemon } from '../../browse-server';
import { checkShellCommand, isPathUnderRoots, normalizeRoots, appendGuardianLog } from '../../guardian-core';
import { loadCmConfig } from '../../cm-config';
import { redactDiffForReview, reviewWithAnthropic, reviewWithOpenAI } from '../../second-opinion-providers';
import {
  initSprint,
  readSprintState,
  completeSprintStep,
  skipSprintStep,
  resetSprint,
  sprintDryRun,
  SPRINT_STEPS,
  skillMappingForStep,
  type SprintStep,
} from '../../sprint-pipeline';
import {
  loadRetroEntries,
  filterSince,
  countByTool,
  formatRetroMarkdown,
  formatRetroJson,
} from '../../retro-summary';
import { suggestFromContext } from '../../cm-suggest';

function projectPath(opt: string | undefined): string {
  return path.resolve(opt || process.cwd());
}

export function registerEngineeringCommands(program: Command): void {
  const browse = program.command('browse').description('Playwright browse daemon (local QA / screenshots)');
  browse
    .command('start')
    .option('-p, --port <n>', 'port (default: .cm/config.yaml browse.port or 17395)')
    .option('-H, --host <h>', 'bind host (default: config or 127.0.0.1)')
    .option('--token <t>', 'bearer token (or env CM_BROWSE_TOKEN or config browse.token)')
    .option('--headed', 'headed browser', false)
    .action(async (opts) => {
      const root = process.cwd();
      const cfg = loadCmConfig(root);
      const port = parseInt(String(opts.port ?? cfg.browse?.port ?? 17395), 10);
      const host = String(opts.host ?? cfg.browse?.host ?? '127.0.0.1');
      const token =
        opts.token ||
        process.env.CM_BROWSE_TOKEN ||
        cfg.browse?.token ||
        'dev-token-change-me';
      const daemon = new BrowseDaemon({
        host,
        port,
        token,
        headless: !opts.headed,
      });
      await daemon.listen();
      console.log(chalk.green(`cm-browse listening http://${host}:${port}`));
      console.log(chalk.dim(`Authorization: Bearer ${token.slice(0, 8)}…`));
      console.log(chalk.dim('POST /session/start, /navigate, /refs/refresh, /click, /fill, GET /screenshot'));
      process.on('SIGINT', async () => {
        await daemon.close();
        process.exit(0);
      });
    });

  const guardian = program.command('guardian').description('Runtime safety: destructive command patterns + path freeze');
  guardian
    .command('check')
    .argument('<cmd...>', 'shell command to check')
    .action((parts: string[]) => {
      const cmd = parts.join(' ');
      const cfg = loadCmConfig(process.cwd());
      const extra = cfg.guardian?.whitelist_prefixes;
      const r = checkShellCommand(cmd, extra?.length ? { extraWhitelist: extra } : undefined);
      if (!r.safe) {
        console.error(chalk.red('BLOCKED:'), r.reason);
        console.error(chalk.dim('Pattern:'), r.matchedPattern);
        appendGuardianLog(process.cwd(), `BLOCKED: ${cmd}`);
        process.exit(1);
      }
      console.log(chalk.green('OK'), chalk.dim(cmd));
    });
  guardian
    .command('path-check')
    .requiredOption('--file <f>', 'file path')
    .option('--roots <r>', 'comma-separated roots (default: config guardian.freeze_roots or src,lib)')
    .action((opts) => {
      const cwd = process.cwd();
      const cfg = loadCmConfig(cwd);
      const rootsCsv =
        opts.roots ??
        (cfg.guardian?.freeze_roots?.length ? cfg.guardian.freeze_roots.join(',') : 'src,lib');
      const roots = normalizeRoots(
        cwd,
        String(rootsCsv)
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      );
      const ok = isPathUnderRoots(opts.file, roots);
      if (!ok) {
        console.error(chalk.red('Path outside freeze roots:'), opts.file);
        appendGuardianLog(cwd, `FREEZE_VIOLATION: ${opts.file}`);
        process.exit(1);
      }
      console.log(chalk.green('OK'), opts.file);
    });

  const sprint = program.command('sprint').description('Opinionated pipeline + .cm/sprint Context Bus');
  sprint
    .command('init')
    .option('--project <dir>')
    .option('--from <step>', `one of: ${SPRINT_STEPS.join(',')}`)
    .action((opts) => {
      const root = projectPath(opts.project);
      const from = opts.from as SprintStep | undefined;
      if (from && !SPRINT_STEPS.includes(from)) {
        console.error(chalk.red('Invalid --from'));
        process.exit(1);
      }
      const state = initSprint(root, from);
      console.log(chalk.green('Sprint initialized'));
      console.log(chalk.dim(JSON.stringify(state, null, 2)));
    });
  sprint
    .command('status')
    .option('--project <dir>')
    .action((opts) => {
      const root = projectPath(opts.project);
      const state = readSprintState(root);
      if (!state) {
        console.log(chalk.yellow('No sprint state. Run: cm sprint init'));
        return;
      }
      const next =
        state.current_index >= state.pipeline.length
          ? '(done)'
          : state.pipeline[state.current_index];
      console.log(chalk.cyan('Current step:'), next);
      if (typeof next === 'string' && next !== '(done)')
        console.log(chalk.dim('Skill hint:'), skillMappingForStep(next as SprintStep));
      console.log(chalk.dim('Completed:'), state.completed.join(', ') || '(none)');
      console.log(chalk.dim('Skipped:'), state.skipped.join(', ') || '(none)');
    });
  sprint
    .command('complete')
    .argument('<step>', 'step name')
    .option('--project <dir>')
    .option('-m, --message <text>', 'artifact markdown body', '')
    .action((step: string, opts) => {
      const root = projectPath(opts.project);
      if (!SPRINT_STEPS.includes(step as SprintStep)) {
        console.error(chalk.red('Invalid step'));
        process.exit(1);
      }
      const body =
        opts.message ||
        `# ${step}\n\n_Completed via \`cm sprint complete\` — replace with real notes._\n`;
      try {
        const state = completeSprintStep(root, step as SprintStep, body);
        console.log(chalk.green('Step recorded:', step));
        console.log(chalk.dim('Next index:', state.current_index));
      } catch (e) {
        console.error(chalk.red((e as Error).message));
        process.exit(1);
      }
    });
  sprint
    .command('skip')
    .argument('[step]', 'step name (default: current step)')
    .option('--project <dir>')
    .action((step: string | undefined, opts: { project?: string }) => {
      const root = projectPath(opts.project);
      const state = readSprintState(root);
      if (!state) {
        console.error(chalk.red('No sprint state. Run: cm sprint init'));
        process.exit(1);
      }
      if (state.current_index >= state.pipeline.length) {
        console.error(chalk.red('Sprint pipeline already finished'));
        process.exit(1);
      }
      const current = state.pipeline[state.current_index];
      const target = (step || current) as SprintStep;
      if (step && !SPRINT_STEPS.includes(target)) {
        console.error(chalk.red('Invalid step'));
        process.exit(1);
      }
      try {
        const next = skipSprintStep(root, target);
        console.log(chalk.green('Skipped step:', target));
        console.log(chalk.dim('Next index:', next.current_index));
      } catch (e) {
        console.error(chalk.red((e as Error).message));
        process.exit(1);
      }
    });
  sprint
    .command('reset')
    .option('--project <dir>')
    .option('--no-backup', 'do not copy sprint files to .cm/sprint/backup before clearing')
    .action((opts: { project?: string; backup?: boolean }) => {
      const root = projectPath(opts.project);
      const r = resetSprint(root, { backup: opts.backup !== false });
      if (!r.ok) {
        console.log(chalk.yellow('Nothing to reset (no sprint data under .cm/sprint).'));
        return;
      }
      if (r.backupDir) console.log(chalk.dim('Backup:'), r.backupDir);
      console.log(chalk.green('Sprint data cleared. Run: cm sprint init'));
    });
  sprint
    .command('dry-run')
    .option('--project <dir>')
    .action((opts) => {
      const root = projectPath(opts.project);
      const d = sprintDryRun(root);
      console.log(chalk.cyan('Steps:'), d.steps.join(' → '));
      d.artifacts.forEach((a) => console.log(chalk.dim(' -'), a));
    });

  program
    .command('second-opinion')
    .description('Send unified diff to a secondary model (redacts obvious secrets)')
    .option('--file <f>', 'file containing diff text')
    .option('--provider <p>', 'openai | anthropic', 'openai')
    .action(async (opts) => {
      const provider = String(opts.provider || 'openai').toLowerCase();
      const raw = opts.file ? fs.readFileSync(opts.file, 'utf8') : '';
      const text = raw ? redactDiffForReview(raw) : '';
      if (!opts.file || !text.trim()) {
        console.log(
          chalk.yellow('Pass --file <diff.txt>. Set OPENAI_API_KEY (openai) or ANTHROPIC_API_KEY (anthropic).')
        );
        console.log(chalk.dim('Diff content is redacted for common secret patterns before sending.'));
        return;
      }
      try {
        let out: string;
        if (provider === 'anthropic') out = await reviewWithAnthropic(text);
        else if (provider === 'openai') out = await reviewWithOpenAI(text);
        else {
          console.error(chalk.red('Unknown --provider (use openai or anthropic)'));
          process.exit(1);
        }
        console.log(out);
      } catch (e) {
        console.error(chalk.red((e as Error).message));
        process.exit(1);
      }
    });

  program
    .command('qa-visual')
    .description('Hit cm-browse for screenshot + health (requires browse running)')
    .requiredOption('--url <u>', 'page URL to navigate')
    .option('--port <n>', 'browse daemon port (default: config browse.port or 17395)')
    .option('--token <t>', 'or env CM_BROWSE_TOKEN or config browse.token')
    .action(async (opts) => {
      const cfg = loadCmConfig(process.cwd());
      const token =
        opts.token || process.env.CM_BROWSE_TOKEN || cfg.browse?.token || 'dev-token-change-me';
      const port = parseInt(String(opts.port ?? cfg.browse?.port ?? 17395), 10);
      const auth = `Bearer ${token}`;
      await browseRequest(port, '/session/start', 'POST', auth, { headless: true });
      await browseRequest(port, '/navigate', 'POST', auth, { url: opts.url });
      await browseRequest(port, '/refs/refresh', 'POST', auth, {});
      const png = await browseBuffer(port, '/screenshot', auth);
      const out = path.join(process.cwd(), 'cm-qa-visual.png');
      fs.writeFileSync(out, png);
      console.log(chalk.green('Screenshot saved'), out);
    });

  program
    .command('canary')
    .description('Post-deploy smoke: HTTP fetch + optional browse console; baseline compare')
    .requiredOption('--url <u>', 'URL to fetch (http/https)')
    .option('--browse-port <n>', 'if set, GET /console from browse (default: config canary.browse_port)')
    .option('--token <t>', 'browse token (env CM_BROWSE_TOKEN or config)')
    .option('--save-baseline', 'write .cm/canary-baseline.json after check')
    .option('--compare-baseline', 'fail on HTTP regression or 2× latency vs baseline')
    .action(async (opts) => {
      const root = process.cwd();
      const cfg = loadCmConfig(root);
      const u = new URL(opts.url);
      const { status, latency_ms } = await httpProbeUrl(u.href);
      if (status >= 400) {
        console.error(chalk.red(`HTTP ${status}`), u.href);
        process.exit(1);
      }

      if (opts.compareBaseline) {
        const baselinePath = path.join(root, '.cm', 'canary-baseline.json');
        if (!fs.existsSync(baselinePath)) {
          console.error(chalk.red('No baseline file. Run once with --save-baseline'));
          process.exit(1);
        }
        const prev = JSON.parse(fs.readFileSync(baselinePath, 'utf8')) as {
          http_status?: number;
          latency_ms?: number;
        };
        if (
          prev.http_status !== undefined &&
          prev.http_status < 400 &&
          status >= 400
        ) {
          console.error(chalk.red('HTTP regression vs baseline'));
          process.exit(1);
        }
        if (
          typeof prev.latency_ms === 'number' &&
          prev.latency_ms > 50 &&
          latency_ms > prev.latency_ms * 2
        ) {
          console.error(
            chalk.red(`Latency regression: ${latency_ms}ms vs baseline ${prev.latency_ms}ms`)
          );
          process.exit(1);
        }
        console.log(chalk.dim('Baseline compare OK'));
      }

      if (opts.saveBaseline) {
        const baselinePath = path.join(root, '.cm', 'canary-baseline.json');
        fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
        fs.writeFileSync(
          baselinePath,
          JSON.stringify(
            {
              url: opts.url,
              http_status: status,
              latency_ms,
              at: new Date().toISOString(),
            },
            null,
            2
          ),
          'utf8'
        );
        console.log(chalk.dim('Wrote'), baselinePath);
      }

      console.log(chalk.green('HTTP OK'), u.href, chalk.dim(`${status} ${latency_ms}ms`));

      const browsePort =
        opts.browsePort ??
        (cfg.canary?.browse_port != null ? String(cfg.canary.browse_port) : undefined);
      if (browsePort) {
        const token =
          opts.token ||
          process.env.CM_BROWSE_TOKEN ||
          cfg.canary?.token ||
          cfg.browse?.token ||
          'dev-token-change-me';
        const raw = await browseRaw(parseInt(browsePort, 10), '/console', `Bearer ${token}`);
        console.log(chalk.dim('Browse console (last messages):'), raw.slice(0, 500));
      }
    });

  const conductor = program.command('conductor').description('Git worktree helpers for parallel sprints');
  conductor
    .command('add')
    .requiredOption('--at <dir>', 'new worktree directory')
    .requiredOption('--branch <b>', 'branch name')
    .option('--base <b>', 'start from branch', 'main')
    .action((opts) => {
      execSync(`git worktree add -b ${opts.branch} ${opts.at} ${opts.base}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      console.log(chalk.green('Worktree created'));
    });
  conductor.command('list').action(() => {
    execSync('git worktree list', { stdio: 'inherit', cwd: process.cwd() });
  });

  const retro = program
    .command('retro')
    .description('Append operational learning (.cm/operational-learnings.jsonl) or print summary');

  retro
    .command('summary')
    .description('Aggregate JSONL by tool; optional --since filter')
    .option('--project <dir>')
    .option('--since <iso>', 'include entries on or after this ISO timestamp')
    .option('--format <f>', 'json | md', 'md')
    .action((opts: { project?: string; since?: string; format?: string }) => {
      const root = projectPath(opts.project);
      const j = path.join(root, '.cm', 'operational-learnings.jsonl');
      let entries = loadRetroEntries(j);
      if (opts.since) entries = filterSince(entries, opts.since);
      const byTool = countByTool(entries);
      const fmt = (opts.format || 'md').toLowerCase();
      if (fmt === 'json') console.log(formatRetroJson(entries, byTool));
      else console.log(formatRetroMarkdown(entries, byTool));
    });

  retro
    .option('--note <text>', 'append entry')
    .option('--tool <t>', 'tool label', 'cli')
    .option('--project <dir>')
    .option('--summary', 'print last 20 lines (legacy quick view)')
    .action((opts: {
      note?: string;
      tool?: string;
      project?: string;
      summary?: boolean;
    }) => {
      const root = projectPath(opts.project);
      const dir = path.join(root, '.cm');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const j = path.join(dir, 'operational-learnings.jsonl');
      if (opts.summary) {
        if (!fs.existsSync(j)) {
          console.log(chalk.yellow('No entries yet'));
          return;
        }
        const lines = fs.readFileSync(j, 'utf8').trim().split('\n').filter(Boolean).slice(-20);
        for (const line of lines) console.log(line);
        return;
      }
      if (!opts.note) {
        console.log(chalk.yellow('Pass --note "...", --summary, or: cm retro summary'));
        return;
      }
      const rec = {
        ts: new Date().toISOString(),
        tool: opts.tool,
        note: opts.note,
      };
      fs.appendFileSync(j, JSON.stringify(rec) + '\n', 'utf8');
      console.log(chalk.green('Recorded'));
    });

  program
    .command('suggest')
    .description('Proactive skill hints from git status + sprint state')
    .option('--project <dir>')
    .action((opts: { project?: string }) => {
      const root = projectPath(opts.project);
      const list = suggestFromContext(root);
      if (list.length === 0) {
        console.log(
          chalk.yellow('No strong signals. Try cm-start or cm-planning for the next step.')
        );
        return;
      }
      for (const s of list) {
        console.log(chalk.cyan(s.skill));
        console.log(chalk.dim(`  ${s.reason}`));
      }
    });
}

function browseRequest(
  port: number,
  pathname: string,
  method: string,
  auth: string,
  body: object
): Promise<void> {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(JSON.stringify(body));
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: pathname,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
          Authorization: auth,
        },
      },
      (res) => {
        res.resume();
        if (res.statusCode && res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}`));
        else resolve();
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function browseBuffer(port: number, pathname: string, auth: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    http.get(
      {
        hostname: '127.0.0.1',
        port,
        path: pathname,
        headers: { Authorization: auth },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}`));
          else resolve(Buffer.concat(chunks));
        });
      }
    ).on('error', reject);
  });
}

function browseRaw(port: number, pathname: string, auth: string): Promise<string> {
  return new Promise((resolve, reject) => {
    http.get(
      {
        hostname: '127.0.0.1',
        port,
        path: pathname,
        headers: { Authorization: auth },
      },
      (res) => {
        let s = '';
        res.on('data', (c) => (s += c));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}`));
          else resolve(s);
        });
      }
    ).on('error', reject);
  });
}

async function httpProbeUrl(url: string): Promise<{ status: number; latency_ms: number }> {
  const t0 = performance.now();
  const res = await fetch(url, { redirect: 'follow' });
  await res.arrayBuffer().catch(() => {});
  const latency_ms = Math.round(performance.now() - t0);
  return { status: res.status, latency_ms };
}
