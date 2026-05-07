/**
 * Output compression middleware — pure helpers that strip noise from common
 * CLI outputs before they enter the model context. Keep them deterministic
 * and side-effect free so cm-terminal can reference them by name.
 */

export type Compressor = (stdout: string) => string;

const STATUS_LINE = /^(?:\s*)([MADRCU?!]{1,2}|\?\?)\s+(.+)$/;

export function compressGitStatus(stdout: string): string {
  const lines = stdout.split('\n');
  const kept: string[] = [];
  let branch: string | null = null;
  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    if (line.startsWith('On branch ')) {
      branch = line;
      continue;
    }
    if (STATUS_LINE.test(line)) {
      kept.push(line.trim());
    }
  }
  if (kept.length === 0) {
    return branch ? `${branch}\n(clean)` : '(clean)';
  }
  const head = branch ? `${branch}\n` : '';
  return `${head}${kept.join('\n')}\n(${kept.length} changed)`;
}

const TEST_FAIL_PATTERNS = [
  /^\s*FAIL\s/,
  /^\s*✗\s/,
  /^\s*×\s/,
  /^\s*✘\s/,
  /\bAssertionError\b/,
  /^\s*Error:/,
  /^\s*Expected /,
  /^\s*at .+\(.+:\d+:\d+\)/,
];

const TEST_SUMMARY_PATTERNS = [
  /Tests?:\s+\d+\s+(failed|passed|skipped)/i,
  /Test Files\s+/i,
  /\d+\s+passing/,
  /\d+\s+failing/,
  /Duration\s+/i,
  /Snapshots:/i,
];

export function compressNpmTest(stdout: string): string {
  const lines = stdout.split('\n');
  const kept: string[] = [];
  let inFailureBlock = false;
  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    const isFailLike = TEST_FAIL_PATTERNS.some(re => re.test(line));
    const isSummary = TEST_SUMMARY_PATTERNS.some(re => re.test(line));
    if (isFailLike) {
      kept.push(line);
      inFailureBlock = true;
      continue;
    }
    if (inFailureBlock && line.trim() === '') {
      kept.push(line);
      inFailureBlock = false;
      continue;
    }
    if (inFailureBlock) {
      kept.push(line);
      continue;
    }
    if (isSummary) {
      kept.push(line);
    }
  }
  if (kept.length === 0) return '(no failures detected)';
  return kept.join('\n').replace(/\n{3,}/g, '\n\n');
}

export function collapseRepeatedLines(stdout: string, threshold = 3): string {
  if (threshold < 2) threshold = 2;
  const lines = stdout.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    let j = i + 1;
    while (j < lines.length && lines[j] === lines[i]) j++;
    const run = j - i;
    if (run >= threshold) {
      out.push(`${lines[i]}  … (× ${run})`);
    } else {
      for (let k = i; k < j; k++) out.push(lines[k]);
    }
    i = j;
  }
  return out.join('\n');
}

const BUILD_KEEP = [
  /\berror\b/i,
  /\bwarning\b/i,
  /\bfailed\b/i,
  /\bsucceeded\b/i,
  /\bbuilt\b/i,
  /\bcompiled\b/i,
  /\bDone in\b/i,
  /^\s*✓\s/,
  /^\s*✗\s/,
];

export function summarizeBuildLog(stdout: string): string {
  const lines = stdout.split('\n');
  const kept = lines.filter(l => BUILD_KEEP.some(re => re.test(l)));
  if (kept.length === 0) {
    const tail = lines.slice(-5).filter(Boolean);
    return tail.join('\n') || '(empty build output)';
  }
  return collapseRepeatedLines(kept.join('\n'), 3);
}

export const COMPRESSORS: Record<string, Compressor> = {
  'git status': compressGitStatus,
  'git status --porcelain': compressGitStatus,
  'npm test': compressNpmTest,
  'npm run test': compressNpmTest,
  'vitest': compressNpmTest,
  'jest': compressNpmTest,
  'npm run build': summarizeBuildLog,
  'npm build': summarizeBuildLog,
  'tsc': summarizeBuildLog,
};

export function compressFor(command: string, stdout: string): string {
  const cmd = command.trim().toLowerCase();
  for (const key of Object.keys(COMPRESSORS)) {
    if (cmd.startsWith(key)) return COMPRESSORS[key](stdout);
  }
  return collapseRepeatedLines(stdout, 3);
}
