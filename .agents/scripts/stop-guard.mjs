#!/usr/bin/env node

/**
 * Deterministic Stop Guardrail v2.0 for SmartFeed Studio (.agents/hooks.json)
 * Fires at turn completion (executionNum <= 2, terminationReason === "NO_TOOL_CALL", fullyIdle === true):
 * Inspects modified files for CRITICAL architectural and code violations (CORE-03 type bypasses, CORE-04 line budgets).
 * If violations exist, prompts the agent to self-heal before concluding the turn.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

function readStdin() {
  if (process.stdin.isTTY) {
    return Promise.resolve('');
  }
  return new Promise((resolve) => {
    let data = '';
    const timer = setTimeout(() => resolve(data), 500);
    timer.unref();

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      clearTimeout(timer);
      resolve(data);
    });
    process.stdin.on('error', () => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

function allowStop() {
  process.stdout.write(JSON.stringify({ decision: 'stop' }) + '\n');
  process.exit(0);
}

export function evaluateStop(payload) {
  if (
    payload.terminationReason !== 'NO_TOOL_CALL' ||
    payload.fullyIdle === false
  ) {
    return { decision: 'stop' };
  }
  if (Number(payload.executionNum || 1) > 2) {
    return { decision: 'stop' };
  }

  let modifiedFiles = [];
  try {
    const gitOut = execSync('git status --porcelain', {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    modifiedFiles = gitOut
      .split('\n')
      .map((line) => line.trim().replace(/^[A-Z?!\s]+\s+/, ''))
      .filter((f) => f && /\.(?:ts|tsx|js|mjs)$/.test(f));
  } catch {
    return { decision: 'stop' };
  }

  if (modifiedFiles.length === 0) {
    return { decision: 'stop' };
  }

  const criticalIssues = [];
  const asAnyPattern = new RegExp('\\b' + 'as' + '\\s+' + 'any' + '\\b');

  for (const relFile of modifiedFiles) {
    const fullPath = path.join(REPO_ROOT, relFile);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split(/\r?\n/);

    // Check CORE-04: File budget (<300 lines)
    if (lines.length > 300) {
      criticalIssues.push(
        `[CORE-04] ${relFile} has ${lines.length} lines (budget <= 300 lines). Decompose into sub-components.`
      );
    }

    // Check CORE-03: Zero type bypasses in application code (apps, services, packages)
    const isAppCode =
      relFile.startsWith('apps/') ||
      relFile.startsWith('services/') ||
      relFile.startsWith('packages/');
    if (
      isAppCode &&
      !relFile.endsWith('.test.ts') &&
      !relFile.endsWith('.spec.ts') &&
      asAnyPattern.test(content)
    ) {
      criticalIssues.push(
        `[CORE-03] ${relFile} contains type bypass. Replace with generated Prisma types, Zod parse, or unknown.`
      );
    }

    // Check backend console.log leaks
    if (
      relFile.startsWith('services/backend-api/') &&
      /\bconsole\.log\(/.test(content)
    ) {
      criticalIssues.push(
        `[CORE-02] ${relFile} contains 'console.log'. Use NestJS this.logger or structured logging.`
      );
    }
  }

  if (criticalIssues.length > 0) {
    const summary = criticalIssues.slice(0, 5).join('\n');
    return {
      decision: 'continue',
      reason: `Stop Guard (.agents/hooks.json): CRITICAL violations detected in modified files. Please fix before concluding:\n${summary}`,
    };
  }

  return { decision: 'stop' };
}

async function main() {
  const raw = await readStdin();
  if (!raw || !raw.trim()) return allowStop();

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return allowStop();
  }

  const result = evaluateStop(payload);
  if (result.decision === 'continue') {
    process.stdout.write(JSON.stringify(result) + '\n');
    process.exit(0);
  }
  return allowStop();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(() => allowStop());
}
