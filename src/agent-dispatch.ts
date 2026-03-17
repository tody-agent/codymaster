import fs from 'fs';
import path from 'path';
import type { Task, Project } from './data';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DispatchResult {
  success: boolean;
  filePath?: string;
  error?: string;
  errorCode?: 'NO_AGENT' | 'MANUAL_AGENT' | 'NO_PROJECT_PATH' | 'PATH_NOT_FOUND' | 'ALREADY_DISPATCHED' | 'WRITE_ERROR' | 'TASK_NOT_FOUND' | 'PROJECT_NOT_FOUND';
}

// ─── Agent Display Names ────────────────────────────────────────────────────

const AGENT_SKILL_PREFIX: Record<string, string> = {
  'antigravity': '@[/',
  'claude-code': '/',
  'cursor': '@',
  'gemini-cli': '@[/',
  'windsurf': '@',
  'cline': '@',
  'copilot': '',
};

const AGENT_DISPLAY: Record<string, string> = {
  'antigravity': 'Google Antigravity',
  'claude-code': 'Claude Code',
  'cursor': 'Cursor',
  'gemini-cli': 'Gemini CLI',
  'windsurf': 'Windsurf',
  'cline': 'Cline / RooCode',
  'copilot': 'GitHub Copilot',
  'manual': 'Manual',
};

// ─── Validation ─────────────────────────────────────────────────────────────

export function validateDispatch(task: Task, project: Project | undefined, force: boolean = false): DispatchResult | null {
  // 1. Agent is required
  if (!task.agent) {
    return { success: false, error: 'Agent is required for dispatch. Assign an agent first.', errorCode: 'NO_AGENT' };
  }

  // 2. Cannot dispatch manual tasks
  if (task.agent === 'manual') {
    return { success: false, error: 'Cannot dispatch manual tasks to AI agent. Change agent to an AI agent.', errorCode: 'MANUAL_AGENT' };
  }

  // 3. Project must exist
  if (!project) {
    return { success: false, error: 'Project not found for this task.', errorCode: 'PROJECT_NOT_FOUND' };
  }

  // 4. Project path is required
  if (!project.path) {
    return { success: false, error: 'Project workspace path is required. Edit the project to set a path.', errorCode: 'NO_PROJECT_PATH' };
  }

  // 5. Project path must exist on disk
  if (!fs.existsSync(project.path)) {
    return { success: false, error: `Project path does not exist: ${project.path}`, errorCode: 'PATH_NOT_FOUND' };
  }

  // 6. Already dispatched (unless force)
  if (task.dispatchStatus === 'dispatched' && task.dispatchedAt && !force) {
    return { success: false, error: `Task already dispatched at ${task.dispatchedAt}. Use force=true to re-dispatch.`, errorCode: 'ALREADY_DISPATCHED' };
  }

  return null; // All validations passed
}

// ─── Task File Generation ───────────────────────────────────────────────────

function generateTaskFileContent(task: Task, project: Project, dashboardPort: number = 6969): string {
  const agentName = AGENT_DISPLAY[task.agent] || task.agent;
  const skillPrefix = AGENT_SKILL_PREFIX[task.agent] || '';
  const skillSuffix = task.agent === 'antigravity' || task.agent === 'gemini-cli' ? ']' : '';
  const skillRef = task.skill ? `${skillPrefix}${task.skill}${skillSuffix}` : 'None';
  const now = new Date().toISOString();

  const priorityEmoji: Record<string, string> = {
    'low': '🟢', 'medium': '🟡', 'high': '🟠', 'urgent': '🔴',
  };

  let content = `# Task: ${task.title}

| Field | Value |
|-------|-------|
| Agent | ${agentName} |
| Skill | ${skillRef} |
| Priority | ${priorityEmoji[task.priority] || '🟡'} ${task.priority} |
| Project | ${project.name} |
| Created | ${task.createdAt} |
| Dispatched | ${now} |
| Task ID | ${task.id} |

## Description

${task.description || 'No additional description provided.'}

## Instructions

Execute this task in the project workspace at: \`${project.path}\`
`;

  if (task.skill) {
    content += `
Use the skill \`${task.skill}\` to guide execution. Invoke it with: ${skillRef}
`;
  }

  content += `
## Progress Reporting

After completing the task, update the status via CodyMaster API:

\`\`\`bash
# Mark as in-progress
curl -s -X PUT http://localhost:${dashboardPort}/api/tasks/${task.id}/move \\
  -H "Content-Type: application/json" \\
  -d '{"column": "in-progress"}'

# Mark as done when complete
curl -s -X PUT http://localhost:${dashboardPort}/api/tasks/${task.id}/move \\
  -H "Content-Type: application/json" \\
  -d '{"column": "done"}'
\`\`\`
`;

  return content;
}

// ─── Dispatcher ─────────────────────────────────────────────────────────────

export function dispatchTaskToAgent(task: Task, project: Project, force: boolean = false): DispatchResult {
  // Validate
  const validationError = validateDispatch(task, project, force);
  if (validationError) return validationError;

  // Generate content
  const content = generateTaskFileContent(task, project);

  // Create .agent-tasks directory
  const taskDir = path.join(project.path, '.agent-tasks');
  try {
    if (!fs.existsSync(taskDir)) {
      fs.mkdirSync(taskDir, { recursive: true });
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Cannot create .agent-tasks directory at ${taskDir}: ${err.message}`,
      errorCode: 'WRITE_ERROR',
    };
  }

  // Write task file
  const shortId = task.id.substring(0, 8);
  const safeTitle = task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 40);
  const fileName = `${shortId}-${safeTitle}.agent-task.md`;
  const filePath = path.join(taskDir, fileName);

  try {
    fs.writeFileSync(filePath, content, 'utf-8');
  } catch (err: any) {
    return {
      success: false,
      error: `Cannot write task file at ${filePath}: ${err.message}`,
      errorCode: 'WRITE_ERROR',
    };
  }

  // Write/update .gitignore in .agent-tasks
  const gitignorePath = path.join(taskDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    try {
      fs.writeFileSync(gitignorePath, '# Agent task files are transient — not tracked in git\n*\n!.gitignore\n', 'utf-8');
    } catch { /* non-critical */ }
  }

  return { success: true, filePath };
}
