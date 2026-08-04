import crypto from 'crypto';
import path from 'path';
import type { AgentBackend, ExecOptions } from './agent/backend';
import { getBackend } from './agent/factory';
import {
  generateModeBTaskEnvelope,
  type ModeBAgentRole,
  type ModeBFinding,
  type ModeBReviewFeedback,
  type ModeBTaskEnvelope,
  type ModeBUpstreamOutput,
} from './agent-dispatch';
import type { Project } from './data';
import type { PlanTaskSpec } from './handoff/contracts';

export type { ModeBTaskEnvelope } from './agent-dispatch';

export interface ModeBAgentQuestion {
  text: string;
  scopeChanging: boolean;
}

export interface ModeBAgentReport {
  agentId: string;
  verdict: 'pass' | 'changes_requested' | 'question' | 'block';
  summary: string;
  modifiedFiles: string[];
  findings: ModeBFinding[];
  selfReview: string[];
  question?: ModeBAgentQuestion;
}

export interface ModeBHarnessAdapter {
  dispatch(envelope: ModeBTaskEnvelope): Promise<unknown>;
}

export interface ModeBVerificationResult {
  passed: boolean;
  command: string;
  evidence: string;
}

export interface ModeBWorkspaceState {
  changedFiles: string[];
  fingerprint: string;
}

export interface ModeBBlocker {
  code:
    | 'agent-blocked'
    | 'dispatch-failed'
    | 'fresh-context-violation'
    | 'independence-violation'
    | 'malformed-report'
    | 'needs-user'
    | 'retry-exhausted'
    | 'unauthorized-file-touch'
    | 'verification-failed';
  message: string;
}

export interface ModeBTaskResult {
  taskId: string;
  status: 'completed' | 'blocked';
  implementerId?: string;
  reviewCycles: number;
  trace: string[];
  summary?: string;
  verification?: ModeBVerificationResult;
  blocker?: ModeBBlocker;
}

export interface ModeBRunResult {
  status: 'completed' | 'blocked';
  tasks: ModeBTaskResult[];
}

export interface ModeBOrchestrationOptions {
  tasks: PlanTaskSpec[];
  project: Project;
  coordinationId: string;
  globalConstraints: string[];
  repoInstructions: string[];
  harness: ModeBHarnessAdapter;
  inspectWorkspace(task: PlanTaskSpec, project: Project): Promise<ModeBWorkspaceState>;
  verify(task: PlanTaskSpec, project: Project): Promise<ModeBVerificationResult>;
  upstreamOutputs?: Record<string, ModeBUpstreamOutput[]>;
  answerQuestion: (question: ModeBAgentQuestion, task: PlanTaskSpec) => Promise<string | null>;
  maxReviewCycles?: number;
}

interface ReportResult {
  report?: ModeBAgentReport;
  blocker?: ModeBBlocker;
}

const DEFAULT_MAX_REVIEW_CYCLES = 2;
const MAX_ANSWERED_QUESTIONS = 3;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJsonReport(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  try {
    return JSON.parse(fenced ? fenced[1] : trimmed);
  } catch {
    return value;
  }
}

function isFinding(value: unknown): value is ModeBFinding {
  if (!isRecord(value)) return false;
  return (
    ['info', 'warn', 'error', 'critical'].includes(String(value.severity))
    && typeof value.message === 'string'
    && (value.file === undefined || typeof value.file === 'string')
    && (value.line === undefined || typeof value.line === 'number')
  );
}

function validateReport(value: unknown): ModeBAgentReport | null {
  const parsed = parseJsonReport(value);
  if (!isRecord(parsed)) return null;
  const verdicts = ['pass', 'changes_requested', 'question', 'block'];
  if (
    typeof parsed.agentId !== 'string'
    || !parsed.agentId
    || !verdicts.includes(String(parsed.verdict))
    || typeof parsed.summary !== 'string'
    || !Array.isArray(parsed.modifiedFiles)
    || !parsed.modifiedFiles.every(file => typeof file === 'string')
    || !Array.isArray(parsed.findings)
    || !parsed.findings.every(isFinding)
    || !Array.isArray(parsed.selfReview)
    || !parsed.selfReview.every(item => typeof item === 'string')
  ) {
    return null;
  }
  if (parsed.verdict === 'question') {
    if (
      !isRecord(parsed.question)
      || typeof parsed.question.text !== 'string'
      || typeof parsed.question.scopeChanging !== 'boolean'
    ) {
      return null;
    }
  }
  if (parsed.verdict === 'changes_requested' && parsed.findings.length === 0) {
    return null;
  }
  return parsed as unknown as ModeBAgentReport;
}

function normalizeReportedPath(filePath: string): string | null {
  if (
    !filePath
    || filePath.includes('\0')
    || path.posix.isAbsolute(filePath)
    || path.win32.isAbsolute(filePath)
  ) return null;
  const normalized = path.posix.normalize(filePath.replace(/\\/g, '/')).replace(/^\.\//, '');
  if (normalized === '..' || normalized.startsWith('../')) return null;
  return normalized;
}

function validateFileScope(
  report: ModeBAgentReport,
  envelope: ModeBTaskEnvelope,
): ModeBBlocker | null {
  const allowed = new Set(envelope.assignment.allowedFiles);
  for (const reportedFile of report.modifiedFiles) {
    const normalized = normalizeReportedPath(reportedFile);
    if (!normalized || !allowed.has(normalized)) {
      return {
        code: 'unauthorized-file-touch',
        message: `Agent ${report.agentId} reported unauthorized file: ${reportedFile}`,
      };
    }
  }
  if (envelope.assignment.role !== 'implementer' && report.modifiedFiles.length > 0) {
    return {
      code: 'unauthorized-file-touch',
      message: `Reviewer ${report.agentId} must not modify files.`,
    };
  }
  return null;
}

function validateInspectedFileScope(
  agentId: string,
  changedFiles: string[],
  allowedFiles: string[],
): ModeBBlocker | null {
  const allowed = new Set(allowedFiles);
  for (const changedFile of changedFiles) {
    const normalized = normalizeReportedPath(changedFile);
    if (!normalized || !allowed.has(normalized)) {
      return {
        code: 'unauthorized-file-touch',
        message: `Coordinator inspection found unauthorized file from agent ${agentId}: ${changedFile}`,
      };
    }
  }
  return null;
}

async function inspectWorkspace(
  options: ModeBOrchestrationOptions,
  task: PlanTaskSpec,
): Promise<{ state?: ModeBWorkspaceState; blocker?: ModeBBlocker }> {
  try {
    const state = await options.inspectWorkspace(task, options.project);
    if (
      !state
      || !Array.isArray(state.changedFiles)
      || !state.changedFiles.every(file => typeof file === 'string')
      || typeof state.fingerprint !== 'string'
      || !state.fingerprint
    ) {
      return {
        blocker: {
          code: 'verification-failed',
          message: `Coordinator workspace inspection returned malformed state for task ${task.id}.`,
        },
      };
    }
    return { state };
  } catch (error) {
    return {
      blocker: {
        code: 'verification-failed',
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

async function ensureReviewerDidNotModifyWorkspace(
  options: ModeBOrchestrationOptions,
  task: PlanTaskSpec,
  baseline: ModeBWorkspaceState,
  roleLabel: string,
  reviewerId: string,
): Promise<ModeBBlocker | null> {
  const inspected = await inspectWorkspace(options, task);
  if (inspected.blocker) return inspected.blocker;
  if (inspected.state!.fingerprint !== baseline.fingerprint) {
    return {
      code: 'unauthorized-file-touch',
      message: `${roleLabel} ${reviewerId} modified the workspace.`,
    };
  }
  return null;
}

function feedbackFrom(role: ModeBAgentRole, findings: ModeBFinding[]): ModeBReviewFeedback[] {
  return findings.map(finding => ({ ...finding, source: role }));
}

function blockedTask(
  taskId: string,
  reviewCycles: number,
  trace: string[],
  blocker: ModeBBlocker,
  implementerId?: string,
): ModeBTaskResult {
  return { taskId, status: 'blocked', implementerId, reviewCycles, trace, blocker };
}

function makeEnvelope(
  options: ModeBOrchestrationOptions,
  task: PlanTaskSpec,
  role: ModeBAgentRole,
  attempt: number,
  feedback: ModeBReviewFeedback[],
  targetAgentId?: string,
): ModeBTaskEnvelope {
  return generateModeBTaskEnvelope(task, options.project, {
    coordinationId: options.coordinationId,
    role,
    attempt,
    globalConstraints: options.globalConstraints,
    repoInstructions: options.repoInstructions,
    upstreamOutputs: options.upstreamOutputs?.[task.id] ?? [],
    priorReviewFeedback: feedback,
    targetAgentId,
  });
}

async function dispatchForReport(
  options: ModeBOrchestrationOptions,
  task: PlanTaskSpec,
  envelope: ModeBTaskEnvelope,
): Promise<ReportResult> {
  let currentEnvelope = envelope;
  for (let questionCount = 0; questionCount <= MAX_ANSWERED_QUESTIONS; questionCount++) {
    let rawReport: unknown;
    try {
      rawReport = await options.harness.dispatch(currentEnvelope);
    } catch (error) {
      return {
        blocker: {
          code: 'dispatch-failed',
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
    const report = validateReport(rawReport);
    if (!report) {
      return {
        blocker: {
          code: 'malformed-report',
          message: `Malformed ${currentEnvelope.assignment.role} report for task ${task.id}.`,
        },
      };
    }
    const scopeBlocker = validateFileScope(report, currentEnvelope);
    if (scopeBlocker) return { blocker: scopeBlocker };
    if (report.verdict !== 'question') return { report };

    const question = report.question!;
    if (question.scopeChanging) {
      return {
        blocker: {
          code: 'needs-user',
          message: question.text,
        },
      };
    }
    const answer = await options.answerQuestion(question, task);
    if (!answer || questionCount === MAX_ANSWERED_QUESTIONS) {
      return {
        blocker: {
          code: 'needs-user',
          message: question.text,
        },
      };
    }
    currentEnvelope = makeEnvelope(
      options,
      task,
      currentEnvelope.assignment.role,
      currentEnvelope.coordination.attempt,
      [{ severity: 'info', message: answer, source: 'coordinator' }],
      report.agentId,
    );
  }
  return {
    blocker: { code: 'needs-user', message: `Question limit reached for task ${task.id}.` },
  };
}

async function runTask(
  options: ModeBOrchestrationOptions,
  task: PlanTaskSpec,
  usedImplementerIds: Set<string>,
): Promise<ModeBTaskResult> {
  const trace: string[] = [];
  const maxReviewCycles = Math.max(
    0,
    Math.min(options.maxReviewCycles ?? DEFAULT_MAX_REVIEW_CYCLES, DEFAULT_MAX_REVIEW_CYCLES),
  );
  let reviewCycles = 0;
  let implementerId: string | undefined;
  let feedback: ModeBReviewFeedback[] = [];
  let implementationSummary = '';

  while (true) {
    const implementationEnvelope = makeEnvelope(
      options,
      task,
      'implementer',
      reviewCycles,
      feedback,
      implementerId,
    );
    const implementationResult = await dispatchForReport(options, task, implementationEnvelope);
    if (implementationResult.blocker) {
      return blockedTask(task.id, reviewCycles, trace, implementationResult.blocker, implementerId);
    }
    const implementation = implementationResult.report!;
    if (!implementerId && usedImplementerIds.has(implementation.agentId)) {
      return blockedTask(task.id, reviewCycles, trace, {
        code: 'fresh-context-violation',
        message: `Task ${task.id} reused implementer session ${implementation.agentId} from an earlier task.`,
      });
    }
    if (implementerId && implementation.agentId !== implementerId) {
      return blockedTask(task.id, reviewCycles, trace, {
        code: 'independence-violation',
        message: `Fix for task ${task.id} did not return to implementer ${implementerId}.`,
      }, implementerId);
    }
    implementerId = implementation.agentId;
    if (implementation.verdict !== 'pass') {
      return blockedTask(task.id, reviewCycles, trace, {
        code: 'agent-blocked',
        message: implementation.summary,
      }, implementerId);
    }
    if (implementation.selfReview.length === 0) {
      return blockedTask(task.id, reviewCycles, trace, {
        code: 'malformed-report',
        message: `Implementer ${implementerId} omitted the required self-review.`,
      }, implementerId);
    }
    implementationSummary = implementation.summary;
    const inspected = await inspectWorkspace(options, task);
    if (inspected.blocker) {
      return blockedTask(task.id, reviewCycles, trace, inspected.blocker, implementerId);
    }
    const workspaceState = inspected.state!;
    const inspectedScopeBlocker = validateInspectedFileScope(
      implementerId,
      workspaceState.changedFiles,
      implementationEnvelope.assignment.allowedFiles,
    );
    if (inspectedScopeBlocker) {
      return blockedTask(task.id, reviewCycles, trace, inspectedScopeBlocker, implementerId);
    }
    trace.push(reviewCycles === 0 ? 'implementation-passed' : 'fix-passed');

    const specEnvelope = makeEnvelope(options, task, 'spec-reviewer', reviewCycles, [], undefined);
    const specResult = await dispatchForReport(options, task, specEnvelope);
    if (specResult.blocker) {
      return blockedTask(task.id, reviewCycles, trace, specResult.blocker, implementerId);
    }
    const specReview = specResult.report!;
    const specReviewerId = specReview.agentId;
    if (specReview.agentId === implementerId) {
      return blockedTask(task.id, reviewCycles, trace, {
        code: 'independence-violation',
        message: `Spec reviewer must be independent from implementer ${implementerId}.`,
      }, implementerId);
    }
    const specMutation = await ensureReviewerDidNotModifyWorkspace(
      options,
      task,
      workspaceState,
      'Spec reviewer',
      specReview.agentId,
    );
    if (specMutation) {
      return blockedTask(task.id, reviewCycles, trace, specMutation, implementerId);
    }
    if (specReview.verdict === 'changes_requested') {
      trace.push('spec-review-rejected');
      if (reviewCycles >= maxReviewCycles) {
        return blockedTask(task.id, reviewCycles, trace, {
          code: 'retry-exhausted',
          message: `Task ${task.id} still failed spec review after ${maxReviewCycles} re-review cycles; treat this as a planning defect.`,
        }, implementerId);
      }
      feedback = feedbackFrom('spec-reviewer', specReview.findings);
      reviewCycles++;
      continue;
    }
    if (specReview.verdict !== 'pass') {
      return blockedTask(task.id, reviewCycles, trace, {
        code: 'agent-blocked',
        message: specReview.summary,
      }, implementerId);
    }
    trace.push('spec-review-passed');

    const qualityEnvelope = makeEnvelope(options, task, 'quality-reviewer', reviewCycles, [], undefined);
    const qualityResult = await dispatchForReport(options, task, qualityEnvelope);
    if (qualityResult.blocker) {
      return blockedTask(task.id, reviewCycles, trace, qualityResult.blocker, implementerId);
    }
    const qualityReview = qualityResult.report!;
    if (qualityReview.agentId === implementerId) {
      return blockedTask(task.id, reviewCycles, trace, {
        code: 'independence-violation',
        message: `Quality reviewer must be independent from implementer ${implementerId}.`,
      }, implementerId);
    }
    if (qualityReview.agentId === specReviewerId) {
      return blockedTask(task.id, reviewCycles, trace, {
        code: 'independence-violation',
        message: `Quality reviewer must be independent from spec reviewer ${specReviewerId}.`,
      }, implementerId);
    }
    const qualityMutation = await ensureReviewerDidNotModifyWorkspace(
      options,
      task,
      workspaceState,
      'Quality reviewer',
      qualityReview.agentId,
    );
    if (qualityMutation) {
      return blockedTask(task.id, reviewCycles, trace, qualityMutation, implementerId);
    }
    if (qualityReview.verdict === 'changes_requested') {
      trace.push('quality-review-rejected');
      if (reviewCycles >= maxReviewCycles) {
        return blockedTask(task.id, reviewCycles, trace, {
          code: 'retry-exhausted',
          message: `Task ${task.id} still failed quality review after ${maxReviewCycles} re-review cycles; treat this as a planning defect.`,
        }, implementerId);
      }
      feedback = feedbackFrom('quality-reviewer', qualityReview.findings);
      reviewCycles++;
      continue;
    }
    if (qualityReview.verdict !== 'pass') {
      return blockedTask(task.id, reviewCycles, trace, {
        code: 'agent-blocked',
        message: qualityReview.summary,
      }, implementerId);
    }
    trace.push('quality-review-passed');

    let verification: ModeBVerificationResult;
    try {
      verification = await options.verify(task, options.project);
    } catch (error) {
      return blockedTask(task.id, reviewCycles, trace, {
        code: 'verification-failed',
        message: error instanceof Error ? error.message : String(error),
      }, implementerId);
    }
    if (!verification.passed) {
      trace.push('verification-failed');
      return blockedTask(task.id, reviewCycles, trace, {
        code: 'verification-failed',
        message: verification.evidence,
      }, implementerId);
    }
    trace.push('verification-passed', 'completed');
    return {
      taskId: task.id,
      status: 'completed',
      implementerId,
      reviewCycles,
      trace,
      summary: implementationSummary,
      verification,
    };
  }
}

export async function orchestrateModeB(options: ModeBOrchestrationOptions): Promise<ModeBRunResult> {
  const tasks: ModeBTaskResult[] = [];
  const usedImplementerIds = new Set<string>();
  for (const task of options.tasks) {
    const result = await runTask(options, task, usedImplementerIds);
    tasks.push(result);
    if (result.implementerId) usedImplementerIds.add(result.implementerId);
    if (result.status === 'blocked') return { status: 'blocked', tasks };
  }
  return { status: 'completed', tasks };
}

function extractReportObject(output: string): Record<string, unknown> | null {
  const parsed = parseJsonReport(output);
  return isRecord(parsed) ? parsed : null;
}

/** Adapts the existing spawn backend to fresh sessions and same-session fixes. */
export class AgentBackendModeBHarness implements ModeBHarnessAdapter {
  constructor(
    private readonly backend: AgentBackend,
    private readonly execOptions: Omit<ExecOptions, 'cwd' | 'resumeSessionId'> = {},
  ) {
    if (!backend.capabilities?.isolatedSessions || !backend.capabilities.resumableSessions) {
      throw new Error(
        `Agent backend ${backend.name} does not support isolated resumable sessions; use Mode F or Mode A.`,
      );
    }
  }

  async dispatch(envelope: ModeBTaskEnvelope): Promise<unknown> {
    const session = await this.backend.execute(JSON.stringify(envelope, null, 2), {
      ...this.execOptions,
      cwd: envelope.execution.workspace,
      resumeSessionId: envelope.coordination.targetAgentId,
    });
    const streamedText: string[] = [];
    let streamedSessionId: string | undefined;
    for await (const message of session.messages) {
      if (message.type === 'text') {
        streamedText.push(message.content);
        if (message.sessionId) streamedSessionId = message.sessionId;
      }
    }
    const result = await session.result;
    if (result.status !== 'completed') {
      return {
        agentId: result.sessionId ?? envelope.coordination.targetAgentId ?? `${this.backend.name}-${crypto.randomUUID()}`,
        verdict: 'block',
        summary: result.error ?? `Agent backend ended with status ${result.status}.`,
        modifiedFiles: [],
        findings: [],
        selfReview: [],
      } satisfies ModeBAgentReport;
    }
    const sessionId = result.sessionId ?? streamedSessionId;
    if (!sessionId) {
      return {
        agentId: `${this.backend.name}-${crypto.randomUUID()}`,
        verdict: 'block',
        summary: `Agent backend ${this.backend.name} did not return a resumable session ID.`,
        modifiedFiles: [],
        findings: [],
        selfReview: [],
      } satisfies ModeBAgentReport;
    }
    const output = streamedText.join('') || result.output;
    const report = extractReportObject(output);
    if (!report) return output;
    return {
      ...report,
      agentId: sessionId,
    };
  }
}

export function createAgentBackendModeBHarness(
  backendName: string,
  execOptions: Omit<ExecOptions, 'cwd' | 'resumeSessionId'> = {},
): AgentBackendModeBHarness {
  return new AgentBackendModeBHarness(getBackend(backendName), execOptions);
}
