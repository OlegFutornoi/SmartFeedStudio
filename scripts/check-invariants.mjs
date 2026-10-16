#!/usr/bin/env node

/**
 * SmartFeed Studio — Invariants Automated Guardrail Checker
 * Verifies machine-enforceable domain invariants across UI, CQRS, and Controllers.
 * Usage:
 *   node scripts/check-invariants.mjs         # Scans currently modified/staged git files
 *   node scripts/check-invariants.mjs --all   # Scans all files across desktop and backend modules
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const DESKTOP_MODULES = path.join(ROOT_DIR, 'apps/desktop/src/modules');
const BACKEND_MODULES = path.join(ROOT_DIR, 'services/backend-api/src/modules');

const isAll = process.argv.includes('--all');
let totalErrors = 0;

function reportError(file, lineNum, ruleId, message, snippet) {
  totalErrors++;
  const relPath = path.relative(ROOT_DIR, file);
  console.error(`❌ [${ruleId}] ${relPath}:${lineNum}: ${message}`);
  if (snippet) {
    console.error(`   > ${snippet.trim()}`);
  }
}

function scanFiles(dir, extensions, callback) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.next') {
        scanFiles(fullPath, extensions, callback);
      }
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      callback(fullPath);
    }
  }
}

let targetFiles = [];

if (isAll) {
  console.log('🔍 Running SmartFeed Studio Invariant Guardrails Check (--all: entire codebase)...\n');
  scanFiles(DESKTOP_MODULES, ['.tsx', '.ts'], (f) => targetFiles.push(f));
  scanFiles(BACKEND_MODULES, ['.ts'], (f) => targetFiles.push(f));
} else {
  console.log('🔍 Running SmartFeed Studio Invariant Guardrails Check on modified git files...\n');
  try {
    const statusOut = execSync('git status --porcelain', { encoding: 'utf-8' });
    const rawFiles = statusOut
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^[A-Z?]{1,2}\s+/, '').trim())
      .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'));

    targetFiles = rawFiles
      .map((f) => path.join(ROOT_DIR, f))
      .filter((f) => fs.existsSync(f));
  } catch {
    scanFiles(DESKTOP_MODULES, ['.tsx', '.ts'], (f) => targetFiles.push(f));
    scanFiles(BACKEND_MODULES, ['.ts'], (f) => targetFiles.push(f));
  }
}

const FORBIDDEN_COLOR_REGEX = /\b(text|bg|border)-(emerald|green|amber|yellow|orange|purple|violet|fuchsia|pink|sky|indigo|teal|cyan)-\d{2,3}\b/;
const TRANSLUCENT_HEADER_REGEX = /(sticky|header|footer|sheetheader|sheetfooter|dialogheader).*bg-(card|background)\/\d+.*backdrop-blur|backdrop-blur.*bg-(card|background)\/\d+.*(sticky|header|footer)/i;

for (const filePath of targetFiles) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const isFrontend = filePath.includes('apps/desktop') || filePath.includes('apps/admin-portal');
  const isBackend = filePath.includes('services/backend-api');

  // 1. Frontend Invariants
  if (isFrontend) {
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

      // Check UI-02 (Forbidden Palette Colors)
      const colorMatch = line.match(FORBIDDEN_COLOR_REGEX);
      if (colorMatch) {
        reportError(
          filePath,
          lineNum,
          'UI-02',
          `Hardcoded palette color class "${colorMatch[0]}" detected. Use semantic tokens (text-success, bg-success/15 border-success/30, text-primary, bg-muted, text-foreground).`,
          line,
        );
      }

      // Check UI-01 (Translucent sticky headers)
      if (TRANSLUCENT_HEADER_REGEX.test(line)) {
        reportError(
          filePath,
          lineNum,
          'UI-01',
          'Translucent sticky header/footer detected. Headers must have 100% solid background (bg-card or bg-background without opacity or blur).',
          line,
        );
      }
    });
  }

  // 2. Backend Invariants
  if (isBackend) {
    const isFacade =
      filePath.endsWith('.module.ts') ||
      filePath.endsWith('index.ts') ||
      filePath.endsWith('.queries.ts') ||
      filePath.endsWith('.commands.ts') ||
      filePath.endsWith('suppliers.handlers.ts') ||
      filePath.endsWith('supplier-sync.handlers.ts') ||
      filePath.endsWith('supplier-pricing-rules.handlers.ts');

    if (!isFacade && filePath.includes('/handlers/')) {
      const commandHandlers = (content.match(/@CommandHandler\(/g) || []).length;
      const queryHandlers = (content.match(/@QueryHandler\(/g) || []).length;
      const totalHandlers = commandHandlers + queryHandlers;

      if (totalHandlers > 1) {
        reportError(
          filePath,
          1,
          'ARCH-04',
          `Found ${totalHandlers} handlers in a single file (${commandHandlers} command, ${queryHandlers} query). Each handler must reside in its own dedicated file.`,
        );
      }
    }

    if (filePath.endsWith('.controller.ts')) {
      lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        if (line.includes("@Query('") || line.includes('@Query("')) {
          reportError(
            filePath,
            lineNum,
            'BE-01',
            'Raw @Query(\'key\') parameter detected. Every query must use a dedicated class decorated with class-validator and class-transformer (@Type).',
            line,
          );
        }
      });
    }
  }
}

if (totalErrors === 0) {
  console.log(`✅ All Invariants Passed on ${targetFiles.length} file(s) (0 violations across UI-01, UI-02, ARCH-04, BE-01)!\n`);
  process.exit(0);
} else {
  console.error(`\n❌ Failed with ${totalErrors} invariant violation(s). Fix all violations before proceeding.\n`);
  process.exit(1);
}
