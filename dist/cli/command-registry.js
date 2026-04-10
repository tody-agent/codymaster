"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAllCommands = registerAllCommands;
const agent_1 = require("./commands/agent");
const dashboard_1 = require("./commands/dashboard");
const project_1 = require("./commands/project");
const skill_chain_1 = require("./commands/skill-chain");
const system_1 = require("./commands/system");
const task_1 = require("./commands/task");
const engineering_1 = require("./commands/engineering");
const design_studio_1 = require("./commands/design-studio");
const distro_1 = require("./commands/distro");
/**
 * Registers all CLI commands with the provided program instance.
 */
function registerAllCommands(program) {
    (0, agent_1.registerAgentCommands)(program);
    (0, dashboard_1.registerDashboardCommands)(program);
    (0, project_1.registerProjectCommands)(program);
    (0, skill_chain_1.registerSkillChainCommands)(program);
    (0, system_1.registerSystemCommands)(program);
    (0, task_1.registerTaskCommands)(program);
    (0, engineering_1.registerEngineeringCommands)(program);
    (0, design_studio_1.registerDesignStudioCommands)(program);
    (0, distro_1.registerDistroCommands)(program);
}
