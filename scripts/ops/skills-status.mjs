#!/usr/bin/env node

/**
 * skills-status.mjs — Live Skills Verification & Drift Tracking CLI
 * Monitors skill directories, calculates content hashes, and tracks verification lifecycle.
 */

import {
  reconcileSkillsStatus,
  generateSkillsStatusDoc,
} from './skill-state-manager.mjs';

function parseArgs(argv) {
  return {
    json: argv.includes('--json'),
    changedOnly: argv.includes('--changed'),
    strict: argv.includes('--strict'),
  };
}

function pad(str, len) {
  const s = String(str || '');
  return s.length >= len ? s.slice(0, len) : s + ' '.repeat(len - s.length);
}

export function main() {
  const opts = parseArgs(process.argv.slice(2));
  const statusList = reconcileSkillsStatus();

  // Generate / synchronize .agents/SKILLS_STATUS.md
  generateSkillsStatusDoc(statusList);

  if (opts.json) {
    console.log(JSON.stringify(statusList, null, 2));
    process.exit(0);
  }

  const verified = statusList.filter((s) => s.status === 'VERIFIED');
  const modified = statusList.filter((s) => s.status === 'MODIFIED');
  const unverified = statusList.filter((s) => s.status === 'UNVERIFIED');
  const failed = statusList.filter((s) => s.status === 'FAILED');

  console.log('='.repeat(80));
  console.log('SmartFeed Studio — Skills Verification & Drift Status Report');
  console.log('='.repeat(80));
  console.log(
    `Total: ${statusList.length} | Verified: ${verified.length} | Modified: ${modified.length} | Unverified: ${unverified.length} | Failed: ${failed.length}`
  );
  console.log('-'.repeat(80));
  console.log(
    `${pad('SKILL NAME', 32)} ${pad('STATUS', 12)} ${pad('LAST EVAL', 12)} ${pad('HASH', 10)} ${pad('PROVIDER', 10)}`
  );
  console.log('-'.repeat(80));

  const displayList = opts.changedOnly
    ? statusList.filter((s) => s.status === 'MODIFIED' || s.status === 'UNVERIFIED' || s.status === 'FAILED')
    : statusList;

  for (const s of displayList) {
    const dateStr = s.lastVerifiedAt ? s.lastVerifiedAt.slice(0, 10) : '-';
    const providerStr = s.provider || '-';
    const hashStr = s.currentHash ? s.currentHash.slice(0, 8) : '-';
    console.log(
      `${pad(s.name, 32)} ${pad(`[${s.status}]`, 12)} ${pad(dateStr, 12)} ${pad(hashStr, 10)} ${pad(providerStr, 10)}`
    );
  }

  console.log('='.repeat(80));

  if (modified.length > 0) {
    console.log(
      `[WARN] ${modified.length} skill(s) have changed since their last verification. Run "pnpm skills:eval:changed" to re-verify.`
    );
  } else if (unverified.length > 0) {
    console.log(
      `[INFO] ${unverified.length} skill(s) are awaiting initial live LLM evaluation. Run "pnpm skills:eval --skill=<name>" to test.`
    );
  } else {
    console.log('[PASS] All skills are fully VERIFIED with current code hashes.');
  }

  if (opts.strict && (modified.length > 0 || failed.length > 0)) {
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('skills-status.mjs')) {
  main();
}

