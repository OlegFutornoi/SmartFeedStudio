#!/usr/bin/env node

/**
 * plan-manager.mjs — Dual-Plan & Plan Lifecycle Automation for SmartFeed Studio
 *
 * Architecture:
 *   - Human plan: plans/active/<slug>.md (Ukrainian, for user review)
 *   - Model plan: plans/completed/<slug>.compressed.md (dense technical English brief)
 *   - Execution: AI models execute ONLY plans/completed/<slug>.compressed.md
 *   - Completion: plans/active/<slug>.md is deleted (NOT moved); the compressed plan remains permanently.
 *
 * Commands:
 *   create <slug> "<title_ua>" ["<title_en>"]
 *   compress <slug>
 *   close <slug>
 *   list
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const PLANS_DIR = path.join(REPO_ROOT, 'plans');
const ACTIVE_DIR = path.join(PLANS_DIR, 'active');
const COMPLETED_DIR = path.join(PLANS_DIR, 'completed');
const ACTIVE_TASK_JSON = path.join(REPO_ROOT, '.agents/state/active_task.json');
const COMPRESS_SCRIPT = path.join(REPO_ROOT, 'scripts/headroom-compress.mjs');

function ensureDirs() {
  [ACTIVE_DIR, COMPLETED_DIR].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

function resolveActiveFile(slug) {
  const normSlug = slug.endsWith('.md') ? slug : `${slug}.md`;
  return path.join(ACTIVE_DIR, normSlug);
}

function resolveCompressedFile(slug) {
  const baseSlug = slug.replace(/\.compressed\.md$/, '').replace(/\.md$/, '');
  return path.join(COMPLETED_DIR, `${baseSlug}.compressed.md`);
}

function createPlan(slug, titleUa, titleEn) {
  ensureDirs();
  const baseSlug = slug.replace(/\.compressed\.md$/, '').replace(/\.md$/, '');
  const activePath = resolveActiveFile(baseSlug);
  const compressedPath = resolveCompressedFile(baseSlug);

  if (fs.existsSync(activePath)) {
    console.error(`[ERROR] Plan already exists at ${path.relative(REPO_ROOT, activePath)}`);
    process.exit(1);
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const englishTitle = titleEn || baseSlug.replace(/[-_]/g, ' ');

  // 1. Human-facing plan in Ukrainian
  const humanContent = `# План: ${titleUa}

- Статус: ЧЕРНЕТКА НА ПОГОДЖЕННЯ (PLAN-01)
- Дата: ${dateStr}
- Доменна назва: ${englishTitle}

## 1. Мета та критерії успіху (DoD)

- Критерій 1: Fresh backend dist (pnpm --filter @smartfeed/backend-api build).
- Критерій 2: Static typecheck passes (0 помилок).
- Критерій 3: Bilingual parity 100% (pnpm i18n:check).
- Критерій 4: Domain invariants 0 порушень (pnpm invariants:check).

## 2. Етапи реалізації

- Крок 1: Контракти в @smartfeed/shared.
- Крок 2: Backend CQRS реалізація.
- Крок 3: Frontend shadcn UI компоненти.
- Крок 4: Верифікація та DoD перевірка.
`;

  fs.writeFileSync(activePath, humanContent, 'utf8');
  console.log(`[PASS] Created active human plan: ${path.relative(REPO_ROOT, activePath)}`);

  // 2. Model-facing compressed plan in technical English
  const modelContent = `<!-- Status: [PLANNING] Model Execution Target (Do not read plans/active/) -->
# Plan Brief: ${englishTitle}

- Task ID: ${baseSlug}
- Date: ${dateStr}
- Target: ${englishTitle}
- Rule: AI model executes ONLY this compressed plan. plans/active/${baseSlug}.md is reserved for human review.

## 1. Definition of Done (DoD)

- Criteria 1: Fresh backend dist (pnpm --filter @smartfeed/backend-api build).
- Criteria 2: Static typecheck passes (0 errors).
- Criteria 3: Bilingual parity 100% (pnpm i18n:check).
- Criteria 4: Domain invariants 0 violations (pnpm invariants:check).

## 2. Implementation Steps

- Step 1: Contracts in @smartfeed/shared.
- Step 2: Backend CQRS implementation.
- Step 3: Frontend shadcn UI components.
- Step 4: Verification and DoD check.
`;

  fs.writeFileSync(compressedPath, modelContent, 'utf8');
  console.log(`[PASS] Created model compressed plan: ${path.relative(REPO_ROOT, compressedPath)}`);

  // 3. Update active_task.json
  const activeTask = {
    active_task_id: baseSlug.match(/^[A-Z]+-\d+/)?.[0] || baseSlug,
    title: titleUa,
    status: 'PLANNING',
    branch: 'omnirout',
    current_stage: 2,
    plan_file: path.relative(REPO_ROOT, activePath),
    compressed_plan_file: path.relative(REPO_ROOT, compressedPath),
  };
  fs.writeFileSync(ACTIVE_TASK_JSON, JSON.stringify(activeTask, null, 2), 'utf8');
}

function compressPlan(slug) {
  ensureDirs();
  const baseSlug = slug.replace(/\.compressed\.md$/, '').replace(/\.md$/, '');
  const activePath = resolveActiveFile(baseSlug);
  const compressedPath = resolveCompressedFile(baseSlug);

  if (!fs.existsSync(activePath)) {
    console.error(`[ERROR] Active plan not found: ${activePath}`);
    process.exit(1);
  }

  console.log(`[HEADROOM] Compressing ${baseSlug} to plans/completed/${baseSlug}.compressed.md...`);
  execFileSync(process.execPath, [COMPRESS_SCRIPT, activePath, '--save', compressedPath], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
}

function closePlan(slug) {
  ensureDirs();
  const baseSlug = slug.replace(/\.compressed\.md$/, '').replace(/\.md$/, '');
  const activePath = resolveActiveFile(baseSlug);
  const compressedPath = resolveCompressedFile(baseSlug);

  // 1. Delete active plan (do NOT move to completed)
  if (fs.existsSync(activePath)) {
    fs.unlinkSync(activePath);
    console.log(`[PASS] Deleted active plan: ${path.relative(REPO_ROOT, activePath)} (compressed copy remains in plans/completed/)`);
  } else {
    console.log(`[WARN] Active plan not found at ${path.relative(REPO_ROOT, activePath)}, proceeding with compressed plan.`);
  }

  // 2. Mark compressed plan as Completed if exists
  if (fs.existsSync(compressedPath)) {
    let compactText = fs.readFileSync(compressedPath, 'utf8');
    if (!compactText.includes('[COMPLETED]')) {
      compactText = `<!-- Status: [COMPLETED] Done -->\n` + compactText;
      fs.writeFileSync(compressedPath, compactText, 'utf8');
    }
    console.log(`[PASS] Verified permanent compressed plan: ${path.relative(REPO_ROOT, compressedPath)}`);
  }

  // 3. Update active_task.json
  if (fs.existsSync(ACTIVE_TASK_JSON)) {
    const task = JSON.parse(fs.readFileSync(ACTIVE_TASK_JSON, 'utf8'));
    task.status = 'COMPLETED';
    task.completed_stages = [1, 2, 3, 4, 5, 6, 7, 8];
    task.current_stage = 8;
    task.plan_file = path.relative(REPO_ROOT, compressedPath);
    task.compressed_plan_file = path.relative(REPO_ROOT, compressedPath);
    fs.writeFileSync(ACTIVE_TASK_JSON, JSON.stringify(task, null, 2), 'utf8');
  }

  console.log(`[PASS] Plan ${baseSlug} successfully closed.`);
}

function listPlans() {
  ensureDirs();
  console.log('--- Active Plans (Human Review) ---');
  fs.readdirSync(ACTIVE_DIR).forEach((f) => {
    if (f.endsWith('.md')) console.log(`  - plans/active/${f}`);
  });

  console.log('\n--- Model Compressed Plans (plans/completed/*.compressed.md) ---');
  fs.readdirSync(COMPLETED_DIR).forEach((f) => {
    if (f.endsWith('.compressed.md')) console.log(`  - plans/completed/${f}`);
  });
}

function main() {
  const [cmd, slug, titleUa, titleEn] = process.argv.slice(2);

  switch (cmd) {
    case 'create':
      if (!slug || !titleUa) {
        console.error('Usage: plan-manager.mjs create <slug> "<title_ua>" ["<title_en>"]');
        process.exit(1);
      }
      createPlan(slug, titleUa, titleEn);
      break;
    case 'compress':
      if (!slug) {
        console.error('Usage: plan-manager.mjs compress <slug>');
        process.exit(1);
      }
      compressPlan(slug);
      break;
    case 'close':
      if (!slug) {
        console.error('Usage: plan-manager.mjs close <slug>');
        process.exit(1);
      }
      closePlan(slug);
      break;
    case 'list':
      listPlans();
      break;
    default:
      console.log('Usage: plan-manager.mjs <create|compress|close|list> [args]');
      process.exit(0);
  }
}

main();
