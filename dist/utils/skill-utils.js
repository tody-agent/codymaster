"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableSkills = getAvailableSkills;
exports.getSkillCount = getSkillCount;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Discovers and returns a list of available 'cm-' skills.
 */
function getAvailableSkills() {
    try {
        const rootDir = path_1.default.resolve(__dirname, '..', '..');
        const skillsDir = path_1.default.join(rootDir, 'skills');
        if (!fs_1.default.existsSync(skillsDir)) {
            return [];
        }
        return fs_1.default.readdirSync(skillsDir)
            .filter(f => f.startsWith('cm-') && fs_1.default.statSync(path_1.default.join(skillsDir, f)).isDirectory());
    }
    catch (_a) {
        return [];
    }
}
/**
 * Returns the count of available 'cm-' skills.
 */
function getSkillCount() {
    return getAvailableSkills().length;
}
