import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getBackend, type StorageBackend, type DbExecutionAnalysis, type DbEvolutionRecommendation, type DbSkillMetric } from './storage-backend';
import { qualityWeight } from './execution-analyzer';
import type { AdvisoryHandoff } from './advisory-handoff';

// ─── Types ──────────────────────────────────────────────────────────────────

export type EvolutionMode = 'FIX' | 'DERIVED' | 'CAPTURED';

export interface SkillRecord {
  id: string;
  skill_name: string;
  origin: 'manual' | 'fix' | 'derived' | 'captured';
  parent_skill?: string;
  generation: number;
  version: string;
  created_at: string;
  updated_at: string;
  evolution_count: number;
  last_evolution_mode?: EvolutionMode;
  notes?: string;
}

export interface EvolutionResult {
  success: boolean;
  mode: EvolutionMode;
  skill: string;
  backupPath?: string;
  patchApplied?: string;
  error?: string;
}

export interface EvolutionHistory {
  id: string;
  skill_name: string;
  mode: EvolutionMode;
  source_analysis_id?: string;
  before_hash: string;
  after_hash: string;
  patch_summary: string;
  confidence: number;
  created_at: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const BACKUP_DIR = '.cm/skill-backups';
const MAX_EVOLUTION_DEPTH = 5;   // Anti-loop: max generations
const MIN_FIX_CONFIDENCE = 0.70;
const MIN_DERIVED_CONFIDENCE = 0.75;
const MIN_CAPTURED_CONFIDENCE = 0.80;

// ─── Skill Evolver ──────────────────────────────────────────────────────────
// TRIZ #15 Dynamization — skills transform based on environment feedback

/**
 * SkillEvolver — Executes evolution actions recommended by the ExecutionAnalyzer.
 *
 * Three modes:
 *   FIX     — In-place repair of degraded skills (patch SKILL.md)
 *   DERIVED — Create specialized variant of an existing skill
 *   CAPTURED — Generate a new skill from successful reasoning patterns
 *
 * Safety: Always creates backups before mutations. Anti-loop protection
 * prevents runaway evolution chains.
 */
export class SkillEvolver {
  private readonly backend: StorageBackend;
  private readonly projectPath: string;
  private readonly skillsDir: string;
  private readonly backupDir: string;

  constructor(projectPath: string, backend?: StorageBackend) {
    this.projectPath = projectPath;
    this.backend = backend ?? getBackend(projectPath);
    this.backend.initialize();
    this.skillsDir = this.findSkillsDir();
    this.backupDir = path.join(projectPath, BACKUP_DIR);
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /**
   * Evolve a skill based on an advisory handoff.
   */
  evolveFromAdvisory(handoff: AdvisoryHandoff): EvolutionResult {
    const mode = handoff.recommendation.action as EvolutionMode;
    const skill = handoff.skill.name;
    const confidence = handoff.recommendation.confidence ?? 0;

    if (!skill) {
      return { success: false, mode: mode ?? 'FIX', skill: '', error: 'No target skill in advisory handoff.' };
    }

    if (!mode || mode === ('NONE' as string)) {
      return { success: false, mode: 'FIX', skill, error: 'No evolution action recommended.' };
    }

    return this.evolve(mode, skill, confidence, handoff.source.analysis_id);
  }

  /**
   * Execute a specific evolution mode on a skill.
   */
  evolve(mode: EvolutionMode, skill: string, confidence: number, sourceAnalysisId?: string): EvolutionResult {
    // Anti-loop protection
    const record = this.getSkillRecord(skill);
    if (record && record.generation >= MAX_EVOLUTION_DEPTH) {
      return {
        success: false, mode, skill,
        error: `Anti-loop: ${skill} has reached max evolution depth (${MAX_EVOLUTION_DEPTH}). Manual review required.`,
      };
    }

    // Confidence threshold check
    const minConfidence = this.getMinConfidence(mode);
    if (confidence < minConfidence) {
      return {
        success: false, mode, skill,
        error: `Confidence ${(confidence * 100).toFixed(0)}% is below ${mode} threshold of ${(minConfidence * 100).toFixed(0)}%.`,
      };
    }

    switch (mode) {
      case 'FIX':
        return this.executeFix(skill, confidence, sourceAnalysisId);
      case 'DERIVED':
        return this.executeDerived(skill, confidence, sourceAnalysisId);
      case 'CAPTURED':
        return this.executeCaptured(skill, confidence, sourceAnalysisId);
    }
  }

  /**
   * Get evolution history for a skill.
   */
  getHistory(skill?: string, limit = 20): EvolutionHistory[] {
    return this.loadHistory(skill, limit);
  }

  /**
   * Get the skill record (lineage tracking).
   */
  getSkillRecord(skill: string): SkillRecord | null {
    return this.loadSkillRecord(skill);
  }

  /**
   * List all skill records.
   */
  listSkillRecords(limit = 50): SkillRecord[] {
    return this.loadAllSkillRecords(limit);
  }

  /**
   * Rollback a skill to its pre-evolution state.
   */
  rollback(skill: string): EvolutionResult {
    const backupPath = this.getLatestBackup(skill);
    if (!backupPath) {
      return { success: false, mode: 'FIX', skill, error: `No backup found for ${skill}.` };
    }

    const skillMdPath = this.getSkillPath(skill);
    if (!skillMdPath) {
      return { success: false, mode: 'FIX', skill, error: `Skill ${skill} not found.` };
    }

    try {
      const backupContent = fs.readFileSync(backupPath, 'utf-8');
      fs.writeFileSync(skillMdPath, backupContent, 'utf-8');
      return { success: true, mode: 'FIX', skill, backupPath, patchApplied: 'Rolled back to backup.' };
    } catch (err) {
      return { success: false, mode: 'FIX', skill, error: `Rollback failed: ${err}` };
    }
  }

  // ─── Evolution Modes ──────────────────────────────────────────────────────

  /**
   * FIX mode — In-place repair of a degraded skill.
   * Appends learnings from failed executions to the skill's SKILL.md.
   */
  private executeFix(skill: string, confidence: number, sourceAnalysisId?: string): EvolutionResult {
    const skillPath = this.getSkillPath(skill);
    if (!skillPath) {
      return { success: false, mode: 'FIX', skill, error: `Skill ${skill} not found at expected path.` };
    }

    // Read current content
    let content: string;
    try {
      content = fs.readFileSync(skillPath, 'utf-8');
    } catch {
      return { success: false, mode: 'FIX', skill, error: `Cannot read ${skillPath}` };
    }

    // Create backup before mutation
    const backupPath = this.createBackup(skill, content);

    // Build the fix patch from execution analysis
    const analyses = this.backend.getExecutionAnalyses(10);
    const relevantAnalysis = sourceAnalysisId
      ? analyses.find(a => a.id === sourceAnalysisId)
      : analyses.find(a => a.recommended_action === 'FIX' && a.skill_judgments.some(j => j.skill === skill));

    if (!relevantAnalysis) {
      return { success: false, mode: 'FIX', skill, backupPath, error: 'No relevant analysis found for fix.' };
    }

    const fixPatch = this.buildFixPatch(skill, relevantAnalysis);
    const beforeHash = this.hashContent(content);

    // Apply the fix (append learnings section)
    const updatedContent = content + '\n' + fixPatch;
    fs.writeFileSync(skillPath, updatedContent, 'utf-8');

    const afterHash = this.hashContent(updatedContent);

    // Record evolution
    this.recordEvolution(skill, 'FIX', sourceAnalysisId, beforeHash, afterHash, fixPatch, confidence);
    this.upsertSkillRecord(skill, 'fix');

    return { success: true, mode: 'FIX', skill, backupPath, patchApplied: fixPatch };
  }

  /**
   * DERIVED mode — Create a specialized variant of an existing skill.
   * Copies the skill and adds specialization notes.
   */
  private executeDerived(skill: string, confidence: number, sourceAnalysisId?: string): EvolutionResult {
    const skillPath = this.getSkillPath(skill);
    if (!skillPath) {
      return { success: false, mode: 'DERIVED', skill, error: `Parent skill ${skill} not found.` };
    }

    let content: string;
    try {
      content = fs.readFileSync(skillPath, 'utf-8');
    } catch {
      return { success: false, mode: 'DERIVED', skill, error: `Cannot read ${skillPath}` };
    }

    // Generate derived skill name
    const record = this.getSkillRecord(skill);
    const gen = (record?.generation ?? 0) + 1;
    const derivedName = `${skill}-v${gen}`;
    const derivedDir = path.join(this.skillsDir, derivedName);

    if (fs.existsSync(derivedDir)) {
      return { success: false, mode: 'DERIVED', skill, error: `Derived skill ${derivedName} already exists.` };
    }

    // Get specialization context from analysis
    const analyses = this.backend.getExecutionAnalyses(10);
    const analysis = sourceAnalysisId
      ? analyses.find(a => a.id === sourceAnalysisId)
      : analyses.find(a => a.recommended_action === 'DERIVED');

    const specialization = analysis
      ? `\n\n## Derived Specialization (gen ${gen})\n\n> Auto-derived from ${skill} based on execution analysis.\n> Analysis: ${analysis.summary}\n> Fallback patterns addressed: ${analysis.skill_judgments.filter(j => j.fallback_used).map(j => j.note || j.skill).join(', ') || 'N/A'}\n`
      : `\n\n## Derived Specialization (gen ${gen})\n\n> Auto-derived from ${skill}.\n`;

    const derivedContent = content + specialization;
    const beforeHash = this.hashContent(content);
    const afterHash = this.hashContent(derivedContent);

    // Create derived skill directory and file
    fs.mkdirSync(derivedDir, { recursive: true });
    fs.writeFileSync(path.join(derivedDir, 'SKILL.md'), derivedContent, 'utf-8');

    // Record evolution
    this.recordEvolution(derivedName, 'DERIVED', sourceAnalysisId, beforeHash, afterHash,
      `Derived from ${skill} (gen ${gen})`, confidence);
    this.upsertSkillRecord(derivedName, 'derived', skill, gen);

    return { success: true, mode: 'DERIVED', skill: derivedName, patchApplied: `Derived from ${skill}` };
  }

  /**
   * CAPTURED mode — Generate a new skill from successful reasoning patterns.
   * Creates a minimal SKILL.md scaffold capturing the successful approach.
   */
  private executeCaptured(skill: string, confidence: number, sourceAnalysisId?: string): EvolutionResult {
    const analyses = this.backend.getExecutionAnalyses(10);
    const analysis = sourceAnalysisId
      ? analyses.find(a => a.id === sourceAnalysisId)
      : analyses.find(a => a.recommended_action === 'CAPTURED');

    if (!analysis) {
      return { success: false, mode: 'CAPTURED', skill, error: 'No analysis with CAPTURED recommendation found.' };
    }

    const capturedName = `cm-captured-${Date.now()}`;
    const capturedDir = path.join(this.skillsDir, capturedName);

    const skillContent = [
      '---',
      `name: ${capturedName}`,
      `description: Auto-captured skill from successful task execution`,
      '---',
      '',
      `# ${capturedName}`,
      '',
      `> Auto-captured on ${new Date().toISOString()}`,
      `> Source: ${analysis.task_title}`,
      `> Confidence: ${(confidence * 100).toFixed(0)}%`,
      '',
      '## Context',
      '',
      analysis.summary,
      '',
      '## Approach',
      '',
      `The following skill chain was NOT used but the task completed successfully:`,
      `- Selected skills: ${(analysis.selected_skills ?? []).join(', ') || 'none'}`,
      '',
      '## When to Apply',
      '',
      `Apply this skill when facing tasks similar to: "${analysis.task_title}"`,
      '',
      '## Steps',
      '',
      '1. [TODO: Extract specific steps from the captured pattern]',
      '2. [TODO: Document the reasoning that led to success]',
      '',
    ].join('\n');

    const afterHash = this.hashContent(skillContent);

    fs.mkdirSync(capturedDir, { recursive: true });
    fs.writeFileSync(path.join(capturedDir, 'SKILL.md'), skillContent, 'utf-8');

    this.recordEvolution(capturedName, 'CAPTURED', sourceAnalysisId, '', afterHash,
      `Captured from: ${analysis.task_title}`, confidence);
    this.upsertSkillRecord(capturedName, 'captured', undefined, 0);

    return { success: true, mode: 'CAPTURED', skill: capturedName, patchApplied: `Captured from task: ${analysis.task_title}` };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private findSkillsDir(): string {
    // Check common skill locations
    const candidates = [
      path.join(this.projectPath, 'skills'),
      path.join(this.projectPath, '.agent', 'skills'),
    ];
    for (const dir of candidates) {
      if (fs.existsSync(dir)) return dir;
    }
    // Default to skills/ (will be created if needed)
    return path.join(this.projectPath, 'skills');
  }

  private getSkillPath(skill: string): string | null {
    const candidates = [
      path.join(this.skillsDir, skill, 'SKILL.md'),
      path.join(this.projectPath, '.agent', 'skills', skill, 'SKILL.md'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  private createBackup(skill: string, content: string): string {
    const backupSkillDir = path.join(this.backupDir, skill);
    fs.mkdirSync(backupSkillDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupSkillDir, `SKILL-${timestamp}.md`);
    fs.writeFileSync(backupPath, content, 'utf-8');
    return backupPath;
  }

  private getLatestBackup(skill: string): string | null {
    const backupSkillDir = path.join(this.backupDir, skill);
    if (!fs.existsSync(backupSkillDir)) return null;
    const files = fs.readdirSync(backupSkillDir)
      .filter(f => f.startsWith('SKILL-') && f.endsWith('.md'))
      .sort()
      .reverse();
    return files.length > 0 ? path.join(backupSkillDir, files[0]) : null;
  }

  private buildFixPatch(skill: string, analysis: DbExecutionAnalysis): string {
    const judgment = analysis.skill_judgments.find(j => j.skill === skill);
    const lines = [
      '',
      `## Evolution Fix (${new Date().toISOString().split('T')[0]})`,
      '',
      `> Auto-applied by SkillEvolver based on execution analysis.`,
      `> Analysis: ${analysis.id.slice(0, 8)}`,
      `> Task: ${analysis.task_title}`,
      `> Status: ${analysis.status}`,
    ];

    if (judgment?.note) {
      lines.push(`> Note: ${judgment.note}`);
    }

    if (analysis.retro_summary) {
      lines.push('', '### Learnings Applied', '', analysis.retro_summary);
    }

    lines.push('', `### Corrective Action`, '', `- Review and address the failure pattern from: "${analysis.task_title}"`);

    return lines.join('\n');
  }

  private hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  }

  private getMinConfidence(mode: EvolutionMode): number {
    switch (mode) {
      case 'FIX': return MIN_FIX_CONFIDENCE;
      case 'DERIVED': return MIN_DERIVED_CONFIDENCE;
      case 'CAPTURED': return MIN_CAPTURED_CONFIDENCE;
    }
  }

  // ─── Persistence (file-based for simplicity, can migrate to SQLite later) ─

  private recordEvolution(
    skill: string, mode: EvolutionMode, sourceAnalysisId: string | undefined,
    beforeHash: string, afterHash: string, patchSummary: string, confidence: number
  ): void {
    const historyDir = path.join(this.projectPath, '.cm', 'evolution');
    fs.mkdirSync(historyDir, { recursive: true });
    const entry: EvolutionHistory = {
      id: crypto.randomUUID(),
      skill_name: skill,
      mode,
      source_analysis_id: sourceAnalysisId,
      before_hash: beforeHash,
      after_hash: afterHash,
      patch_summary: patchSummary,
      confidence,
      created_at: new Date().toISOString(),
    };
    const historyFile = path.join(historyDir, 'history.jsonl');
    fs.appendFileSync(historyFile, JSON.stringify(entry) + '\n');
  }

  private loadHistory(skill?: string, limit = 20): EvolutionHistory[] {
    const historyFile = path.join(this.projectPath, '.cm', 'evolution', 'history.jsonl');
    if (!fs.existsSync(historyFile)) return [];
    const lines = fs.readFileSync(historyFile, 'utf-8').trim().split('\n').filter(Boolean);
    let entries: EvolutionHistory[] = [];
    for (const line of lines) {
      try { entries.push(JSON.parse(line)); } catch { /* skip malformed */ }
    }
    if (skill) entries = entries.filter(e => e.skill_name === skill);
    return entries.slice(-limit).reverse();
  }

  private upsertSkillRecord(
    skill: string, origin: SkillRecord['origin'],
    parentSkill?: string, generation?: number
  ): void {
    const recordsDir = path.join(this.projectPath, '.cm', 'evolution');
    fs.mkdirSync(recordsDir, { recursive: true });
    const recordsFile = path.join(recordsDir, 'records.json');

    let records: Record<string, SkillRecord> = {};
    if (fs.existsSync(recordsFile)) {
      try { records = JSON.parse(fs.readFileSync(recordsFile, 'utf-8')); } catch { /* fresh */ }
    }

    const existing = records[skill];
    const now = new Date().toISOString();

    records[skill] = {
      id: existing?.id ?? crypto.randomUUID(),
      skill_name: skill,
      origin: existing?.origin ?? origin,
      parent_skill: parentSkill ?? existing?.parent_skill,
      generation: generation ?? (existing?.generation ?? 0),
      version: `${(existing?.evolution_count ?? 0) + 1}.0.0`,
      created_at: existing?.created_at ?? now,
      updated_at: now,
      evolution_count: (existing?.evolution_count ?? 0) + 1,
      last_evolution_mode: origin.toUpperCase() as EvolutionMode,
    };

    fs.writeFileSync(recordsFile, JSON.stringify(records, null, 2));
  }

  private loadSkillRecord(skill: string): SkillRecord | null {
    const recordsFile = path.join(this.projectPath, '.cm', 'evolution', 'records.json');
    if (!fs.existsSync(recordsFile)) return null;
    try {
      const records = JSON.parse(fs.readFileSync(recordsFile, 'utf-8'));
      return records[skill] ?? null;
    } catch { return null; }
  }

  private loadAllSkillRecords(limit: number): SkillRecord[] {
    const recordsFile = path.join(this.projectPath, '.cm', 'evolution', 'records.json');
    if (!fs.existsSync(recordsFile)) return [];
    try {
      const records = JSON.parse(fs.readFileSync(recordsFile, 'utf-8'));
      return Object.values(records as Record<string, SkillRecord>).slice(0, limit);
    } catch { return []; }
  }
}

// ─── Display Helpers ─────────────────────────────────────────────────────────

export function formatEvolutionResult(result: EvolutionResult): string {
  const icon = result.success ? '✅' : '❌';
  const lines = [
    `${icon} Skill Evolution — ${result.mode}`,
    '─'.repeat(50),
    `Skill:   ${result.skill}`,
    `Result:  ${result.success ? 'Success' : 'Failed'}`,
  ];

  if (result.backupPath) lines.push(`Backup:  ${result.backupPath}`);
  if (result.patchApplied) lines.push(`Patch:   ${result.patchApplied.split('\n')[0]}...`);
  if (result.error) lines.push(`Error:   ${result.error}`);

  return lines.join('\n');
}

export function formatEvolutionHistory(history: EvolutionHistory[]): string {
  if (history.length === 0) return 'No evolution history recorded.';
  const lines = [
    '🧬 Evolution History',
    '─'.repeat(70),
    `${'Date'.padEnd(12)} ${'Skill'.padEnd(25)} ${'Mode'.padEnd(10)} ${'Conf'.padEnd(6)} Summary`,
    '─'.repeat(70),
  ];
  for (const entry of history) {
    const date = entry.created_at.split('T')[0];
    const conf = (entry.confidence * 100).toFixed(0) + '%';
    const summary = entry.patch_summary.split('\n')[0].slice(0, 30);
    lines.push(`${date.padEnd(12)} ${entry.skill_name.padEnd(25)} ${entry.mode.padEnd(10)} ${conf.padEnd(6)} ${summary}`);
  }
  return lines.join('\n');
}
