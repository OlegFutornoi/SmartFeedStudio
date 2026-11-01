#!/usr/bin/env node

/**
 * agents-retro.mjs — Retrospective & Invariant Candidate Synthesizer
 * Reads .agents/state/observations.jsonl and .agents/state/guard.log.jsonl,
 * clusters friction points, and identifies repeat triggers as candidates for machine rules/hooks (AGENT-03).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const OBSERVATIONS_PATH = path.join(
  REPO_ROOT,
  '.agents/state/observations.jsonl'
);
const GUARD_LOG_PATH = path.join(REPO_ROOT, '.agents/state/guard.log.jsonl');

function loadJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const records = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      records.push(JSON.parse(line));
    } catch {
      // Skip broken JSON lines
    }
  }
  return records;
}

function analyzeRetro() {
  const observations = loadJsonl(OBSERVATIONS_PATH);
  const guardLogs = loadJsonl(GUARD_LOG_PATH);

  console.log('=== SmartFeed Studio Agent System Retrospective ===\n');
  console.log(`- Total observations recorded: ${observations.length}`);
  console.log(`- Total guardrail actions logged: ${guardLogs.length}\n`);

  // Cluster by type
  const byType = {};
  for (const obs of observations) {
    byType[obs.type] = (byType[obs.type] || 0) + 1;
  }
  console.log('--- Observations by Type ---');
  for (const [t, count] of Object.entries(byType)) {
    console.log(`  - ${t}: ${count}`);
  }

  // Analyze Guard Blocks
  const blockedRules = {};
  for (const g of guardLogs) {
    if (g.decision === 'deny') {
      blockedRules[g.rule] = (blockedRules[g.rule] || 0) + 1;
    }
  }

  if (Object.keys(blockedRules).length > 0) {
    console.log('\n--- Guardrail Blocks (PreToolUse) ---');
    for (const [r, count] of Object.entries(blockedRules)) {
      console.log(`  - ${r}: ${count} block(s)`);
    }
  }

  // Candidate suggestions for machine enforcement
  console.log('\n--- Recent Friction Observations & Resolutions ---');
  observations.slice(-5).forEach((obs, idx) => {
    console.log(`\n${idx + 1}. [${obs.type}] Trigger: ${obs.trigger}`);
    console.log(`   Friction: ${obs.friction}`);
    console.log(`   Resolution: ${obs.resolution}`);
  });

  console.log('\n[PASS] Retrospective synthesis complete.');
}

analyzeRetro();

