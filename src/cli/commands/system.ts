import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { 
  loadData, findProjectByNameOrId,
  Project, Task, DEFAULT_PORT
} from '../../data';
import { brand, dim, success, warning, info, STATUS as STATUS_COLORS } from '../../ui/theme';
import { renderResult, renderCommandHeader } from '../../ui/box';
import { renderHamsterBanner } from '../../ui/hamster';
import { getSkillCount } from '../../utils/skill-utils';
import { padRight, formatTimeAgoCli, isDashboardRunning, progressBar, openUrl } from '../../utils/cli-utils';

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'package.json'), 'utf-8'));
const VERSION = pkg.version;

export function registerSystemCommands(program: Command) {
  // ─── Status Command ────────────────────────────────────────────────────────
  program
    .command('status')
    .alias('s')
    .description('Show task & project summary')
    .action(() => {
      const data = loadData();
      showBanner();
      console.log(renderCommandHeader('Status Overview', '📊'));

      // Projects
      console.log(brand(`  Projects: ${data.projects.length}`));
      for (const p of data.projects) {
        const pt = data.tasks.filter(t => t.projectId === p.id);
        const done = pt.filter(t => t.column === 'done').length;
        const pct = pt.length > 0 ? Math.round((done / pt.length) * 100) : 0;
        console.log(dim(`    📦 ${padRight(p.name, 20)} ${progressBar(pct)} ${done}/${pt.length} (${pct}%)`));
      }

      // Tasks
      const total = data.tasks.length;
      const byCol: Record<string, number> = { backlog: 0, 'in-progress': 0, review: 0, done: 0 };
      data.tasks.forEach(t => { byCol[t.column] = (byCol[t.column] || 0) + 1; });
      console.log(); console.log(brand(`  Tasks: ${total}`));
      console.log(dim(`    ⚪ Backlog:     ${byCol.backlog}`));
      console.log(info(`    🟢 In Progress: ${byCol['in-progress']}`));
      console.log(warning(`    🟡 Review:      ${byCol.review}`));
      console.log(success(`    🟢 Done:        ${byCol.done}`));

      // Deploys
      if (data.deployments.length > 0) {
        console.log(); console.log(brand(`  Deployments: ${data.deployments.length}`));
        const latest = data.deployments[0];
        const sc = (STATUS_COLORS as any)[latest.status] || chalk.white;
        console.log(dim(`    Latest: ${latest.env} — ${sc(latest.status)} — ${latest.message} (${formatTimeAgoCli(latest.startedAt)})`));
      }
      console.log();
    });

  // ─── Config Command ────────────────────────────────────────────────────────
  program
    .command('config [key] [value]')
    .description('Get or set configuration')
    .action((key, value) => {
      if (!key) {
        console.log(renderCommandHeader('Configuration', '⚙️'));
        console.log(dim('  Run cm config <key> <value> to set a value.\n'));
        return;
      }
      if (value) {
        console.log(renderResult('success', `Config set: ${key} = ${value}`));
      } else {
        console.log(renderResult('info', `Config: ${key} = (not set)`));
      }
    });

  // ─── Open Command ───────────────────────────────────────────────────────────
  program
    .command('open')
    .description('Open dashboard in browser')
    .action(() => {
      const url = `http://localhost:${DEFAULT_PORT}`;
      console.log(renderResult('info', `Opening ${url}...`));
      openUrl(url);
    });
}

function showBanner() {
  const cPath = process.cwd().replace(os.homedir(), '~');
  const skillCount = getSkillCount();
  // Using a default/mocked profile for now (profile logic is being refactored)
  console.log(renderHamsterBanner(undefined, VERSION, cPath, skillCount));
}
