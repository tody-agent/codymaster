"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.copySkills = copySkills;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const paths_1 = require("./paths");
const profiles_1 = require("./profiles");
/**
 * Copy skills to a target directory according to profile + format.
 * Mirrors install.sh `install_skills_to()` behavior.
 *
 *  raw  → cp -r skills/cm-foo/  →  <target>/cm-foo/
 *  md   → cp    SKILL.md         →  <target>/cm-foo.md
 *  mdc  → wrap with frontmatter  →  <target>/cm-foo.mdc   (Cursor format)
 */
function copySkills(target, format, opts) {
    const root = (0, paths_1.findCmRoot)();
    const allow = (0, profiles_1.loadProfileAllowlist)(opts.profile, root);
    const allSkills = (0, profiles_1.listAllSkills)(root);
    const installed = [];
    const skipped = [];
    if (!opts.dryRun)
        fs.mkdirSync(target, { recursive: true });
    for (const skillName of allSkills) {
        if (allow && !allow.includes(skillName)) {
            skipped.push(skillName);
            continue;
        }
        const skillDir = path.join(root, 'skills', skillName);
        const skillMd = path.join(skillDir, 'SKILL.md');
        if (!fs.existsSync(skillMd)) {
            skipped.push(skillName);
            continue;
        }
        if (opts.dryRun) {
            installed.push(skillName);
            continue;
        }
        if (format === 'mdc') {
            const out = path.join(target, `${skillName}.mdc`);
            const body = fs.readFileSync(skillMd, 'utf-8');
            const fm = `---\ndescription: ${skillName}\nglobs: *\n---\n`;
            fs.writeFileSync(out, fm + body);
        }
        else if (format === 'md') {
            fs.copyFileSync(skillMd, path.join(target, `${skillName}.md`));
        }
        else {
            copyDirRecursive(skillDir, path.join(target, skillName));
        }
        installed.push(skillName);
    }
    return { installed, skipped };
}
function copyDirRecursive(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const s = path.join(src, entry.name);
        const d = path.join(dest, entry.name);
        if (entry.isDirectory())
            copyDirRecursive(s, d);
        else if (entry.isFile())
            fs.copyFileSync(s, d);
    }
}
