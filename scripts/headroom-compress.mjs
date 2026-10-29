#!/usr/bin/env node

/**
 * Headroom Context Optimization Script for SmartFeed Studio Agents
 * Compresses plans, specs, logs, feeds, JSON, diffs, and documents before feeding to the active LLM.
 *
 * Usage:
 *   node scripts/headroom-compress.mjs <file-path> --save
 *   node scripts/headroom-compress.mjs <file-path> -o <output-path>
 *   node scripts/headroom-compress.mjs <file-path> [--json | --raw]
 *   cat file.md | node scripts/headroom-compress.mjs [--save]
 */

import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const UV_HEADROOM_PYTHON = '/Users/oleg/.local/share/uv/tools/headroom-ai/bin/python';

async function readAllStdin() {
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

async function compressViaHeadroom(rawContent) {
  return new Promise((resolve, reject) => {
    const pythonScript = `
import json, sys
from headroom.compress import compress, CompressConfig

raw = sys.stdin.read()
if not raw:
    print(json.dumps({"error": "Empty input"}))
    sys.exit(0)

try:
    cfg = CompressConfig(
        compress_user_messages=True,
        compress_system_messages=True,
        min_tokens_to_compress=50,
        protect_recent=0
    )
    res = compress([{"role": "tool", "content": raw}], model="claude-sonnet-4-5-20250929", config=cfg)
    compressed_text = res.messages[0].get("content", raw) if res.messages else raw
    tokens_before = res.tokens_before
    tokens_after = res.tokens_after
    applied = list(res.transforms_applied) if res.transforms_applied else []

    # If Headroom skipped text/markdown (router:noop), apply markdown/spec hygiene
    if (not applied or applied == ["router:noop"]) and len(raw) > 200:
        lines = [line.rstrip() for line in raw.splitlines()]
        compact_lines = []
        prev_empty = False
        for line in lines:
            if not line:
                if not prev_empty:
                    compact_lines.append("")
                    prev_empty = True
            else:
                compact_lines.append(line)
                prev_empty = False
        densified = chr(10).join(compact_lines).strip() + chr(10)
        if len(densified) < len(raw):
            compressed_text = densified
            applied.append("densify:markdown-hygiene")

    saved = max(0, tokens_before - tokens_after)
    pct = round((saved / tokens_before) * 100, 1) if tokens_before > 0 else 0
    print(json.dumps({
        "compressed": compressed_text,
        "original_tokens": tokens_before,
        "compressed_tokens": tokens_after,
        "tokens_saved": saved,
        "savings_percent": pct,
        "transforms": applied
    }, ensure_ascii=False))
except Exception as e:
    print(json.dumps({"error": str(e), "compressed": raw, "savings_percent": 0, "transforms": []}))
`;

    const proc = spawn(
      existsSync(UV_HEADROOM_PYTHON) ? UV_HEADROOM_PYTHON : 'python3',
      ['-c', pythonScript],
      { stdio: ['pipe', 'pipe', 'pipe'] }
    );

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    proc.on('close', (code) => {
      if (code !== 0 && !stdout) {
        return reject(new Error(`Headroom compression failed (exit ${code}): ${stderr}`));
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Failed to parse Headroom output: ${stdout || stderr}`));
      }
    });

    proc.stdin.write(rawContent);
    proc.stdin.end();
  });
}

async function main() {
  const args = process.argv.slice(2);
  let rawContent = '';
  let isJson = args.includes('--json');
  let isRaw = args.includes('--raw');
  let shouldSave = args.includes('--save') || args.includes('-s');

  let outputFile = null;
  const outArgIdx = args.indexOf('--output') !== -1 ? args.indexOf('--output') : args.indexOf('-o');
  if (outArgIdx !== -1 && args[outArgIdx + 1]) {
    outputFile = args[outArgIdx + 1];
    shouldSave = true;
  }

  let fileArg = args.find((a) => !a.startsWith('-') && existsSync(a));

  const textArgIdx = args.indexOf('--text');
  if (textArgIdx !== -1 && args[textArgIdx + 1]) {
    rawContent = args[textArgIdx + 1];
  } else if (fileArg) {
    rawContent = readFileSync(fileArg, 'utf-8');
  } else {
    rawContent = await readAllStdin();
  }

  if (fileArg && shouldSave && !outputFile) {
    const ext = path.extname(fileArg);
    const base = path.basename(fileArg, ext);
    const dir = path.dirname(fileArg);
    outputFile = path.join(dir, `${base}.compressed${ext}`);
  }

  if (!rawContent || !rawContent.trim()) {
    console.error('[HEADROOM] Error: No content provided via file, --text, or stdin.');
    process.exit(1);
  }

  try {
    const result = await compressViaHeadroom(rawContent);

    if (result.error && !result.compressed) {
      console.error(`[HEADROOM] Compression error: ${result.error}`);
      process.exit(1);
    }

    if (outputFile) {
      const outDir = path.dirname(outputFile);
      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
      }
      writeFileSync(outputFile, result.compressed, 'utf-8');
      console.error(`[HEADROOM] Saved compressed output to: ${outputFile}`);
      console.error(
        `[HEADROOM] Tokens: ${result.original_tokens} -> ${result.compressed_tokens} (-${result.savings_percent}% saved: ${result.tokens_saved} tokens)`
      );
      if (result.transforms && result.transforms.length > 0) {
        console.error(`[HEADROOM] Transforms applied: ${result.transforms.join(', ')}`);
      }
      if (isJson) {
        console.log(JSON.stringify({ ...result, outputFile }, null, 2));
      } else {
        console.log(outputFile);
      }
      return;
    }

    if (isJson) {
      console.log(JSON.stringify(result, null, 2));
    } else if (isRaw) {
      process.stdout.write(result.compressed);
    } else {
      console.error(
        `[HEADROOM] Tokens: ${result.original_tokens} -> ${result.compressed_tokens} (-${result.savings_percent}% saved: ${result.tokens_saved} tokens)`
      );
      if (result.transforms && result.transforms.length > 0) {
        console.error(`[HEADROOM] Transforms applied: ${result.transforms.join(', ')}`);
      }
      console.log(result.compressed);
    }
  } catch (err) {
    console.error(`[HEADROOM] Error: ${err.message}`);
    process.exit(1);
  }
}

main();
