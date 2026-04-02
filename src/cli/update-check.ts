import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';

const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', 'package.json'), 'utf-8'));
const VERSION = pkg.version;

export let _updateMessage = '';

/**
 * Checks for updates to CodyMaster on the npm registry.
 * Caches results for 24 hours to avoid frequent network calls.
 */
export async function checkForUpdates(): Promise<void> {
  try {
    const cacheDir = path.join(os.homedir(), '.codymaster');
    const cacheFile = path.join(cacheDir, '.update-check');

    // Ensure cache directory exists
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // Check cache (24h TTL)
    try {
      if (fs.existsSync(cacheFile)) {
        const stat = fs.statSync(cacheFile);
        const age = Date.now() - stat.mtimeMs;
        if (age < 24 * 60 * 60 * 1000) {
          const cached = fs.readFileSync(cacheFile, 'utf-8').trim();
          if (cached && cached !== VERSION) {
            _updateMessage = cached;
          }
          return;
        }
      }
    } catch { /* ignore cache errors */ }

    // Fetch latest version from npm (2s timeout)
    const latestVersion = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), 2000);
      https.get('https://registry.npmjs.org/codymaster/latest', { headers: { 'Accept': 'application/json' } }, (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk; });
        res.on('end', () => {
          clearTimeout(timer);
          try {
            const json = JSON.parse(data);
            resolve(json.version || VERSION);
          } catch { resolve(VERSION); }
        });
      }).on('error', () => { clearTimeout(timer); reject(new Error('fetch failed')); });
    });

    // Cache result
    if (latestVersion && latestVersion !== VERSION) {
      _updateMessage = latestVersion;
      fs.writeFileSync(cacheFile, latestVersion);
    } else {
      fs.writeFileSync(cacheFile, '');
    }
  } catch (e) {
    // Silent failure for update checks
  }
}
