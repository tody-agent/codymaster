"use strict";
/**
 * AdapterFactory — Auto-detect and select the best available browser adapter.
 * Priority: agent-browser → Playwright (fallback).
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
exports.createAdapter = createAdapter;
exports.checkEngines = checkEngines;
const agent_browser_adapter_1 = require("./adapters/agent-browser-adapter");
const playwright_adapter_1 = require("./adapters/playwright-adapter");
/**
 * Create the best available adapter.
 * @param preferred - 'auto' (default), 'agent-browser', or 'playwright'
 */
function createAdapter() {
    return __awaiter(this, arguments, void 0, function* (preferred = 'auto') {
        // Explicit choice
        if (preferred === 'playwright') {
            const pw = new playwright_adapter_1.PlaywrightAdapter();
            if (!(yield pw.isAvailable())) {
                throw new Error('Playwright is not available. Run: npx playwright install chromium');
            }
            return { adapter: pw, engine: 'playwright', fallback: false };
        }
        if (preferred === 'agent-browser') {
            const ab = new agent_browser_adapter_1.AgentBrowserAdapter();
            if (!(yield ab.isAvailable())) {
                throw new Error('agent-browser is not available. Run: npm i -g agent-browser && agent-browser install');
            }
            return { adapter: ab, engine: 'agent-browser', fallback: false };
        }
        // Auto: try agent-browser first, fallback to playwright
        const ab = new agent_browser_adapter_1.AgentBrowserAdapter();
        if (yield ab.isAvailable()) {
            return { adapter: ab, engine: 'agent-browser', fallback: false };
        }
        const pw = new playwright_adapter_1.PlaywrightAdapter();
        if (yield pw.isAvailable()) {
            console.log('[cm-browse] agent-browser not found, falling back to Playwright');
            return { adapter: pw, engine: 'playwright', fallback: true };
        }
        throw new Error('No browser engine available. Install one:\n' +
            '  npm i -g agent-browser && agent-browser install\n' +
            '  npx playwright install chromium');
    });
}
/**
 * Check which engines are available without creating adapters.
 */
function checkEngines() {
    return __awaiter(this, void 0, void 0, function* () {
        const ab = new agent_browser_adapter_1.AgentBrowserAdapter();
        const pw = new playwright_adapter_1.PlaywrightAdapter();
        const [abAvail, pwAvail] = yield Promise.all([ab.isAvailable(), pw.isAvailable()]);
        return {
            'agent-browser': abAvail,
            playwright: pwAvail,
        };
    });
}
