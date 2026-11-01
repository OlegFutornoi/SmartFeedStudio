#!/usr/bin/env node

/**
 * SessionStart Hook for SmartFeed Studio (.agents/hooks.json)
 * Injects essential workspace state, active task ID, and core invariants at session startup.
 * Keeps payload lightweight (<= 1500 tokens).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const ACTIVE_TASK_PATH = path.join(REPO_ROOT, '.agents/state/active_task.json');

function main() {
  let activeTaskInfo = 'No active task currently running.';
  try {
    if (fs.existsSync(ACTIVE_TASK_PATH)) {
      const task = JSON.parse(fs.readFileSync(ACTIVE_TASK_PATH, 'utf8'));
      if (task.active_task_id) {
        activeTaskInfo = `Active Task: [${task.active_task_id}] ${task.title || ''} (Stage ${task.current_stage || 1}/8, Agent: ${task.assigned_agent || 'unassigned'})`;
      }
    }
  } catch {
    // Non-blocking
  }

  const message = [
    `[SmartFeed Studio Workspace Active]`,
    `- ${activeTaskInfo}`,
    `- Invariant 20: Models execute tasks STRICTLY from 'plans/completed/<name>.compressed.md' (plans/active/ is reserved for human review).`,
    `- Core Invariants: 0 type bypasses (CORE-03), file budget <= 300 lines (CORE-04), 100% official shadcn primitives (UI-05), 100% bilingual parity (i18n:check).`,
    `- Git Safety: Autonomous git commit/push is blocked without explicit user command (CORE-10).`,
    `- Verification Gate: DoD requires fresh backend dist, clean tsc across monorepo packages, and clean invariants:check.`,
  ].join('\n');

  const output = {
    injectSteps: [
      {
        ephemeralMessage: message,
      },
    ],
  };

  process.stdout.write(JSON.stringify(output) + '\n');
  process.exit(0);
}

main();

