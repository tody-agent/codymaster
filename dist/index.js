"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const prompts_1 = __importDefault(require("prompts"));
const chalk_1 = __importDefault(require("chalk"));
const dashboard_1 = require("./dashboard");
const program = new commander_1.Command();
program
    .name('cm')
    .description('CodyMaster Universal Skills CLI')
    .version('1.0.0');
program.command('install')
    .description('Install a new agent skill to the central registry')
    .argument('<skill>', 'Name of the skill to install')
    .option('-p, --platform <platform>', 'Specify the target platform (cursor, claude, gemini, etc.)')
    .action((skill, options) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(chalk_1.default.blue(`Installing skill: ${skill}...`));
    if (!options.platform) {
        const response = yield (0, prompts_1.default)({
            type: 'select',
            name: 'platform',
            message: 'Which platform do you want to install this skill for?',
            choices: [
                { title: 'Google Antigravity', value: 'gemini' },
                { title: 'Claude Code', value: 'claude' },
                { title: 'Cursor', value: 'cursor' },
                { title: 'Windsurf', value: 'windsurf' },
                { title: 'Cline / RooCode', value: 'cline' },
                { title: 'OpenClaw', value: 'openclaw' }
            ]
        });
        options.platform = response.platform;
    }
    console.log(chalk_1.default.green(`\n✅ Skill '${skill}' successfully adapted and installed for ${options.platform}!`));
}));
program.command('dashboard')
    .description('Launch the CodyMaster Observatory Dashboard')
    .action(() => {
    (0, dashboard_1.launchDashboard)();
});
program.parse(process.argv);
