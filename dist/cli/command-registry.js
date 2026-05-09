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
const mcp_serve_1 = require("./commands/mcp-serve");
const bench_1 = require("./commands/bench");
const install_1 = require("./commands/install");
const brain_1 = require("./commands/brain");
const evolve_1 = require("./commands/evolve");
const learn_1 = require("./commands/learn");
const quality_1 = require("./commands/quality");
const stack_1 = require("./commands/stack");
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
    (0, mcp_serve_1.registerMcpServeCommands)(program);
    (0, bench_1.registerBenchCommands)(program);
    (0, install_1.registerInstallCommands)(program);
    (0, brain_1.registerBrainCommands)(program);
    (0, evolve_1.registerEvolveCommands)(program);
    (0, learn_1.registerLearnCommands)(program);
    (0, quality_1.registerQualityCommands)(program);
    (0, stack_1.registerStackCommands)(program);
}
