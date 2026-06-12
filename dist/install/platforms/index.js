"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLATFORMS = void 0;
exports.getPlatform = getPlatform;
const claude_code_1 = require("./claude-code");
const cursor_1 = require("./cursor");
const antigravity_1 = require("./antigravity");
const simple_1 = require("./simple");
exports.PLATFORMS = [
    claude_code_1.claudeCode,
    simple_1.claudeDesktop,
    cursor_1.cursor,
    simple_1.windsurf,
    antigravity_1.antigravity,
    simple_1.codex,
    simple_1.opencode,
    simple_1.cline,
    simple_1.kiro,
    simple_1.copilot,
    simple_1.aider,
    simple_1.continueDev,
    simple_1.amazonQ,
    simple_1.amp,
];
function getPlatform(id) {
    return exports.PLATFORMS.find((p) => p.id === id);
}
