"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._updateMessage = void 0;
exports.checkForUpdates = checkForUpdates;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const https_1 = __importDefault(require("https"));
const pkg = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(__dirname, '..', '..', 'package.json'), 'utf-8'));
const VERSION = pkg.version;
exports._updateMessage = '';
/**
 * Checks for updates to CodyMaster on the npm registry.
 * Caches results for 24 hours to avoid frequent network calls.
 */
function checkForUpdates() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const cacheDir = path_1.default.join(os_1.default.homedir(), '.codymaster');
            const cacheFile = path_1.default.join(cacheDir, '.update-check');
            // Ensure cache directory exists
            if (!fs_1.default.existsSync(cacheDir)) {
                fs_1.default.mkdirSync(cacheDir, { recursive: true });
            }
            // Check cache (24h TTL)
            try {
                if (fs_1.default.existsSync(cacheFile)) {
                    const stat = fs_1.default.statSync(cacheFile);
                    const age = Date.now() - stat.mtimeMs;
                    if (age < 24 * 60 * 60 * 1000) {
                        const cached = fs_1.default.readFileSync(cacheFile, 'utf-8').trim();
                        if (cached && cached !== VERSION) {
                            exports._updateMessage = cached;
                        }
                        return;
                    }
                }
            }
            catch ( /* ignore cache errors */_a) { /* ignore cache errors */ }
            // Fetch latest version from npm (2s timeout)
            const latestVersion = yield new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error('timeout')), 2000);
                https_1.default.get('https://registry.npmjs.org/codymaster/latest', { headers: { 'Accept': 'application/json' } }, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        clearTimeout(timer);
                        try {
                            const json = JSON.parse(data);
                            resolve(json.version || VERSION);
                        }
                        catch (_a) {
                            resolve(VERSION);
                        }
                    });
                }).on('error', () => { clearTimeout(timer); reject(new Error('fetch failed')); });
            });
            // Cache result
            if (latestVersion && latestVersion !== VERSION) {
                exports._updateMessage = latestVersion;
                fs_1.default.writeFileSync(cacheFile, latestVersion);
            }
            else {
                fs_1.default.writeFileSync(cacheFile, '');
            }
        }
        catch (e) {
            // Silent failure for update checks
        }
    });
}
