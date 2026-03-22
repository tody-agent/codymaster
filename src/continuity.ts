import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Learning {
  id: string;
  whatFailed: string;
  whyFailed: string;
  howToPrevent: string;
  timestamp: string;
  agent: string;
  taskId: string;
  module?: string;
}

export interface Decision {
  id: string;
  decision: string;
  rationale: string;
  timestamp: string;
  agent: string;
}

export interface ContinuityState {
  lastUpdated: string;
  currentPhase: 'planning' | 'executing' | 'testing' | 'deploying' | 'reviewing' | 'idle';
  currentIteration: number;
  project: string;
  activeGoal: string;
  currentTask: {
    id: string;
    title: string;
    status: string;
    skill: string;
    started: string;
  } | null;
  justCompleted: string[];
  nextActions: string[];
  activeBlockers: string[];
  keyDecisions: Decision[];
  learnings: Learning[];
  workingContext: string;
  filesModified: { path: string; change: string }[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CM_DIR = '.cm';
const CONTINUITY_FILE = 'CONTINUITY.md';
const LEARNINGS_FILE = 'memory/learnings.json';
const DECISIONS_FILE = 'memory/decisions.json';
const CONFIG_FILE = 'config.yaml';

// ─── Directory Management ───────────────────────────────────────────────────

export function getCmDir(projectPath: string): string {
  return path.join(projectPath, CM_DIR);
}

export function ensureCmDir(projectPath: string): void {
  const cmDir = getCmDir(projectPath);
  const memoryDir = path.join(cmDir, 'memory');

  if (!fs.existsSync(cmDir)) {
    fs.mkdirSync(cmDir, { recursive: true });
  }
  if (!fs.existsSync(memoryDir)) {
    fs.mkdirSync(memoryDir, { recursive: true });
  }

  // Initialize files if they don't exist
  const continuityPath = path.join(cmDir, CONTINUITY_FILE);
  if (!fs.existsSync(continuityPath)) {
    writeContinuityMd(projectPath, createDefaultState(path.basename(projectPath)));
  }

  const learningsPath = path.join(cmDir, LEARNINGS_FILE);
  if (!fs.existsSync(learningsPath)) {
    fs.writeFileSync(learningsPath, JSON.stringify([], null, 2));
  }

  const decisionsPath = path.join(cmDir, DECISIONS_FILE);
  if (!fs.existsSync(decisionsPath)) {
    fs.writeFileSync(decisionsPath, JSON.stringify([], null, 2));
  }

  const configPath = path.join(cmDir, CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, generateDefaultConfig());
  }

  // Add .cm to .gitignore if not already there
  const gitignorePath = path.join(projectPath, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    if (!content.includes('.cm/')) {
      fs.appendFileSync(gitignorePath, '\n# CodyMaster working memory\n.cm/\n');
    }
  }
}

// ─── Default State ──────────────────────────────────────────────────────────

function createDefaultState(projectName: string): ContinuityState {
  return {
    lastUpdated: new Date().toISOString(),
    currentPhase: 'idle',
    currentIteration: 0,
    project: projectName,
    activeGoal: '',
    currentTask: null,
    justCompleted: [],
    nextActions: [],
    activeBlockers: [],
    keyDecisions: [],
    learnings: [],
    workingContext: '',
    filesModified: [],
  };
}

function generateDefaultConfig(): string {
  return `# CodyMaster Working Memory Configuration
# Inspired by Loki Mode (autonomi.dev)

rarv:
  max_retries: 3              # Max retry per task before marking blocked
  pre_act_attention: true     # Enable goal alignment check before every action
  self_correction: true       # Enable self-correction loop on verify failure

memory:
  max_learnings: 50           # Max learnings to keep in CONTINUITY.md (rotate to learnings.json)
  max_just_completed: 5       # Max recent completions to show
  max_decisions: 20           # Max decisions before archiving

quality:
  velocity_quality_tracking: true  # Track warnings/complexity over time
  blind_review: false              # Enable blind code review (Phase 2)
  anti_sycophancy: false           # Enable anti-sycophancy check (Phase 2)
`;
}

// ─── CONTINUITY.md Read/Write ───────────────────────────────────────────────

export function readContinuityState(projectPath: string): ContinuityState | null {
  const filePath = path.join(getCmDir(projectPath), CONTINUITY_FILE);
  if (!fs.existsSync(filePath)) return null;

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return parseContinuityMd(content);
  } catch {
    return null;
  }
}

function parseContinuityMd(content: string): ContinuityState {
  const state = createDefaultState('');

  // Parse Last Updated
  const updatedMatch = content.match(/Last Updated:\s*(.+)/);
  if (updatedMatch) state.lastUpdated = updatedMatch[1].trim();

  // Parse Current Phase
  const phaseMatch = content.match(/Current Phase:\s*(.+)/);
  if (phaseMatch) state.currentPhase = phaseMatch[1].trim() as ContinuityState['currentPhase'];

  // Parse Current Iteration
  const iterMatch = content.match(/Current Iteration:\s*(\d+)/);
  if (iterMatch) state.currentIteration = parseInt(iterMatch[1]);

  // Parse Project
  const projMatch = content.match(/Project:\s*(.+)/);
  if (projMatch) state.project = projMatch[1].trim();

  // Parse Active Goal
  const goalSection = extractSection(content, 'Active Goal');
  if (goalSection) state.activeGoal = goalSection.trim();

  // Parse Just Completed
  const completedSection = extractSection(content, 'Just Completed');
  if (completedSection) {
    state.justCompleted = completedSection.split('\n')
      .map(l => l.replace(/^[-*]\s*/, '').trim())
      .filter(l => l.length > 0);
  }

  // Parse Next Actions
  const nextSection = extractSection(content, 'Next Actions');
  if (nextSection) {
    state.nextActions = nextSection.split('\n')
      .map(l => l.replace(/^\d+\.\s*/, '').trim())
      .filter(l => l.length > 0);
  }

  // Parse Active Blockers
  const blockersSection = extractSection(content, 'Active Blockers');
  if (blockersSection) {
    state.activeBlockers = blockersSection.split('\n')
      .map(l => l.replace(/^[-*]\s*/, '').trim())
      .filter(l => l.length > 0);
  }

  // Parse Working Context
  const contextSection = extractSection(content, 'Working Context');
  if (contextSection) state.workingContext = contextSection.trim();

  return state;
}

function extractSection(content: string, heading: string): string | null {
  const regex = new RegExp(`## ${heading}[^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

export function writeContinuityMd(projectPath: string, state: ContinuityState): void {
  const filePath = path.join(getCmDir(projectPath), CONTINUITY_FILE);
  state.lastUpdated = new Date().toISOString();

  const content = `# CodyMaster Working Memory
Last Updated: ${state.lastUpdated}
Current Phase: ${state.currentPhase}
Current Iteration: ${state.currentIteration}
Project: ${state.project}

## Active Goal
${state.activeGoal || '[No active goal set]'}

## Current Task
${state.currentTask
    ? `- ID: ${state.currentTask.id}\n- Title: ${state.currentTask.title}\n- Status: ${state.currentTask.status}\n- Skill: ${state.currentTask.skill}\n- Started: ${state.currentTask.started}`
    : '[No active task]'}

## Just Completed
${state.justCompleted.length > 0
    ? state.justCompleted.map(c => `- ${c}`).join('\n')
    : '- [Nothing yet]'}

## Next Actions (Priority Order)
${state.nextActions.length > 0
    ? state.nextActions.map((a, i) => `${i + 1}. ${a}`).join('\n')
    : '1. [No actions planned]'}

## Active Blockers
${state.activeBlockers.length > 0
    ? state.activeBlockers.map(b => `- ${b}`).join('\n')
    : '- [No blockers]'}

## Key Decisions This Session
${state.keyDecisions.length > 0
    ? state.keyDecisions.map(d => `- ${d.decision}: ${d.rationale} — ${d.timestamp}`).join('\n')
    : '- [No decisions recorded]'}

## Mistakes & Learnings
${state.learnings.length > 0
    ? state.learnings.map(l => `
### ${l.whatFailed}
- **What Failed:** ${l.whatFailed}
- **Why It Failed:** ${l.whyFailed}
- **How to Prevent:** ${l.howToPrevent}
- **Timestamp:** ${l.timestamp}
- **Agent:** ${l.agent}
- **Task:** ${l.taskId}
`).join('\n')
    : '[No learnings yet — this is good!]'}

## Working Context
${state.workingContext || '[No additional context]'}

## Files Currently Being Modified
${state.filesModified.length > 0
    ? state.filesModified.map(f => `- ${f.path}: ${f.change}`).join('\n')
    : '- [No files being modified]'}
`;

  fs.writeFileSync(filePath, content, 'utf-8');
}

// ─── Learnings Management ───────────────────────────────────────────────────

export function addLearning(projectPath: string, learning: Omit<Learning, 'id'>): Learning {
  const fullLearning: Learning = {
    ...learning,
    id: crypto.randomUUID(),
  };

  // Add to CONTINUITY.md
  const state = readContinuityState(projectPath);
  if (state) {
    state.learnings.push(fullLearning);
    // Keep max 10 in CONTINUITY.md (rotate old to learnings.json)
    if (state.learnings.length > 10) {
      const archived = state.learnings.splice(0, state.learnings.length - 10);
      archiveLearnings(projectPath, archived);
    }
    writeContinuityMd(projectPath, state);
  }

  // Also add to persistent learnings.json
  const learningsPath = path.join(getCmDir(projectPath), LEARNINGS_FILE);
  let learnings: Learning[] = [];
  try {
    learnings = JSON.parse(fs.readFileSync(learningsPath, 'utf-8'));
  } catch { /* empty */ }
  learnings.push(fullLearning);
  fs.writeFileSync(learningsPath, JSON.stringify(learnings, null, 2));

  return fullLearning;
}

function archiveLearnings(projectPath: string, learnings: Learning[]): void {
  const learningsPath = path.join(getCmDir(projectPath), LEARNINGS_FILE);
  let existing: Learning[] = [];
  try {
    existing = JSON.parse(fs.readFileSync(learningsPath, 'utf-8'));
  } catch { /* empty */ }
  existing.push(...learnings);
  // Keep max 200 archived learnings
  if (existing.length > 200) {
    existing = existing.slice(existing.length - 200);
  }
  fs.writeFileSync(learningsPath, JSON.stringify(existing, null, 2));
}

export function getLearnings(projectPath: string): Learning[] {
  const learningsPath = path.join(getCmDir(projectPath), LEARNINGS_FILE);
  try {
    return JSON.parse(fs.readFileSync(learningsPath, 'utf-8'));
  } catch {
    return [];
  }
}

export function deleteLearning(projectPath: string, learningId: string): boolean {
  const learningsPath = path.join(getCmDir(projectPath), LEARNINGS_FILE);
  try {
    const learnings: Learning[] = JSON.parse(fs.readFileSync(learningsPath, 'utf-8'));
    const idx = learnings.findIndex(l => l.id === learningId);
    if (idx === -1) return false;
    learnings.splice(idx, 1);
    fs.writeFileSync(learningsPath, JSON.stringify(learnings, null, 2));
    return true;
  } catch {
    return false;
  }
}

// ─── Decisions Management ───────────────────────────────────────────────────

export function addDecision(projectPath: string, decision: Omit<Decision, 'id'>): Decision {
  const fullDecision: Decision = {
    ...decision,
    id: crypto.randomUUID(),
  };

  const decisionsPath = path.join(getCmDir(projectPath), DECISIONS_FILE);
  let decisions: Decision[] = [];
  try {
    decisions = JSON.parse(fs.readFileSync(decisionsPath, 'utf-8'));
  } catch { /* empty */ }
  decisions.push(fullDecision);
  fs.writeFileSync(decisionsPath, JSON.stringify(decisions, null, 2));

  // Also update CONTINUITY.md
  const state = readContinuityState(projectPath);
  if (state) {
    state.keyDecisions.push(fullDecision);
    if (state.keyDecisions.length > 20) {
      state.keyDecisions = state.keyDecisions.slice(-20);
    }
    writeContinuityMd(projectPath, state);
  }

  return fullDecision;
}

export function getDecisions(projectPath: string): Decision[] {
  const decisionsPath = path.join(getCmDir(projectPath), DECISIONS_FILE);
  try {
    return JSON.parse(fs.readFileSync(decisionsPath, 'utf-8'));
  } catch {
    return [];
  }
}

export function deleteDecision(projectPath: string, decisionId: string): boolean {
  const decisionsPath = path.join(getCmDir(projectPath), DECISIONS_FILE);
  try {
    const decisions: Decision[] = JSON.parse(fs.readFileSync(decisionsPath, 'utf-8'));
    const idx = decisions.findIndex(d => d.id === decisionId);
    if (idx === -1) return false;
    decisions.splice(idx, 1);
    fs.writeFileSync(decisionsPath, JSON.stringify(decisions, null, 2));
    return true;
  } catch {
    return false;
  }
}

// ─── Status Summary ─────────────────────────────────────────────────────────

export interface ContinuitySummary {
  initialized: boolean;
  phase: string;
  iteration: number;
  project: string;
  activeGoal: string;
  currentTask: string | null;
  completedCount: number;
  blockerCount: number;
  learningCount: number;
  decisionCount: number;
  lastUpdated: string;
}

export function getContinuityStatus(projectPath: string): ContinuitySummary {
  const cmDir = getCmDir(projectPath);
  const initialized = fs.existsSync(path.join(cmDir, CONTINUITY_FILE));

  if (!initialized) {
    return {
      initialized: false,
      phase: 'not initialized',
      iteration: 0,
      project: path.basename(projectPath),
      activeGoal: '',
      currentTask: null,
      completedCount: 0,
      blockerCount: 0,
      learningCount: 0,
      decisionCount: 0,
      lastUpdated: '',
    };
  }

  const state = readContinuityState(projectPath);
  const learnings = getLearnings(projectPath);
  const decisions = getDecisions(projectPath);

  return {
    initialized: true,
    phase: state?.currentPhase || 'idle',
    iteration: state?.currentIteration || 0,
    project: state?.project || path.basename(projectPath),
    activeGoal: state?.activeGoal || '',
    currentTask: state?.currentTask?.title || null,
    completedCount: state?.justCompleted.length || 0,
    blockerCount: state?.activeBlockers.length || 0,
    learningCount: learnings.length,
    decisionCount: decisions.length,
    lastUpdated: state?.lastUpdated || '',
  };
}

// ─── Reset ──────────────────────────────────────────────────────────────────

export function resetContinuity(projectPath: string): void {
  const state = createDefaultState(path.basename(projectPath));
  writeContinuityMd(projectPath, state);
}

// ─── Has CM Directory ───────────────────────────────────────────────────────

export function hasCmDir(projectPath: string): boolean {
  return fs.existsSync(getCmDir(projectPath));
}
