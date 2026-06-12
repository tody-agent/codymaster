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
import { registerBrainCommands } from './commands/brain';
import { registerEvolveCommands } from './commands/evolve';
import { registerLearnCommands } from './commands/learn';
import { registerQualityCommands } from './commands/quality';
import { registerStackCommands } from './commands/stack';
import { registerParallelCommands } from './commands/parallel';
import { registerUpdateCommands } from './commands/update';

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
  registerBrainCommands(program);
  registerEvolveCommands(program);
  registerLearnCommands(program);
  registerQualityCommands(program);
  registerStackCommands(program);
  registerParallelCommands(program);
  registerUpdateCommands(program);
}
