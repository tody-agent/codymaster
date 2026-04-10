/**
 * Validate skill pack layout for future `cm install` / `cm distro` (ADR 003).
 */

import fs from 'fs';
import path from 'path';

export interface DistroValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

const META_KEYS = ['name', 'description'] as const;

export function validateSkillPackDir(dir: string): DistroValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const abs = path.resolve(dir);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    return { ok: false, errors: [`Not a directory: ${abs}`], warnings: [] };
  }

  const skillMd = path.join(abs, 'SKILL.md');
  const tmpl = path.join(abs, 'SKILL.md.tmpl');
  const metaPath = path.join(abs, 'meta.json');

  if (!fs.existsSync(skillMd) && !fs.existsSync(tmpl)) {
    errors.push('Missing SKILL.md or SKILL.md.tmpl');
  }

  if (fs.existsSync(metaPath)) {
    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch {
      errors.push('meta.json is not valid JSON');
      return { ok: errors.length === 0, errors, warnings };
    }
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      errors.push('meta.json must be a JSON object');
    } else {
      const o = raw as Record<string, unknown>;
      for (const k of META_KEYS) {
        if (typeof o[k] !== 'string' || !(o[k] as string).trim()) {
          errors.push(`meta.json missing or invalid string field: ${k}`);
        }
      }
    }
    if (fs.existsSync(tmpl) && !fs.existsSync(skillMd)) {
      warnings.push('SKILL.md.tmpl without generated SKILL.md — run npm run build:skills');
    }
  } else if (fs.existsSync(tmpl)) {
    warnings.push('SKILL.md.tmpl present but no meta.json (optional for local-only skills)');
  }

  return { ok: errors.length === 0, errors, warnings };
}
