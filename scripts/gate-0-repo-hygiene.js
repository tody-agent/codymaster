#!/usr/bin/env node
/**
 * Gate 0b: Repo Hygiene
 * Ensures tracked files and git remote URLs are safe before push/deploy.
 */
const { execFileSync } = require('child_process');

const FORBIDDEN_TRACKED_PATTERNS = [
  /^\.DS_Store$/,
  /^\.env(\..+)?$/,
  /^\.dev\.vars(\..+)?$/,
  /^.*\.(pem|key|p12|pfx)$/i,
  /^.*\.(log|tmp|bak|swp)$/i,
];

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf-8' }).trim();
}

function hasEmbeddedCredentials(remoteUrl) {
  return /^https?:\/\/[^/\s]+@/i.test(remoteUrl);
}

function getTrackedFiles() {
  const out = run('git', ['ls-files']);
  if (!out) return [];
  return out.split('\n').filter(Boolean);
}

function checkTrackedFiles() {
  const tracked = getTrackedFiles();
  return tracked.filter((file) =>
    !file.endsWith('.example') &&
    FORBIDDEN_TRACKED_PATTERNS.some((pattern) => pattern.test(file)),
  );
}

function checkOriginRemote() {
  try {
    return run('git', ['remote', 'get-url', 'origin']);
  } catch (_error) {
    return '';
  }
}

function main() {
  const failures = [];

  const originUrl = checkOriginRemote();
  if (originUrl && hasEmbeddedCredentials(originUrl)) {
    failures.push(
      [
        'origin remote URL has embedded credentials.',
        'Fix: git remote set-url origin https://github.com/<owner>/<repo>.git',
      ].join(' '),
    );
  }

  const badTrackedFiles = checkTrackedFiles();
  if (badTrackedFiles.length > 0) {
    failures.push(
      `forbidden files are tracked by git: ${badTrackedFiles.join(', ')}`,
    );
  }

  if (failures.length > 0) {
    console.error('❌ Repo hygiene check failed:');
    failures.forEach((failure) => console.error(`  - ${failure}`));
    process.exit(1);
  }

  console.log('✅ Repo hygiene check passed');
}

main();
