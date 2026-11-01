#!/usr/bin/env node

/**
 * review-scope.mjs — Isolated Review Handshake & Scope Compiler
 * Generates an isolated diff scope, git statistics, and changed-file list
 * to pass to @agents_review in read-only audit mode.
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

function getBaseSha() {
  try {
    const defaultBranch = execSync(
      'git rev-parse --verify origin/main 2>/dev/null || git rev-parse --verify main 2>/dev/null || git rev-parse HEAD~1',
      { encoding: 'utf8', cwd: REPO_ROOT }
    ).trim();
    return defaultBranch;
  } catch {
    return 'HEAD~1';
  }
}

function compileReviewScope(baseCommit) {
  const base = baseCommit || getBaseSha();
  let diffStat = '';
  let changedFiles = [];

  try {
    diffStat = execSync(`git diff --stat ${base}...HEAD`, {
      encoding: 'utf8',
      cwd: REPO_ROOT,
    }).trim();

    changedFiles = execSync(`git diff --name-only ${base}...HEAD`, {
      encoding: 'utf8',
      cwd: REPO_ROOT,
    })
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    // If git diff against base fails, fallback to working tree status
    const status = execSync('git status --short', {
      encoding: 'utf8',
      cwd: REPO_ROOT,
    }).trim();
    diffStat = status;
    changedFiles = status
      .split('\n')
      .map((l) => l.slice(3).trim())
      .filter(Boolean);
  }

  const payload = {
    base,
    head: 'HEAD',
    timestamp: new Date().toISOString(),
    changedFilesCount: changedFiles.length,
    changedFiles,
    diffStat,
    reviewMandates: [
      'Operate strictly in read-only mode (zero modifications to worktree).',
      'Check 100% of changed files against 5 axes: Architecture, Security, Database, UI/UX, Invariants.',
      'Deliver findings with file:line pointers and persist actionable tasks to plans/active/.',
    ],
  };

  return payload;
}

function main() {
  const baseArg = process.argv[2];
  const scope = compileReviewScope(baseArg);

  if (process.argv.includes('--json')) {
    process.stdout.write(JSON.stringify(scope, null, 2) + '\n');
    process.exit(0);
  }

  console.log('=== Review Scope Handshake ===\n');
  console.log(`- Base: ${scope.base}`);
  console.log(`- Head: ${scope.head}`);
  console.log(`- Changed files (${scope.changedFilesCount}):`);
  scope.changedFiles.forEach((f) => console.log(`    - ${f}`));
  console.log('\n--- Git Diff Stat ---');
  console.log(scope.diffStat || '  (Clean working tree)');
  console.log('\n[PASS] Review scope prepared for @agents_review.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

