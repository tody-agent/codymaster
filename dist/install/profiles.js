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
exports.isValidProfile = isValidProfile;
exports.loadProfileAllowlist = loadProfileAllowlist;
exports.listAllSkills = listAllSkills;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const paths_1 = require("./paths");
const VALID_PROFILES = ['core', 'growth', 'design', 'knowledge', 'full'];
function isValidProfile(p) {
    return VALID_PROFILES.includes(p);
}
/**
 * Load the skill allowlist for a profile. `full` returns null = no filter.
 */
function loadProfileAllowlist(profile, cmRoot) {
    if (profile === 'full')
        return null;
    const root = cmRoot || (0, paths_1.findCmRoot)();
    const file = path.join(root, 'skills', 'profiles', `${profile}.txt`);
    if (!fs.existsSync(file)) {
        throw new Error(`Profile not found: ${profile} (expected ${file})`);
    }
    const allow = [];
    for (const raw of fs.readFileSync(file, 'utf-8').split('\n')) {
        const line = raw.replace(/#.*$/, '').trim();
        if (line)
            allow.push(line);
    }
    return allow;
}
function listAllSkills(cmRoot) {
    const root = cmRoot || (0, paths_1.findCmRoot)();
    const skillsDir = path.join(root, 'skills');
    if (!fs.existsSync(skillsDir))
        return [];
    return fs
        .readdirSync(skillsDir)
        .filter((n) => n.startsWith('cm-'))
        .filter((n) => fs.existsSync(path.join(skillsDir, n, 'SKILL.md')))
        .sort();
}
