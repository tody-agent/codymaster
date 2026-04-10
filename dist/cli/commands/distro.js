"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDistroCommands = registerDistroCommands;
const chalk_1 = __importDefault(require("chalk"));
const distro_validate_1 = require("../../distro-validate");
function registerDistroCommands(program) {
    const distro = program.command('distro').description('Skill pack validation (ecosystem roadmap)');
    distro
        .command('validate')
        .description('Validate a skill directory (SKILL.md / tmpl + optional meta.json)')
        .argument('<dir>', 'path to skill folder')
        .action((dir) => {
        const r = (0, distro_validate_1.validateSkillPackDir)(dir);
        for (const w of r.warnings)
            console.log(chalk_1.default.yellow('warning:'), w);
        for (const e of r.errors)
            console.error(chalk_1.default.red('error:'), e);
        if (!r.ok)
            process.exit(1);
        console.log(chalk_1.default.green('OK'), dir);
    });
}
