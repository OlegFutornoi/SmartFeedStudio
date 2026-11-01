#!/usr/bin/env node

/**
 * Git Pre-Commit Guardrail: Protected Files & Secrets Defense
 * Prevents committing sensitive environment files (.env*) and validates staged content for raw secrets.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';

const SECRET_PATTERNS = [
  { name: 'Perplexity API Key', regex: /\bpplx-[A-Za-z0-9]{20,}\b/ },
  { name: 'Context7 Secret Key', regex: /\bctx7sk-[A-Za-z0-9-]{20,}\b/ },
  { name: 'Firecrawl API Key', regex: /\bfc-[a-f0-9]{24,}\b/ },
  { name: 'GitHub Personal Access Token', regex: /\bghp_[A-Za-z0-9]{20,}\b/ },
  { name: 'Google API Key', regex: /\bAIzaSy[A-Za-z0-9_-]{30,}\b/ },
  { name: 'Groq API Key', regex: /\bgsk_[A-Za-z0-9]{24,}\b/ },
  { name: 'OpenAI Secret Key', regex: /\bsk-[A-Za-z0-9_-]{24,}\b/ },
  { name: 'Raw JWT Token', regex: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/ },
];

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
    console.error(`       To unstage, run: git reset HEAD ${file}`);
    hasErrors = true;
    continue;
  }

  // 2. Scan staged text contents for secrets
  if (fs.existsSync(file)) {
    try {
      const stats = fs.statSync(file);
      if (stats.size > 2 * 1024 * 1024) continue; // skip large binaries
      const content = fs.readFileSync(file, 'utf-8');

      for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(content)) {
          console.error(
            `[FAIL] [Security] Potential ${pattern.name} detected in staged file '${file}'!`
          );
          console.error(`       Never commit raw API keys. Use Keychain or .env.`);
          hasErrors = true;
          break;
        }
      }
    } catch {
      // Ignore binary or unreadable files
    }
  }
}

if (hasErrors) {
  console.error('[FAIL] Pre-commit security check failed. Commit aborted to prevent secret leaks.');
  process.exit(1);
}

console.log('[PASS] [Security] Protected files and secret scan passed.');
process.exit(0);
