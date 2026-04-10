"use strict";
/**
 * Redaction + secondary-model review for `cm second-opinion`.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redactDiffForReview = redactDiffForReview;
exports.reviewWithOpenAI = reviewWithOpenAI;
exports.reviewWithAnthropic = reviewWithAnthropic;
const SYSTEM = 'You are a senior reviewer. List risks, bugs, and missing tests. Be concise. Do not restate the entire diff.';
function redactDiffForReview(text, maxLen = 120000) {
    let t = text.slice(0, maxLen);
    t = t.replace(/^(\s*(?:#\s*)?(?:API_KEY|API_SECRET|SECRET|PASSWORD|ACCESS_TOKEN|AUTH_TOKEN|BEARER|Authorization)\s*[:=]\s*)\S+.*$/gim, '$1[REDACTED]');
    t = t.replace(/\b(sk-[a-zA-Z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|ghp_[A-Za-z0-9]{36,}|gho_[A-Za-z0-9]{36,}|AKIA[0-9A-Z]{16})\b/g, '[REDACTED_TOKEN]');
    return t;
}
function reviewWithOpenAI(diffText) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const key = process.env.OPENAI_API_KEY;
        if (!key)
            throw new Error('OPENAI_API_KEY is not set');
        const model = process.env.CM_SECOND_OPINION_MODEL || 'gpt-4o-mini';
        const res = yield fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: SYSTEM },
                    { role: 'user', content: `Review this diff:\n\n${diffText}` },
                ],
            }),
        });
        if (!res.ok)
            throw new Error(yield res.text());
        const data = (yield res.json());
        return (_d = (_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) !== null && _d !== void 0 ? _d : '';
    });
}
function reviewWithAnthropic(diffText) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const key = process.env.ANTHROPIC_API_KEY;
        if (!key)
            throw new Error('ANTHROPIC_API_KEY is not set');
        const model = process.env.CM_ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';
        const res = yield fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: 4096,
                system: SYSTEM,
                messages: [{ role: 'user', content: `Review this diff:\n\n${diffText}` }],
            }),
        });
        if (!res.ok)
            throw new Error(yield res.text());
        const data = (yield res.json());
        const block = (_a = data.content) === null || _a === void 0 ? void 0 : _a.find((c) => c.type === 'text');
        return (_b = block === null || block === void 0 ? void 0 : block.text) !== null && _b !== void 0 ? _b : '';
    });
}
