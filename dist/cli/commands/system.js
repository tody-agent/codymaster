"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSystemCommands = registerSystemCommands;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const data_1 = require("../../data");
const theme_1 = require("../../ui/theme");
const box_1 = require("../../ui/box");
const hamster_1 = require("../../ui/hamster");
const skill_utils_1 = require("../../utils/skill-utils");
const cli_utils_1 = require("../../utils/cli-utils");
const pkg = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, '..', '..', '..', 'package.json'), 'utf-8'));
const VERSION = pkg.version;
function registerSystemCommands(program) {
    // ─── Status Command ────────────────────────────────────────────────────────
    program
        .command('status')
        .alias('s')
        .description('Show task & project summary')
        .action(() => {
        const data = (0, data_1.loadData)();
        showBanner();
        console.log((0, box_1.renderCommandHeader)('Status Overview', '📊'));
        // Projects
        console.log((0, theme_1.brand)(`  Projects: ${data.projects.length}`));
        for (const p of data.projects) {
            const pt = data.tasks.filter(t => t.projectId === p.id);
            const done = pt.filter(t => t.column === 'done').length;
            const pct = pt.length > 0 ? Math.round((done / pt.length) * 100) : 0;
            console.log((0, theme_1.dim)(`    📦 ${(0, cli_utils_1.padRight)(p.name, 20)} ${(0, cli_utils_1.progressBar)(pct)} ${done}/${pt.length} (${pct}%)`));
        }
        // Tasks
        const total = data.tasks.length;
        const byCol = { backlog: 0, 'in-progress': 0, review: 0, done: 0 };
        data.tasks.forEach(t => { byCol[t.column] = (byCol[t.column] || 0) + 1; });
        console.log();
        console.log((0, theme_1.brand)(`  Tasks: ${total}`));
        console.log((0, theme_1.dim)(`    ⚪ Backlog:     ${byCol.backlog}`));
        console.log((0, theme_1.info)(`    🟢 In Progress: ${byCol['in-progress']}`));
        console.log((0, theme_1.warning)(`    🟡 Review:      ${byCol.review}`));
        console.log((0, theme_1.success)(`    🟢 Done:        ${byCol.done}`));
        // Deploys
        if (data.deployments.length > 0) {
            console.log();
            console.log((0, theme_1.brand)(`  Deployments: ${data.deployments.length}`));
            const latest = data.deployments[0];
            const sc = theme_1.STATUS[latest.status] || chalk_1.default.white;
            console.log((0, theme_1.dim)(`    Latest: ${latest.env} — ${sc(latest.status)} — ${latest.message} (${(0, cli_utils_1.formatTimeAgoCli)(latest.startedAt)})`));
        }
        console.log();
    });
    // ─── Config Command ────────────────────────────────────────────────────────
    program
        .command('config [key] [value]')
        .description('Get or set configuration')
        .action((key, value) => {
        if (!key) {
            console.log((0, box_1.renderCommandHeader)('Configuration', '⚙️'));
            console.log((0, theme_1.dim)('  Run cm config <key> <value> to set a value.\n'));
            return;
        }
        if (value) {
            console.log((0, box_1.renderResult)('success', `Config set: ${key} = ${value}`));
        }
        else {
            console.log((0, box_1.renderResult)('info', `Config: ${key} = (not set)`));
        }
    });
    // ─── Open Command ───────────────────────────────────────────────────────────
    program
        .command('open')
        .description('Open dashboard in browser')
        .action(() => {
        const url = `http://localhost:${data_1.DEFAULT_PORT}`;
        console.log((0, box_1.renderResult)('info', `Opening ${url}...`));
        (0, cli_utils_1.openUrl)(url);
    });
}
function showBanner() {
    const cPath = process.cwd().replace(os_1.default.homedir(), '~');
    const skillCount = (0, skill_utils_1.getSkillCount)();
    // Using a default/mocked profile for now (profile logic is being refactored)
    console.log((0, hamster_1.renderHamsterBanner)(undefined, VERSION, cPath, skillCount));
}
