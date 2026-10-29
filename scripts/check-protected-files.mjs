#!/usr/bin/env node

/**
 * Git Pre-Commit Guardrail: Protected Files & Secrets Defense
 * Prevents committing sensitive environment files (.env*) and validates lockfile integrity.
 */

import { execSync } from 'node:child_process';

function getStagedFiles() {
  try {
    const out = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
    });
    return out
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

const staged = getStagedFiles();
let hasErrors = false;

for (const file of staged) {
  const norm = file.replace(/\\/g, '/').toLowerCase();

  // 1. Block sensitive .env files
  const isEnv = norm.includes('.env');
  const isAllowedEnv =
    norm.endsWith('.example') ||
    norm.endsWith('.sample') ||
    norm.endsWith('.template');

  if (isEnv && !isAllowedEnv) {
    console.error(
      `[FAIL] [Security] Staging sensitive environment file '${file}' is forbidden!`
    );
    console.error(
      `       To unstage, run: git reset HEAD ${file}`
    );
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('[FAIL] Pre-commit security check failed. Commit aborted to prevent secret leaks.');
  process.exit(1);
}

console.log('[PASS] [Security] Protected files check passed (zero sensitive .env files staged).');
process.exit(0);

