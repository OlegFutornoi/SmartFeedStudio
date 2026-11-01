#!/usr/bin/env node

/**
 * check-budget.mjs — Prompt Token & Instruction Budget Verifier
 * Verifies that always-on agent context files respect strict prompt token limits:
 *   - Combined always-on rules (core.md + agents.md) <= 14,000 characters
 *   - Max file size <= 24,000 bytes per file (Antigravity instruction limit)
 *   - Total root always-on instruction chain <= 32 KiB (OpenAI Codex project_doc_max_bytes limit)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

const ALWAYS_ON_RULES = [
  path.join(REPO_ROOT, '.agents/rules/core.md'),
  path.join(REPO_ROOT, '.agents/rules/agents.md'),
];

const ROOT_DISPATCHERS = [
  path.join(REPO_ROOT, 'AGENTS.md'),
  path.join(REPO_ROOT, '.agents/AGENTS.md'),
];

export function verifyBudget() {
  const errors = [];
  let alwaysOnChars = 0;
  let totalChainBytes = 0;

  for (const f of ALWAYS_ON_RULES) {
    if (!fs.existsSync(f)) {
      errors.push(`Missing always-on rule file: ${path.relative(REPO_ROOT, f)}`);
      continue;
    }
    const stat = fs.statSync(f);
    const content = fs.readFileSync(f, 'utf8');
    alwaysOnChars += content.length;
    totalChainBytes += stat.size;

    if (stat.size > 24000) {
      errors.push(
        `File ${path.relative(REPO_ROOT, f)} is ${stat.size} bytes (exceeds 24,000 bytes Antigravity limit)`
      );
    }
  }

  for (const f of ROOT_DISPATCHERS) {
    if (fs.existsSync(f)) {
      totalChainBytes += fs.statSync(f).size;
    }
  }

  if (alwaysOnChars > 14000) {
    errors.push(
      `Combined always-on rules (core.md + agents.md) are ${alwaysOnChars} characters (exceeds budget 14,000 chars)`
    );
  }

  if (totalChainBytes > 32 * 1024) {
    errors.push(
      `Total always-on chain is ${totalChainBytes} bytes (exceeds 32 KiB OpenAI Codex limit)`
    );
  }

  return {
    success: errors.length === 0,
    errors,
    alwaysOnChars,
    totalChainBytes,
  };
}

function main() {
  const res = verifyBudget();
  console.log(`[agents:budget] Always-on rules payload: ${res.alwaysOnChars}/14000 characters`);
  console.log(
    `[agents:budget] Total always-on chain: ${res.totalChainBytes}/${32 * 1024} bytes (${Math.round((res.totalChainBytes / (32 * 1024)) * 100)}%)`
  );

  if (!res.success) {
    console.error('\n[FAIL] Budget check failed:');
    res.errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('[PASS] All prompt and context instruction budgets satisfied.');
  process.exit(0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

