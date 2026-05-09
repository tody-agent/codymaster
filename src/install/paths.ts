import * as fs from 'fs';
import * as path from 'path';

/**
 * Locate the repository / install root that contains `skills/`.
 * Resolves in this order:
 *   1. Env var CM_HOME (explicit override)
 *   2. Walk up from __dirname looking for skills/ + package.json
 *   3. ~/.cody-master (legacy bash installer cache)
 */
export function findCmRoot(): string {
  if (process.env.CM_HOME && fs.existsSync(path.join(process.env.CM_HOME, 'skills'))) {
    return process.env.CM_HOME;
  }
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    if (
      fs.existsSync(path.join(dir, 'skills')) &&
      fs.existsSync(path.join(dir, 'package.json'))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const fallback = path.join(home, '.cody-master');
  if (fs.existsSync(path.join(fallback, 'skills'))) return fallback;
  throw new Error(
    'Cannot locate CodyMaster skills directory. Set CM_HOME or run from the repo root.'
  );
}

export function homeDir(): string {
  return process.env.HOME || process.env.USERPROFILE || '';
}
