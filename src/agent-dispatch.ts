import fs from 'fs';
import path from 'path';
import type { Task, Project } from './data';
import type { PlanTaskInterfaces, PlanTaskSpec } from './handoff/contracts';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DispatchResult {
  success: boolean;
  filePath?: string;
  prompt?: string;
  cliCommand?: string;
  error?: string;
  errorCode?: 'NO_AGENT' | 'MANUAL_AGENT' | 'NO_PROJECT_PATH' | 'PATH_NOT_FOUND' | 'ALREADY_DISPATCHED' | 'WRITE_ERROR' | 'TASK_NOT_FOUND' | 'PROJECT_NOT_FOUND';
}

export type ModeBAgentRole = 'implementer' | 'spec-reviewer' | 'quality-reviewer';

export interface ModeBFinding {
  severity: 'info' | 'warn' | 'error' | 'critical';
  message: string;
  file?: string;
  line?: number;
}

export interface ModeBReviewFeedback extends ModeBFinding {
  source: ModeBAgentRole | 'coordinator';
}

export interface ModeBUpstreamOutput {
  taskId: string;
  output: string;
}

export interface ModeBEnvelopeOptions {
  coordinationId: string;
  role: ModeBAgentRole;
  attempt: number;
  globalConstraints: string[];
  repoInstructions: string[];
  upstreamOutputs: ModeBUpstreamOutput[];
  priorReviewFeedback: ModeBReviewFeedback[];
  targetAgentId?: string;
}

export interface ModeBTaskEnvelope {
  schema: 'codymaster-subagent-task@1';
  coordination: {
    parentId: string;
    taskId: string;
    attempt: number;
    targetAgentId?: string;
  };
  assignment: {
    role: ModeBAgentRole;
    task: PlanTaskSpec;
    allowedFiles: string[];
    priorReviewFeedback: ModeBReviewFeedback[];
  };
  context: {
    globalConstraints: string[];
    interfaces: PlanTaskInterfaces;
    repoInstructions: string[];
    upstreamOutputs: ModeBUpstreamOutput[];
  };
  execution: {
    workspace: string;
    freshContext: boolean;
    serial: true;
    selfReviewRequired: boolean;
  };
  verification: PlanTaskSpec['verification'];
  responseContract: {
    format: 'json';
    required: string[];
    verdicts: string[];
  };
}

// ─── Agent Display Names ────────────────────────────────────────────────────

const AGENT_SKILL_PREFIX: Record<string, string> = {
  'antigravity': '@[/',
  'claude-code': '/',
  'codex': '/',
  'opencode': '/',
  'cursor': '@',
  'gemini-cli': '@[/',
  'windsurf': '@',
  'cline': '@',
  'copilot': '',
};

const AGENT_DISPLAY: Record<string, string> = {
  'antigravity': 'Google Antigravity',
  'claude-code': 'Claude Code',
  'codex': 'OpenAI Codex',
  'opencode': 'OpenCode',
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

function buildDoneCriteria(task: Task): string[] {
  const criteria = [
    'Complete the requested scope only.',
    'Preserve unrelated existing changes.',
    'Report verification evidence before claiming completion.',
  ];
  if (task.skill) {
    criteria.unshift(`Follow the workflow guidance from skill "${task.skill}" when it applies.`);
  }
  return criteria;
}

export function generateTaskEnvelope(task: Task, project: Project, dashboardPort: number = 6969): Record<string, unknown> {
  const agentName = AGENT_DISPLAY[task.agent] || task.agent;
  const skillPrefix = AGENT_SKILL_PREFIX[task.agent] || '';
  const skillSuffix = task.agent === 'antigravity' || task.agent === 'gemini-cli' ? ']' : '';
  const skillRef = task.skill ? `${skillPrefix}${task.skill}${skillSuffix}` : 'None';
  return {
    schema: 'codymaster-task@2',
    task: {
      id: task.id,
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      createdAt: task.createdAt,
      dispatchedAt: new Date().toISOString(),
    },
    execution: {
      agent: agentName,
      workspace: project.path,
      skill: task.skill || null,
      skillInvocation: task.skill ? skillRef : null,
      doneCriteria: buildDoneCriteria(task),
    },
    project: {
      id: project.id,
      name: project.name,
    },
    progressReporting: {
      baseUrl: `http://localhost:${dashboardPort}`,
      inProgress: {
        method: 'PUT',
        path: `/api/tasks/${task.id}/move`,
        body: { column: 'in-progress' },
      },
      done: {
        method: 'PUT',
        path: `/api/tasks/${task.id}/move`,
        body: { column: 'done' },
      },
    },
  };
}

function normalizeRepoRelativePath(filePath: string): string {
  if (
    !filePath
    || filePath.includes('\0')
    || path.posix.isAbsolute(filePath)
    || path.win32.isAbsolute(filePath)
  ) {
    throw new Error(`Unsafe repository-relative path: ${filePath}`);
  }
  const normalized = path.posix.normalize(filePath.replace(/\\/g, '/')).replace(/^\.\//, '');
  if (normalized === '..' || normalized.startsWith('../')) {
    throw new Error(`Unsafe repository-relative path: ${filePath}`);
  }
  return normalized;
}

export function generateModeBTaskEnvelope(
  task: PlanTaskSpec,
  project: Project,
  options: ModeBEnvelopeOptions,
): ModeBTaskEnvelope {
  const allowedFiles = task.files.map(file => normalizeRepoRelativePath(file.path));
  return {
    schema: 'codymaster-subagent-task@1',
    coordination: {
      parentId: options.coordinationId,
      taskId: task.id,
      attempt: options.attempt,
      ...(options.targetAgentId ? { targetAgentId: options.targetAgentId } : {}),
    },
    assignment: {
      role: options.role,
      task,
      allowedFiles,
      priorReviewFeedback: options.priorReviewFeedback,
    },
    context: {
      globalConstraints: options.globalConstraints,
      interfaces: task.interfaces,
      repoInstructions: options.repoInstructions,
      upstreamOutputs: options.upstreamOutputs,
    },
    execution: {
      workspace: project.path,
      freshContext: !options.targetAgentId,
      serial: true,
      selfReviewRequired: options.role === 'implementer',
    },
    verification: task.verification,
    responseContract: {
      format: 'json',
      required: ['verdict', 'summary', 'modifiedFiles', 'findings', 'selfReview'],
      verdicts: ['pass', 'changes_requested', 'question', 'block'],
    },
  };
}

function generateTaskFileContent(task: Task, project: Project, dashboardPort: number = 6969): string {
  return JSON.stringify(generateTaskEnvelope(task, project, dashboardPort), null, 2);
}

export function buildAgentTaskCliCommand(agent: string, relativePath: string): string {
  if (!/^[a-zA-Z0-9._/-]+$/.test(relativePath) || relativePath.split('/').includes('..')) {
    throw new Error(`Unsafe agent task path: ${relativePath}`);
  }
  const quotedPath = `"${relativePath}"`;
  const commands: Record<string, string> = {
    'antigravity': `antigravity -p < ${quotedPath}`,
    'codex': `codex exec - < ${quotedPath}`,
    'opencode': `opencode --task ${quotedPath}`,
    'cursor': `cursor --task ${quotedPath}`,
    'gemini-cli': `gemini run --task ${quotedPath}`,
    'claude-code': `claude -p < ${quotedPath}`,
  };
  return commands[agent] || `# Open and run: ${relativePath}`;
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

  // Generate CLI command
  const relativePath = path.relative(project.path, filePath);
  const cliCommand = buildAgentTaskCliCommand(task.agent, relativePath);

  return { success: true, filePath, prompt: content, cliCommand };
}
