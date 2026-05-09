import { Command } from 'commander';
import { registerAgentCommands } from './commands/agent';
import { registerDashboardCommands } from './commands/dashboard';
import { registerProjectCommands } from './commands/project';
import { registerSkillChainCommands } from './commands/skill-chain';
import { registerSystemCommands } from './commands/system';
import { registerTaskCommands } from './commands/task';
import { registerEngineeringCommands } from './commands/engineering';
import { registerDesignStudioCommands } from './commands/design-studio';
import { registerDistroCommands } from './commands/distro';
import { registerMcpServeCommands } from './commands/mcp-serve';
import { registerBenchCommands } from './commands/bench';
import { registerInstallCommands } from './commands/install';

/**
 * Registers all CLI commands with the provided program instance.
 */
export function registerAllCommands(program: Command) {
  registerAgentCommands(program);
  registerDashboardCommands(program);
  registerProjectCommands(program);
  registerSkillChainCommands(program);
  registerSystemCommands(program);
  registerTaskCommands(program);
  registerEngineeringCommands(program);
  registerDesignStudioCommands(program);
  registerDistroCommands(program);
  registerMcpServeCommands(program);
  registerBenchCommands(program);
  registerInstallCommands(program);
}
