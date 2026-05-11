import type { Project, Task } from './data';

export function getProjectActiveAgents(project: Project, tasks: Task[]): string[] {
  return [...new Set([
    ...(Array.isArray(project.agents) ? project.agents : []),
    ...tasks.map(t => t.agent).filter(Boolean),
  ])];
}
