"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillIntegrityError = void 0;
exports.extractFrontmatterName = extractFrontmatterName;
exports.setFrontmatterName = setFrontmatterName;
exports.safeWriteSkillMd = safeWriteSkillMd;
exports.scanSkillIntegrity = scanSkillIntegrity;
exports.formatIntegrityReport = formatIntegrityReport;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
class SkillIntegrityError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SkillIntegrityError';
    }
}
exports.SkillIntegrityError = SkillIntegrityError;
/** Extract the `name:` value from a SKILL.md YAML frontmatter block. Returns null if absent. */
function extractFrontmatterName(content) {
    const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm)
        return null;
    const m = fm[1].match(/^name:\s*(.+?)\s*$/m);
    if (!m)
        return null;
    const value = m[1].replace(/^["']|["']$/g, '').trim();
    return value || null;
}
/** Return `content` with its frontmatter `name:` set to `newName` (adds frontmatter if missing). */
function setFrontmatterName(content, newName) {
    const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) {
        return `---\nname: ${newName}\n---\n\n${content}`;
    }
    let inner = fm[1];
    if (/^name:\s*.+$/m.test(inner)) {
        inner = inner.replace(/^name:\s*.+$/m, `name: ${newName}`);
    }
    else {
        inner = `name: ${newName}\n${inner}`;
    }
    const newBlock = `---\n${inner}\n---`;
    // Use a replacer function so `$` in newBlock is never treated as a backreference.
    return content.replace(fm[0], () => newBlock);
}
/**
 * Write a SKILL.md only if its frontmatter `name:` matches the target folder.
 * Throws SkillIntegrityError (and writes nothing) on mismatch or missing name.
 */
function safeWriteSkillMd(skillMdPath, content, opts = {}) {
    var _a;
    const folderName = path_1.default.basename(path_1.default.dirname(skillMdPath));
    const expected = (_a = opts.expectedName) !== null && _a !== void 0 ? _a : folderName;
    const actual = extractFrontmatterName(content);
    if (!actual) {
        throw new SkillIntegrityError(`Refusing to write ${skillMdPath}: content has no frontmatter "name:" field.`);
    }
    if (actual !== expected) {
        throw new SkillIntegrityError(`Refusing to write ${skillMdPath}: frontmatter name "${actual}" does not match expected "${expected}". ` +
            `This guards against cross-skill clobbering (writing one skill's content into another's folder).`);
    }
    let backupPath;
    if (opts.backupDir && fs_1.default.existsSync(skillMdPath)) {
        fs_1.default.mkdirSync(opts.backupDir, { recursive: true });
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        backupPath = path_1.default.join(opts.backupDir, `${expected}-SKILL-${ts}.md`);
        fs_1.default.copyFileSync(skillMdPath, backupPath);
    }
    fs_1.default.mkdirSync(path_1.default.dirname(skillMdPath), { recursive: true });
    fs_1.default.writeFileSync(skillMdPath, content, 'utf-8');
    return { backupPath };
}
/**
 * Scan a skills/ directory for integrity violations.
 * Skips dotfolders and `_shared`-style underscore folders (not skills).
 */
function scanSkillIntegrity(skillsDir) {
    var _a;
    const issues = [];
    if (!fs_1.default.existsSync(skillsDir))
        return issues;
    const entries = fs_1.default.readdirSync(skillsDir, { withFileTypes: true }).filter(e => e.isDirectory());
    const byHash = new Map();
    for (const e of entries) {
        const folder = e.name;
        if (folder.startsWith('.') || folder.startsWith('_'))
            continue;
        const skillMd = path_1.default.join(skillsDir, folder, 'SKILL.md');
        if (!fs_1.default.existsSync(skillMd))
            continue; // not every subdir is a skill
        const content = fs_1.default.readFileSync(skillMd, 'utf-8');
        const name = extractFrontmatterName(content);
        if (!name) {
            issues.push({ type: 'missing_name', folder, detail: `${folder}/SKILL.md has no frontmatter "name:"` });
        }
        else if (name !== folder) {
            issues.push({ type: 'name_mismatch', folder, detail: `folder "${folder}" != frontmatter name "${name}"` });
        }
        const hash = crypto_1.default.createHash('sha256').update(content).digest('hex');
        const list = (_a = byHash.get(hash)) !== null && _a !== void 0 ? _a : [];
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
function formatIntegrityReport(issues) {
    if (issues.length === 0) {
        return '✅ Skill integrity: all skills pass (folder == frontmatter name, no duplicate bodies).';
    }
    const lines = [
        `❌ Skill integrity: ${issues.length} issue(s) found`,
        '─'.repeat(70),
    ];
    for (const issue of issues) {
        const icon = issue.type === 'name_mismatch' ? '🔀'
            : issue.type === 'missing_name' ? '∅'
                : '👯';
        lines.push(`${icon} [${issue.type}] ${issue.detail}`);
    }
    return lines.join('\n');
}
