"use strict";
/**
 * Validate skill pack layout for future `cm install` / `cm distro` (ADR 003).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSkillPackDir = validateSkillPackDir;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const META_KEYS = ['name', 'description'];
function validateSkillPackDir(dir) {
    const errors = [];
    const warnings = [];
    const abs = path_1.default.resolve(dir);
    if (!fs_1.default.existsSync(abs) || !fs_1.default.statSync(abs).isDirectory()) {
        return { ok: false, errors: [`Not a directory: ${abs}`], warnings: [] };
    }
    const skillMd = path_1.default.join(abs, 'SKILL.md');
    const tmpl = path_1.default.join(abs, 'SKILL.md.tmpl');
    const metaPath = path_1.default.join(abs, 'meta.json');
    if (!fs_1.default.existsSync(skillMd) && !fs_1.default.existsSync(tmpl)) {
        errors.push('Missing SKILL.md or SKILL.md.tmpl');
    }
    if (fs_1.default.existsSync(metaPath)) {
        let raw;
        try {
            raw = JSON.parse(fs_1.default.readFileSync(metaPath, 'utf8'));
        }
        catch (_a) {
            errors.push('meta.json is not valid JSON');
            return { ok: errors.length === 0, errors, warnings };
        }
        if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
            errors.push('meta.json must be a JSON object');
        }
        else {
            const o = raw;
            for (const k of META_KEYS) {
                if (typeof o[k] !== 'string' || !o[k].trim()) {
                    errors.push(`meta.json missing or invalid string field: ${k}`);
                }
            }
        }
        if (fs_1.default.existsSync(tmpl) && !fs_1.default.existsSync(skillMd)) {
            warnings.push('SKILL.md.tmpl without generated SKILL.md — run npm run build:skills');
        }
    }
    else if (fs_1.default.existsSync(tmpl)) {
        warnings.push('SKILL.md.tmpl present but no meta.json (optional for local-only skills)');
    }
    return { ok: errors.length === 0, errors, warnings };
}
