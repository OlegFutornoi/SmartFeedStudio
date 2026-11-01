#!/usr/bin/env node

/**
 * Deterministic PreToolUse Guardrail v2.0 for SmartFeed Studio (.agents/hooks.json)
 * Enforces zero-token safety invariants before tool execution (CORE-08, R1..R9).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checkCommandRules,
  checkFileReadRules,
  checkFileWriteRules,
} from './guard-rules.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const GUARD_LOG_PATH = path.join(REPO_ROOT, '.agents/state/guard.log.jsonl');

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

function logDecision(rule, decision, reason, toolName) {
  try {
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      rule,
      decision,
      tool: toolName,
      reason: reason || null,
    });
    fs.appendFileSync(GUARD_LOG_PATH, entry + '\n');
  } catch {
    // Non-blocking log failure
  }
}

function respond(obj, rule, toolName) {
  logDecision(rule, obj.decision, obj.reason, toolName);
  process.stdout.write(JSON.stringify(obj) + '\n');
  process.exit(0);
}

export const allow = (rule = 'DEFAULT', toolName = '') =>
  respond({ decision: 'allow' }, rule, toolName);
export const deny = (reason, rule = 'DENY', toolName = '') =>
  respond({ decision: 'deny', reason }, rule, toolName);
export const ask = (reason, rule = 'ASK', toolName = '') =>
  respond({ decision: 'ask', reason }, rule, toolName);

export function evaluateGuard(payload) {
  const toolName = String(
    payload?.toolCall?.name || payload?.tool_name || ''
  ).toLowerCase();
  const args = payload?.toolCall?.args || payload?.tool_input || {};
  const lastUserInput = String(payload?.lastUserInput || '');

  // 1. MCP Auto-Approval (CORE-08)
  if (
    toolName === 'call_mcp_tool' ||
    toolName.startsWith('mcp_') ||
    toolName.startsWith('browser_')
  ) {
    return { decision: 'allow', rule: 'CORE-08_MCP_AUTO_APPROVAL' };
  }

  // 2. Shell Command Guards (run_command)
  if (toolName === 'run_command') {
    const cmd = String(args.CommandLine || '').trim();
    const cmdCheck = checkCommandRules(cmd, lastUserInput);
    if (cmdCheck) return cmdCheck;
  }

  // 3. Plan Isolation (Invariant 20) & Heavy Artifact Read Guard
  if (toolName === 'read_file' || toolName === 'view_file') {
    const rawPath = String(
      args.Path || args.AbsolutePath || args.file_path || ''
    ).replace(/\\/g, '/');
    const readCheck = checkFileReadRules(rawPath, args, REPO_ROOT);
    if (readCheck) return readCheck;
  }

  // 4. File Write / Edit Guards
  if (toolName === 'write_file' || toolName === 'edit_file') {
    const targetPath = String(args.Path || '').replace(/\\/g, '/');
    const writeCheck = checkFileWriteRules(
      targetPath,
      args.Content,
      args.Replacement
    );
    if (writeCheck) return writeCheck;
  }

  return { decision: 'allow', rule: 'DEFAULT' };
}

async function main() {
  const raw = await readStdin();
  if (!raw || !raw.trim()) {
    return allow('EMPTY_STDIN');
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return allow('PARSE_ERROR');
  }

  const toolName = String(
    payload?.toolCall?.name || payload?.tool_name || ''
  ).toLowerCase();
  const result = evaluateGuard(payload);

  if (result.decision === 'deny') {
    return deny(result.reason, result.rule, toolName);
  }
  if (result.decision === 'ask') {
    return ask(result.reason, result.rule, toolName);
  }
  return allow(result.rule, toolName);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(() => allow('CATCH_FALLBACK'));
}
