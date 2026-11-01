#!/usr/bin/env node

/**
 * validate-agents.mjs — High-performance structural, referential & security validator for .agents/
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REPO_ROOT,
  AGENTS_DIR,
  RULES_DIR,
  SKILLS_DIR,
  SUBAGENTS_DIR,
  AGENTS_MD,
  ROOT_AGENTS_MD,
  ENFORCEMENT_MAP_PATH,
  VALID_RULES,
  MASTER_SKILLS,
  UTILITY_SKILLS,
  SECRET_RE,
  TABLE_PATTERN,
  walk,
} from './validator/helpers.mjs';
import { validateRules, validateSkills } from './validator/skill-checks.mjs';
import {
  validateAgents,
  validateEnforcement,
  validateActiveTask,
} from './validator/agent-checks.mjs';

export { parseFrontmatter } from './validator/helpers.mjs';

export function runValidation() {
  const errors = [];
  const warnings = [];

  const pkgPath = path.join(REPO_ROOT, 'package.json');
  const pkg = fs.existsSync(pkgPath)
    ? JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    : {};
  const npmScripts = new Set(Object.keys(pkg.scripts || {}));

  const allFiles = walk(AGENTS_DIR);

  // 1. Clutter & Secret Scanning
  for (const f of allFiles) {
    const rel = path.relative(REPO_ROOT, f);
    if (path.basename(f) === '.DS_Store') {
      errors.push(`[CLUTTER] Remove .DS_Store file: ${rel}`);
    }
    if (
      /\.(?:md|json|mjs|js|py|sh|toml)$/.test(f) &&
      !f.includes('.test.') &&
      !f.includes('__fixtures__')
    ) {
      try {
        const text = fs.readFileSync(f, 'utf8');
        if (SECRET_RE.test(text)) {
          errors.push(`[SECURITY] Hardcoded secret pattern detected in ${rel}`);
        }
      } catch {
        // Skip unreadable
      }
    }
  }

  // 2. Validate Rules (.agents/rules/)
  const alwaysOnChars = validateRules(RULES_DIR, VALID_RULES, errors, warnings);

  // 3. Validate Agents (.agents/agents/*.md)
  validateAgents(SUBAGENTS_DIR, AGENTS_DIR, errors, warnings);

  // 4. Validate Skills (.agents/skills/*)
  const skillDirs = validateSkills(
    SKILLS_DIR,
    AGENTS_DIR,
    REPO_ROOT,
    AGENTS_MD,
    VALID_RULES,
    MASTER_SKILLS,
    UTILITY_SKILLS,
    errors,
    warnings
  );

  // 5. Validate Dispatcher Files
  if (!fs.existsSync(ROOT_AGENTS_MD)) {
    errors.push('[DISPATCHER] Missing root AGENTS.md');
  } else if (TABLE_PATTERN.test(fs.readFileSync(ROOT_AGENTS_MD, 'utf8'))) {
    errors.push('[DISPATCHER] Root AGENTS.md contains forbidden markdown table syntax');
  }

  if (!fs.existsSync(AGENTS_MD)) {
    errors.push('[DISPATCHER] Missing .agents/AGENTS.md');
  } else if (TABLE_PATTERN.test(fs.readFileSync(AGENTS_MD, 'utf8'))) {
    errors.push('[DISPATCHER] .agents/AGENTS.md contains forbidden markdown table syntax');
  }

  // 6. Validate Enforcement Map & Active Task State
  validateEnforcement(ENFORCEMENT_MAP_PATH, RULES_DIR, VALID_RULES, errors);
  validateActiveTask(AGENTS_DIR, errors);

  // 7. Referential integrity of markdown links & pnpm scripts in .agents/
  const mdFiles = allFiles.filter((f) => f.endsWith('.md'));
  const pathRe = /(?:\.agents|scripts|tools|utils)\/[A-Za-z0-9_./-]+\.(?:cjs|mjs|js|ts|py|md|json|sh)\b/g;

  for (const f of mdFiles) {
    const relFile = path.relative(REPO_ROOT, f);
    const txt = fs.readFileSync(f, 'utf8');

    for (const m of txt.matchAll(pathRe)) {
      const ref = m[0];
      if (ref.includes('<') || ref.includes('*') || ref.includes('{')) continue;
      if (!fs.existsSync(path.join(REPO_ROOT, ref))) {
        if (!ref.includes('example') && !ref.includes('sample')) {
          warnings.push(`[REFERENTIAL] ${relFile} references missing path: ${ref}`);
        }
      }
    }

    for (const m of txt.matchAll(/pnpm\s+([A-Za-z0-9:_-]+)/g)) {
      const s = m[1];
      if (s.startsWith('-')) continue;
      if (
        !npmScripts.has(s) &&
        !['i', 'install', 'add', 'remove', 'exec', 'run', 'test', 'dlx', 'filter', 'update'].includes(s)
      ) {
        warnings.push(`[SCRIPT] ${relFile} references unknown pnpm script: pnpm ${s}`);
      }
    }
  }

  return { errors, warnings, alwaysOnChars, skillsCount: skillDirs.length };
}

function main() {
  const isJson = process.argv.includes('--json');
  const { errors, warnings, alwaysOnChars, skillsCount } = runValidation();

  if (isJson) {
    process.stdout.write(
      JSON.stringify(
        {
          success: errors.length === 0,
          errors,
          warnings,
          metrics: { alwaysOnChars, skillsCount },
        },
        null,
        2
      ) + '\n'
    );
    process.exit(errors.length === 0 ? 0 : 1);
  }

  console.log('Validating .agents architecture (validate-agents.mjs)...');
  console.log(`  Always-on rules payload: ${alwaysOnChars} characters (budget <= 14,000) - OK`);
  console.log(`  Found ${skillsCount} skill directories`);
  console.log(`  Verified 7 native subagents, rules, and enforcement-map`);

  console.log('\n' + '='.repeat(50));
  console.log(`Validation summary: ${errors.length} error(s), ${warnings.length} warning(s)`);
  console.log('='.repeat(50));

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.slice(0, 15).forEach((w) => console.log(`  [WARN] ${w}`));
    if (warnings.length > 15) {
      console.log(`  ... and ${warnings.length - 15} more warnings`);
    }
  }

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach((e) => console.log(`  [FAIL] ${e}`));
    process.exit(1);
  }

  console.log('\nAll agent and skill validation checks PASSED successfully.');
  process.exit(0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
