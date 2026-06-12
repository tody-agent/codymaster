"use strict";
/**
 * Skills-Lock — record canonical hashes for every active skill.
 *
 * Stored as `skills-lock.json` at the package root. Each entry records the
 * version (frontmatter), a sha256 of the SKILL.md content, and a generated
 * timestamp. The postinstall verifier compares the current SKILL.md hashes
 * against the lock and warns on drift.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSkillsLock = buildSkillsLock;
exports.writeSkillsLock = writeSkillsLock;
exports.verifySkillsLock = verifySkillsLock;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
function sha256OfFile(file) {
    const buf = fs_1.default.readFileSync(file);
    return crypto_1.default.createHash('sha256').update(buf).digest('hex');
}
function parseFrontmatter(text) {
    const m = text.match(/^---\n([\s\S]*?)\n---/);
    if (!m)
        return {};
    const out = {};
    const v = m[1].match(/^version:\s*['"]?([\w.\-+]+)['"]?\s*$/m);
    if (v)
        out.version = v[1];
    const d = m[1].match(/^deprecated:\s*(true|false)\s*$/m);
    if (d)
        out.deprecated = d[1] === 'true';
    return out;
}
function buildSkillsLock(packageRoot) {
    const skillsDir = path_1.default.join(packageRoot, 'skills');
    const skills = {};
    if (fs_1.default.existsSync(skillsDir)) {
        for (const entry of fs_1.default.readdirSync(skillsDir, { withFileTypes: true })) {
            if (!entry.isDirectory() || !entry.name.startsWith('cm-'))
                continue;
            const skillFile = path_1.default.join(skillsDir, entry.name, 'SKILL.md');
            if (!fs_1.default.existsSync(skillFile))
                continue;
            const text = fs_1.default.readFileSync(skillFile, 'utf8');
            const fm = parseFrontmatter(text);
            skills[entry.name] = Object.assign(Object.assign({ sha256: sha256OfFile(skillFile) }, (fm.version ? { version: fm.version } : {})), (fm.deprecated ? { deprecated: true } : {}));
        }
    }
    return {
        version: 2,
        generated_at: new Date().toISOString(),
        skills,
    };
}
function writeSkillsLock(packageRoot) {
    const lock = buildSkillsLock(packageRoot);
    const file = path_1.default.join(packageRoot, 'skills-lock.json');
    fs_1.default.writeFileSync(file, JSON.stringify(lock, null, 2) + '\n', 'utf8');
    return file;
}
function verifySkillsLock(packageRoot) {
    var _a, _b;
    const lockPath = path_1.default.join(packageRoot, 'skills-lock.json');
    const result = { ok: true, missing: [], drifted: [], unlocked: [] };
    if (!fs_1.default.existsSync(lockPath)) {
        result.ok = false;
        return result;
    }
    let lock;
    try {
        lock = JSON.parse(fs_1.default.readFileSync(lockPath, 'utf8'));
    }
    catch (_c) {
        result.ok = false;
        return result;
    }
    const current = buildSkillsLock(packageRoot);
    for (const [name, entry] of Object.entries((_a = lock.skills) !== null && _a !== void 0 ? _a : {})) {
        const cur = current.skills[name];
        if (!cur) {
            result.missing.push(name);
            continue;
        }
        if (cur.sha256 !== entry.sha256)
            result.drifted.push(name);
    }
    for (const name of Object.keys(current.skills)) {
        if (!((_b = lock.skills) !== null && _b !== void 0 ? _b : {})[name])
            result.unlocked.push(name);
    }
    result.ok = result.missing.length === 0 && result.drifted.length === 0;
    return result;
}
