#!/usr/bin/env node

/**
 * scan-skills-security.mjs — Supply Chain & Prompt Injection Defense for Skills
 * Scans all skill markdown files, scripts, and dependencies for:
 *   - Remote code execution payloads (curl | sh, wget | bash)
 *   - Obfuscated base64 eval execution
 *   - Prompt injection jailbreaks (e.g. "ignore previous instructions")
 *   - Zero-width or invisible Unicode characters
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const SKILLS_DIR = path.join(REPO_ROOT, '.agents/skills');

const MALICIOUS_PATTERNS = [
  {
    name: 'Remote Shell Piping',
    regex: /\b(?:curl|wget|fetch)\s+[^\n|]+\|\s*(?:sh|bash|zsh)\b/i,
  },
  {
    name: 'Obfuscated Base64 Eval',
    regex: /\beval\s*\(\s*(?:Buffer\.from|atob)\s*\(/i,
  },
  {
    name: 'Jailbreak Prompt Injection',
    regex:
      /\b(?:ignore\s+all\s+(?:previous|prior)\s+instructions|disregard\s+(?:all\s+)?earlier\s+prompts|bypass\s+all\s+safety\s+filters)\b/i,
  },
  {
    name: 'Invisible Zero-Width Obfuscation',
    regex: /[\u200B-\u200D\uFEFF]/,
  },
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

export function scanSkillsSecurity() {
  const issues = [];
  const files = walk(SKILLS_DIR);

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!['.md', '.json', '.js', '.mjs', '.ts', '.py', '.sh'].includes(ext)) {
      continue;
    }

    try {
      const content = fs.readFileSync(file, 'utf8');
      const rel = path.relative(REPO_ROOT, file);

      for (const pat of MALICIOUS_PATTERNS) {
        if (pat.regex.test(content)) {
          issues.push({
            file: rel,
            pattern: pat.name,
          });
        }
      }
    } catch {
      // Ignore unreadable
    }
  }

  return issues;
}

function main() {
  console.log('Scanning .agents/skills/ for security threats & prompt injections...');
  const issues = scanSkillsSecurity();

  if (issues.length > 0) {
    console.error(`\n[FAIL] Detected ${issues.length} potential security threat(s) in skills:`);
    issues.forEach((i) => console.error(`  - [${i.pattern}] in ${i.file}`));
    process.exit(1);
  }

  console.log('[PASS] Zero malicious patterns or prompt injections detected across all skills.');
  process.exit(0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

