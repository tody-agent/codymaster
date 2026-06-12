import fs from 'fs';
import path from 'path';
import { estimateTokens } from './token-budget';

export interface SkillTokenFileStat {
  path: string;
  bytes: number;
  lines: number;
  tokens: number;
}

export interface SkillTokenDelta {
  bytes: number;
  lines: number;
  tokens: number;
}

export interface SkillTokenBaselineReport {
  path: string;
  bytes: number;
  lines: number;
  tokens: number;
  delta_vs_progressive_min: SkillTokenDelta;
  delta_vs_progressive_max: SkillTokenDelta;
}

export interface SkillTokenReport {
  skill: string;
  project_path: string;
  skill_path: string;
  core: SkillTokenFileStat;
  references: SkillTokenFileStat[];
  progressive_min: SkillTokenFileStat;
  progressive_max: SkillTokenFileStat;
  baseline?: SkillTokenBaselineReport;
}

function fileStat(filePath: string): SkillTokenFileStat {
  const content = fs.readFileSync(filePath, 'utf-8');
  return {
    path: filePath,
    bytes: Buffer.byteLength(content, 'utf-8'),
    lines: content === '' ? 0 : content.split('\n').length,
    tokens: estimateTokens(content),
  };
}

function addStats(pathLabel: string, stats: SkillTokenFileStat[]): SkillTokenFileStat {
  return stats.reduce<SkillTokenFileStat>(
    (acc, stat) => ({
      path: pathLabel,
      bytes: acc.bytes + stat.bytes,
      lines: acc.lines + stat.lines,
      tokens: acc.tokens + stat.tokens,
    }),
    { path: pathLabel, bytes: 0, lines: 0, tokens: 0 }
  );
}

function delta(from: SkillTokenFileStat, to: SkillTokenFileStat): SkillTokenDelta {
  return {
    bytes: from.bytes - to.bytes,
    lines: from.lines - to.lines,
    tokens: from.tokens - to.tokens,
  };
}

export interface SkillTokenReportOptions {
  projectPath?: string;
  baselinePath?: string;
}

export function analyzeSkillTokenFootprint(
  skillName: string,
  opts: SkillTokenReportOptions = {}
): SkillTokenReport {
  const projectPath = path.resolve(opts.projectPath ?? process.cwd());
  const skillPath = path.join(projectPath, 'skills', skillName);
  const skillMdPath = path.join(skillPath, 'SKILL.md');

  if (!fs.existsSync(skillMdPath)) {
    throw new Error(`Skill "${skillName}" not found at ${skillMdPath}`);
  }

  const core = fileStat(skillMdPath);
  const referencesDir = path.join(skillPath, 'references');
  const references = fs.existsSync(referencesDir)
    ? fs.readdirSync(referencesDir, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => path.join(referencesDir, entry.name))
        .sort((a, b) => a.localeCompare(b))
        .map(fileStat)
    : [];

  const progressiveMin: SkillTokenFileStat = { ...core, path: 'progressive_min' };
  const progressiveMax = addStats('progressive_max', [core, ...references]);

  const report: SkillTokenReport = {
    skill: skillName,
    project_path: projectPath,
    skill_path: skillPath,
    core,
    references,
    progressive_min: progressiveMin,
    progressive_max: progressiveMax,
  };

  if (opts.baselinePath) {
    const baselinePath = path.resolve(projectPath, opts.baselinePath);
    if (!fs.existsSync(baselinePath)) {
      throw new Error(`Baseline file not found: ${baselinePath}`);
    }
    const baseline = fileStat(baselinePath);
    report.baseline = {
      path: baseline.path,
      bytes: baseline.bytes,
      lines: baseline.lines,
      tokens: baseline.tokens,
      delta_vs_progressive_min: delta(baseline, progressiveMin),
      delta_vs_progressive_max: delta(baseline, progressiveMax),
    };
  }

  return report;
}

export function formatSkillTokenReport(report: SkillTokenReport): string {
  const lines = [
    `Skill Token Report: ${report.skill}`,
    `Project: ${report.project_path}`,
    `Skill path: ${report.skill_path}`,
    '',
    `core: ${report.core.tokens} tok · ${report.core.lines} lines · ${report.core.bytes} bytes`,
    `progressive_min: ${report.progressive_min.tokens} tok · ${report.progressive_min.lines} lines · ${report.progressive_min.bytes} bytes`,
    `progressive_max: ${report.progressive_max.tokens} tok · ${report.progressive_max.lines} lines · ${report.progressive_max.bytes} bytes`,
    `references: ${report.references.length}`,
  ];

  if (report.references.length > 0) {
    lines.push('');
    lines.push('Reference files:');
    for (const ref of report.references) {
      lines.push(`- ${path.basename(ref.path)}: ${ref.tokens} tok · ${ref.lines} lines · ${ref.bytes} bytes`);
    }
  }

  if (report.baseline) {
    lines.push('');
    lines.push(`baseline: ${report.baseline.tokens} tok · ${report.baseline.lines} lines · ${report.baseline.bytes} bytes`);
    lines.push(
      `baseline delta vs progressive_min: ${report.baseline.delta_vs_progressive_min.tokens} tok · ${report.baseline.delta_vs_progressive_min.lines} lines · ${report.baseline.delta_vs_progressive_min.bytes} bytes`
    );
    lines.push(
      `baseline delta vs progressive_max: ${report.baseline.delta_vs_progressive_max.tokens} tok · ${report.baseline.delta_vs_progressive_max.lines} lines · ${report.baseline.delta_vs_progressive_max.bytes} bytes`
    );
  }

  return lines.join('\n');
}
