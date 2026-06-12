import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// ─── Skill Integrity Guard ────────────────────────────────────────────────────
//
// Invariant: a skill folder named `X` MUST contain a SKILL.md whose frontmatter
// `name:` equals `X`. Violating this is how the f65126e "health monitoring
// evolutions" batch silently clobbered skills/cm-ux-master/SKILL.md with the body
// of cm-continuity — a full cross-skill content swap that no append-only path
// should ever produce.
//
// This module provides:
//   • safeWriteSkillMd()  — a write guard that REFUSES to persist content whose
//                           frontmatter name does not match the target folder,
//                           so a writer can never drop skill B's body into
//                           skill A's folder.
//   • scanSkillIntegrity() — a detector that flags name/folder mismatches,
//                            missing names, and byte-identical SKILL.md files
//                            (the duplicate-content signature of a clobber).

export class SkillIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SkillIntegrityError';
  }
}

/** Extract the `name:` value from a SKILL.md YAML frontmatter block. Returns null if absent. */
export function extractFrontmatterName(content: string): string | null {
  const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return null;
  const m = fm[1].match(/^name:\s*(.+?)\s*$/m);
  if (!m) return null;
  const value = m[1].replace(/^["']|["']$/g, '').trim();
  return value || null;
}

/** Return `content` with its frontmatter `name:` set to `newName` (adds frontmatter if missing). */
export function setFrontmatterName(content: string, newName: string): string {
  const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) {
    return `---\nname: ${newName}\n---\n\n${content}`;
  }
  let inner = fm[1];
  if (/^name:\s*.+$/m.test(inner)) {
    inner = inner.replace(/^name:\s*.+$/m, `name: ${newName}`);
  } else {
    inner = `name: ${newName}\n${inner}`;
  }
  const newBlock = `---\n${inner}\n---`;
  // Use a replacer function so `$` in newBlock is never treated as a backreference.
  return content.replace(fm[0], () => newBlock);
}

export interface SafeWriteOptions {
  /** Expected skill name. Defaults to the basename of the SKILL.md's parent folder. */
  expectedName?: string;
  /** If set, the existing file (if any) is copied here before being overwritten. */
  backupDir?: string;
}

export interface SafeWriteResult {
  backupPath?: string;
}

/**
 * Write a SKILL.md only if its frontmatter `name:` matches the target folder.
 * Throws SkillIntegrityError (and writes nothing) on mismatch or missing name.
 */
export function safeWriteSkillMd(
  skillMdPath: string,
  content: string,
  opts: SafeWriteOptions = {}
): SafeWriteResult {
  const folderName = path.basename(path.dirname(skillMdPath));
  const expected = opts.expectedName ?? folderName;
  const actual = extractFrontmatterName(content);

  if (!actual) {
    throw new SkillIntegrityError(
      `Refusing to write ${skillMdPath}: content has no frontmatter "name:" field.`
    );
  }
  if (actual !== expected) {
    throw new SkillIntegrityError(
      `Refusing to write ${skillMdPath}: frontmatter name "${actual}" does not match expected "${expected}". ` +
      `This guards against cross-skill clobbering (writing one skill's content into another's folder).`
    );
  }

  let backupPath: string | undefined;
  if (opts.backupDir && fs.existsSync(skillMdPath)) {
    fs.mkdirSync(opts.backupDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    backupPath = path.join(opts.backupDir, `${expected}-SKILL-${ts}.md`);
    fs.copyFileSync(skillMdPath, backupPath);
  }

  fs.mkdirSync(path.dirname(skillMdPath), { recursive: true });
  fs.writeFileSync(skillMdPath, content, 'utf-8');
  return { backupPath };
}

// ─── Repo-wide Integrity Scanner ──────────────────────────────────────────────

export type IntegrityIssueType =
  | 'name_mismatch'
  | 'missing_name'
  | 'duplicate_content';

export interface IntegrityIssue {
  type: IntegrityIssueType;
  folder: string;
  detail: string;
}

/**
 * Scan a skills/ directory for integrity violations.
 * Skips dotfolders and `_shared`-style underscore folders (not skills).
 */
export function scanSkillIntegrity(skillsDir: string): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  if (!fs.existsSync(skillsDir)) return issues;

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true }).filter(e => e.isDirectory());
  const byHash = new Map<string, string[]>();

  for (const e of entries) {
    const folder = e.name;
    if (folder.startsWith('.') || folder.startsWith('_')) continue;
    const skillMd = path.join(skillsDir, folder, 'SKILL.md');
    if (!fs.existsSync(skillMd)) continue; // not every subdir is a skill

    const content = fs.readFileSync(skillMd, 'utf-8');
    const name = extractFrontmatterName(content);

    if (!name) {
      issues.push({ type: 'missing_name', folder, detail: `${folder}/SKILL.md has no frontmatter "name:"` });
    } else if (name !== folder) {
      issues.push({ type: 'name_mismatch', folder, detail: `folder "${folder}" != frontmatter name "${name}"` });
    }

    const hash = crypto.createHash('sha256').update(content).digest('hex');
    const list = byHash.get(hash) ?? [];
    list.push(folder);
    byHash.set(hash, list);
  }

  for (const folders of byHash.values()) {
    if (folders.length > 1) {
      const sorted = [...folders].sort();
      for (const f of sorted) {
        issues.push({
          type: 'duplicate_content',
          folder: f,
          detail: `identical SKILL.md shared by: ${sorted.join(', ')}`,
        });
      }
    }
  }

  return issues;
}

export function formatIntegrityReport(issues: IntegrityIssue[]): string {
  if (issues.length === 0) {
    return '✅ Skill integrity: all skills pass (folder == frontmatter name, no duplicate bodies).';
  }
  const lines = [
    `❌ Skill integrity: ${issues.length} issue(s) found`,
    '─'.repeat(70),
  ];
  for (const issue of issues) {
    const icon =
      issue.type === 'name_mismatch' ? '🔀'
      : issue.type === 'missing_name' ? '∅'
      : '👯';
    lines.push(`${icon} [${issue.type}] ${issue.detail}`);
  }
  return lines.join('\n');
}
