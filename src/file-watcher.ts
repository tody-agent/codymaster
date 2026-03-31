import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';
import { generateLearningsIndex } from './l0-indexer';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WatcherOptions {
  /** Debounce delay in ms before reacting to file changes (default: 300) */
  debounceMs?: number;
  /** Called after L0 index is refreshed */
  onRefresh?: (target: string) => void;
  /** Called on watcher error */
  onError?: (err: Error) => void;
}

// ─── Watcher ─────────────────────────────────────────────────────────────────

let watcher: FSWatcher | null = null;
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

function debounce(key: string, ms: number, fn: () => void): void {
  const existing = debounceTimers.get(key);
  if (existing) clearTimeout(existing);
  debounceTimers.set(key, setTimeout(() => {
    debounceTimers.delete(key);
    fn();
  }, ms));
}

/**
 * Start watching `.cm/memory/learnings.json` and `.cm/memory/decisions.json`.
 * On change, regenerates the L0 learnings index automatically.
 */
export function startWatcher(projectPath: string, options: WatcherOptions = {}): FSWatcher {
  if (watcher) return watcher;

  const { debounceMs = 300, onRefresh, onError } = options;

  const memoryDir = path.join(projectPath, '.cm', 'memory');
  const watched = [
    path.join(memoryDir, 'learnings.json'),
    path.join(memoryDir, 'decisions.json'),
  ];

  watcher = chokidar.watch(watched, {
    ignoreInitial: true,
    persistent: false,
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
  });

  watcher.on('change', (filePath: string) => {
    const basename = path.basename(filePath);
    debounce(`refresh:${basename}`, debounceMs, () => {
      try {
        if (basename === 'learnings.json') {
          generateLearningsIndex(projectPath);
          onRefresh?.('learnings');
        }
        // decisions don't have an L0 index yet — placeholder for future
      } catch (err) {
        onError?.(err as Error);
      }
    });
  });

  watcher.on('error', (err: unknown) => {
    onError?.(err as Error);
  });

  return watcher;
}

/**
 * Stop the active watcher and clear pending debounce timers.
 */
export function stopWatcher(): void {
  for (const timer of debounceTimers.values()) clearTimeout(timer);
  debounceTimers.clear();

  if (watcher) {
    watcher.close();
    watcher = null;
  }
}

/**
 * Returns true if a watcher is currently active.
 */
export function isWatching(): boolean {
  return watcher !== null;
}
