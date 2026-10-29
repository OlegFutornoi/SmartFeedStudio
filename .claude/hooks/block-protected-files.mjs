#!/usr/bin/env node

/**
 * PreToolUse Hook: Protection of Secrets (.env*) and Lockfile (pnpm-lock.yaml)
 * Blocks models and agents from directly modifying sensitive environment files or lockfiles.
 * Exit code 2 tells Claude Code to deny the tool execution.
 */

import { readFileSync } from 'node:fs';

function main() {
  let raw = '';
  try {
    raw = readFileSync(0, 'utf-8');
  } catch {
    process.exit(0);
  }

  if (!raw || !raw.trim()) {
    process.exit(0);
  }

  let data = null;
  try {
    data = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const toolInput = data.tool_input || data.input || {};
  const filePath =
    toolInput.file_path ||
    toolInput.path ||
    toolInput.target_file ||
    toolInput.Path ||
    '';

  if (!filePath) {
    process.exit(0);
  }

  const normalized = filePath.replace(/\\/g, '/').toLowerCase();

  // 1. Check for sensitive .env files
  const isEnv = normalized.includes('.env');
  const isAllowedEnv =
    normalized.endsWith('.example') ||
    normalized.endsWith('.sample') ||
    normalized.endsWith('.template');

  if (isEnv && !isAllowedEnv) {
    const errorMsg = `[SECURITY POLICY] Direct edit/write to sensitive environment file '${filePath}' is strictly blocked. Environment secrets must be configured via environment variables, Railway CLI, or documented in .env.example.`;
    console.error(errorMsg);
    process.exit(2);
  }

  // 2. Check for lockfiles
  if (
    normalized.endsWith('pnpm-lock.yaml') ||
    normalized.endsWith('package-lock.json') ||
    normalized.endsWith('yarn.lock')
  ) {
    const errorMsg = `[INTEGRITY POLICY] Direct manual editing of '${filePath}' is strictly blocked. Package lockfiles must be updated deterministically via package manager commands (e.g. 'pnpm add', 'pnpm update', 'pnpm install').`;
    console.error(errorMsg);
    process.exit(2);
  }

  process.exit(0);
}

main();

