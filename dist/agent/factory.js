"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBackend = getBackend;
exports.listBackends = listBackends;
const claude_1 = require("./claude");
const codex_1 = require("./codex");
const cursor_1 = require("./cursor");
const gemini_1 = require("./gemini");
const copilot_1 = require("./copilot");
const antigravity_1 = require("./antigravity");
const opencode_1 = require("./opencode");
const backends = {
    'claude-code': () => new claude_1.ClaudeBackend(),
    'codex': () => new codex_1.CodexBackend(),
    'cursor': () => new cursor_1.CursorBackend(),
    'gemini': () => new gemini_1.GeminiBackend(),
    'copilot': () => new copilot_1.CopilotBackend(),
    'antigravity': () => new antigravity_1.AntigravityBackend(),
    'opencode': () => new opencode_1.OpenCodeBackend(),
};
function getBackend(name) {
    const factory = backends[name];
    if (!factory) {
        throw new Error(`Unknown agent backend: ${name}. Available: ${Object.keys(backends).join(', ')}`);
    }
    return factory();
}
function listBackends() {
    return Object.keys(backends);
}
