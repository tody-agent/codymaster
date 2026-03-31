"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWatcher = startWatcher;
exports.stopWatcher = stopWatcher;
exports.isWatching = isWatching;
const chokidar_1 = __importDefault(require("chokidar"));
const path_1 = __importDefault(require("path"));
const l0_indexer_1 = require("./l0-indexer");
// ─── Watcher ─────────────────────────────────────────────────────────────────
let watcher = null;
const debounceTimers = new Map();
function debounce(key, ms, fn) {
    const existing = debounceTimers.get(key);
    if (existing)
        clearTimeout(existing);
    debounceTimers.set(key, setTimeout(() => {
        debounceTimers.delete(key);
        fn();
    }, ms));
}
/**
 * Start watching `.cm/memory/learnings.json` and `.cm/memory/decisions.json`.
 * On change, regenerates the L0 learnings index automatically.
 */
function startWatcher(projectPath, options = {}) {
    if (watcher)
        return watcher;
    const { debounceMs = 300, onRefresh, onError } = options;
    const memoryDir = path_1.default.join(projectPath, '.cm', 'memory');
    const watched = [
        path_1.default.join(memoryDir, 'learnings.json'),
        path_1.default.join(memoryDir, 'decisions.json'),
    ];
    watcher = chokidar_1.default.watch(watched, {
        ignoreInitial: true,
        persistent: false,
        awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
    });
    watcher.on('change', (filePath) => {
        const basename = path_1.default.basename(filePath);
        debounce(`refresh:${basename}`, debounceMs, () => {
            try {
                if (basename === 'learnings.json') {
                    (0, l0_indexer_1.generateLearningsIndex)(projectPath);
                    onRefresh === null || onRefresh === void 0 ? void 0 : onRefresh('learnings');
                }
                // decisions don't have an L0 index yet — placeholder for future
            }
            catch (err) {
                onError === null || onError === void 0 ? void 0 : onError(err);
            }
        });
    });
    watcher.on('error', (err) => {
        onError === null || onError === void 0 ? void 0 : onError(err);
    });
    return watcher;
}
/**
 * Stop the active watcher and clear pending debounce timers.
 */
function stopWatcher() {
    for (const timer of debounceTimers.values())
        clearTimeout(timer);
    debounceTimers.clear();
    if (watcher) {
        watcher.close();
        watcher = null;
    }
}
/**
 * Returns true if a watcher is currently active.
 */
function isWatching() {
    return watcher !== null;
}
